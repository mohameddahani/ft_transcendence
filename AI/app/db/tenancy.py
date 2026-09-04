"""Turning a verified token subject into a `Scope`. The only unscoped queries here.

Every other read in this service goes through `scope.py`, which needs an `admin_id`
to build its predicate. Resolving *which* gym a token belongs to is the one lookup
that cannot -- that is the chicken and the egg, and this module is the deliberate,
audited exception to guardrail #2.

What keeps it honest:

* The id is not user input in any meaningful sense. It arrives inside a signature
  Dahani produced with a secret we hold, so the caller has already proved it is theirs.
* Each function selects the tenancy pointer and the account state, nothing else. No
  names, no contact details, no money. A caller who somehow forced an arbitrary id in
  would learn only which gym that id belongs to.
* Both return `None` for an unknown id rather than raising, so the caller answers 401
  and never distinguishes "no such account" from "wrong signature".
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final

from app.db import engine as _engine
from app.db.models import MemberAccountStatus, Role
from app.db.scope import Scope

# A row of `users`. `id` here IS the admin_id every gym-scoped table hangs off.
_ADMIN_SQL: Final = "SELECT id, role, company_name FROM users WHERE id = :id"
_MEMBER_SQL: Final = "SELECT id, admin_id, account_status FROM members WHERE id = :id"


@dataclass(frozen=True)
class AdminIdentity:
    admin_id: str
    company_name: str

    @property
    def scope(self) -> Scope:
        return Scope(admin_id=self.admin_id)


@dataclass(frozen=True)
class MemberIdentity:
    member_id: str
    admin_id: str
    account_status: MemberAccountStatus

    @property
    def scope(self) -> Scope:
        return Scope(admin_id=self.admin_id, member_id=self.member_id)


async def resolve_admin(admin_id: str) -> AdminIdentity | None:
    """The gym behind an ADMIN token, or None if it is gone or not an admin.

    The role is re-checked against the database, not taken from the token: an access
    token lives 15 minutes, so a demoted or deleted account keeps a valid signature
    for that long. This is the check that closes that window.
    """
    row = await _engine._fetch_one(_ADMIN_SQL, {"id": admin_id})
    if row is None or row["role"] != Role.ADMIN:
        return None
    return AdminIdentity(admin_id=row["id"], company_name=row["company_name"])


async def resolve_member(member_id: str) -> MemberIdentity | None:
    """The gym behind a MEMBER token, or None if the member is gone or banned.

    A banned member keeps a working access token until it expires. Refusing them here
    means the ban takes effect on the assistant immediately, the same as everywhere
    else. FROZEN is allowed through on purpose -- a frozen account still needs to be
    able to ask why it is frozen and what it owes. (Confirm with Dahani, ask #10.)
    """
    row = await _engine._fetch_one(_MEMBER_SQL, {"id": member_id})
    if row is None or row["account_status"] == MemberAccountStatus.BANNED:
        return None
    return MemberIdentity(
        member_id=row["id"],
        admin_id=row["admin_id"],
        account_status=MemberAccountStatus(row["account_status"]),
    )
