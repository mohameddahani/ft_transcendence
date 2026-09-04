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
    FRONTEND_URL: str = "http://localhost:3000"

    # --- secrets: no defaults, so a missing value fails at boot ---
    # SecretStr, so a stray `print(settings)` or a logged repr shows `**********`
    # instead of the key. Read the value with `.get_secret_value()`.
    # min_length rejects `INTERNAL_API_KEY=` in .env, which a bare `str` accepts.
    INTERNAL_API_KEY: SecretStr = Field(min_length=16)

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
