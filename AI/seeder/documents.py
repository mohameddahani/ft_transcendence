"""Per-gym policy documents, tagged staff or member (task 1.7).

    python -m seeder.documents          # rewrite seeder/documents/

These are the RAG corpus. Phase 3 uploads them through `POST /ai/documents` and
chunks them into Chroma; this file produces them.

**Generated from `catalogue.py`, not written by hand.** If a document says the annual
plan costs 2,600 MAD and the database says 2,800, the assistant contradicts itself
depending on whether the question routes to SQL or to retrieval -- and it will look
like a model failure rather than a data one. Deriving the prices from the same source
makes that impossible.

**Every gym's policies differ**, in the same way and for the same reason their prices
do: a retrieval leak across tenants then shows up as a *wrong fact* in an answer, not
merely as an extra chunk. Atlas allows one 30-day freeze a year, Oasis two of 14 days;
the opening hours, the class timetable and the guest-pass allowance all differ too.

**The staff documents carry facts a member must never see** -- the discount a
receptionist may authorise without approval, where the key safe is, the refund window.
`gym_docs` is filtered by `visibility = 'member'` for the member agent (AI_SPECS 2.3),
and those facts are how that filter gets tested: ask the member agent what discount it
can give you, and the correct behaviour is not to know.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path

from seeder.catalogue import CATALOGUE, GymSpec

DOCS_ROOT = Path(__file__).resolve().parent / "documents"

VISIBILITIES = ("member", "staff")


@dataclass(frozen=True)
class GymPolicy:
    weekday_hours: str
    weekend_hours: str
    freeze_days: int
    freezes_per_year: int
    cancellation_notice_days: int
    guest_passes_per_month: int
    classes: tuple[tuple[str, str, str], ...]   # (day, time, class)
    # --- staff only, below this line -------------------------------------------
    max_discount_pct: int
    refund_window_days: int
    late_fee_mad: Decimal
    key_safe_location: str
    incident_contact: str


POLICIES: dict[str, GymPolicy] = {
    "atl": GymPolicy(
        weekday_hours="06:00 to 22:00", weekend_hours="08:00 to 20:00",
        freeze_days=30, freezes_per_year=1, cancellation_notice_days=30,
        guest_passes_per_month=1,
        classes=(("Monday", "19:00", "Circuit training"),
                 ("Wednesday", "19:00", "Boxing fundamentals"),
                 ("Saturday", "10:00", "Functional strength")),
        max_discount_pct=15, refund_window_days=14, late_fee_mad=Decimal("50.00"),
        key_safe_location="behind the reception desk, lower left drawer",
        incident_contact="Karim Bennani, +212 600 000 001"),
    "oas": GymPolicy(
        weekday_hours="07:00 to 23:00", weekend_hours="09:00 to 21:00",
        freeze_days=14, freezes_per_year=2, cancellation_notice_days=45,
        guest_passes_per_month=2,
        classes=(("Tuesday", "19:00", "Yoga"),
                 ("Thursday", "20:00", "Spinning"),
                 ("Saturday", "10:00", "Aqua fitness")),
        max_discount_pct=10, refund_window_days=7, late_fee_mad=Decimal("100.00"),
        key_safe_location="in the manager's office, inside the filing cabinet",
        incident_contact="Nadia Berrada, +212 600 000 002"),
    "tit": GymPolicy(
        weekday_hours="05:30 to 23:30", weekend_hours="07:00 to 21:00",
        freeze_days=21, freezes_per_year=2, cancellation_notice_days=30,
        guest_passes_per_month=3,
        classes=(("Monday", "19:00", "CrossFit"),
                 ("Wednesday", "19:00", "Olympic lifting"),
                 ("Thursday", "20:00", "HIIT"),
                 ("Saturday", "10:00", "Open gym coaching")),
        max_discount_pct=20, refund_window_days=30, late_fee_mad=Decimal("75.00"),
        key_safe_location="the staff room, above the lockers",
        incident_contact="Mehdi Lahlou, +212 600 000 003"),
    "med": GymPolicy(
        weekday_hours="07:00 to 21:00", weekend_hours="09:00 to 18:00",
        freeze_days=60, freezes_per_year=1, cancellation_notice_days=15,
        guest_passes_per_month=0,
        classes=(("Tuesday", "19:00", "Pilates"),
                 ("Thursday", "20:00", "Barre"),
                 ("Saturday", "10:00", "Mobility and stretch")),
        max_discount_pct=5, refund_window_days=14, late_fee_mad=Decimal("40.00"),
        key_safe_location="the reception cupboard, second shelf",
        incident_contact="Salma Kettani, +212 600 000 004"),
}


def _front_matter(gym: GymSpec, visibility: str, title: str) -> str:
    return (f"---\ngym: {gym.key}\ngym_name: {gym.company_name}\n"
            f"visibility: {visibility}\ntitle: {title}\n---\n")


def _price_table(gym: GymSpec) -> str:
    rows = ["| Plan | Length | Price |", "|---|---|---|"]
    for plan in gym.plans:
        for days, price in plan.durations:
            rows.append(f"| {plan.name} | {days} days | {price:,.2f} MAD |")
    return "\n".join(rows)


def membership_terms(gym: GymSpec, policy: GymPolicy) -> str:
    return f"""# Membership terms — {gym.company_name}

## What you are buying

{gym.company_name} sells the plans listed below. Prices are in Moroccan dirhams and
include VAT. A membership begins on the day it is paid for and runs for the number of
days shown; it does not renew automatically, and we do not hold your card details.

{_price_table(gym)}

## Freezing your membership

You may freeze your membership {policy.freezes_per_year} time(s) per calendar year,
for up to {policy.freeze_days} consecutive days. A freeze extends your expiry date by
the number of days frozen. Ask at reception at least two working days before you want
the freeze to start; we cannot backdate one.

## Cancelling

Give us {policy.cancellation_notice_days} days notice in writing, by email or on the
form at reception. Your membership stays active until the end of the notice period and
you keep full access during it.

## Guest passes

Each member may bring {policy.guest_passes_per_month} guest per month at no charge.
Guests must sign in at reception and are your responsibility while they are in the
building. Members under 18 may not sign in guests.

## Payment

Membership is paid before access begins. If a payment fails or is missed, access is
suspended until it is settled — your membership dates do not pause while that is
outstanding, so a late payment shortens the time you have left.

## Your information

We hold your name, contact details, date of birth and attendance record for as long as
you are a member and for two years afterwards. You can ask to see it, correct it, or
have it deleted once your membership has ended.
"""


def facilities_and_hours(gym: GymSpec, policy: GymPolicy) -> str:
    timetable = "\n".join(
        f"| {day} | {time} | {name} |" for day, time, name in policy.classes)
    return f"""# Facilities, hours and gym rules — {gym.company_name}

## Opening hours

| Days | Hours |
|---|---|
| Monday to Friday | {policy.weekday_hours} |
| Saturday and Sunday | {policy.weekend_hours} |

Last entry is 45 minutes before closing. We close on Eid al-Fitr and Eid al-Adha; the
dates are posted at reception two weeks ahead.

## Class timetable

Classes are included in every membership. Places are first come, first served — arrive
five minutes early, because we start on time.

| Day | Time | Class |
|---|---|---|
{timetable}

## Rules

1. **Rack your weights.** Every plate, every time. This is the rule we enforce most.
2. Wipe down equipment after use. Spray and cloths are on every pillar.
3. Indoor shoes only on the gym floor. No outdoor shoes past the changing rooms.
4. No filming other members. Film yourself if you must, with nobody else in frame.
5. Bags stay in the lockers, not on the floor beside you.
6. Twenty minutes maximum on cardio machines when somebody is waiting.
7. Chalk is allowed in the free weights area only.

## Changing rooms and lockers

Lockers are for the duration of your visit. Anything left overnight is moved to lost
property and kept for 30 days. Bring your own padlock — we sell them at reception if
you forget.

## Personal training

Personal training is not included in membership and is arranged directly with the
coach. Coaches working here are insured and hold a recognised qualification; ask to see
it, they will not mind.

## If something is broken

Tell reception. There is a fault log at the desk and anything reported before midday is
looked at the same day. Do not use equipment marked out of order, even if it seems to
work.
"""


def pricing_authority(gym: GymSpec, policy: GymPolicy) -> str:
    cheapest = min(p for plan in gym.plans for _, p in plan.durations)
    return f"""# Staff handbook — pricing and discount authority ({gym.company_name})

**Internal. Do not share with members or leave at the front desk.**

## Discount authority

Reception staff may authorise a discount of up to **{policy.max_discount_pct}%** on any
plan without approval. Anything above that goes to {policy.incident_contact.split(',')[0]}
in person or by phone — not by message, and not "I will confirm later".

Standing exceptions that do not count against the {policy.max_discount_pct}% ceiling:

- Students with a valid card: our published student rate only.
- A second family member at the same address: 10% off their plan.
- Corporate agreements: the rate in the signed agreement, no more.

Never discount below **{cheapest:,.2f} MAD**, which is our floor for any plan at this
site regardless of who is asking.

## Refunds

A member may cancel and be refunded in full within **{policy.refund_window_days} days**
of first payment, provided they have visited no more than twice. After that, refunds are
pro rata by unused days and require manager approval. Log every refund the same day.

## Late and failed payments

A missed payment carries a late fee of **{policy.late_fee_mad:,.2f} MAD** after seven
days. Suspend access on day eight — do not let it run, because it becomes much harder to
recover after a month. Waive the fee once, for a member in good standing, at your own
discretion; twice needs approval.

## What not to say

- Do not quote a price you have not checked in the system today.
- Do not tell a member what another member pays. Ever.
- Do not promise a freeze, a refund or a transfer that you are not authorised to grant.
"""


def operations_manual(gym: GymSpec, policy: GymPolicy) -> str:
    return f"""# Staff handbook — daily operations ({gym.company_name})

**Internal. Do not share with members.**

## Opening

Opening staff arrive 30 minutes before {policy.weekday_hours.split(' to ')[0]}.

1. Keys are in the key safe, {policy.key_safe_location}. Return them there before you
   leave, not in your pocket.
2. Turn on the floor lights, the ventilation and the music system in that order.
3. Walk the floor. Check every plate is racked and no equipment is marked out of order
   without a fault card.
4. Check the changing rooms: hot water running, no standing water, bins emptied.
5. Unlock the front door on the hour, not before.

## During the day

- The fault log lives at reception. Anything reported before midday is looked at the
  same day; anything after goes on tomorrow's list.
- Peak is 19:00 to 20:00 on weekdays. Two staff on the floor during that hour, not one.
- Wipe-down stations get restocked at 12:00 and again at 18:00.

## Closing

1. Last entry is 45 minutes before closing; tell people at the door, do not let them in
   and then rush them.
2. Clear the floor 10 minutes before closing. Racked, wiped, nothing left out.
3. Lockers: cut anything still locked, bag it, label it with the date, lost property.
4. Cash drawer counted and signed by two people. Discrepancies of any size get reported
   the same night.
5. Lights, ventilation, music off. Alarm set. Keys back in the safe.

## Incidents

Any injury, any altercation, any member refused entry: write it in the incident book
before you go home, while you still remember it. Then call {policy.incident_contact}.

For a medical emergency call 15 first, then the number above. The first aid kit is at
reception and the defibrillator is on the wall beside it. Do not move an injured person
unless they are in immediate danger.

## Data

Member records are confidential. Do not look up a member unless you are serving them,
do not photograph the screen, and do not discuss a member's attendance or payments with
anyone outside staff — including their family.
"""


DOCUMENTS: tuple[tuple[str, str, str, object], ...] = (
    ("membership-terms.md", "member", "Membership terms", membership_terms),
    ("facilities-and-hours.md", "member", "Facilities, hours and rules", facilities_and_hours),
    ("pricing-authority.md", "staff", "Pricing and discount authority", pricing_authority),
    ("operations-manual.md", "staff", "Daily operations", operations_manual),
)


@dataclass(frozen=True)
class Document:
    gym_key: str
    gym_name: str
    visibility: str
    title: str
    filename: str
    body: str

    @property
    def text(self) -> str:
        """Body only, without front matter. This is what gets chunked."""
        return self.body


def build_all() -> list[Document]:
    docs: list[Document] = []
    for gym in CATALOGUE:
        policy = POLICIES[gym.key]
        for filename, visibility, title, render in DOCUMENTS:
            docs.append(Document(
                gym_key=gym.key, gym_name=gym.company_name, visibility=visibility,
                title=title, filename=filename, body=render(gym, policy)))
    return docs


def write_all(root: Path = DOCS_ROOT) -> list[Path]:
    """One directory per gym, front matter at the top of every file."""
    written: list[Path] = []
    for doc in build_all():
        directory = root / doc.gym_key
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / doc.filename
        gym = next(g for g in CATALOGUE if g.key == doc.gym_key)
        path.write_text(_front_matter(gym, doc.visibility, doc.title) + "\n" + doc.body)
        written.append(path)
    return written


def parse(path: Path) -> Document:
    """Read a document back, front matter and all. Phase 3 ingests through this."""
    raw = path.read_text()
    if not raw.startswith("---\n"):
        raise ValueError(f"{path} has no front matter")
    _, header, body = raw.split("---\n", 2)
    meta = dict(
        line.split(":", 1) for line in header.strip().splitlines() if ":" in line)
    meta = {k.strip(): v.strip() for k, v in meta.items()}
    return Document(gym_key=meta["gym"], gym_name=meta["gym_name"],
                    visibility=meta["visibility"], title=meta["title"],
                    filename=path.name, body=body.lstrip("\n"))


def load_all(root: Path = DOCS_ROOT) -> list[Document]:
    return [parse(p) for p in sorted(root.glob("*/*.md"))]


if __name__ == "__main__":
    paths = write_all()
    total = sum(p.stat().st_size for p in paths)
    print(f"{len(paths)} documents, {total:,} bytes, in {DOCS_ROOT}")
    for gym in CATALOGUE:
        kinds = [f"{v}:{sum(1 for _, vis, _, _ in DOCUMENTS if vis == v)}" for v in VISIBILITIES]
        print(f"  {gym.company_name:<28} {' '.join(kinds)}")
    sys.exit(0)
