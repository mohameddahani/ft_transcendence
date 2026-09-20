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
    # A gym employee (Dahani's 2026-09-20 release). Belongs to a gym through
    # `staffs.admin_id`, and in his API has exactly the admin's reach over members,
    # memberships, payments, attendance and visits -- but no access to plan pricing,
    # to staff management, or to the gym's own subscription.
    STAFF = "STAFF"
    MEMBER = "MEMBER"


class MemberAccountStatus(StrEnum):
    ACTIVE = "ACTIVE"
    FROZEN = "FROZEN"
    BANNED = "BANNED"


class UserAccountStatus(StrEnum):
    """The status on `users` and `staffs` -- a different set from a member's."""

    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"
    BANNED = "BANNED"


class PaymentStatus(StrEnum):
    PAID = "PAID"
    UNPAID = "UNPAID"
    OVERDUE = "OVERDUE"


class AttendanceMethod(StrEnum):
    """How the member got through the door. Dahani's booking system (2026-09-20)."""

    QR_CODE = "QR_CODE"
    MANUAL = "MANUAL"


class FeedbackStatus(StrEnum):
    """The staff workflow on a comment, independent of its sentiment. A complaint
    can be NEGATIVE and RESOLVED at the same time, and the owner cares about both."""

    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


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
    """A row of `users`. `id` is the `admin_id` every other table scopes by.

    Three columns, narrowed on 2026-09-20 from six. The service only ever reads
    `company_name` (the gym's name, for the prompt and `/ai/me`) and `role` (for
    tenancy), so the owner's own name and email address were readable by every
    scope -- including a staff one -- for no reason at all. Dahani's API exposes
    neither to staff. Nothing surfaced them, but "no tool happens to return it" is
    a weaker guarantee than "the role cannot select it", and phase 3 adds surfaces.
    """

    id: str
    company_name: str
    role: Role


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


class Staff(ReadModel):
    """A gym employee. Read only to resolve their gym and confirm they still work here.

    Deliberately four columns: the tenancy pointer and the account state, nothing
    else. `staffs.password` is a hash and is neither modelled nor granted.
    """

    id: str
    admin_id: str
    role: Role
    account_status: UserAccountStatus


class MembershipPlan(ReadModel):
    id: str
    admin_id: str
    plan_name: str
    description: str | None
    is_active: bool
    # Sessions a week this plan allows. Dahani's booking and check-in paths refuse
    # past it, so a member asking "how many do I have left?" is asking about a rule
    # that will actually be enforced on them at the door.
    weekly_visit_limit: int


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
        """Valid means `membership_status = 'ACTIVE'` **and** `expires_at` in the
        future. Both halves are load-bearing, in opposite directions.

        Rule #6 says never derive *expiry* from the stored column, because a cron job
        maintains it (hourly) and a missed run leaves it saying ACTIVE after the date
        has passed. That is still true, and the date check below is what enforces it.

        The other direction was wrong until 2026-09-20. A stored status of EXPIRED or
        CANCELLED is written by a *person*, not by the cron -- changing a member's
        plan supersedes the old membership immediately, while its `expires_at` may
        still be weeks away (`members.service.ts:267`). Deriving purely from the date
        therefore reported two valid memberships for anyone who ever changed plan:
        they appeared twice in the renewal-chase list, and a downgrade told the member
        they were still on the old, longer plan.

        So: the cron can only ever be stale in the "still valid" direction, which
        makes the stored column safe as a filter that **narrows** and unsafe as one
        that **widens**. Dahani's own `AccessesService.validateActiveMembership`
        requires exactly this pair, so the assistant and the app now agree on who may
        train today.
        """
        if self.membership_status == StoredMembershipStatus.CANCELLED:
            return DerivedMembershipStatus.CANCELLED
        now = _utc(now or datetime.now(UTC))
        # Superseded by a plan change: dead now, whatever the date still claims.
        if self.membership_status == StoredMembershipStatus.EXPIRED:
            return DerivedMembershipStatus.EXPIRED
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
    def superseded(self) -> bool:
        """Terminated by hand while its paid-for date is still in the future.

        Almost always a plan change: the old membership is set EXPIRED the moment
        the new one is created. Not an error, and not drift -- but worth being able
        to see, because the row keeps advertising an end date that no longer means
        anything. (The open ask to Dahani is to set `expires_at = now` as well.)
        """
        return (self.membership_status == StoredMembershipStatus.EXPIRED
                and self.expires_at > datetime.now(UTC))

    @computed_field
    @property
    def status_drifted(self) -> bool:
        """True when the cron job is behind: still ACTIVE after the date has passed.

        Only that one direction is drift. The reverse -- EXPIRED with a future date
        -- is a person superseding the membership (see `superseded`), and counting it
        here would have reported every plan change in the gym as a failed cron run.

        `==` not `is`: these are StrEnums, so equality also holds for a raw string
        that skipped validation (`model_copy`, a hand-built fixture). An identity
        check would silently report "no drift" in exactly the case this exists to
        catch.
        """
        return (self.membership_status == StoredMembershipStatus.ACTIVE
                and self.expires_at < datetime.now(UTC))


class Payment(ReadModel):
    id: str
    admin_id: str
    member_id: str
    amount: Decimal
    # Nullable since 2026-09-20 (ask #9, delivered). Every consumer must cope with
    # None: these were required until that migration, and a required field here
    # turns the first NULL row into a validation error *inside a tool call*, which
    # the boot check cannot catch because it verifies types, not nullability.
    #
    # Nothing in the backend writes NULL yet -- both write paths still set both
    # dates unconditionally -- so this is defensive until an unpaid flow exists.
    paid_at: datetime | None
    due_date: datetime | None
    payment_status: PaymentStatus

    _norm = field_validator("paid_at", "due_date")(
        classmethod(lambda cls, v: v if v is None else _utc(v))
    )

    @computed_field
    @property
    def is_current(self) -> bool:
        """Whether this payment's period is the one the member is paid up for.

        **Not a revenue signal, and the name matters.** It was `is_collected` until
        2026-09-20, which was wrong: Dahani's cron rewrites a collected payment to
        OVERDUE and then UNPAID as the period it bought runs out, so a member who has
        renewed monthly for a year leaves eleven rows saying UNPAID for cash that was
        handed over. Summing `PAID` reported about the last month and called it the
        year.

        Revenue now comes from `memberships` instead -- each row carries its own plan
        and price, which is exact and needs nothing from him (`reports.revenue`).
        What this flag is still good for is the question the column actually answers:
        is this member paid up right now?
        """
        return self.payment_status == PaymentStatus.PAID


class Attendance(ReadModel):
    """One visit that actually happened. The attendance module counts these.

    Was `CheckIn` against our shadow table until 2026-09-20. Dahani's `attendances`
    carries more: the booking it came from (`visit_id`), the staff member who waved
    it through (`staff_id`), and the membership it was taken under.

    Still deliberately thin. `visit_id` and `staff_id` answer no question we have,
    and every field here is a column granted to `ai_readonly` -- widening the model
    means widening the grant, which is a decision and not a convenience.
    """

    id: str
    admin_id: str
    member_id: str
    # New, and the useful one: attendance can be attributed to a plan.
    membership_id: str
    attendance_method: AttendanceMethod
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
    # NOT NULL in Dahani's schema: every comment carries a star rating. Kept
    # optional here anyway -- a rating that stops being mandatory is a schema change
    # that should not take the assistant down with it.
    rating: int | None
    # Both nullable: the row is written when the member submits and scored
    # afterwards by POST /internal/sentiment.
    sentiment: Sentiment | None
    sentiment_score: Decimal | None
    # The staff workflow on this comment, independent of its sentiment.
    feedback_status: FeedbackStatus
    created_at: datetime

    _norm = field_validator("created_at")(classmethod(lambda cls, v: _utc(v)))

    @computed_field
    @property
    def is_scored(self) -> bool:
        return self.sentiment is not None

    @computed_field
    @property
    def needs_attention(self) -> bool:
        """Open, and either negative or poorly rated. The owner's actual worklist."""
        if self.feedback_status != FeedbackStatus.OPEN:
            return False
        return self.sentiment == Sentiment.NEGATIVE or (
            self.rating is not None and self.rating <= 2)
