"""Tenant scoping. Every read of Dahani's database goes through this module.

The goal is not "remember to add `WHERE admin_id = ...`". Humans forget, and the
bug is invisible in a one-gym dev database and catastrophic in production. The goal
is an API where forgetting is *impossible*: there is no argument to `select()` that
omits the tenant predicate, and no way to reach the engine without calling it.

Four properties hold for every query this module builds:

1. **The scope predicate comes first and is not optional.** It is derived from the
   `Scope`, never from an argument. `_scope_sql` ends in `raise`, so an unknown
   rule produces an exception rather than an empty WHERE clause.
2. **A caller's `where` fragment cannot escape it.** It is wrapped in parentheses,
   and the fragment is refused if it contains a quote, a comment, a semicolon, or a
   `)` that would close the wrapper early -- the three ways to defeat the wrap.
3. **A `where` fragment cannot reach another gym either.** The tenant predicate
   constrains the outer query only, so a nested SELECT inside the fragment would
   read the whole table and turn the result into an oracle. It is refused.
4. **Identifiers are allowlisted, values are bound.** Column and table names cannot
   be bound parameters, so they are checked against `schema.TABLES`. Everything
   else is a `:param`.

`Scope` is built from the verified JWT and from nothing else (guardrail #4). It is
never a tool argument the model fills in, and never read from a request body -- that
is what stops "show me member 47's payments" from working when you are not 47.
"""

from __future__ import annotations

import logging
import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Final

from app.db import engine as _engine
from app.db.models import ReadModel
from app.db.schema import TABLES, MemberAccess, ScopeRule, TableSpec

logger = logging.getLogger(__name__)

# A single answer never needs more rows than this. An agent asking to "list all
# members" of a 4,000-member gym would otherwise blow the context window and the
# token budget in one call.
MAX_LIMIT: Final = 500
DEFAULT_LIMIT: Final = 100

# Reserved parameter names. A caller passing its own `scope_admin_id` would be
# choosing its own tenant, so the prefix is refused outright rather than merged.
_RESERVED_PREFIX: Final = "scope_"
_ADMIN_PARAM: Final = "scope_admin_id"
_MEMBER_PARAM: Final = "scope_member_id"
_LIMIT_PARAM: Final = "scope_limit"

# Values belong in bound parameters, so a `where` fragment never needs a string
# literal, a comment, or a statement separator. Refusing them makes the parenthesis
# scan below exact: there is nowhere for a `(` to hide.
_FORBIDDEN_IN_WHERE: Final = ("'", '"', ";", "--", "/*", "*/", "$")

# A nested SELECT inside a caller's fragment is NOT scoped -- the tenant predicate
# only constrains the outer query. `amount = (SELECT max(amount) FROM payments)`
# reads every gym's payments and turns the result set into an oracle you can
# binary-search. There is no legitimate use for it here, so the keyword is refused;
# that also removes UNION, since a UNION needs a SELECT to reach.
_SUBQUERY = re.compile(r"\bselect\b", re.IGNORECASE)

_IDENTIFIER = re.compile(r"^[a-z_][a-z0-9_]*$")
_ORDER_ITEM = re.compile(r"^([a-z_][a-z0-9_]*)(?:\s+(asc|desc))?$", re.IGNORECASE)
_AGGREGATES: Final = frozenset({"COUNT", "SUM", "AVG", "MIN", "MAX"})


class ScopeViolation(PermissionError):
    """A query that this scope is not allowed to make. Never reaches the database."""


@dataclass(frozen=True)
class Scope:
    """Who is asking. Built from the verified JWT, once, at the edge of a request.

    Frozen on purpose: a scope that can be mutated after construction can be
    mutated by a tool, and then the language model is choosing its own tenant.

    `member_id` set means the member agent -- it narrows the query a second time,
    below the gym. Left None it is the owner agent, which sees the whole gym.
    """

    admin_id: str
    member_id: str | None = None

    def __post_init__(self) -> None:
        if not self.admin_id or not isinstance(self.admin_id, str):
            raise ValueError("Scope.admin_id must be a non-empty string from the JWT")
        if self.member_id is not None and not self.member_id:
            raise ValueError("Scope.member_id must be None or a non-empty string")

    @property
    def is_member(self) -> bool:
        return self.member_id is not None


def _spec(table: str) -> TableSpec:
    spec = TABLES.get(table)
    if spec is None:
        # Not "return nothing": a table absent from the contract is a bug or an
        # attack, and both deserve a loud stop rather than an empty result set.
        raise ScopeViolation(
            f"table {table!r} is not in the schema contract; "
            f"readable tables are {sorted(TABLES)}"
        )
    return spec


def _scope_sql(spec: TableSpec, scope: Scope, table: str) -> tuple[str, dict[str, Any]]:
    """The predicate that makes the query safe. Never empty, never optional."""
    params: dict[str, Any] = {_ADMIN_PARAM: scope.admin_id}

    if spec.rule is ScopeRule.DIRECT:
        predicate = f"admin_id = :{_ADMIN_PARAM}"
    elif spec.rule is ScopeRule.TENANT:
        predicate = f"id = :{_ADMIN_PARAM}"
    elif spec.rule is ScopeRule.TRANSITIVE:
        # A subquery, not a JOIN: no aliasing, so nothing the caller writes in
        # `where` or `columns` can become ambiguous, and no row can be duplicated
        # by the parent side.
        predicate = (
            f"{spec.local_key} IN (SELECT {spec.parent_key} FROM {spec.parent_table}"
            f" WHERE admin_id = :{_ADMIN_PARAM})"
        )
    else:  # pragma: no cover - unreachable while ScopeRule has three members
        raise ScopeViolation(f"no scoping rule implemented for {table!r}")

    if scope.is_member:
        if spec.member_access is MemberAccess.DENIED:
            raise ScopeViolation(f"the member agent may not read {table!r}")
        if spec.member_access is MemberAccess.OWN_ROWS:
            predicate += f" AND {spec.member_column} = :{_MEMBER_PARAM}"
            params[_MEMBER_PARAM] = scope.member_id

    return predicate, params


def _validate_columns(spec: TableSpec, table: str, columns: Sequence[str]) -> list[str]:
    if not columns:
        raise ScopeViolation("select() needs at least one column")
    unknown = [c for c in columns if c not in spec.columns]
    if unknown:
        raise ScopeViolation(
            f"{table}: columns {unknown} are not in the schema contract. "
            "Widening what the AI can read is a deliberate edit to app/db/schema.py."
        )
    return list(columns)


def _validate_params(params: Mapping[str, Any] | None) -> dict[str, Any]:
    clean = dict(params or {})
    stolen = [k for k in clean if k.startswith(_RESERVED_PREFIX)]
    if stolen:
        raise ScopeViolation(
            f"parameter names {stolen} are reserved for the scope predicate"
        )
    return clean


def _validate_where(where: str) -> None:
    for token in _FORBIDDEN_IN_WHERE:
        if token in where:
            raise ScopeViolation(
                f"{token!r} is not allowed in a where fragment; bind values as :params"
            )
    if _SUBQUERY.search(where):
        raise ScopeViolation(
            "a nested SELECT in a where fragment is not tenant-scoped and would "
            "read every gym; filter with bound parameters instead"
        )
    depth = 0
    for char in where:
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth < 0:
                # `foo) OR (1=1` is balanced overall, but it closes the wrapper
                # early: the result reads `(admin_id = X AND (foo)) OR (1=1)`,
                # and the OR branch returns every gym's rows. This is the check.
                raise ScopeViolation(
                    "where fragment closes a parenthesis it did not open -- "
                    "that would break out of the tenant scope"
                )
    if depth != 0:
        raise ScopeViolation("unbalanced '(' in where fragment")


def _validate_order_by(spec: TableSpec, table: str, order_by: str) -> str:
    parts: list[str] = []
    for item in order_by.split(","):
        match = _ORDER_ITEM.match(item.strip())
        if not match:
            raise ScopeViolation(f"order_by item {item.strip()!r} is not 'column [asc|desc]'")
        column, direction = match.group(1), (match.group(2) or "ASC").upper()
        if column not in spec.columns:
            raise ScopeViolation(f"{table}: cannot order by {column!r}, not in the contract")
        parts.append(f"{column} {direction}")
    return ", ".join(parts)


def _validate_limit(limit: int) -> int:
    if not isinstance(limit, int) or isinstance(limit, bool):
        raise ScopeViolation("limit must be an int")
    if not 1 <= limit <= MAX_LIMIT:
        raise ScopeViolation(f"limit must be between 1 and {MAX_LIMIT}, got {limit}")
    return limit


async def select(
    scope: Scope,
    table: str,
    columns: Sequence[str],
    *,
    where: str = "",
    params: Mapping[str, Any] | None = None,
    order_by: str = "",
    limit: int = DEFAULT_LIMIT,
) -> list[dict[str, Any]]:
    """A tenant-scoped SELECT. The only way anything outside `app/db/` reads Postgres.

    `where` is a fragment written by *our* tool code, not by the model; the model
    supplies values, which go in `params` and are bound by the driver. Because
    string literals are refused, an enum is compared as `payment_status::text = :s`.
    """
    spec = _spec(table)
    selected = _validate_columns(spec, table, columns)
    bound = _validate_params(params)
    limit = _validate_limit(limit)
    predicate, scope_params = _scope_sql(spec, scope, table)

    sql = f"SELECT {', '.join(selected)} FROM {table} WHERE {predicate}"
    if where:
        _validate_where(where)
        # The parentheses are the whole point. Without them a caller's trailing
        # `OR ...` binds looser than our AND and the scope evaporates.
        sql += f" AND ({where})"
    if order_by:
        sql += f" ORDER BY {_validate_order_by(spec, table, order_by)}"
    sql += f" LIMIT :{_LIMIT_PARAM}"

    # Scope parameters merged last: even if the reserved-prefix check above were
    # ever removed, a caller still could not overwrite its own tenant.
    return await _engine._fetch_all(sql, {**bound, **scope_params, _LIMIT_PARAM: limit})


async def select_models(
    scope: Scope,
    table: str,
    *,
    where: str = "",
    params: Mapping[str, Any] | None = None,
    order_by: str = "",
    limit: int = DEFAULT_LIMIT,
) -> list[ReadModel]:
    """`select()` with the columns taken from the table's read model, parsed into it.

    Preferred over `select()` for anything a tool returns: the columns cannot drift
    from the model, and the result carries the derived expiry and Decimal money.
    """
    spec = _spec(table)
    rows = await select(
        scope, table, list(spec.model.model_fields),
        where=where, params=params, order_by=order_by, limit=limit,
    )
    return [spec.model(**row) for row in rows]


async def aggregate(
    scope: Scope,
    table: str,
    functions: Sequence[tuple[str, str, str]],
    *,
    group_by: Sequence[str] = (),
    where: str = "",
    params: Mapping[str, Any] | None = None,
    limit: int = DEFAULT_LIMIT,
) -> list[dict[str, Any]]:
    """Scoped COUNT/SUM/AVG/MIN/MAX, e.g. `[("SUM", "amount", "revenue")]`.

    This exists so nobody ever has a reason to drop down to the engine for a total.
    An escape hatch that is needed in practice is not a guardrail; it is a hole.
    """
    spec = _spec(table)
    bound = _validate_params(params)
    limit = _validate_limit(limit)
    predicate, scope_params = _scope_sql(spec, scope, table)

    projections: list[str] = []
    for func, column, alias in functions:
        upper = func.upper()
        if upper not in _AGGREGATES:
            raise ScopeViolation(f"aggregate {func!r} is not allowed; use {sorted(_AGGREGATES)}")
        if column == "*":
            if upper != "COUNT":
                raise ScopeViolation("'*' is only valid with COUNT")
        elif column not in spec.columns:
            raise ScopeViolation(f"{table}: cannot aggregate {column!r}, not in the contract")
        if not _IDENTIFIER.match(alias):
            raise ScopeViolation(f"alias {alias!r} must be a plain lowercase identifier")
        projections.append(f"{upper}({column}) AS {alias}")
    if not projections:
        raise ScopeViolation("aggregate() needs at least one function")

    grouped = _validate_columns(spec, table, group_by) if group_by else []

    sql = f"SELECT {', '.join(grouped + projections)} FROM {table} WHERE {predicate}"
    if where:
        _validate_where(where)
        sql += f" AND ({where})"
    if grouped:
        sql += f" GROUP BY {', '.join(grouped)} ORDER BY {', '.join(grouped)}"
    sql += f" LIMIT :{_LIMIT_PARAM}"

    return await _engine._fetch_all(sql, {**bound, **scope_params, _LIMIT_PARAM: limit})
