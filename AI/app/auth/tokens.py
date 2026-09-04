"""Verifying Dahani's access tokens. HS256, one secret per role.

The rule that shapes this module: **the `role` claim never chooses the key.**

A JWT's payload is base64, not encrypted -- anyone can edit it and re-encode. If we
read `role` first and then picked a secret, an attacker would flip `"MEMBER"` to
`"ADMIN"` and we would obligingly verify their token against the admin secret. It
would fail here, because they cannot forge the signature. But the habit is the bug:
the moment any decision is made from an unverified claim, the next one will be a
decision that matters.

So: try each secret, and only after a signature verifies do we look at the payload.
Then check that the claim agrees with the key that verified it. That last step is
what defends against the two secrets accidentally being set to the same value -- a
one-line copy-paste in a `.env` that would otherwise promote every member to admin.
(`Settings` also refuses to boot in that case; this is the second layer.)

OWNER tokens are signed with a secret we deliberately do not hold, so they simply
fail both attempts and get a 401. Platform operators are out of scope for the
assistant (AI_SPECS 3.1), and not holding the key is a stronger way to say so than
an `if` would be.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Final

import jwt

from app.config import Settings
from app.db.models import Role

logger = logging.getLogger(__name__)

# Pinned, never read from the token header. Accepting the header's `alg` is the
# classic JWT break: `alg: none` verifies anything, and `RS256` lets an attacker
# sign with the public key as if it were an HMAC secret.
_ALGORITHMS: Final = ["HS256"]

# Dahani's signer emits both (nestjs/jwt adds them). Requiring them means a token
# without an expiry is rejected rather than treated as eternal.
_REQUIRED_CLAIMS: Final = ["exp", "iat"]

# The roles this service accepts, each with the setting that verifies it. Order is
# only a performance detail -- both are tried before giving up.
_ACCEPTED_ROLES: Final = (Role.ADMIN, Role.MEMBER)


class InvalidToken(Exception):
    """Verification failed. The message is for the log, never for the client.

    Callers answer a flat 401 for every case: telling an attacker whether a token
    was expired, unsigned, or signed with the wrong role's key is free reconnaissance.
    """


@dataclass(frozen=True)
class TokenClaims:
    """A payload that has been verified. Nothing here is attacker-controlled."""

    subject: str   # `id` in Dahani's AccessTokenPayload
    role: Role


def _secret_for(role: Role, settings: Settings) -> str:
    if role is Role.ADMIN:
        return settings.JWT_ADMIN_ACCESS_SECRET.get_secret_value()
    if role is Role.MEMBER:
        return settings.JWT_MEMBER_ACCESS_SECRET.get_secret_value()
    raise InvalidToken(f"no access secret is configured for role {role}")


def verify_access_token(token: str, settings: Settings) -> TokenClaims:
    """Verify a bearer token against each role's secret. Raises `InvalidToken`."""
    if not token or token.count(".") != 2:
        raise InvalidToken("not a three-segment JWT")

    for expected_role in _ACCEPTED_ROLES:
        try:
            payload = jwt.decode(
                token,
                _secret_for(expected_role, settings),
                algorithms=_ALGORITHMS,
                leeway=settings.JWT_LEEWAY_SECONDS,
                options={"require": _REQUIRED_CLAIMS},
            )
        except jwt.InvalidSignatureError:
            # Wrong key for this token; it may still be the other role's. This is
            # the ONLY error worth retrying -- everything else is a property of the
            # token itself and will fail identically against the next secret.
            continue
        except jwt.ExpiredSignatureError as exc:
            raise InvalidToken("token expired") from exc
        except jwt.MissingRequiredClaimError as exc:
            raise InvalidToken(f"missing required claim: {exc.claim}") from exc
        except jwt.PyJWTError as exc:
            raise InvalidToken(f"{type(exc).__name__}: {exc}") from exc

        # Past this line the signature is valid, so the payload can be trusted.
        claimed = payload.get("role")
        if claimed != expected_role:
            # Signed with this role's key but claiming another. Either the two
            # secrets are the same value, or someone with one key is impersonating
            # the other role. Both are refusals, and both are worth a loud log.
            logger.warning(
                "token verified with the %s secret but claims role %r", expected_role, claimed
            )
            raise InvalidToken("role claim does not match the signing key")

        subject = payload.get("id")
        if not isinstance(subject, str) or not subject:
            raise InvalidToken("token has no usable `id` claim")

        return TokenClaims(subject=subject, role=expected_role)

    raise InvalidToken("signature does not match any configured access secret")
