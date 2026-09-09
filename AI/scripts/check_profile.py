"""Task 2.5 acceptance checks: the DB-derived profile.

Run inside the ai container via scripts/verify.sh. No network call.

The point of the day is *why the profile is a `SELECT` and not memory*, so the checks
are about where the facts come from and when they are read -- not about how nicely
they render.
"""

import asyncio
import inspect
import re
import sys

from app.agents.prompts import build_system_prompt
from app.api.ai import chat
from app.config import get_settings
from app.db import engine as db
from app.db import scope as sc
from app.db.models import DerivedMembershipStatus
from app.db.profile import MAX_PLANS_IN_PROMPT, Profile, ProfileUnavailable, load_profile
from app.db.scope import Scope

FAIL = 0


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<54} {detail}")
    if not cond:
        FAIL = 1


async def main() -> None:  # noqa: C901 -- a check script is a list, not a design
    await db.init_engine(get_settings())
    atlas = (await db._fetch_one("SELECT id FROM users WHERE email = :e",
                                 {"e": "karim@atlasfitness.ma"}))["id"]
    oasis = (await db._fetch_one("SELECT id FROM users WHERE email = :e",
                                 {"e": "nadia@oasisgym.ma"}))["id"]
    siham = await db._fetch_one("SELECT id, admin_id FROM members WHERE email = :e",
                                {"e": "siham@gmail.com"})
    omar = await db._fetch_one("SELECT id, admin_id FROM members WHERE email = :e",
                               {"e": "omar@gmail.com"})

    owner = Scope(admin_id=atlas)
    rival = Scope(admin_id=oasis)
    expiring = Scope(admin_id=siham["admin_id"], member_id=siham["id"])
    lapsed = Scope(admin_id=omar["admin_id"], member_id=omar["id"])

    # -------------------------------------------------------------- read fresh
    print("\n\033[1m  a SELECT, not a memory\033[0m")

    # The assertion that matters: the endpoint reads the profile inside the request,
    # so nothing about the caller can be older than this turn. Same idiom as the
    # per-request graph check -- a property proved from the source, because no single
    # response can demonstrate the absence of a cache.
    handler = inspect.getsource(chat)
    check("the endpoint loads the profile on every turn", "load_profile(" in handler)
    check("...and nothing caches it", "lru_cache" not in inspect.getsource(load_profile))
    # `thread_messages` never sees it: check_memory.py asserts no system row is
    # stored, and the profile only ever reaches the model through that prompt.
    check("the profile only travels in the system prompt",
          "profile" in inspect.signature(build_system_prompt).parameters)

    # ------------------------------------------------------------- the owner
    print("\n\033[1m  what an owner's profile says\033[0m")

    admin = await load_profile(owner)
    check("the gym is named from the database", admin.gym_name == "Atlas Fitness Agadir",
          admin.gym_name)
    check("the plans on sale are listed", len(admin.plan_names) > 0,
          ", ".join(admin.plan_names))
    check("...and capped, because the prompt is paid for every turn",
          len(admin.plan_names) <= MAX_PLANS_IN_PROMPT, f"limit {MAX_PLANS_IN_PROMPT}")
    check("an owner has no member fields", not admin.is_member
          and admin.membership_status is None)

    other = await load_profile(rival)
    check("the other gym gets its own name and plans",
          other.gym_name != admin.gym_name
          and set(other.plan_names).isdisjoint(admin.plan_names),
          other.gym_name)

    # ------------------------------------------------------------- the member
    print("\n\033[1m  what a member's profile says\033[0m")

    member = await load_profile(expiring)
    check("the member is named", member.member_name == "Siham Idrissi", member.member_name)
    check("...with their own membership state", member.membership_status is not None,
          str(member.membership_status))
    check("...the date it ends", member.membership_expires_on is not None,
          str(member.membership_expires_on))
    check("...and the plan it is on", bool(member.membership_plan), member.membership_plan)
    check("a member still sees the gym's plan list", bool(member.plan_names))

    # Guardrail #6, in the one place a member reads first. `membership_status` is
    # cron-maintained; a missed run would put a stale word on the opening line of
    # every answer. The profile derives it from `expires_at` instead.
    rows = await sc.select_models(expiring, "memberships", order_by="expires_at desc", limit=1)
    check("the status is derived, not read from the cron column",
          member.membership_status is rows[0].status,
          f"stored={rows[0].membership_status} derived={rows[0].status}")

    gone = await load_profile(lapsed)
    check("a lapsed member is described as lapsed",
          gone.membership_status in (DerivedMembershipStatus.EXPIRED,
                                     DerivedMembershipStatus.CANCELLED),
          str(gone.membership_status))

    # ------------------------------------------------------- what it must NOT say
    print("\n\033[1m  what stays in the tools\033[0m")

    prompt = build_system_prompt(owner, admin, question="how are we doing?")
    known = prompt.split("WHAT YOU ALREADY KNOW")[1].split("WHO YOU ARE")[0]

    # A figure in the prompt is paid for on every turn whether or not it is wanted,
    # and a model that can read one off its prompt stops calling the tool that would
    # have shown the owner where it came from. Asserted on the *facts* section rather
    # than on the whole prompt: the role section names revenue as a thing an owner may
    # ask about, which is the opposite of stating one.
    check("no money amount is asserted without a tool",
          not re.search(r"\d[\d,]*\.\d{2}|\bMAD\b", known), known.strip()[:60])
    check("no head-count is asserted without a tool",
          not re.search(r"\b\d{2,3}\b(?!\s+\w+\s+20\d\d)", known),
          "dates are allowed, counts are not")
    check("the profile carries no counts at all",
          not any(isinstance(value, int) for value in vars(admin).values()))

    check("the owner prompt states what was read", "read from the database just now" in prompt)
    check("...and lists the plans so 'the annual one' resolves",
          admin.plan_names[0] in prompt)
    check("an owner prompt claims no membership of its own",
          "Their membership is" not in prompt)

    member_prompt = build_system_prompt(expiring, member, question="when do I expire?")
    check("a member prompt states their own membership",
          "Their membership is" in member_prompt
          and member.membership_plan in member_prompt)
    check("...and still refuses gym-wide access", "gym-wide revenue" in member_prompt)

    # Plan names are catalogue identifiers, not prose. Answering a French question,
    # the model rendered "Basic Annual" as "Annuel Basique" -- correct French and a
    # name the owner cannot find in any search box.
    check("proper names are protected from translation",
          "Never translate a proper name" in prompt)

    # A profile with nothing to say adds no section rather than an empty heading.
    bare = build_system_prompt(owner, Profile(gym_name="Nowhere Gym"))
    check("an empty profile adds no empty section",
          "read from the database just now" not in bare and "Nowhere Gym" in bare)

    # -------------------------------------------------------------- the gap
    print("\n\033[1m  when the row is gone\033[0m")

    try:
        await load_profile(Scope(admin_id="00000000-0000-0000-0000-000000000000"))
        check("a deleted account raises rather than inventing a gym", False, "returned")
    except ProfileUnavailable:
        check("a deleted account raises rather than inventing a gym", True,
              "the endpoint answers 401")

    await db.dispose_engine()
    sys.exit(FAIL)


asyncio.run(main())
