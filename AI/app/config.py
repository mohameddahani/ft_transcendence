"""Application settings.

Every setting is read once, validated once, and then frozen. `get_settings()` is
called at import time in `app.main`, so a missing or malformed value stops the
process at boot rather than surfacing as a 500 on the first request.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, ValidationError, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Roles that own the schema and can write to it. The AI service must never
# connect as one of these -- see seeder/roles/ai_readonly.sql.
_WRITE_CAPABLE_ROLES = {"admin", "postgres", "root"}


class Settings(BaseSettings):
    # --- application ---
    # Literal, not str: `APP_ENV=prod` is a typo that would otherwise pass silently
    # and expose /docs in production.
    APP_ENV: Literal["development", "production"] = "development"
    LOG_LEVEL: Literal["debug", "info", "warning", "error", "critical"] = "info"
    VERSION: str = "0.1.0"
    # Comma-separated so local development and a deployed frontend can both be
    # allowed without a second setting. Origins only -- scheme, host and port, no
    # path -- because that is what a browser sends in `Origin` and what CORS
    # compares against.
    FRONTEND_URL: str = "http://localhost:3000"

    # --- secrets: no defaults, so a missing value fails at boot ---
    # SecretStr, so a stray `print(settings)` or a logged repr shows `**********`
    # instead of the key. Read the value with `.get_secret_value()`.
    # min_length rejects `INTERNAL_API_KEY=` in .env, which a bare `str` accepts.
    INTERNAL_API_KEY: SecretStr = Field(min_length=16)
    
    GEMINI_API_KEY: SecretStr = Field(min_length=16)
    GEMINI_CHAT_MODEL: str

    # --- agent (task 2.2) ---
    # gemini-2.5-flash reasons before answering unless told not to, and on this tool
    # registry that measurably *hurt*: asked "who hasn't checked in for three weeks
    # and expires soon?", thinking-on spent ~190 reasoning tokens and returned no
    # tool call at all, while thinking-off called both tools correctly in half the
    # time. 0 disables it; -1 hands the decision back to the model.
    GEMINI_THINKING_BUDGET: int = Field(default=0, ge=-1, le=24576)
    # A ceiling on one Gemini call. The agent may make several per answer, so this
    # is not the request budget -- it is how long a dead upstream may hang a stream.
    GEMINI_TIMEOUT_SECONDS: float = Field(default=30.0, gt=0, le=120)
    # How many messages of a conversation are re-sent to the model each turn. A
    # thread is unbounded and every turn re-sends all of it, so this is the cost of
    # question twenty. Counted in messages rather than tokens on purpose: one tool
    # response is one message, and the window has to be able to hold a whole
    # question-plus-tools-plus-answer cycle without cutting into one.
    AGENT_HISTORY_MESSAGES: int = Field(default=24, ge=4, le=200)
    # A conversation is a cache of context, not a record -- the gym's data lives in
    # Dahani's Postgres and nothing here is the only copy of anything. 90 days so
    # history survives to the demo (AI_SPECS 2.2).
    THREAD_TTL_DAYS: int = Field(default=90, ge=1, le=365)
    # AI_SPECS 3.2 requires the length limit in the frontend *and* here: the browser
    # is not the only thing that can POST to this endpoint. Sized for a long question,
    # not an essay -- every character is billed and re-sent on every tool round.
    MAX_MESSAGE_CHARS: int = Field(default=2000, ge=100, le=20000)
    # How many rounds of tool execution one question may spend before the agent is
    # made to answer with what it already has. Counted in rounds rather than model
    # calls because a round is what a runaway model actually spends: each one is a
    # fan-out of database reads and another full context window sent to Gemini.
    AGENT_MAX_TOOL_ROUNDS: int = Field(default=5, ge=1, le=12)

    # --- JWT verification (task 0.5) ---
    # One secret per role, matching Dahani's getJwtConfig(role, type). We hold only
    # the two ACCESS secrets: refresh tokens are his to handle, and the OWNER secret
    # is deliberately absent so a platform-operator token cannot verify here at all.
    JWT_ADMIN_ACCESS_SECRET: SecretStr = Field(min_length=32)
    JWT_MEMBER_ACCESS_SECRET: SecretStr = Field(min_length=32)
    # Clock skew allowance between Dahani's container and ours. Seconds, small on
    # purpose: this widens the window in which an expired token is still accepted.
    JWT_LEEWAY_SECONDS: int = Field(default=10, ge=0, le=120)

    # --- database (task 0.2) ---
    AI_DATABASE_URL: str = Field(min_length=1)
    DB_POOL_SIZE: int = Field(default=5, ge=1)
    DB_MAX_OVERFLOW: int = Field(default=5, ge=0)
    DB_CONNECT_TIMEOUT_SECONDS: float = Field(default=5.0, gt=0)
    DB_HEALTH_TIMEOUT_SECONDS: float = Field(default=2.0, gt=0)

    # --- our own state + rate limiting (task 0.7) ---
    # SQLite on the ai_state volume. Must stay under /data: that is the only path
    # the Dockerfile makes writable to the runtime user.
    SQLITE_PATH: str = Field(default="/data/ai_state.db", min_length=1)
    RATE_LIMIT_CHAT_PER_MIN: int = Field(default=20, ge=1)
    RATE_LIMIT_DOCS_PER_MIN: int = Field(default=10, ge=1)
    # The rolling window both limits are measured over. Configurable mainly so a
    # test can use a two-second window instead of sleeping a minute.
    RATE_LIMIT_WINDOW_SECONDS: int = Field(default=60, ge=1, le=3600)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        frozen=True,
    )

    @field_validator("AI_DATABASE_URL")
    @classmethod
    def _must_be_async_and_read_only(cls, v: str) -> str:
        """Guardrail #1, asserted at boot.

        Two ways to lose read-only access without noticing: pointing the URL at the
        `admin` role, or using the sync `postgresql://` driver (which silently gives
        you a blocking driver inside an async event loop). Both are caught here
        instead of at the first query.
        """
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "AI_DATABASE_URL must use the postgresql+asyncpg:// driver"
            )
        # scheme://user:pass@host/db -> user
        try:
            user = v.split("://", 1)[1].split("@", 1)[0].split(":", 1)[0]
        except IndexError:
            raise ValueError("AI_DATABASE_URL is malformed") from None
        if user.lower() in _WRITE_CAPABLE_ROLES:
            raise ValueError(
                f"AI_DATABASE_URL connects as '{user}', which can write. "
                "The AI service must connect as a SELECT-only role "
                "(see seeder/roles/ai_readonly.sql)."
            )
        return v

    @model_validator(mode="after")
    def _role_secrets_must_differ(self) -> "Settings":
        # The whole point of two secrets is that a MEMBER token cannot verify as an
        # ADMIN token. Set them equal -- by a copy-paste in a .env, which is exactly
        # how it would happen -- and every member becomes an admin of their own gym.
        # `verify_access_token` also cross-checks the role claim, but a boot-time
        # refusal is the layer that makes the misconfiguration impossible to ship.
        if (self.JWT_ADMIN_ACCESS_SECRET.get_secret_value()
                == self.JWT_MEMBER_ACCESS_SECRET.get_secret_value()):
            raise ValueError(
                "JWT_ADMIN_ACCESS_SECRET and JWT_MEMBER_ACCESS_SECRET are identical; "
                "that collapses the admin/member boundary"
            )
        return self

    @property
    def cors_origins(self) -> list[str]:
        """The exact origins allowed to call this service from a browser.

        A list, never `*`. A wildcard would let any page on the internet make a
        request with the user's Authorization header if it could obtain one, and it
        is the difference between "the frontend may call us" and "anything may".
        """
        return [origin.strip().rstrip("/") for origin in self.FRONTEND_URL.split(",")
                if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"


class ConfigError(RuntimeError):
    """Configuration is invalid. Rendered without echoing a single value."""


def render_config_error(exc: ValidationError) -> str:
    """Field names and messages only -- never `input_value`."""
    problems = "\n".join(
        f"  - {'.'.join(str(part) for part in err['loc']) or '(settings)'}: {err['msg']}"
        for err in exc.errors()
    )
    return (
        "invalid configuration -- refusing to start:\n"
        + problems
        + "\nValues are not shown on purpose; check .env against .env.example."
    )


@lru_cache
def get_settings() -> Settings:
    """The single Settings instance. Called at import in `app.main`, so anything
    wrong here kills the process at boot.

    Pydantic's own ValidationError prints `input_value=` for every failure -- which
    for a too-short secret means printing the secret into the boot log, where it is
    then in `docker compose logs`, in CI output, and in whatever anyone pastes into
    a chat asking why the container will not start. So the error is re-rendered from
    the field name and the message only, and `from None` drops the original
    traceback rather than letting it print the values anyway.
    """
    try:
        return Settings()
    except ValidationError as exc:
        raise ConfigError(render_config_error(exc)) from None
