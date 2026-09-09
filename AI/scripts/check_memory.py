"""Task 2.4 acceptance checks: conversation memory.

Run inside the ai container via scripts/verify.sh. **No network call**: the loop is
driven by the same `ScriptedLLM` the agent checks use, so what is asserted here is
what is *stored* and what is *replayed*, not what a model happens to say about it.

The security half is the reason this file is long. A `thread_id` arrives from the
client and names a stored conversation; without an ownership check that is a stranger
reading somebody's chat about their own gym.
"""

import asyncio
import json
import sys
import time
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

from app.agents.graph import _replayable, run_turn
from app.config import get_settings
from app.db import engine as db
from app.agents.prompts import build_system_prompt
from app.db.profile import Profile
from app.db.scope import Scope
from app.state import db as state_db
from app.state.threads import (
    ThreadNotFound,
    append_messages,
    assert_owned,
    list_threads,
    load_history,
    open_thread,
    sweep_expired_threads,
)

sys.path.insert(0, "/tmp")
from check_agent import ScriptedLLM, call, tool_messages, wants  # noqa: E402

FAIL = 0
# A profile is a parameter now (task 2.5). These checks are about the loop and the
# store, not about the lookup, so they hand it a fixed one.
ATLAS = Profile(gym_name="Atlas Fitness Agadir", plan_names=("Basic Monthly",))
SUBJECT = "memory-check-subject"
OTHER_SUBJECT = "memory-check-other"


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<54} {detail}")
    if not cond:
        FAIL = 1


async def stored(thread_id: str) -> list[tuple[int, str, str]]:
    """The rows as they sit on disk -- the thing this task is really about."""
    connection = state_db.get_state_db()
    async with connection.execute(
        "SELECT seq, role, payload FROM thread_messages WHERE thread_id = ? ORDER BY seq",
        (thread_id,),
    ) as cursor:
        return list(await cursor.fetchall())


async def main() -> None:  # noqa: C901 -- a check script is a list, not a design
    settings = get_settings()
    await db.init_engine(settings)
    await state_db.init_state_db(settings)
    atlas = (await db._fetch_one("SELECT id FROM users WHERE email = :e",
                                 {"e": "karim@atlasfitness.ma"}))["id"]
    owner = Scope(admin_id=atlas)

    async def turn(thread_id: str | None, question: str, llm: Any, **kw: Any):
        return await run_turn(scope=owner, profile=ATLAS, question=question,
                              llm=llm, thread_id=thread_id, **kw)

    # ------------------------------------------------------------- ownership
    print("\n\033[1m  whose conversation is it\033[0m")

    thread, created = await open_thread(thread_id=None, subject_id=SUBJECT,
                                        role="ADMIN", admin_id=atlas)
    check("a new conversation is created and owned", created and len(thread) == 36, thread)

    same, again = await open_thread(thread_id=thread, subject_id=SUBJECT,
                                    role="ADMIN", admin_id=atlas)
    check("...and the owner can resume it", same == thread and not again)

    # The finding this whole module exists for: the id comes from the client, and a
    # store keyed on it alone answers to whoever sends it.
    for label, kwargs in (
        ("another subject cannot resume it",
         {"subject_id": OTHER_SUBJECT, "role": "ADMIN"}),
        ("...nor the same subject under a different role",
         {"subject_id": SUBJECT, "role": "MEMBER"}),
        ("an unknown id is refused the same way",
         {"subject_id": SUBJECT, "role": "ADMIN"}),
    ):
        target = "does-not-exist" if "unknown" in label else thread
        try:
            await open_thread(thread_id=target, admin_id=atlas, **kwargs)
            check(label, False, "RESUMED")
        except ThreadNotFound:
            check(label, True, "404 not_found, never 403")

    # A read is not a use. `assert_owned` exists so redrawing a transcript does not
    # renew the TTL -- otherwise an open tab keeps a dead conversation alive forever.
    await assert_owned(thread, SUBJECT, "ADMIN")
    for label, subject, role in (
        ("another subject cannot read the transcript", OTHER_SUBJECT, "ADMIN"),
        ("...nor another role", SUBJECT, "MEMBER"),
    ):
        try:
            await assert_owned(thread, subject, role)
            check(label, False, "READ")
        except ThreadNotFound:
            check(label, True)

    # ------------------------------------------------------- what is stored
    print("\n\033[1m  what is written down\033[0m")

    llm = ScriptedLLM([wants(call("get_gym_overview")),
                       AIMessage(content="You have 234 active members.")])
    await turn(thread, "how many active members?", llm)
    rows = await stored(thread)
    roles = [role for _, role, _ in rows]
    check("a turn is stored as the messages it was made of",
          roles == ["human", "ai", "tool", "ai"], " ".join(roles))
    check("...in order, with no gaps", [seq for seq, _, _ in rows] == [1, 2, 3, 4])

    # A blob would answer "what does the assistant remember about me?" with msgpack.
    payloads = json.dumps([payload for _, _, payload in rows])
    check("the question is readable on disk", "how many active members?" in payloads)
    check("...and so is the tool it called", "get_gym_overview" in payloads)

    # The system prompt is rebuilt every turn. Storing it would freeze the date it
    # was built on into a thread that may be resumed weeks later.
    check("the system prompt is not stored", "system" not in roles)
    first_sent = llm.calls[0]["messages"][0]
    check("...but every model call still gets one",
          isinstance(first_sent, SystemMessage) and "Today is" in first_sent.content)

    # Memory the model refuses to use is not memory. The prompt used to say "if you
    # have not called a tool, you do not know the answer" -- with a full transcript in
    # front of it, the model answered "I do not have the ability to recall previous
    # questions". The rule had to learn the difference between a gym fact and a thing
    # that was said a minute ago.
    prompt_text = build_system_prompt(owner, ATLAS)
    check("the prompt lets the model use the conversation",
          "use it and quote it when asked" in prompt_text)
    check("...while still requiring a tool for the gym's numbers",
          "Facts about the gym come only from the tools" in prompt_text)

    restored = await load_history(thread, 50)
    check("history round-trips through the database",
          [m.type for m in restored] == ["human", "ai", "tool", "ai"])
    ai_with_calls = restored[1]
    check("...including the tool call and its id",
          bool(ai_with_calls.tool_calls)
          and ai_with_calls.tool_calls[0]["id"] == tool_messages(restored)[0].tool_call_id,
          ai_with_calls.tool_calls[0]["name"])

    # ------------------------------------------------------------ the replay
    print("\n\033[1m  what the next turn sees\033[0m")

    llm2 = ScriptedLLM([AIMessage(content="Your first question was about active members.")])
    await turn(thread, "what did I ask first?", llm2)
    sent = llm2.calls[0]["messages"]
    check("the previous turn is replayed to the model",
          any(isinstance(m, HumanMessage) and "how many active members" in m.content
              for m in sent),
          f"{len(sent)} messages sent")
    check("...with exactly one system prompt, at the front",
          isinstance(sent[0], SystemMessage)
          and sum(isinstance(m, SystemMessage) for m in sent) == 1)
    check("...and the tool result from last time is still there",
          any(isinstance(m, ToolMessage) for m in sent))

    # The bug the checkpointer surfaced: `operator.add` reducers on the counters
    # accumulate, so turn two would have started with turn one's budget spent.
    result = await turn(thread, "and again?", ScriptedLLM([AIMessage(content="Again.")]))
    check("the per-turn counters start at zero on every turn",
          result.model_calls == 1 and result.tool_rounds == 0,
          f"model_calls={result.model_calls} tool_rounds={result.tool_rounds}")

    # ------------------------------------------------------------- the bounds
    print("\n\033[1m  bounded, and safe to replay\033[0m")

    window = settings.AGENT_HISTORY_MESSAGES
    filler = [HumanMessage(content=f"q{i}") if i % 2 == 0 else AIMessage(content=f"a{i}")
              for i in range(window + 20)]
    long_thread, _ = await open_thread(thread_id=None, subject_id=SUBJECT,
                                       role="ADMIN", admin_id=atlas)
    await append_messages(long_thread, filler)
    llm3 = ScriptedLLM([AIMessage(content="ok")])
    await turn(long_thread, "still there?", llm3)
    sent = llm3.calls[0]["messages"]
    check("a long conversation is trimmed before it is sent",
          len(sent) <= window + 2, f"{len(sent)} of {len(filler) + 2}")
    check("...and the window still begins at a human turn",
          isinstance(sent[1], HumanMessage), type(sent[1]).__name__)

    # A stored tool call with no answer makes the *next* request malformed, and
    # `finish` produces exactly that: it abandons the model's pending call.
    dangling = [HumanMessage(content="q"),
                wants(call("get_gym_overview", {}, "unanswered"))]
    check("an unanswered tool call is never stored",
          [m.type for m in _replayable(dangling)] == ["human"])
    answered = [HumanMessage(content="q"), wants(call("get_gym_overview", {}, "c1")),
                ToolMessage(content="{}", tool_call_id="c1", name="get_gym_overview")]
    check("...but an answered one is kept",
          [m.type for m in _replayable(answered)] == ["human", "ai", "tool"])

    capped, _ = await open_thread(thread_id=None, subject_id=SUBJECT,
                                  role="ADMIN", admin_id=atlas)
    looper = ScriptedLLM([], default=lambda: wants(call("get_gym_overview")))
    outcome = await turn(capped, "loop", looper, max_tool_rounds=2)
    replayed = await load_history(capped, 50)
    unanswered = {
        c["id"]
        for m in replayed if isinstance(m, AIMessage)
        for c in (m.tool_calls or [])
    } - {m.tool_call_id for m in replayed if isinstance(m, ToolMessage)}
    check("a truncated turn leaves a replayable thread",
          outcome.finish_reason == "max_tool_rounds" and not unanswered,
          f"{len(replayed)} messages, {len(unanswered)} dangling")

    # ------------------------------------------------------------- the listing
    print("\n\033[1m  a caller sees only their own conversations\033[0m")

    listed = await list_threads(SUBJECT, "ADMIN")
    ids = [row["thread_id"] for row in listed]
    check("the caller's threads are listed", thread in ids, f"{len(listed)} threads")
    check("...newest first",
          [row["last_used_at"] for row in listed] == sorted(
              (row["last_used_at"] for row in listed), reverse=True))
    check("...with the first question as the title",
          any(row["opening"].startswith("how many active members") for row in listed))
    check("...and no empty ones", all(row["messages"] > 0 for row in listed))
    check("another subject's listing is empty of it",
          thread not in [row["thread_id"] for row in await list_threads(OTHER_SUBJECT, "ADMIN")])
    check("...and so is the same subject's under another role",
          thread not in [row["thread_id"] for row in await list_threads(SUBJECT, "MEMBER")])

    # ------------------------------------------------------ opt-out and expiry
    print("\n\033[1m  memory is opt-in, and it expires\033[0m")

    before = len(await stored(thread))
    await turn(None, "no thread at all", ScriptedLLM([AIMessage(content="fine")]))
    check("a turn with no thread_id writes nothing",
          len(await stored(thread)) == before, "the sentiment worker calls it this way")

    stale, _ = await open_thread(thread_id=None, subject_id=SUBJECT,
                                 role="ADMIN", admin_id=atlas)
    await append_messages(stale, [HumanMessage(content="old news")])
    connection = state_db.get_state_db()
    await connection.execute("UPDATE threads SET last_used_at = ? WHERE id = ?",
                             (time.time() - 400 * 86400, stale))
    swept = await sweep_expired_threads(settings.THREAD_TTL_DAYS)
    check("expired threads are swept", swept >= 1, f"{swept} removed")
    check("...and their messages go with them", not await stored(stale),
          "an orphaned transcript is a conversation nothing can reach")
    check("...while a thread in use survives", bool(await stored(thread)))

    # ------------------------------------------------------------- cleanup
    for leftover in (thread, long_thread, capped):
        await connection.execute("DELETE FROM thread_messages WHERE thread_id = ?", (leftover,))
        await connection.execute("DELETE FROM threads WHERE id = ?", (leftover,))

    await state_db.close_state_db()
    await db.dispose_engine()
    sys.exit(FAIL)


asyncio.run(main())
