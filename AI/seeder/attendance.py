from __future__ import annotations

import random
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from zoneinfo import ZoneInfo

CASABLANCA = ZoneInfo("Africa/Casablanca")

MONDAY, FRIDAY, SATURDAY, SUNDAY = 0, 4, 5, 6
WEEKDAYS = (0, 1, 2, 3, 4)
WEEKEND = (5, 6)


class Archetype(StrEnum):
    REGULAR = "regular"
    FADER = "fader"
    WEEKEND_ONLY = "weekend_only"
    CLASS_HOPPER = "class_hopper"


# a fader starts strong and slowly stops coming: the members an owner should chase
ARCHETYPE_WEIGHTS: dict[str, int] = {
    "regular": 30, "fader": 25, "weekend_only": 20, "class_hopper": 25,
}

WEEKDAY_WEIGHTS: dict[int, float] = {0: 1.2, 1: 1.1, 2: 1.1, 3: 1.0, 4: 0.6, 5: 0.85, 6: 0.8}

EVENING_HOURS = ((17, 12), (18, 30), (19, 35), (20, 20), (21, 8))
MORNING_HOURS = ((6, 10), (7, 30), (8, 35), (9, 25))
MIDDAY_HOURS = ((12, 40), (13, 35), (14, 25))
AFTERNOON_HOURS = ((15, 12), (16, 18))
WEEKEND_HOURS = ((9, 30), (10, 35), (11, 25), (12, 10), (16, 8))

CLASS_SLOTS: tuple[tuple[int, int], ...] = ((0, 19), (1, 19), (2, 19), (3, 20), (5, 10))


@dataclass(frozen=True)
class Profile:
    visits_per_week: float
    days: tuple[int, ...]
    hours: tuple[tuple[int, int], ...]
    half_life_weeks: float | None = None


PROFILES: dict[str, Profile] = {
    "regular": Profile(3.8, WEEKDAYS + (SATURDAY,),
                       EVENING_HOURS + MORNING_HOURS + MIDDAY_HOURS + AFTERNOON_HOURS),
    "fader": Profile(4.5, WEEKDAYS, EVENING_HOURS + MORNING_HOURS + AFTERNOON_HOURS,
                     half_life_weeks=4.5),
    "weekend_only": Profile(1.6, WEEKEND, WEEKEND_HOURS),
    "class_hopper": Profile(2.5, tuple(d for d, _ in CLASS_SLOTS), ()),
}

CANCELLED_ACTIVE_SHARE = 0.4


@dataclass(frozen=True)
class Window:
    member_id: str
    membership_id: str
    start: datetime
    end: datetime
    cancelled: bool
    weekly_visit_limit: int


def pick_archetype(rng: random.Random) -> Archetype:
    return Archetype(
        rng.choices(list(ARCHETYPE_WEIGHTS), weights=list(ARCHETYPE_WEIGHTS.values()))[0])


def _weighted(rng: random.Random, options: tuple[tuple[int, int], ...]) -> int:
    return rng.choices([v for v, _ in options], weights=[w for _, w in options])[0]


def _visit_time(rng: random.Random, day: datetime, archetype: Archetype,
                profile: Profile) -> datetime:
    if archetype is Archetype.CLASS_HOPPER:
        hour = next((h for d, h in CLASS_SLOTS if d == day.weekday()), 19)
    else:
        hour = _weighted(rng, profile.hours)
    minute = rng.choice((0, 5, 10)) if archetype is Archetype.CLASS_HOPPER else rng.randint(0, 59)
    # hours are picked in gym time, the database stores UTC
    local = day.replace(hour=hour, minute=minute, second=0, microsecond=0, tzinfo=CASABLANCA)
    return local.astimezone(UTC).replace(tzinfo=None)


def build_check_ins(
    windows: list[Window],
    archetype: Archetype,
    rng: random.Random,
    now: datetime,
) -> list[tuple[str, str, datetime]]:
    visits: list[tuple[str, str, datetime]] = []
    profile = PROFILES[archetype.value]
    origin = min((w.start for w in windows), default=now)

    for window in windows:
        end = min(window.end, now)
        if window.cancelled:
            end = window.start + (end - window.start) * CANCELLED_ACTIVE_SHARE
        if end <= window.start:
            continue

        week_start = window.start
        while week_start < end:
            rate = profile.visits_per_week
            if profile.half_life_weeks:
                weeks_in = (week_start - origin).days / 7
                rate *= 0.5 ** (weeks_in / profile.half_life_weeks)

            wanted = round(rng.gauss(rate, 0.8))
            wanted = max(0, min(wanted, len(profile.days), window.weekly_visit_limit))
            if wanted:
                for weekday in rng.sample(profile.days, k=wanted):
                    if rng.random() > WEEKDAY_WEIGHTS[weekday]:
                        continue
                    day = week_start + timedelta(days=(weekday - week_start.weekday()) % 7)
                    if not (window.start <= day < end) or day > now:
                        continue
                    moment = _visit_time(rng, day, archetype, profile)
                    if moment > now:
                        continue
                    visits.append((window.member_id, window.membership_id, moment))
            week_start += timedelta(days=7)

    # at most one visit per day
    seen: set[str] = set()
    unique: list[tuple[str, str, datetime]] = []
    for member_id, membership_id, moment in sorted(visits, key=lambda v: v[2]):
        key = moment.date().isoformat()
        if key not in seen:
            seen.add(key)
            unique.append((member_id, membership_id, moment))
    return unique


# ids come from the seeded RNG, so the same seed gives the same data
def new_id(rng: random.Random) -> str:
    return str(uuid.UUID(int=rng.getrandbits(128), version=4))
