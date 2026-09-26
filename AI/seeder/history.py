from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from enum import StrEnum

# continuous: always renews, lapsed: left and came back, churned: left, new: just joined
JOURNEY_WEIGHTS: dict[str, int] = {
    "continuous": 35, "lapsed": 25, "churned": 25, "new": 15,
}

MAX_MEMBERSHIPS: dict[str, int] = {"continuous": 8, "lapsed": 6, "churned": 3, "new": 1}

LAPSE_MIN_DAYS, LAPSE_MAX_DAYS = 30, 120
RENEWAL_GAP_MAX_DAYS = 5
CHURN_MIN_DAYS, CHURN_MAX_DAYS = 30, 240

# share of members whose current membership ends within a week / a month
EXPIRING_WEEK_RATE, EXPIRING_MONTH_RATE = 0.08, 0.20

CANCELLED_RATE = 0.02
PAID_RATE = 0.92
OVERDUE_AFTER_DAYS = 20
PLAN_LOYALTY = 0.8


class Journey(StrEnum):
    CONTINUOUS = "continuous"
    LAPSED = "lapsed"
    CHURNED = "churned"
    NEW = "new"


@dataclass(frozen=True)
class DurationOption:
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
    # built backwards from today, so we control who is expiring right now
    span = max((now - joined_at).days, 1)
    fitting = [o for o in options if o.days <= span] or [min(options, key=lambda o: o.days)]
    preferred = rng.choice(fitting)

    def next_option() -> DurationOption:
        return preferred if rng.random() < PLAN_LOYALTY else rng.choice(fitting)

    last = next_option()
    if journey is Journey.CHURNED:
        cursor_end = now - timedelta(days=rng.randint(CHURN_MIN_DAYS, CHURN_MAX_DAYS))
    else:
        cursor_end = now + timedelta(days=_remaining_days(rng, last.days))

    rows: list[MembershipRow] = []
    option = last
    lapse_at = rng.randint(1, 2) if journey is Journey.LAPSED else -1

    while len(rows) < MAX_MEMBERSHIPS[journey.value]:
        start = cursor_end - timedelta(days=option.days)
        if start < joined_at:
            if rows:
                break
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
