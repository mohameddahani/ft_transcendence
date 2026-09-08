"""What a tool *is* in this codebase, and the guarantees every one of them shares.

A tool is a name, a description, an optional arguments model, and a callable with a
`Scope` already closed over it. That last part is the whole design:

    build_admin_tools(scope) -> {name: Tool}

`scope` is captured in a closure at build time, so it appears in no signature, no
schema, and no log of the model's function calls. The model cannot pass a gym id
because there is nowhere to put one. Prompt injection against the tenant boundary is
not blocked here -- it is *unexpressible*, which is a stronger property.

`Tool` exists rather than a bare dict of callables because D13 needs three things
from each tool (its declaration, its validator, its implementation) and because the
security tests want to assert over the whole registry at once: "no admin tool's
schema mentions admin_id" should hold for a tool somebody adds in week 4 too.
"""

from __future__ import annotations

import functools
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from pydantic import BaseModel

from app.db.scope import ScopeViolation

logger = logging.getLogger(__name__)

# Identifiers the model must never be able to supply. Asserted against every
# registered tool's JSON schema by scripts/check_tools.py.
FORBIDDEN_PARAMETERS = frozenset({"admin_id", "adminId", "gym_id", "tenant_id",
                                  "member_id", "memberId"})

# `member_id` is forbidden everywhere except here: an owner asking about one of
# *their own* members is the whole point of get_member_detail, and a wrong id under
# an owner scope returns nothing rather than somebody else's data.
MEMBER_ID_ALLOWED_IN = frozenset({"get_member_detail"})


@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    run: Callable[..., Awaitable[dict[str, Any]]]
    args_model: type[BaseModel] | None = None

    def json_schema(self) -> dict[str, Any]:
        """The parameter schema, in the shape a function declaration wants."""
        if self.args_model is None:
            return {"type": "object", "properties": {}}
        schema = self.args_model.model_json_schema()
        schema.pop("title", None)
        return schema


def tool(name: str, description: str, args_model: type[BaseModel] | None = None):
    """Wrap a tool body: catch what should be reported, re-raise what must not be.

    An exception escaping a tool aborts the agent turn mid-answer, so anything that
    is merely a failed query comes back as `{"error": ...}` and the model gets to say
    something useful about it.

    `ScopeViolation` is deliberately excluded. It means a tool tried to read outside
    its tenant -- that is a bug in our code, not a message for a user, and swallowing
    it would turn the loudest signal this system has into a shrug.
    """
    def decorate(fn: Callable[..., Awaitable[dict[str, Any]]]) -> Tool:
        @functools.wraps(fn)
        async def guarded(*args: Any, **kwargs: Any) -> dict[str, Any]:
            try:
                return await fn(*args, **kwargs)
            except ScopeViolation:
                raise
            except Exception as exc:
                logger.exception("tool %s failed", name,
                                 extra={"fields": {"tool": name,
                                                   "error_type": type(exc).__name__}})
                # No exception text: it can carry column names and SQL, and this
                # string goes straight into the model's context and then to a user.
                return {"error": f"{name} could not be completed. Nothing was changed."}

        return Tool(name=name, description=description, run=guarded, args_model=args_model)
    return decorate


def period_start(period: str, now: datetime) -> datetime | None:
    """Calendar window boundaries, computed in Python and bound as a parameter.

    Not in SQL: `NOW() - INTERVAL '7 days'` cannot survive `scope.py`'s where-fragment
    grammar, which bans quotes so that no caller can smuggle a string literal in. That
    ban is what makes the fragment safe, so the windows move to Python -- which is
    better anyway, because a test can then pass its own `now` instead of waiting.

    Calendar, not rolling: an owner asking "revenue this month" means since the 1st.
    """
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "week":
        return midnight - timedelta(days=midnight.weekday())
    if period == "month":
        return midnight.replace(day=1)
    if period == "year":
        return midnight.replace(month=1, day=1)
    return None  # all_time
