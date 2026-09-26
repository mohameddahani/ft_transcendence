from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal


@dataclass(frozen=True)
class PlanSpec:
    name: str
    description: str
    durations: tuple[tuple[int, Decimal], ...]
    weekly_visit_limit: int = 7


@dataclass(frozen=True)
class GymSpec:
    key: str
    key_digit: int
    company_name: str
    city: str
    owner_first: str
    owner_last: str
    email: str
    user_name: str
    phone_number: str
    plans: tuple[PlanSpec, ...] = field(default_factory=tuple)


# plan names and prices are unique across gyms, so data leaking between gyms shows up as a wrong number
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
            PlanSpec("Basic Monthly", "Standard gym access",
                     ((30, Decimal("300.00")),), 4),
            PlanSpec("Basic Quarterly", "Standard access, three months",
                     ((90, Decimal("800.00")),), 4),
            PlanSpec("Basic Annual", "Standard access, twelve months",
                     ((365, Decimal("2800.00")),), 5),
            PlanSpec("Student Monthly", "Reduced rate, student card required",
                     ((30, Decimal("200.00")),), 3),
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
                     ((365, Decimal("4500.00")),), 7),
            PlanSpec("Premium Monthly", "Full access, pool and sauna",
                     ((30, Decimal("450.00")),), 7),
            PlanSpec("Premium Half-Year", "Full access, six months",
                     ((180, Decimal("2400.00")),), 7),
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
                     ((30, Decimal("350.00")),), 5),
            PlanSpec("Standard Quarterly", "Weights, cardio and classes, 3 months",
                     ((90, Decimal("950.00")),), 5),
            PlanSpec("Standard Annual", "Weights, cardio and classes, 12 months",
                     ((365, Decimal("3400.00")),), 6),
            PlanSpec("Couples Monthly", "Two people, one membership",
                     ((30, Decimal("600.00")),), 4),
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
                     ((30, Decimal("280.00")),), 4),
            PlanSpec("Wellness Quarterly", "Studio classes, three months",
                     ((90, Decimal("750.00")),), 5),
            PlanSpec("Wellness Annual", "Studio classes, twelve months",
                     ((365, Decimal("2600.00")),), 6),
        ),
    ),
)

# members created by the SQL fixtures; the seeder never touches them
FIXTURE_MEMBER_USERNAMES: frozenset[str] = frozenset(
    {"youssef_a", "siham_i", "omar_t", "rachid_o", "latifa_s"}
)


def all_prices() -> list[Decimal]:
    return [price for gym in CATALOGUE for plan in gym.plans for _, price in plan.durations]
