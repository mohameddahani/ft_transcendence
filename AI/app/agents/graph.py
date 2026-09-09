"""The agent loop: a hand-built LangGraph over Gemini function calling (task 2.2).

Three nodes and one conditional edge:

    START -> agent -> (tool calls? and budget left?) -> tools -> agent -> ...
                   -> (tool calls? and budget spent?) -> finish -> END
                   -> (no tool calls)                            -> END

Written out rather than assembled with `create_react_agent` because the loop *is*
the graded module -- and because the prebuilt `ToolNode` expects LangChain `BaseTool`
objects, while ours are the `Tool` dataclass from task 2.1, whose whole point is that
a `Scope` is closed over the callable and appears in no schema.

Four properties this module is responsible for, none of which the tool layer can
enforce on its own:

1. **Nothing that holds a `Scope` outlives the request.** The registry, the tool
   declarations, the bound model and the compiled graph are all built inside
   `run_turn`. A module-level `_GRAPH = build(...)` memoised on first use would serve
   gym 1's closures to gym 2, and `scope.py` would not catch it: the queries would be
   correctly scoped -- to the wrong tenant. `check_agent.py` asserts this module
   holds no compiled graph.
2. **The model's arguments are validated before they reach a tool**, against the
   tool's own `args_model`. Bad arguments and unknown tool names are answers back to
   the model, not exceptions: an exception here aborts the turn mid-sentence.
3. **The loop is bounded, and the bound is in the graph** rather than buried in a
   node, so it is visible in the shape. The budget counts *rounds of tool execution*,
   not model calls, because that is the thing a runaway model actually spends. Hitting
   it does not produce an empty answer: the `finish` node asks once more, with no
   tools bound, for an answer from what has already been gathered.
4. **`ScopeViolation` propagates.** It means a tool tried to read outside its tenant.
   That is a bug, not a message for a user, and this module adds no `except
   Exception` that would swallow it.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from datetime import datetime
from typing import Annotated, Any, TypedDict

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
    trim_messages,
)
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from pydantic import ValidationError

from app.agents.llm import get_llm
from app.agents.prompts import build_system_prompt
from app.agents.tools import Tool, build_admin_tools, build_member_tools
from app.config import get_settings
from app.core.errors import ApiError, upstream
from app.db.profile import Profile
from app.db.scope import Scope
from app.state.threads import append_messages, load_history

logger = logging.getLogger(__name__)

# Gemini may request several tools in one message, which is a feature -- "who is
# lapsing and who is expiring" is two independent reads. It is still a fan-out the
# model chooses, so it is capped. Calls past the cap are *answered* with a refusal
# rather than dropped: a function call left without a response makes the next
# request malformed.
MAX_TOOL_CALLS_PER_STEP = 8


class AgentState(TypedDict):
    """What flows along the edges -- and, since 2.4, what is written to disk.

    **One field.** The checkpointer persists this whole dict per thread, so anything
    in it outlives the turn, and almost nothing here should. The counters were in it
    until the checkpointer arrived and made the bug obvious: `operator.add` reducers
    accumulate, so turn two would have started with turn one's `tool_rounds` already
    spent and the budget would have been exhausted by the second question. They live
    in a per-request `Turn` now, which cannot outlive the request that made it.

    `add_messages` is a reducer for the opposite reason: a node's return is a *delta*,
    and appending is exactly what a conversation does.

    The system prompt is deliberately absent. It is rebuilt and prepended on each
    model call, so a thread resumed tomorrow is told tomorrow's date rather than the
    one frozen into it the day it started.
    """

    messages: Annotated[list[BaseMessage], add_messages]


@dataclass
class Turn:
    """Everything about *this* turn, which is everything that must not be persisted.

    Mutable and per request, held in the closure the nodes are built in. Safe because
    this graph has no parallel branches -- `agent`, `tools` and `finish` run one at a
    time -- which is the condition that makes read-modify-write sound and is why the
    persisted half still uses a reducer.
    """

    tools_used: list["ToolCall"] = field(default_factory=list)
    tool_rounds: int = 0
    model_calls: int = 0
    finish_reason: str = "stop"


@dataclass(frozen=True)
class ToolCall:
    """One function call the model made, as the UI will need to describe it.

    Task 2.3 turns this into the `tool` events of the SSE stream, which is why it is
    recorded now: retrofitting it later would mean re-plumbing the node.
    """

    name: str
    args: dict[str, Any] = field(default_factory=dict)
    ok: bool = True
    error: str | None = None


@dataclass(frozen=True)
class AgentEvent:
    """One SSE event, before it is formatted (AI_SPECS 3.2).

    A type and a payload, not a string: the route owns the wire format, this module
    owns the grammar, and a test can assert the sequence without parsing text.
    """

    type: str
    data: dict[str, Any]


@dataclass(frozen=True)
class TurnResult:
    answer: str
    tools_used: tuple[ToolCall, ...]
    tool_rounds: int
    model_calls: int
    # AI_SPECS 3.2 puts this in the `done` event. "stop" is a finished answer;
    # "max_tool_rounds" means the budget ran out and the answer is partial.
    finish_reason: str


def build_declarations(tools: dict[str, Tool]) -> list[dict[str, Any]]:
    """The registry, in the shape `bind_tools` wants.

    Generated from `Tool.json_schema()` and never hand-written, so the "no tool lets
    the model choose a tenant" assertion in `check_tools.py` covers what is actually
    sent to Gemini rather than a parallel copy that can drift away from it.
    """
    return [
        {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.json_schema(),
            },
        }
        for tool in tools.values()
    ]


def _summarise_validation(exc: ValidationError) -> str:
    """Field names and messages only. Never `input`.

    The same rule as boot errors (D5) and request validation (D6), for the same
    reason from a new direction: this string goes into the model's context and then
    into an answer, and pydantic's own rendering appends the offending value.
    """
    parts = [
        f"{'.'.join(str(piece) for piece in err['loc']) or 'arguments'}: {err['msg']}"
        for err in exc.errors()
    ]
    return "; ".join(parts[:4])


def _message_text(message: BaseMessage, *, strip: bool = True) -> str:
    """Gemini returns either a string or a list of content parts.

    `strip` is a parameter and not a default because the two callers want opposite
    things. A finished answer should not begin or end with whitespace. A *chunk* of a
    streamed answer must keep every byte it was given: the boundary between two
    chunks often falls on a space, and stripping each one glues the words either side
    of it together. That produced "Your membershipexpired on 2026-08-10" in a live
    stream -- visible in the demo, invisible in every non-streaming test.
    """
    content = message.content
    if isinstance(content, str):
        text = content
    elif isinstance(content, list):
        text = "".join(
            part if isinstance(part, str) else str(part.get("text", ""))
            for part in content
            if isinstance(part, (str, dict))
        )
    else:
        text = str(content)
    return text.strip() if strip else text


def _latest_ai_message(messages: list[BaseMessage]) -> AIMessage | None:
    """The model's most recent reply -- found, not assumed to be last.

    `add_messages` keys on message id and *replaces* an existing entry rather than
    appending when it sees one again, so `messages[-1]` is only the newest reply as
    long as every reply carries a fresh id. Real Gemini responses do; a retry layer,
    a replayed transcript or a test double need not, and the failure is silent: the
    router reads a `ToolMessage`, decides the model is done, and returns raw JSON to
    the user as the answer. Scanning for the last `AIMessage` is right either way.
    """
    for message in reversed(messages):
        if isinstance(message, AIMessage):
            return message
    return None


def _refusal(call_id: str, name: str, args: dict[str, Any], reason: str) -> tuple[ToolMessage, ToolCall]:
    return (
        ToolMessage(content=json.dumps({"error": reason}), tool_call_id=call_id, name=name),
        ToolCall(name=name, args=args, ok=False, error=reason),
    )


async def _run_tool_call(raw_call: dict[str, Any], tools: dict[str, Tool]) -> tuple[ToolMessage, ToolCall]:
    """Validate one function call and run it. Every path returns a `ToolMessage`.

    That is not tidiness: Gemini rejects a request whose history contains a function
    call with no matching response, so a call we refuse still has to be answered.
    """
    name = str(raw_call.get("name") or "")
    args = raw_call.get("args") or {}
    call_id = str(raw_call.get("id") or "")

    tool = tools.get(name)
    if tool is None:
        # Name the alternatives: the model recovers from this in one turn instead of
        # apologising to the user about a tool the user never heard of.
        available = ", ".join(sorted(tools))
        return _refusal(call_id, name, args, f"No such tool. Available tools: {available}.")

    if tool.args_model is not None:
        try:
            parsed = tool.args_model(**args)
        except ValidationError as exc:
            return _refusal(call_id, name, args, f"Invalid arguments -- {_summarise_validation(exc)}")
        except TypeError:
            # `args` was not a mapping of keywords at all.
            return _refusal(call_id, name, args, "Invalid arguments -- expected an object of named fields.")
        result = await tool.run(parsed)
    else:
        result = await tool.run()

    # `ScopeViolation` is not caught anywhere above: `Tool.run` re-raises it and so
    # does this module. Everything else the tool could fail on has already been
    # turned into `{"error": ...}` by the decorator in tools/base.py.
    try:
        content = json.dumps(result)
    except (TypeError, ValueError):
        # A tool returned something that will not serialise -- a Decimal or a
        # datetime that should have been converted at the boundary. That is our bug,
        # so it is logged loudly, but the turn still finishes with a sentence.
        logger.exception("tool %s returned non-serialisable output", name,
                         extra={"fields": {"tool": name}})
        return _refusal(call_id, name, args, "The tool returned data that could not be read.")

    ok = not (isinstance(result, dict) and "error" in result)
    return (
        ToolMessage(content=content, tool_call_id=call_id, name=name),
        ToolCall(name=name, args=args, ok=ok,
                 error=None if ok else str(result.get("error"))),
    )


def _build_turn(
    scope: Scope,
    profile: Profile,
    question: str,
    llm: Any | None,
    max_tool_rounds: int | None,
    now: datetime | None,
    history: list[BaseMessage],
) -> tuple[Any, dict[str, Any], Turn]:
    """Compile the graph for **one** request and return it with its opening state.

    Both entry points go through here, and nothing it produces is cached. The
    registry has a `Scope` closed over it, the declarations are derived from that
    registry, and the bound model holds the declarations -- so a graph memoised
    across requests would serve one gym's tools to the next caller, with `scope.py`
    raising no objection because every query would be correctly scoped, to the wrong
    tenant.
    """
    settings = get_settings()
    budget = max_tool_rounds if max_tool_rounds is not None else settings.AGENT_MAX_TOOL_ROUNDS
    turn = Turn()

    # Role dispatch. Both builders refuse the wrong kind of scope, so a mistake here
    # fails at wiring time rather than halfway through an answer.
    tools = build_member_tools(scope) if scope.is_member else build_admin_tools(scope)
    declarations = build_declarations(tools)

    model = llm if llm is not None else get_llm()
    with_tools = model.bind_tools(declarations)

    def _for_model(messages: list[BaseMessage]) -> list[BaseMessage]:
        """The window this turn actually sends, with a fresh system prompt on top.

        Trimmed, because a thread is unbounded and every turn re-sends all of it --
        the cost of question twenty is the whole conversation, again. `start_on`
        matters more than the size: cutting between an assistant's tool call and its
        response leaves a function call with no answer, which Gemini rejects
        outright, so the window is only ever allowed to begin at a human turn.
        """
        kept = trim_messages(
            list(messages),
            max_tokens=settings.AGENT_HISTORY_MESSAGES,
            token_counter=len,
            strategy="last",
            start_on="human",
            include_system=False,
            allow_partial=False,
        )
        return [SystemMessage(content=build_system_prompt(
            scope, profile, question=question, now=now)), *kept]

    async def _ask(model_to_use: Any, messages: list[BaseMessage]) -> AIMessage:
        try:
            return await model_to_use.ainvoke(messages)
        except ApiError:
            raise
        except Exception as exc:  # noqa: BLE001 -- anything the SDK raises is upstream
            logger.warning("gemini call failed",
                           extra={"fields": {"error_type": type(exc).__name__}})
            # The exception text is dropped on purpose: it can carry the request
            # URL, a quota figure, or part of the prompt, and this becomes a user's
            # error message.
            raise upstream("The assistant is temporarily unavailable. Please try again.") from exc

    async def agent(state: AgentState) -> dict[str, Any]:
        reply = await _ask(with_tools, _for_model(state["messages"]))
        turn.model_calls += 1
        return {"messages": [reply]}

    async def run_tools(state: AgentState) -> dict[str, Any]:
        last = _latest_ai_message(list(state["messages"]))
        calls = list(getattr(last, "tool_calls", None) or [])

        messages: list[BaseMessage] = []
        record: list[ToolCall] = []
        for index, call in enumerate(calls):
            if index >= MAX_TOOL_CALLS_PER_STEP:
                message, entry = _refusal(
                    str(call.get("id") or ""), str(call.get("name") or ""), call.get("args") or {},
                    f"Too many tools requested at once (limit {MAX_TOOL_CALLS_PER_STEP}). "
                    "Ask for them one at a time.")
            else:
                message, entry = await _run_tool_call(call, tools)
            messages.append(message)
            record.append(entry)

        turn.tools_used.extend(record)
        turn.tool_rounds += 1
        return {"messages": messages}

    async def finish(state: AgentState) -> dict[str, Any]:
        """The budget ran out with the model still asking for tools.

        The pending call is dropped rather than answered, and the model is asked
        again with **no tools bound**, so it cannot request more. Dropping it is what
        keeps the history valid: an unanswered function call would make this very
        request malformed.
        """
        pending = _latest_ai_message(list(state["messages"]))
        history = _for_model([m for m in state["messages"] if m is not pending])
        history.append(HumanMessage(content=(
            "You have used all the tool calls available for this question. Answer now "
            "using only what the tools have already returned, and state plainly which "
            "part you could not determine.")))
        reply = await _ask(model, history)
        turn.model_calls += 1
        turn.finish_reason = "max_tool_rounds"
        return {"messages": [reply]}

    def route(state: AgentState) -> str:
        last = _latest_ai_message(list(state["messages"]))
        wants_tools = last is not None and bool(last.tool_calls)
        if not wants_tools:
            return END
        # Checked after `wants_tools`, so an answer that arrives exactly at the cap
        # ends the turn instead of paying for a redundant `finish` call.
        if turn.tool_rounds >= budget:
            return "finish"
        return "tools"

    workflow = StateGraph(AgentState)
    workflow.add_node("agent", agent)
    workflow.add_node("tools", run_tools)
    workflow.add_node("finish", finish)
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", route, ["tools", "finish", END])
    workflow.add_edge("tools", "agent")
    workflow.add_edge("finish", END)

    # The conversation, then this turn's question. The history was read once, before
    # the graph was built, rather than being restored inside it -- so the ownership
    # check in `state/threads.py` happens strictly before anything is loaded.
    opening: dict[str, Any] = {"messages": [*history, HumanMessage(content=question)]}
    return workflow.compile(), opening, turn


def _clean_question(question: str) -> str:
    """Trim, and refuse what is left if there is nothing in it.

    Length is the endpoint's job (it knows `MAX_MESSAGE_CHARS` and owns the 400).
    Emptiness is checked here as well because `run_turn` is called directly by tests
    and, later, by the sentiment worker: a blank prompt is a paid round trip that can
    only produce a hallucination.
    """
    cleaned = (question or "").strip()
    if not cleaned:
        raise ApiError(400, "invalid_request", "message must not be empty.")
    return cleaned


async def _history_for(thread_id: str | None) -> list[BaseMessage]:
    """The conversation so far, or nothing.

    `thread_id is None` is a one-shot turn with no memory -- how the acceptance tests
    and, later, the sentiment worker call the agent, and the reason memory is opt-in
    rather than ambient. Ownership of the id was settled in `state/threads.py` before
    this is reached; by here it is already the caller's.
    """
    if thread_id is None:
        return []
    return await load_history(thread_id, get_settings().AGENT_HISTORY_MESSAGES)


def _replayable(messages: list[BaseMessage]) -> list[BaseMessage]:
    """Drop any tool call that never got an answer, before the turn is stored.

    The `finish` node leaves exactly this behind: it abandons the model's pending
    call rather than executing it. Storing that message would poison the *next* turn
    -- a history containing a function call with no response is rejected outright by
    Gemini, so one truncated answer would break the conversation from then on.
    """
    answered = {
        message.tool_call_id for message in messages if isinstance(message, ToolMessage)
    }
    return [
        message
        for message in messages
        if not (
            isinstance(message, AIMessage)
            and message.tool_calls
            and any(call.get("id") not in answered for call in message.tool_calls)
        )
    ]


def _log_turn(tools_used: tuple[ToolCall, ...], rounds: int, calls: int, reason: str) -> None:
    # Names and outcomes only. The question is not logged (it is the user's) and
    # neither are the arguments (a search query is somebody's name).
    logger.info("agent turn complete", extra={"fields": {
        "tool_rounds": rounds,
        "model_calls": calls,
        "finish_reason": reason,
        "tools": [call.name for call in tools_used],
        "tool_failures": sum(1 for call in tools_used if not call.ok),
    }})


async def run_turn(
    *,
    scope: Scope,
    profile: Profile,
    question: str,
    llm: Any | None = None,
    max_tool_rounds: int | None = None,
    now: datetime | None = None,
    thread_id: str | None = None,
) -> TurnResult:
    """One question in, one whole answer out. The non-streaming entry point.

    Keyword-only: `run_turn(question, scope)` and `run_turn(scope, question)` are
    both plausible readings of a positional call, and one of them silently makes the
    question the tenant.

    `llm` is injectable so the acceptance tests can drive the loop without a network
    call -- a paid, nondeterministic dependency in `verify.sh` produces a suite that
    fails for reasons that are not bugs, and a suite people learn to ignore.
    """
    history = await _history_for(thread_id)
    graph, opening, turn = _build_turn(scope, profile, _clean_question(question),
                                       llm, max_tool_rounds, now, history)
    final = await graph.ainvoke(opening)

    if thread_id is not None:
        # Everything after the history is this turn: the question, the tool round
        # trips and the answer.
        await append_messages(thread_id, _replayable(list(final["messages"])[len(history):]))

    used = tuple(turn.tools_used)
    _log_turn(used, turn.tool_rounds, turn.model_calls, turn.finish_reason)

    reply = _latest_ai_message(list(final["messages"]))
    return TurnResult(
        answer=_message_text(reply) if reply is not None else "",
        tools_used=used,
        tool_rounds=turn.tool_rounds,
        model_calls=turn.model_calls,
        finish_reason=turn.finish_reason,
    )


async def stream_turn(
    *,
    scope: Scope,
    profile: Profile,
    question: str,
    thread_id: str,
    llm: Any | None = None,
    max_tool_rounds: int | None = None,
    now: datetime | None = None,
) -> AsyncIterator[AgentEvent]:
    """The same turn, as a sequence of events (task 2.3).

    Yields the AI_SPECS 3.2 grammar and nothing else, so the endpoint is a formatter:
    `meta` first, `tool` pairs as they happen, `token` as they arrive, `done` last --
    or a single `error` in place of `done`. Keeping the grammar here rather than in
    the route means it can be asserted without HTTP, and 3.6's knowledge branch can
    add `sources` in one place.

    **Errors are values here, not exceptions**, with one exception of its own. By the
    time anything can fail the response is already `200 text/event-stream`, so a
    failure has to travel as an `error` event; the caller has no status code left to
    read. `ScopeViolation` is deliberately not caught: it means a tool read outside
    its tenant, which is a bug and not a message for a user, and the route logs it
    and closes the stream.
    """
    history = await _history_for(thread_id)
    graph, opening, turn = _build_turn(scope, profile, _clean_question(question),
                                       llm, max_tool_rounds, now, history)
    produced: list[BaseMessage] = list(opening["messages"][len(history):])

    # `route` is `structured` until phase 3 adds retrieval; the field exists now so
    # the frontend never has to learn a new event shape to get it.
    yield AgentEvent("meta", {"thread_id": thread_id, "route": "structured"})

    text_seen = False
    reported: list[ToolCall] = []
    # Tokens emitted since the last node finished. LangGraph produces them by
    # streaming the model inside the node, which is a mechanism that can be absent --
    # a model that does not stream, a test double that is not a LangChain model, a
    # future change to how `messages` mode works. When it is, the node's own return
    # value still carries the whole answer, so it is sent as one token rather than
    # letting the caller watch a stream that never says anything.
    streamed_here = ""

    try:
        # Two modes at once: `updates` is what a node returned (tool activity),
        # `messages` is what the model is emitting token by token. LangGraph turns a
        # node's `ainvoke` into a streaming call for this, so the nodes stay simple.
        async for mode, chunk in graph.astream(opening,
                                               stream_mode=["updates", "messages"]):
            if mode == "messages":
                message, meta = chunk
                # Only the nodes that speak to the user. A tool-call message streams
                # through here too, with empty content.
                if meta.get("langgraph_node") not in {"agent", "finish"}:
                    continue
                # Not stripped: a chunk boundary usually falls on a space.
                text = _message_text(message, strip=False)
                if text:
                    text_seen = True
                    streamed_here += text
                    yield AgentEvent("token", {"text": text})
                continue

            for node, update in chunk.items():
                if node in {"agent", "finish"}:
                    produced.extend(update.get("messages", []))
                    for message in update.get("messages", []):
                        # Announced before the tools node runs them, which is the
                        # whole point of the event: the UI shows what is happening,
                        # not a spinner that could mean anything.
                        for call in getattr(message, "tool_calls", None) or []:
                            yield AgentEvent("tool", {"name": call.get("name", ""),
                                                      "status": "running"})
                        text = _message_text(message)
                        if text and not streamed_here:
                            text_seen = True
                            yield AgentEvent("token", {"text": text})
                    streamed_here = ""
                elif node == "tools":
                    produced.extend(update.get("messages", []))
                    # Read off the turn rather than the node's return: the counters
                    # and the record are per request now, not persisted state.
                    for record in turn.tools_used[len(reported):]:
                        reported.append(record)
                        yield AgentEvent("tool", {"name": record.name,
                                                  "status": "done" if record.ok else "error"})
    except ApiError as exc:
        _log_turn(tuple(turn.tools_used), turn.tool_rounds, turn.model_calls, "error")
        yield AgentEvent("error", dict(exc.detail["error"]))
        return

    _log_turn(tuple(turn.tools_used), turn.tool_rounds, turn.model_calls, turn.finish_reason)

    if thread_id is not None:
        await append_messages(thread_id, _replayable(produced))

    if not text_seen:
        # Gemini can finish with no text at all -- a refusal, a safety stop, or a
        # tool-call message with nothing after it. Saying so is honest; inventing a
        # closing sentence so the transcript looks complete is not.
        yield AgentEvent("error", {"code": "upstream_error",
                                   "message": "The assistant did not produce an answer."})
        return

    yield AgentEvent("done", {"finish_reason": turn.finish_reason})
