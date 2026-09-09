"""Tool definitions bound to a verified Scope (task 2.1).

    tools = build_admin_tools(ctx.scope)      # owner
    tools = build_member_tools(ctx.scope)     # member

`ctx.scope` comes from `require_auth`, which built it from the verified JWT. Nothing
downstream can widen it: the scope is closed over each tool, so it appears in no
schema the model is shown.
"""

from app.agents.tools.admin import build_admin_tools
from app.agents.tools.base import (
    FORBIDDEN_PARAMETERS,
    MEMBER_ID_ALLOWED_IN,
    Tool,
    period_start,
    plain_field,
    quote_user_text,
)
from app.agents.tools.members import build_member_tools

__all__ = ["Tool", "build_admin_tools", "build_member_tools", "period_start",
           "plain_field", "quote_user_text", "FORBIDDEN_PARAMETERS", "MEMBER_ID_ALLOWED_IN"]
