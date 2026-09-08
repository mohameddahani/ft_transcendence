"""The four gyms and what each one sells (task 1.1).

Two rules shape this file.

**Every gym's catalogue is different, in name and in price.** That is not cosmetic:
`membership_plan_durations` has no `admin_id` and is the likeliest tenant leak in
the schema, so distinct prices per gym mean a leak shows up as a *wrong number* in
an answer, not merely as a wrong row count. `check_scope.py` relies on it.

**Gyms 1 and 2 already exist**, created by the D1 and D4 SQL fixtures. Their owner
rows and their first plan are reproduced here exactly -- same email, same plan name,
same price -- so the seeder recognises them instead of creating duplicates, and so
every test that names Youssef, Siham, Omar, Rachid or Latifa keeps passing. The
seeder adds the rest of each catalogue and a few hundred members around them.

Prices are MAD, and roughly what a gym in that city actually charges: Agadir is
budget, Marrakech is premium, Casablanca is mid-market, Fes is a small studio.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal


@dataclass(frozen=True)
class PlanSpec:
    name: str
    description: str
    durations: tuple[tuple[int, Decimal], ...]  # (duration_days, price MAD)


@dataclass(frozen=True)
class GymSpec:
    key: str            # short id used in generated usernames
    # 1-4. Generated phone numbers are +2126<key_digit><7 digits>, so a number is
    # unique across gyms by construction and its gym is readable at a glance.
    key_digit: int
    company_name: str
    city: str
    owner_first: str
    owner_last: str
    email: str          # unique in `users`; also how the seeder finds an existing gym
    user_name: str      # unique in `users`
    phone_number: str   # unique in `users`
    plans: tuple[PlanSpec, ...] = field(default_factory=tuple)


CATALOGUE: tuple[GymSpec, ...] = (
    GymSpec(
        key="atl",
        key_digit=1,
        company_name="Atlas Fitness Agadir",
        city="Agadir",
        owner_first="Karim", owner_last="Bennani",
        email="karim@atlasfitness.ma",
        user_name="karim_admin",
        phone_number="+212600000001",
        plans=(
            # Reproduces the D1 fixture's plan exactly. The seeder must find this one
            # rather than create a second "Basic Monthly" at a different price.
            PlanSpec("Basic Monthly", "Standard gym access",
                     ((30, Decimal("300.00")),)),
            PlanSpec("Basic Quarterly", "Standard access, three months",
                     ((90, Decimal("800.00")),)),
            PlanSpec("Basic Annual", "Standard access, twelve months",
                     ((365, Decimal("2800.00")),)),
            PlanSpec("Student Monthly", "Reduced rate, student card required",
                     ((30, Decimal("200.00")),)),
        ),
    ),
    GymSpec(
        key="oas",
        key_digit=2,
        company_name="Oasis Gym Marrakech",
        city="Marrakech",
        owner_first="Nadia", owner_last="Berrada",
        email="nadia@oasisgym.ma",
        user_name="nadia_admin",
        phone_number="+212600000002",
        plans=(
            PlanSpec("Premium Annual", "Full access, 12 months",
                     ((365, Decimal("4500.00")),)),
            PlanSpec("Premium Monthly", "Full access, pool and sauna",
                     ((30, Decimal("450.00")),)),
            PlanSpec("Premium Half-Year", "Full access, six months",
                     ((180, Decimal("2400.00")),)),
        ),
    ),
    GymSpec(
        key="tit",
        key_digit=3,
        company_name="Titan Fitness Casablanca",
        city="Casablanca",
        owner_first="Mehdi", owner_last="Lahlou",
        email="mehdi@titanfitness.ma",
        user_name="mehdi_admin",
        phone_number="+212600000003",
        plans=(
            PlanSpec("Standard Monthly", "Weights, cardio and classes",
                     ((30, Decimal("350.00")),)),
            PlanSpec("Standard Quarterly", "Weights, cardio and classes, 3 months",
                     ((90, Decimal("950.00")),)),
            PlanSpec("Standard Annual", "Weights, cardio and classes, 12 months",
                     ((365, Decimal("3400.00")),)),
            PlanSpec("Couples Monthly", "Two people, one membership",
                     ((30, Decimal("600.00")),)),
        ),
    ),
    GymSpec(
        key="med",
        key_digit=4,
        company_name="Medina Wellness Fes",
        city="Fes",
        owner_first="Salma", owner_last="Kettani",
        email="salma@medinawellness.ma",
        user_name="salma_admin",
        phone_number="+212600000004",
        plans=(
            PlanSpec("Wellness Monthly", "Studio classes and open gym",
                     ((30, Decimal("280.00")),)),
            PlanSpec("Wellness Quarterly", "Studio classes, three months",
                     ((90, Decimal("750.00")),)),
            PlanSpec("Wellness Annual", "Studio classes, twelve months",
                     ((365, Decimal("2600.00")),)),
        ),
    ),
)

# Members created by the D1/D4 fixtures. The seeder leaves them alone: they are the
# named anchors the rest of the test suite asserts against.
FIXTURE_MEMBER_USERNAMES: frozenset[str] = frozenset(
    {"youssef_a", "siham_i", "omar_t", "rachid_o", "latifa_s"}
)


def all_prices() -> list[Decimal]:
    return [price for gym in CATALOGUE for plan in gym.plans for _, price in plan.durations]
