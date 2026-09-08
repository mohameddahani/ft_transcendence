"""Check-in events from archetypes (task 1.5).

**Why not just scatter visits at random.** Uniform randomness is the failure mode
this file exists to avoid. If everyone checks in at random times then attendance
carries no information: "who is about to churn?" has no signal, because frequency is
noise; "what is my busiest hour?" is flat; "who stopped coming?" returns whoever the
random number generator happened to starve. The agent would compute all of it
correctly and still say nothing worth hearing. A demo fails there, and it looks like
the model's fault.

So the patterns are put in deliberately, as four kinds of person:

    regular       3-4x/week, weekday evenings, steady for as long as they are a member
    fader         starts at 4-5x/week and decays to nothing over a couple of months
    weekend only  1-2x/week, Saturday and Sunday mornings
    class-hopper  2-3x/week, only at class times

**The fader is the important one.** It is the churn signal in attendance form, and it
is what `list_inactive_members(days_since_last_checkin=21)` finds. A member whose
membership is still valid but who has not appeared in three weeks is the single most
useful thing the assistant can tell a gym owner, and it only exists here because it
was generated on purpose.

Sampling is weekly rather than daily: a week is the unit people actually plan in
("I go three times a week"), and it is ~7x fewer iterations over a 12-month history.
"""

from __future__ import annotations

import random
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from zoneinfo import ZoneInfo

# Every hour in this file is the hour on the clock in the gym. The column holds UTC
# instants (Prisma writes UTC into `timestamp without time zone`), so a 19:00 visit
# is stored as 18:00 -- Morocco is UTC+1, and UTC+0 during Ramadan, which ZoneInfo
# knows and a hardcoded offset would not. Skip this and every answer about the
# busiest hour is an hour late, with nothing to show why.
CASABLANCA = ZoneInfo("Africa/Casablanca")

MONDAY, FRIDAY, SATURDAY, SUNDAY = 0, 4, 5, 6
WEEKDAYS = (0, 1, 2, 3, 4)
WEEKEND = (5, 6)


class Archetype(StrEnum):
    REGULAR = "regular"
    FADER = "fader"
    WEEKEND_ONLY = "weekend_only"
    CLASS_HOPPER = "class_hopper"


ARCHETYPE_WEIGHTS: dict[str, int] = {
    "regular": 30, "fader": 25, "weekend_only": 20, "class_hopper": 25,
}

# Fridays are quiet in Morocco -- midday prayer breaks the day in half -- and Sunday
# is softer than Saturday. This is what gives `group_by="weekday"` a shape instead of
# a flat bar chart.
WEEKDAY_WEIGHTS: dict[int, float] = {0: 1.2, 1: 1.1, 2: 1.1, 3: 1.0, 4: 0.6, 5: 0.85, 6: 0.8}

# (hour, weight). Evenings dominate; a real morning crowd exists and should show up
# as a second, smaller peak rather than noise.
EVENING_HOURS = ((17, 12), (18, 30), (19, 35), (20, 20), (21, 8))
MORNING_HOURS = ((6, 10), (7, 30), (8, 35), (9, 25))
MIDDAY_HOURS = ((12, 40), (13, 35), (14, 25))
# The dead hours between lunch and the evening rush. Thin on purpose, but not empty:
# a gym with literally zero visits at 15:00 reads as generated at a glance.
AFTERNOON_HOURS = ((15, 12), (16, 18))
WEEKEND_HOURS = ((9, 30), (10, 35), (11, 25), (12, 10), (16, 8))

# Fixed slots, so the class-hopper produces spikes an owner would recognise. One on
# each weekday plus Saturday: with only Mon/Wed/Thu, Tuesday became a trough for no
# reason anybody could explain, which is the kind of artefact that makes seeded data
# look seeded.
CLASS_SLOTS: tuple[tuple[int, int], ...] = ((0, 19), (1, 19), (2, 19), (3, 20), (5, 10))


@dataclass(frozen=True)
class Profile:
    """How often, on which days, at what time."""

    visits_per_week: float
    days: tuple[int, ...]
    hours: tuple[tuple[int, int], ...]
    # Weeks for the rate to halve. None = steady for the whole membership.
    half_life_weeks: float | None = None


PROFILES: dict[str, Profile] = {
    "regular": Profile(3.8, WEEKDAYS + (SATURDAY,),
                       EVENING_HOURS + MORNING_HOURS + MIDDAY_HOURS + AFTERNOON_HOURS),
    # Decays to about a tenth of its starting rate in 15 weeks, which is what
    # "stopped coming" looks like from the outside.
    "fader": Profile(4.5, WEEKDAYS, EVENING_HOURS + MORNING_HOURS + AFTERNOON_HOURS,
                     half_life_weeks=4.5),
    "weekend_only": Profile(1.6, WEEKEND, WEEKEND_HOURS),
    "class_hopper": Profile(2.5, tuple(d for d, _ in CLASS_SLOTS), ()),
}

# A cancelled membership was abandoned partway through; nobody keeps training after
# they quit. Visits stop somewhere in the first part of the window.
CANCELLED_ACTIVE_SHARE = 0.4


@dataclass(frozen=True)
class Window:
    """A period during which a member could actually have visited."""

    member_id: str
    start: datetime
    end: datetime
    cancelled: bool


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
    # Class slots start on the hour; everyone else drifts.
    minute = rng.choice((0, 5, 10)) if archetype is Archetype.CLASS_HOPPER else rng.randint(0, 59)
    local = day.replace(hour=hour, minute=minute, second=0, microsecond=0, tzinfo=CASABLANCA)
    return local.astimezone(UTC).replace(tzinfo=None)


def build_check_ins(
    windows: list[Window],
    archetype: Archetype,
    rng: random.Random,
    now: datetime,
) -> list[tuple[str, datetime]]:
    """(member_id, checked_in_at) for one member across every window they paid for.

    Windows are the member's memberships. Nobody checks in without a valid one, and
    generating outside them would produce the single most obviously wrong row in the
    corpus: attendance from someone who was not a member that day.
    """
    visits: list[tuple[str, datetime]] = []
    profile = PROFILES[archetype.value]
    # The decay clock runs from the member's first membership, not from each one:
    # a fader who renews does not become enthusiastic again.
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

            # Gaussian around the rate, so weeks vary the way real ones do. Never
            # more visits than there are eligible days -- one check-in per day.
            wanted = round(rng.gauss(rate, 0.8))
            wanted = max(0, min(wanted, len(profile.days)))
            if wanted:
                # Distinct days: `sample`, not `choices`. One check-in per day.
                for weekday in rng.sample(profile.days, k=wanted):
                    # Skip a day against its own weight: this is what makes Friday
                    # quieter without removing it from anyone's schedule.
                    if rng.random() > WEEKDAY_WEIGHTS[weekday]:
                        continue
                    day = week_start + timedelta(days=(weekday - week_start.weekday()) % 7)
                    if not (window.start <= day < end) or day > now:
                        continue
                    visits.append((window.member_id, _visit_time(rng, day, archetype, profile)))
            week_start += timedelta(days=7)

    # One check-in per day, and chronological. Duplicates are possible when two
    # windows abut or a week straddles a renewal.
    seen: set[str] = set()
    unique: list[tuple[str, datetime]] = []
    for member_id, moment in sorted(visits, key=lambda v: v[1]):
        key = moment.date().isoformat()
        if key not in seen:
            seen.add(key)
            unique.append((member_id, moment))
    return unique


def new_id(rng: random.Random) -> str:
    """A UUID drawn from the seeded generator, so a re-run produces the same ids."""
    return str(uuid.UUID(int=rng.getrandbits(128), version=4))
