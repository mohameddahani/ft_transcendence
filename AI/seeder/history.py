"""Membership history and payments (tasks 1.3 and 1.4).

**A member is a sequence, not a row.** The gaps between their memberships are the
churn signal, and the whole point of this file:

    continuous   [====][====][====]        renews on time
    lapsed       [====]      [====][====]  a gap, then came back
    churned      [====][====]              stopped, never returned
    new          [====]                    joined recently

Without those gaps, "who lapsed and came back?" has no answer -- not because the
agent is weak, but because the data contains no such person. Six of the eight admin
tools read these two tables.

**Generated backwards, from the present.** A forward chain from each member's join
date lands wherever it lands, and the demo-critical property is the *current* state:
how many people expire in the next seven days. So each member's last membership is
placed first, relative to today, and earlier ones are chained back from it until the
sequence reaches their join date. Durations and gaps come out identical either way;
what backwards buys is exact control over the state an evaluator will ask about.

**Two invariants that must hold for every row:**

* `expires_at = start_date + duration_days`, taken from the plan's own duration.
  The agent divides revenue by days; a length that does not match the catalogue is a
  wrong answer with no visible cause.
* No member has two overlapping memberships. An overlap is silent and makes one
  person count twice in "active members".
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from enum import StrEnum

# Roughly a real gym's book, and deliberately not mostly-continuous: a corpus where
# everybody renews on time makes every churn question return an empty list.
JOURNEY_WEIGHTS: dict[str, int] = {
    "continuous": 35, "lapsed": 25, "churned": 25, "new": 15,
}

# How many memberships a journey can hold. Bounded by the member's join date too, so
# somebody who joined four months ago cannot have eight of them.
MAX_MEMBERSHIPS: dict[str, int] = {"continuous": 8, "lapsed": 6, "churned": 3, "new": 1}

LAPSE_MIN_DAYS, LAPSE_MAX_DAYS = 30, 120      # a real gap, not a late renewal
RENEWAL_GAP_MAX_DAYS = 5                      # people renew a few days late
CHURN_MIN_DAYS, CHURN_MAX_DAYS = 30, 240      # how long ago a churned member left

# Of the currently-valid members: this share expires inside a week, this share inside
# a month. `list_expiring_memberships(within_days=7)` returning nothing per gym is a
# dead demo, so the share is chosen rather than left to chance.
EXPIRING_WEEK_RATE, EXPIRING_MONTH_RATE = 0.08, 0.20

CANCELLED_RATE = 0.02   # cancelled mid-term: expiry is in the future, membership is not
PAID_RATE = 0.92        # the rest split into OVERDUE (old) and UNPAID (recent)
OVERDUE_AFTER_DAYS = 20
PLAN_LOYALTY = 0.8      # chance a renewal keeps the same plan rather than switching


class Journey(StrEnum):
    CONTINUOUS = "continuous"
    LAPSED = "lapsed"
    CHURNED = "churned"
    NEW = "new"


@dataclass(frozen=True)
class DurationOption:
    """One buyable thing: a plan at a length and a price."""

    plan_id: str
    duration_id: str
    days: int
    price: Decimal


@dataclass(frozen=True)
class MembershipRow:
    member_id: str
    plan_id: str
    duration_id: str
    start_date: datetime
    expires_at: datetime
    status: str
    price: Decimal


@dataclass(frozen=True)
class PaymentRow:
    member_id: str
    amount: Decimal
    paid_at: datetime
    due_date: datetime
    status: str


def pick_journey(rng: random.Random) -> Journey:
    return Journey(rng.choices(list(JOURNEY_WEIGHTS), weights=list(JOURNEY_WEIGHTS.values()))[0])


def _remaining_days(rng: random.Random, duration_days: int) -> int:
    """Where `now` falls inside the final membership, in days still to run."""
    roll = rng.random()
    if roll < EXPIRING_WEEK_RATE:
        return rng.randint(1, min(7, duration_days))
    if roll < EXPIRING_WEEK_RATE + EXPIRING_MONTH_RATE and duration_days > 8:
        return rng.randint(8, min(30, duration_days))
    return rng.randint(1, duration_days)


def build_history(
    member_id: str,
    joined_at: datetime,
    journey: Journey,
    options: list[DurationOption],
    rng: random.Random,
    now: datetime,
) -> list[MembershipRow]:
    """One member's whole membership sequence, oldest first."""
    # Narrow the catalogue first. A member who joined six weeks ago cannot have
    # bought an annual plan, and choosing one anyway pushes their start date into
    # the future once the length is subtracted from the target end.
    span = max((now - joined_at).days, 1)
    fitting = [o for o in options if o.days <= span] or [min(options, key=lambda o: o.days)]
    preferred = rng.choice(fitting)

    def next_option() -> DurationOption:
        return preferred if rng.random() < PLAN_LOYALTY else rng.choice(fitting)

    # Where the sequence ends relative to today. This is the number an evaluator
    # will ask about, so it is chosen, not inherited from a forward chain. The
    # remaining days are drawn from the chosen plan's own length, so the start that
    # falls out of `end - length` is always in the past.
    last = next_option()
    if journey is Journey.CHURNED:
        cursor_end = now - timedelta(days=rng.randint(CHURN_MIN_DAYS, CHURN_MAX_DAYS))
    else:
        cursor_end = now + timedelta(days=_remaining_days(rng, last.days))

    rows: list[MembershipRow] = []
    option = last
    # The lapse sits between the two most recent memberships for most lapsed
    # members, which is what makes them findable as "came back recently".
    lapse_at = rng.randint(1, 2) if journey is Journey.LAPSED else -1

    while len(rows) < MAX_MEMBERSHIPS[journey.value]:
        start = cursor_end - timedelta(days=option.days)
        if start < joined_at:
            if rows:
                break
            # Their first and only membership: keep the duration, move the start to
            # the join date. `expires_at` is recomputed, so the length rule holds.
            # Capped at today -- somebody who joined yesterday would otherwise get a
            # membership starting tomorrow, and a payment due for it.
            start = min(joined_at + timedelta(days=rng.randint(0, 3)), now)
            cursor_end = start + timedelta(days=option.days)

        expired = cursor_end <= now
        if not expired and rng.random() < CANCELLED_RATE:
            status = "CANCELLED"
        else:
            status = "EXPIRED" if expired else "ACTIVE"

        rows.append(MembershipRow(
            member_id=member_id, plan_id=option.plan_id, duration_id=option.duration_id,
            start_date=start, expires_at=cursor_end, status=status, price=option.price,
        ))

        if journey is Journey.NEW:
            break
        gap = (rng.randint(LAPSE_MIN_DAYS, LAPSE_MAX_DAYS) if len(rows) == lapse_at
               else rng.randint(0, RENEWAL_GAP_MAX_DAYS))
        cursor_end = start - timedelta(days=gap)
        if cursor_end <= joined_at:
            break
        option = next_option()

    rows.reverse()
    return rows


def build_payments(
    memberships: list[MembershipRow], rng: random.Random, now: datetime
) -> list[PaymentRow]:
    """One payment per membership, priced from the catalogue.

    `paid_at` is NOT NULL in Dahani's schema, so an unpaid row still carries a date --
    it gets the due date. That is why revenue must filter on `payment_status` and
    never sum by `paid_at` alone; `Payment.is_collected` exists for exactly this.
    Nullable `paid_at` is an open ask.

    There is also no `membership_id` on `payments`, so the link back is implicit:
    same member, an amount that matches a plan price, a date near a start. Also an
    open ask; until then nothing may join these two tables directly.
    """
    payments: list[PaymentRow] = []
    for membership in memberships:
        due = membership.start_date
        overdue_days = (now - due).days

        if rng.random() < PAID_RATE:
            paid_at = min(due + timedelta(days=rng.randint(0, 5)), now)
            status = "PAID"
        else:
            paid_at = due
            status = "OVERDUE" if overdue_days > OVERDUE_AFTER_DAYS else "UNPAID"

        payments.append(PaymentRow(
            member_id=membership.member_id, amount=membership.price,
            paid_at=paid_at, due_date=due, status=status,
        ))
    return payments
