"""Typed read models for Dahani's Postgres.

Exactly the tables and columns in AI_SPECS 2.1 -- no more. If a query needs a
column that is not here, the read model and the `ai_readonly` grant both have to
change, which is the point: widening what the AI can see is a deliberate act.

Two invariants worth stating out loud, because both are easy to break silently:

**Money is `Decimal`.** `amount` and `price` are Postgres `NUMERIC(10,2)`, which is
exact base-10. `float` is exact base-2, where 0.1 + 0.2 != 0.3. Answering "what did
I make last month" with 4799.999999999999 is a demo-ending bug, so no float ever
touches these values. asyncpg already returns `Decimal`; the job here is not to
widen it back.

**Expiry is derived, never read.** `memberships.membership_status` is maintained by
a cron job. A missed run leaves it stale while `expires_at` stays correct, so every
answer about who is expired comes from `expires_at` vs. now. The D1 fixture is
currently consistent -- the point is that nothing in the schema *keeps* it that way,
and `status_drifted` exists to make a divergence visible rather than silent.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from enum import StrEnum
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict, computed_field, field_validator

# Prisma writes UTC instants into `timestamp without time zone` columns, so every
# datetime arrives naive but is already UTC. All comparison happens in UTC.
# Morocco is UTC+1 year-round (permanent DST since 2018, briefly UTC+0 during
# Ramadan) -- that offset belongs in the presentation layer, not in a WHERE clause.
CASABLANCA = ZoneInfo("Africa/Casablanca")

# A membership inside this window is "expiring soon" -- the renewal-chase list.
EXPIRING_SOON = timedelta(days=7)


def _utc(value: datetime) -> datetime:
    """Attach UTC to a naive timestamp; leave an aware one alone."""
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def naive_utc_now() -> datetime:
    """`now`, shaped for binding into a query parameter.

    Every timestamp column here is `timestamp without time zone` holding a UTC
    instant, and asyncpg refuses to bind a tz-aware datetime to one. So a time window
    computed in Python -- which is where they should be computed, since a SQL literal
    like `NOW() - INTERVAL '7 days'` cannot survive the where-fragment grammar -- has
    to drop its tzinfo on the way in.
    """
    return datetime.now(UTC).replace(tzinfo=None)


def to_local(value: datetime) -> datetime:
    """UTC -> Africa/Casablanca. For display only; never for comparison."""
    return _utc(value).astimezone(CASABLANCA)


# --- enums, mirroring the Postgres types -------------------------------------

class Gender(StrEnum):
    MALE = "MALE"
    FEMALE = "FEMALE"


class Role(StrEnum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"


class MemberAccountStatus(StrEnum):
    ACTIVE = "ACTIVE"
    FROZEN = "FROZEN"
    BANNED = "BANNED"


class PaymentStatus(StrEnum):
    PAID = "PAID"
    UNPAID = "UNPAID"
    OVERDUE = "OVERDUE"


class Sentiment(StrEnum):
    """Written by the sentiment module (task 5.1) through Dahani's backend, then read
    back here. Nullable in the schema: a feedback that has not been scored yet is a
    normal state, not an error."""

    POSITIVE = "POSITIVE"
    NEUTRAL = "NEUTRAL"
    NEGATIVE = "NEGATIVE"


class StoredMembershipStatus(StrEnum):
    """The cron-maintained column. Named `Stored` as a warning: read it only to
    report the discrepancy, never to answer whether a membership is valid."""

    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class DerivedMembershipStatus(StrEnum):
    """What the agent is allowed to report. Computed from `expires_at`, except for
    cancellation -- see `Membership.status_at`."""

    ACTIVE = "active"
    EXPIRING_SOON = "expiring_soon"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


# --- read models --------------------------------------------------------------

class ReadModel(BaseModel):
    """Frozen: a row that has been read is a fact, not a working value."""

    model_config = ConfigDict(frozen=True, extra="forbid")


class GymOwner(ReadModel):
    """A row of `users`. `id` is the `admin_id` every other table scopes by."""

    id: str
    first_name: str
    last_name: str
    company_name: str
    role: Role
    email: str


class Member(ReadModel):
    id: str
    admin_id: str
    first_name: str
    last_name: str
    # Not unique, and must not be made unique -- families share a number.
    # Any lookup by phone returns a list.
    phone_number: str
    email: str
    gender: Gender
    birth_date: datetime
    account_status: MemberAccountStatus
    created_at: datetime

    _norm = field_validator("birth_date", "created_at")(classmethod(lambda cls, v: _utc(v)))

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @computed_field
    @property
    def age(self) -> int:
        today = date.today()
        born = self.birth_date.date()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


class MembershipPlan(ReadModel):
    id: str
    admin_id: str
    plan_name: str
    description: str | None
    is_active: bool


class MembershipPlanDuration(ReadModel):
    """The leak risk: no `admin_id` of its own, so it must be scoped by joining
    `membership_plan_id` -> `membership_plans.admin_id` (AI_SPECS 2.1)."""

    id: str
    membership_plan_id: str
    duration_days: int
    price: Decimal


class Membership(ReadModel):
    id: str
    admin_id: str
    member_id: str
    membership_plan_id: str
    membership_plan_duration_id: str
    # Present so a report can flag drift. Never branch on it.
    membership_status: StoredMembershipStatus
    start_date: datetime
    expires_at: datetime
    created_at: datetime

    _norm = field_validator("start_date", "expires_at", "created_at")(
        classmethod(lambda cls, v: _utc(v))
    )

    def status_at(self, now: datetime | None = None) -> DerivedMembershipStatus:
        """Rule #6 says never derive *expiry* from `membership_status`, because a
        cron job maintains it and a missed run leaves it stale.

        Cancellation is the exception, and the distinction matters: nothing else in
        the schema records that a member cancelled. `expires_at` is unchanged when
        they do -- so a cancelled membership with a future expiry would otherwise be
        reported ACTIVE, and the owner would be told that someone who quit last week
        is still a member. The stored column is untrusted for expiry and is the only
        source for cancellation; both statements are true at once.
        """
        if self.membership_status == StoredMembershipStatus.CANCELLED:
            return DerivedMembershipStatus.CANCELLED
        now = _utc(now or datetime.now(UTC))
        if self.expires_at < now:
            return DerivedMembershipStatus.EXPIRED
        if self.expires_at < now + EXPIRING_SOON:
            return DerivedMembershipStatus.EXPIRING_SOON
        return DerivedMembershipStatus.ACTIVE

    @computed_field
    @property
    def status(self) -> DerivedMembershipStatus:
        return self.status_at()

    @computed_field
    @property
    def days_remaining(self) -> int:
        """Negative once expired."""
        return (self.expires_at - datetime.now(UTC)).days

    @computed_field
    @property
    def is_valid(self) -> bool:
        """May this member train today? The one question a tool should ask."""
        return self.status in (DerivedMembershipStatus.ACTIVE,
                               DerivedMembershipStatus.EXPIRING_SOON)

    @computed_field
    @property
    def status_drifted(self) -> bool:
        """True when the cron column disagrees with reality -- worth surfacing to
        the owner, and the reason rule #6 exists."""
        # CANCELLED is set by a person, not by the cron job, so it cannot drift.
        # Including it here would flag every cancelled-but-not-yet-expired
        # membership as a cron failure.
        if self.membership_status == StoredMembershipStatus.CANCELLED:
            return False
        # `==` not `is`: these are StrEnums, so equality also holds for a raw
        # string that skipped validation (model_copy, a hand-built fixture). An
        # identity check would silently report "no drift" in exactly the case
        # this method exists to catch.
        stored_expired = self.membership_status == StoredMembershipStatus.EXPIRED
        # Straight from expires_at, not from `self.status`: that property now
        # short-circuits on CANCELLED and would make this comparison meaningless.
        really_expired = self.expires_at < datetime.now(UTC)
        return stored_expired != really_expired


class Payment(ReadModel):
    id: str
    admin_id: str
    member_id: str
    amount: Decimal
    # NOT NULL in the schema, so an unpaid row still carries a date. Revenue must
    # therefore filter on payment_status, not merely sum by paid_at
    # (Dahani ask #9: make this nullable).
    paid_at: datetime
    due_date: datetime
    payment_status: PaymentStatus

    _norm = field_validator("paid_at", "due_date")(classmethod(lambda cls, v: _utc(v)))

    @computed_field
    @property
    def is_collected(self) -> bool:
        """The only safe basis for revenue: money actually received."""
        return self.payment_status == PaymentStatus.PAID


class CheckIn(ReadModel):
    """One visit. The whole attendance module is built on counting these.

    Deliberately thin -- the table carries `created_at` and `updated_at` too, but a
    check-in has exactly one interesting fact, and widening the read model would
    mean widening the grant.
    """

    id: str
    admin_id: str
    member_id: str
    checked_in_at: datetime

    _norm = field_validator("checked_in_at")(classmethod(lambda cls, v: _utc(v)))

    @computed_field
    @property
    def hour(self) -> int:
        """Local hour, for `get_attendance_stats(group_by="hour")`.

        Casablanca rather than UTC, because an owner asking about their busiest hour
        means the hour on the clock in the gym. This is presentation: every filter
        and comparison still happens in UTC.
        """
        return to_local(self.checked_in_at).hour

    @computed_field
    @property
    def weekday(self) -> int:
        """Monday = 0, matching `datetime.weekday()`."""
        return to_local(self.checked_in_at).weekday()


class Feedback(ReadModel):
    id: str
    admin_id: str
    member_id: str
    content: str
    rating: int | None
    # Both nullable: the row is written when the member submits and scored
    # afterwards by POST /internal/sentiment.
    sentiment: Sentiment | None
    sentiment_score: Decimal | None
    created_at: datetime

    _norm = field_validator("created_at")(classmethod(lambda cls, v: _utc(v)))

    @computed_field
    @property
    def is_scored(self) -> bool:
        return self.sentiment is not None
