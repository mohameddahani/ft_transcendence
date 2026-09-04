"""The schema contract: the only tables and columns this service may ever read.

One dict, `TABLES`, does two jobs that must never disagree:

1. **Boot-time verification** (`verify_schema`) -- guardrail #5. Dahani owns this
   database and keeps migrating it. The day `expires_at` is renamed, this service
   must refuse to start, with a message naming the column. The alternative is a
   crash inside a tool call, halfway through an answer, during the demo.
2. **Runtime allowlisting** -- `scope.py` checks every requested column against
   the same mapping. Column names cannot be bound parameters; they are formatted
   into the SQL string. The allowlist is the only thing that makes that safe.

Keeping both on one dict is the design: a column you are allowed to select is a
column the boot check requires. They cannot drift apart.

A useful side effect of running the check as `ai_readonly`: `information_schema`
only shows columns the role holds some privilege on, so a missing GRANT fails the
boot check exactly like a missing column. The schema check verifies the grants too.
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from dataclasses import dataclass
from enum import StrEnum
from typing import Final

from app.db import engine as _engine
from app.db.models import (
    GymOwner,
    Member,
    Membership,
    MembershipPlan,
    MembershipPlanDuration,
    Payment,
    ReadModel,
)

logger = logging.getLogger(__name__)

# information_schema.columns.data_type values, spelled exactly as Postgres reports
# them. `USER-DEFINED` is what a Prisma enum looks like from here.
TEXT: Final = "text"
NUMERIC: Final = "numeric"
INTEGER: Final = "integer"
BOOLEAN: Final = "boolean"
TIMESTAMP: Final = "timestamp without time zone"
ENUM: Final = "USER-DEFINED"


class SchemaMismatch(RuntimeError):
    """The live database does not match this contract. Raised at boot."""


class ScopeRule(StrEnum):
    """How a table is narrowed to one gym. There is no fourth option: a table not
    in `TABLES` cannot be queried at all."""

    DIRECT = "direct"          # the table carries admin_id itself
    TRANSITIVE = "transitive"  # scoped through a parent that carries admin_id
    TENANT = "tenant"          # the tenant row itself: id = admin_id


class MemberAccess(StrEnum):
    """What the member agent may see. Every table must make this choice out loud --
    a default would eventually be the wrong one for some table nobody re-read."""

    OWN_ROWS = "own_rows"   # narrowed again to rows belonging to this member
    GYM_WIDE = "gym_wide"   # a member may read all of their own gym's rows
    DENIED = "denied"       # the member agent may not touch this table


@dataclass(frozen=True)
class TableSpec:
    rule: ScopeRule
    columns: Mapping[str, str]
    model: type[ReadModel]
    member_access: MemberAccess
    # OWN_ROWS only: the column holding the member's id on this table.
    member_column: str | None = None
    # TRANSITIVE only: `<local_key> IN (SELECT <parent_key> FROM <parent_table>
    # WHERE admin_id = ...)`.
    parent_table: str | None = None
    local_key: str | None = None
    parent_key: str = "id"

    def __post_init__(self) -> None:
        # These are startup assertions, not runtime validation. A malformed spec
        # must blow up at import, because the failure mode of, say, a `rule` typed
        # as a plain string is that `scope.py` matches no branch -- and a query
        # with no tenant predicate is precisely the disaster this file prevents.
        if not isinstance(self.rule, ScopeRule):
            raise TypeError(f"rule must be a ScopeRule, got {type(self.rule).__name__}")
        if not isinstance(self.member_access, MemberAccess):
            raise TypeError("member_access must be a MemberAccess")
        if not self.columns:
            raise ValueError("a table with no allowlisted columns is not queryable")

        if self.rule is ScopeRule.TRANSITIVE:
            if not self.parent_table or not self.local_key:
                raise ValueError("TRANSITIVE needs parent_table and local_key")
            if self.local_key not in self.columns:
                raise ValueError(f"local_key {self.local_key!r} is not an allowlisted column")
        elif self.parent_table or self.local_key:
            raise ValueError("parent_table/local_key are meaningful only for TRANSITIVE")

        if self.rule is ScopeRule.DIRECT and "admin_id" not in self.columns:
            raise ValueError("DIRECT scoping needs an admin_id column")

        if self.member_access is MemberAccess.OWN_ROWS:
            if not self.member_column:
                raise ValueError("OWN_ROWS needs member_column")
            if self.member_column not in self.columns:
                raise ValueError(f"member_column {self.member_column!r} is not allowlisted")
        elif self.member_column:
            raise ValueError("member_column is meaningful only for OWN_ROWS")

        missing = set(self.model.model_fields) - set(self.columns)
        if missing:
            raise ValueError(f"{self.model.__name__} has fields not allowlisted: {sorted(missing)}")


TABLES: Final[Mapping[str, TableSpec]] = {
    # The tenant row. `users.password` is deliberately absent here and ungranted
    # in the database -- two independent reasons it can never be read.
    "users": TableSpec(
        rule=ScopeRule.TENANT,
        member_access=MemberAccess.GYM_WIDE,  # only ever their own gym's single row
        columns={
            "id": TEXT, "first_name": TEXT, "last_name": TEXT,
            "company_name": TEXT, "role": ENUM, "email": TEXT,
        },
        model=GymOwner,
    ),
    "members": TableSpec(
        rule=ScopeRule.DIRECT,
        member_access=MemberAccess.OWN_ROWS,
        member_column="id",  # a member IS a row of this table
        columns={
            "id": TEXT, "admin_id": TEXT, "first_name": TEXT, "last_name": TEXT,
            "phone_number": TEXT, "email": TEXT, "gender": ENUM,
            "birth_date": TIMESTAMP, "account_status": ENUM, "created_at": TIMESTAMP,
        },
        model=Member,
    ),
    "membership_plans": TableSpec(
        rule=ScopeRule.DIRECT,
        member_access=MemberAccess.GYM_WIDE,  # members may browse what their gym sells
        columns={
            "id": TEXT, "admin_id": TEXT, "plan_name": TEXT,
            "description": TEXT, "is_active": BOOLEAN,
        },
        model=MembershipPlan,
    ),
    # The likeliest leak in the whole schema: pricing, with no admin_id to forget.
    # An unscoped query here hands a competitor every gym's price list.
    "membership_plan_durations": TableSpec(
        rule=ScopeRule.TRANSITIVE,
        parent_table="membership_plans",
        local_key="membership_plan_id",
        member_access=MemberAccess.GYM_WIDE,
        columns={
            "id": TEXT, "membership_plan_id": TEXT,
            "duration_days": INTEGER, "price": NUMERIC,
        },
        model=MembershipPlanDuration,
    ),
    "memberships": TableSpec(
        rule=ScopeRule.DIRECT,
        member_access=MemberAccess.OWN_ROWS,
        member_column="member_id",
        columns={
            "id": TEXT, "admin_id": TEXT, "member_id": TEXT,
            "membership_plan_id": TEXT, "membership_plan_duration_id": TEXT,
            "membership_status": ENUM, "start_date": TIMESTAMP,
            "expires_at": TIMESTAMP, "created_at": TIMESTAMP,
        },
        model=Membership,
    ),
    "payments": TableSpec(
        rule=ScopeRule.DIRECT,
        member_access=MemberAccess.OWN_ROWS,
        member_column="member_id",
        columns={
            "id": TEXT, "admin_id": TEXT, "member_id": TEXT, "amount": NUMERIC,
            "paid_at": TIMESTAMP, "due_date": TIMESTAMP, "payment_status": ENUM,
        },
        model=Payment,
    ),
}

# check_ins and feedbacks are not here on purpose: Dahani has not shipped the
# migrations yet (AI_PLAN 7, due D8). Adding them before they exist would make the
# boot check fail on a known-pending dependency, which trains everyone to ignore it.

_SCHEMA_SQL = """
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = ANY(:tables)
"""


async def verify_schema() -> None:
    """Compare `TABLES` against the live database. Raises `SchemaMismatch`.

    Called from the app lifespan, so a mismatch stops the container from starting.
    Every problem is collected before raising -- one restart should tell you
    everything that moved, not the first thing alphabetically.
    """
    rows = await _engine._fetch_all(_SCHEMA_SQL, {"tables": list(TABLES)})

    live: dict[str, dict[str, str]] = {}
    for row in rows:
        live.setdefault(row["table_name"], {})[row["column_name"]] = row["data_type"]

    problems: list[str] = []
    for table, spec in TABLES.items():
        actual = live.get(table)
        if actual is None:
            problems.append(f"{table}: table is missing, or no column is granted to this role")
            continue
        for column, expected in spec.columns.items():
            found = actual.get(column)
            if found is None:
                problems.append(f"{table}.{column}: missing, or not granted to ai_readonly")
            elif found != expected:
                problems.append(f"{table}.{column}: type is {found!r}, contract says {expected!r}")

    if problems:
        raise SchemaMismatch(
            "the database no longer matches app/db/schema.py:\n  - "
            + "\n  - ".join(problems)
            + "\nFix the contract (and the read models) or the migration. Refusing to start."
        )

    logger.info(
        "schema check ok: %d tables, %d columns",
        len(TABLES),
        sum(len(s.columns) for s in TABLES.values()),
    )
