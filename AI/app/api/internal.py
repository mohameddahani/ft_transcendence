"""`/internal/*` — server-to-server, authenticated with `X-API-Key`, never a JWT.

`POST /internal/sentiment` (task 5.1) is the real payload of this router. What is
here now is the connectivity check Dahani needs to confirm the shared key is right
before there is anything to call, plus a development-only route whose whole job is
to raise, so `verify.sh` can prove the 500 handler leaks nothing.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.apikey import require_internal_key
from app.config import get_settings

# The dependency is declared on the router, not per route: a new endpoint added here
# is authenticated by default. Remembering to add a guard is exactly the kind of
# thing that gets forgotten once.
router = APIRouter(
    prefix="/internal",
    tags=["internal"],
    dependencies=[Depends(require_internal_key)],
)


class Ping(BaseModel):
    status: str


@router.get("/ping", response_model=Ping)
async def ping() -> Ping:
    """Confirms the shared key matches. Returns nothing about this service's state --
    `/health` is the endpoint for that, and it needs no key."""
    return Ping(status="ok")


if get_settings().is_development:

    @router.get("/boom", include_in_schema=False)
    async def boom() -> None:
        """Raises on purpose. Development only, and behind the API key even so.

        Without a route that fails, the global 500 handler is untested code that
        runs for the first time during a demo.
        """
        raise RuntimeError("deliberate failure: sk-secret-should-not-be-in-the-response")
