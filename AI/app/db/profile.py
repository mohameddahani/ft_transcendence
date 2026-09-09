"""Who the caller is, read fresh on every turn (task 2.5).

**A `SELECT`, never memory.** The profile is the one part of the context that is a
statement about the world rather than about the conversation, and the world moves
while the conversation is open: a membership that was valid when the thread started
expires overnight, a plan is renamed, a member is banned. A profile carried in the
transcript would still be saying yesterday's thing, confidently, with no way for the
model to know. So it is read again on every turn and never written to
`thread_messages` -- which is exactly why the system prompt is rebuilt per turn too.

**What belongs here, and what does not.** Identity and the vocabulary needed to
*interpret* a question: the gym's name, the plan names so "the platinum one" resolves,
and for a member their own name and membership state. Not metrics -- revenue, counts
and lists stay in tools. Two reasons: a number in the prompt is paid for on every
turn whether or not it is wanted, and a model that can read a figure off its prompt
stops calling the tool that would have shown the owner where the figure came from.

The member's own membership is the deliberate exception. It is one row, it is the
question members actually ask, and its freshness is the whole point of this module.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.db import scope as sc
from app.db.models import DerivedMembershipStatus, Membership
from app.db.scope import Scope

# The prompt is paid for on every turn of every conversation. A gym with forty plans
# does not need all forty in it for "the platinum one" to resolve.
MAX_PLANS_IN_PROMPT = 12


@dataclass(frozen=True)
class Profile:
    """Everything the prompt is allowed to assert without calling a tool."""

    gym_name: str
    plan_names: tuple[str, ...] = ()
    # Members only. `None` for an owner, and for a member who has never had a
    # membership -- which is a real state, not an error.
    member_name: str | None = None
    membership_status: DerivedMembershipStatus | None = None
    membership_expires_on: date | None = None
    membership_plan: str | None = None

    @property
    def is_member(self) -> bool:
        return self.member_name is not None


class ProfileUnavailable(LookupError):
    """The caller's own row is gone -- deleted between the token check and now."""


async def load_profile(scope: Scope) -> Profile:
    """Read the caller's profile through the scope, like everything else.

    One extra round trip per turn, on a request that is about to spend several
    seconds talking to Gemini. Caching it would save nothing worth having and would
    reintroduce the staleness this module exists to avoid.
    """
    gyms = await sc.select_models(scope, "users")
    if not gyms:
        raise ProfileUnavailable("the caller's gym no longer exists")

    plans = await sc.select_models(
        scope, "membership_plans", where="is_active = true",
        order_by="plan_name asc", limit=MAX_PLANS_IN_PROMPT)
    plan_names = tuple(plan.plan_name for plan in plans)

    if not scope.is_member:
        return Profile(gym_name=gyms[0].company_name, plan_names=plan_names)

    # Under a member scope this table is narrowed to `id = :member_id`, so the only
    # row it can return is the caller's own.
    people = await sc.select_models(scope, "members")
    if not people:
        raise ProfileUnavailable("the caller's member record no longer exists")
    person = people[0]

    # Latest first: a member who lapsed and came back has several, and the current
    # one is the one that matters.
    memberships = await sc.select_models(
        scope, "memberships", order_by="expires_at desc", limit=1)
    current: Membership | None = memberships[0] if memberships else None

    plan = None
    if current is not None:
        named = await sc.select_models(
            scope, "membership_plans", where="id = :plan",
            params={"plan": current.membership_plan_id}, limit=1)
        plan = named[0].plan_name if named else None

    return Profile(
        gym_name=gyms[0].company_name,
        plan_names=plan_names,
        member_name=person.full_name,
        # Derived, never read from `membership_status` -- that column is
        # cron-maintained (guardrail #6) and a missed run would put a stale word in
        # front of the member on the first line of every answer.
        membership_status=current.status if current is not None else None,
        membership_expires_on=current.expires_at.date() if current is not None else None,
        membership_plan=plan,
    )
