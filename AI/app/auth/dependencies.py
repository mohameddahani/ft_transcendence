"""FastAPI dependencies that turn an `Authorization` header into a `Scope`.

This is the only place a `Scope` is constructed for a request. Guardrail #4 says
member tools take `member_id` from the verified JWT and never from the model; that
is true because the model never gets to influence anything on this path -- the id
comes out of a signature, and the `Scope` it produces is frozen.

Every failure below answers the same flat 401 with the same message. The reason is
uniformity: a client that can tell "expired" from "unknown account" from "wrong
secret" can enumerate accounts and map the auth surface. The specifics are logged.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.tokens import InvalidToken, TokenClaims, verify_access_token
from app.config import Settings, get_settings
from app.db import tenancy
from app.db.models import Role
from app.db.scope import Scope
from app.core.errors import forbidden, unauthorized

logger = logging.getLogger(__name__)

# auto_error=False so a missing header reaches our handler and gets the documented
# envelope, instead of FastAPI's own `{"detail": "Not authenticated"}`.
_bearer = HTTPBearer(auto_error=False, scheme_name="Dahani access token")


@dataclass(frozen=True)
class AuthContext:
    """Everything downstream is allowed to know about the caller."""

    scope: Scope
    role: Role
    # The rate limiter (task 0.7) keys on this. It is the token subject, so a member
    # cannot get a fresh bucket by opening a new thread.
    subject: str

    @property
    def is_admin(self) -> bool:
        return self.role is Role.ADMIN


async def _claims(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> TokenClaims:
    if credentials is None or not credentials.credentials:
        raise unauthorized("Missing bearer token.")
    try:
        return verify_access_token(credentials.credentials, settings)
    except InvalidToken as exc:
        # The reason goes here and only here.
        logger.info("rejected token on %s: %s", request.url.path, exc)
        raise unauthorized("Invalid or expired token.") from exc


async def require_auth(claims: Annotated[TokenClaims, Depends(_claims)]) -> AuthContext:
    """A verified token resolved to the gym it belongs to.

    The token proves who the caller is; the database says which tenant that is and
    whether the account is still allowed in. Both are needed: a 15-minute access
    token outlives a deletion, a demotion, or a ban.
    """
    if claims.role is Role.ADMIN:
        admin = await tenancy.resolve_admin(claims.subject)
        if admin is None:
            logger.info("admin token for an unknown or non-admin account")
            raise unauthorized("Invalid or expired token.")
        return AuthContext(scope=admin.scope, role=Role.ADMIN, subject=claims.subject)

    member = await tenancy.resolve_member(claims.subject)
    if member is None:
        logger.info("member token for an unknown or banned account")
        raise unauthorized("Invalid or expired token.")
    return AuthContext(scope=member.scope, role=Role.MEMBER, subject=claims.subject)


async def require_admin(ctx: Annotated[AuthContext, Depends(require_auth)]) -> AuthContext:
    """Admin-only routes: document upload, gym-wide reports.

    403 rather than 401 here, and that distinction is deliberate: the token is
    genuine, so telling the caller "not you" reveals nothing they did not already
    know, and re-authenticating would not help.
    """
    if not ctx.is_admin:
        logger.info("member token refused on an admin-only route")
        raise forbidden("This endpoint is for gym administrators.")
    return ctx


CurrentUser = Annotated[AuthContext, Depends(require_auth)]
CurrentAdmin = Annotated[AuthContext, Depends(require_admin)]
