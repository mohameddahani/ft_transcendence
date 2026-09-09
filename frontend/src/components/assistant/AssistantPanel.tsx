"use client";

/**
 * The root of the assistant. Owns the thread, the transcript and the one open
 * connection to `/ai/chat`.
 *
 * Everything below it is presentational: the stream is read here, folded into a
 * single assistant message as events arrive, and handed down. That is deliberate --
 * one place decides what an event means, so adding `sources` in phase 3 is a change
 * to this file and a new component, not a change to five of them.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AI_BASE_URL,
  IS_DEV,
  clearToken,
  readThreadId,
  readToken,
  writeThreadId,
  writeToken,
} from "@/lib/assistant/session";
import { RateLimited, RequestFailed, streamChat } from "@/lib/assistant/stream";
import type {
  ChatMessage,
  Identity,
  PanelState,
  StoredMessage,
  ToolRun,
} from "@/lib/assistant/types";

import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";

/**
 * A message id, unique for the life of the tab.
 *
 * This was a module-level counter, which the browser caught within a minute:
 * `Encountered two children with the same key, u-1`. Fast Refresh re-evaluates the
 * module and resets the counter to zero while React keeps the existing transcript in
 * state, so the next message collides with the first one. Duplicate keys make React
 * reuse or drop rows -- in a streaming transcript that is an answer landing under the
 * wrong question.
 *
 * The earlier reasoning against `randomUUID` was simply wrong: a random id is only a
 * hydration hazard when it is generated *during render*, and every id here comes from
 * a click handler that cannot run on the server.
 */
function nextId(prefix: string): string {
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${unique}`;
}

export function AssistantPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<PanelState>("empty");
  const [fatal, setFatal] = useState<string | null>(null);
  const [retryIn, setRetryIn] = useState(0);
  const [threadId, setThreadId] = useState<string | null>(null);

  // One writer for both, so the tab's stored id can never disagree with the one the
  // next request will send.
  const rememberThread = useCallback((id: string | null) => {
    setThreadId(id);
    writeThreadId(id);
  }, []);
  const [draftToken, setDraftToken] = useState("");

  const abort = useRef<AbortController | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      // Leaving the page mid-answer must actually close the connection, or the
      // server keeps streaming into a reader nobody is holding.
      abort.current?.abort();
    };
  }, []);

  // Read after mount, never during render: `localStorage` does not exist on the
  // server, and touching it while rendering is a hydration mismatch in the console.
  useEffect(() => {
    setToken(readToken());
  }, []);

  // Who the caller is. Also the end-to-end proof that the token, the tenant lookup
  // and CORS all work, before the user has typed anything.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    fetch(`${AI_BASE_URL}/ai/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!alive.current) return;
        if (response.status === 401) {
          // Drop the token as well as reporting it. Leaving a rejected token in
          // storage left the panel with no way out: the message said "sign in
          // again" while the only thing that *can* sign you in -- the token box --
          // is rendered exactly when there is no token. A dead end is worse than an
          // error.
          clearToken();
          setToken(null);
          setFatal("That session has expired. Sign in again.");
          setState("error");
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        setIdentity((await response.json()) as Identity);
        setFatal(null);
        setState((current) => (current === "error" ? "empty" : current));
      })
      .catch((error: unknown) => {
        if (!alive.current || (error as Error)?.name === "AbortError") return;
        // A failed preflight and a stopped container look identical from here, so
        // the message names both rather than guessing.
        setFatal(`Cannot reach the assistant service at ${AI_BASE_URL}.`);
        setState("error");
      });

    return () => controller.abort();
  }, [token]);

  // Redraw the conversation this tab was in. Without it a reload loses the
  // transcript while the server still holds it -- the assistant remembers and the
  // screen does not, which reads as a bug in the memory rather than in the UI.
  useEffect(() => {
    if (!token) return;
    const stored = readThreadId();
    if (!stored) return;
    const controller = new AbortController();

    fetch(`${AI_BASE_URL}/ai/threads/${stored}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!alive.current) return;
        if (!response.ok) {
          // Expired, swept, or not this account's any more. Drop it quietly and
          // start clean: an error about a conversation the user never asked to
          // resume is noise.
          writeThreadId(null);
          return;
        }
        const rows = (await response.json()) as StoredMessage[];
        if (!rows.length) return;
        setThreadId(stored);
        setMessages(rows.map((row) => ({
          id: nextId(row.author === "user" ? "u" : "a"),
          author: row.author,
          text: row.text,
          tools: row.tools.map((name) => ({ name, status: "done" as const })),
        })));
        setState("idle");
      })
      .catch(() => {
        /* offline or aborted: the panel still works, it just starts a new thread */
      });

    return () => controller.abort();
  }, [token]);

  // The rate-limit countdown. One interval, cleared on unmount, and it stops itself
  // at zero rather than running for the life of the page.
  useEffect(() => {
    if (retryIn <= 0) return;
    const timer = window.setInterval(() => {
      setRetryIn((seconds) => {
        if (seconds <= 1) {
          setState((current) => (current === "rate_limited" ? "idle" : current));
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryIn]);

  const send = useCallback(
    async (text: string) => {
      if (!token) return;

      const userMessage: ChatMessage = { id: nextId("u"), author: "user", text };
      const replyId = nextId("a");
      setMessages((current) => [
        ...current,
        userMessage,
        { id: replyId, author: "assistant", text: "", tools: [] },
      ]);
      setState("streaming");
      setFatal(null);

      const controller = new AbortController();
      abort.current = controller;

      // Patch just this turn's message, so a token arriving during a re-render can
      // never overwrite the transcript with a stale copy of itself.
      const patch = (change: (message: ChatMessage) => ChatMessage) =>
        setMessages((current) =>
          current.map((message) => (message.id === replyId ? change(message) : message)),
        );

      try {
        for await (const event of streamChat({
          baseUrl: AI_BASE_URL,
          token,
          message: text,
          threadId,
          signal: controller.signal,
        })) {
          if (!alive.current) return;

          switch (event.type) {
            case "meta":
              rememberThread(event.data.thread_id);
              break;

            case "tool": {
              const { name, status } = event.data;
              patch((message) => {
                const runs: ToolRun[] = [...(message.tools ?? [])];
                // `running` then `done` for the same tool is one row that changes,
                // not two rows -- and a parallel fan-out means matching the *first*
                // still-running entry with that name, not the last one added.
                const open = runs.findIndex((run) => run.name === name && run.status === "running");
                if (status === "running") runs.push({ name, status });
                else if (open >= 0) runs[open] = { name, status };
                else runs.push({ name, status });
                return { ...message, tools: runs };
              });
              break;
            }

            case "token":
              patch((message) => ({ ...message, text: message.text + event.data.text }));
              break;

            case "done":
              patch((message) => ({
                ...message,
                truncated: event.data.finish_reason === "max_tool_rounds",
              }));
              break;

            case "error":
              // A 200 that failed halfway. The status line said nothing was wrong,
              // which is exactly why this has to be read out of the stream.
              patch((message) => ({ ...message, error: event.data.message }));
              break;
          }
        }
        if (alive.current) setState("idle");
      } catch (error: unknown) {
        if (!alive.current) return;

        if ((error as Error)?.name === "AbortError") {
          patch((message) => ({ ...message, note: "Stopped." }));
          setState("idle");
          return;
        }
        if (error instanceof RateLimited) {
          setRetryIn(error.retryAfterSeconds);
          setState("rate_limited");
          // The banner is the whole message, and it counts down. Leaving the
          // server's frozen "try again in 21s" in the transcript alongside a banner
          // ticking through 18s reads as two different answers to one question.
          // There is no reply to show either -- the request never reached the model.
          setMessages((current) => current.filter((message) => message.id !== replyId));
          return;
        }
        if (error instanceof RequestFailed) {
          if (error.status === 401) {
            clearToken();
            setToken(null);
            setFatal("That session has expired. Sign in again.");
            setState("error");
            return;
          }
          if (error.status === 404) {
            // The conversation is gone -- expired, or the service's state was
            // reset. Holding the dead id would 404 every message from here on, so
            // it is dropped and the next question opens a new one.
            rememberThread(null);
            patch((message) => ({
              ...message,
              note: "That conversation expired. Ask again to start a new one.",
            }));
            setState("idle");
            return;
          }
          patch((message) => ({ ...message, error: error.message }));
          setState("idle");
          return;
        }
        patch((message) => ({
          ...message,
          error: "The connection dropped before the answer finished.",
        }));
        setState("idle");
      } finally {
        abort.current = null;
      }
    },
    [token, threadId, rememberThread],
  );

  // ---------------------------------------------------------------- no token yet
  if (!token) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-6">
        <h1 className="text-lg font-semibold">Gym assistant</h1>
        {fatal ? (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {fatal}
          </p>
        ) : null}
        <p className="text-sm text-black/60 dark:text-white/60">
          This panel needs an access token from the main application.
        </p>
        {IS_DEV ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const value = draftToken.trim();
              if (!value) return;
              writeToken(value);
              setToken(value);
            }}
          >
            {/* Development only. The real token arrives from the team's auth
                context; this box exists so the panel can be demonstrated before
                that lands, and it is compiled out of a production build. */}
            <label htmlFor="dev-token" className="text-xs text-black/50 dark:text-white/50">
              Development: paste an access token
            </label>
            <input
              id="dev-token"
              value={draftToken}
              onChange={(event) => setDraftToken(event.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 font-mono text-xs outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
              placeholder="eyJhbGciOi…"
            />
            <button
              type="submit"
              className="self-start rounded-lg bg-black/85 px-4 py-2 text-sm text-white dark:bg-white/90 dark:text-black"
            >
              Use this token
            </button>
          </form>
        ) : null}
      </main>
    );
  }

  const streaming = state === "streaming";
  const blocked = streaming || state === "rate_limited" || Boolean(fatal);

  return (
    <main className="flex h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-black/10 px-4 py-3 sm:px-6 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-3xl items-baseline justify-between gap-3">
          <h1 className="truncate text-sm font-semibold">
            {identity ? identity.gym : "Gym assistant"}
          </h1>
          <div className="flex shrink-0 items-center gap-3">
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  abort.current?.abort();
                  rememberThread(null);
                  setMessages([]);
                  setState("empty");
                }}
                className="rounded-lg border border-black/15 px-2.5 py-1 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                New chat
              </button>
            ) : null}
          <p className="shrink-0 text-xs text-black/45 dark:text-white/45">
            {identity
              ? identity.role === "ADMIN"
                ? "Owner view"
                : `Signed in as ${identity.member_name ?? "member"}`
              : fatal
                ? "Not signed in"
                : "Connecting…"}
          </p>
          </div>
        </div>
      </header>

      {fatal ? (
        <div className="px-4 py-3 sm:px-6">
          <p
            role="alert"
            className="mx-auto w-full max-w-3xl rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {fatal}
          </p>
        </div>
      ) : null}

      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="flex max-w-md flex-col gap-3 text-center">
            <p className="text-sm text-black/60 dark:text-white/60">
              Ask about your gym in plain language.
            </p>
            <ul className="flex flex-col gap-1 text-sm text-black/45 dark:text-white/45">
              <li>&ldquo;How many active members do we have?&rdquo;</li>
              <li>&ldquo;Who hasn&rsquo;t checked in for three weeks?&rdquo;</li>
              <li>&ldquo;What did people complain about recently?&rdquo;</li>
            </ul>
          </div>
        </div>
      ) : (
        <ChatMessageList messages={messages} streaming={streaming} />
      )}

      {state === "rate_limited" ? (
        <div className="px-4 sm:px-6">
          <p
            role="status"
            className="mx-auto w-full max-w-3xl rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          >
            Too many questions at once. You can ask again in {retryIn}s.
          </p>
        </div>
      ) : null}

      <ChatInput
        onSend={(text) => void send(text)}
        onStop={() => abort.current?.abort()}
        disabled={blocked}
        streaming={streaming}
      />
    </main>
  );
}
