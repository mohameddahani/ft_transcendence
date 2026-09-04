"""`/ai/*` — the surface the browser talks to, authenticated with Dahani's JWT.

`/ai/chat` and `/ai/documents` arrive in weeks 3 and 4. What is here now is the
identity endpoint: the frontend calls it once to learn who the token belongs to, and
it doubles as the end-to-end proof that the D5 chain works --
token -> signature -> tenant lookup -> `Scope` -> a query that is scoped by it.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.auth.dependencies import CurrentUser
from app.db import scope as sc
from app.db.models import Role
from app.core.errors import unauthorized

router = APIRouter(prefix="/ai", tags=["ai"])


class Identity(BaseModel):
    role: Role
    gym: str
    # Present only for a member token. An admin has no member identity, and saying
    # so with `null` is clearer than omitting the field.
    member_name: str | None = None


@router.get("/me", response_model=Identity)
async def me(ctx: CurrentUser) -> Identity:
    """Who the caller is, answered entirely through `scope.py`.

    Note what is NOT in the response: no ids. The frontend never needs `admin_id`,
    and echoing a tenant key back into a browser is how it ends up in a query string,
    a log, or a bug report.
    """
    # The tenant rule (`id = :admin_id`) means this returns exactly one row -- the
    # caller's own gym -- whether the caller is the admin or one of its members.
    # The account was confirmed a moment ago in `require_auth`, but it can be deleted
    # between that lookup and this one. Answer 401 rather than letting an IndexError
    # become a 500 with a stack trace in it.
    rows = await sc.select_models(ctx.scope, "users")
    if not rows:
        raise unauthorized("Invalid or expired token.")
    gym = rows[0]

    member_name = None
    if ctx.role is Role.MEMBER:
        # Under a member scope this table is narrowed to `id = :member_id`, so the
        # only row it can return is the caller's own.
        mine = await sc.select_models(ctx.scope, "members")
        if not mine:
            raise unauthorized("Invalid or expired token.")
        member_name = mine[0].full_name

    return Identity(role=ctx.role, gym=gym.company_name, member_name=member_name)
