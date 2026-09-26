"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ApiError, clearToken, getMe, getThread, saveToken, streamChat, type Me, type Role } from "@/lib/assistant/api";

type Message = { role: "user" | "model"; text: string; tools: string[] };

const SUGGESTIONS: Record<Role, string[]> = {
  ADMIN: ["How is the gym doing today?", "Who expires this week?", "How much did we make last month?"],
  STAFF: ["Who expires this week?", "Who hasn't come for 3 weeks?", "Show me the negative feedback"],
  MEMBER: ["When does my membership end?", "How many times did I come this month?", "Show my payments"],
};
const ROLE_LABEL: Record<Role, string> = { ADMIN: "Owner", STAFF: "Staff", MEMBER: "Member" };

export default function AssistantPanel() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const threadId = useRef<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  // on load: who is signed in, and is there a conversation to restore in this tab?
  useEffect(() => {
    getMe()
      .then((user) => {
        setMe(user);
        threadId.current = sessionStorage.getItem("thread_id");
        if (threadId.current) {
          return getThread(threadId.current).then((saved) =>
            setMessages(saved.map((m) => ({ ...m, tools: [] }))));
        }
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) clearToken();
        else setError("Can't reach the assistant right now.");
      })
      .finally(() => setLoading(false));
  }, []);

  // braces matter: an effect may only return a cleanup function, and scrollIntoView returns a promise
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // change the last message (the answer being written) without touching the others
  function updateAnswer(change: (m: Message) => Message) {
    setMessages((all) => [...all.slice(0, -1), change(all[all.length - 1])]);
  }

  async function send(question: string) {
    if (!question.trim() || busy) return;
    setError("");
    setInput("");
    setBusy(true);
    setMessages((all) => [...all, { role: "user", text: question, tools: [] },
                                   { role: "model", text: "", tools: [] }]);
    try {
      await streamChat(question, threadId.current, (event, data) => {
        if (event === "start") {
          threadId.current = data.thread_id;
          sessionStorage.setItem("thread_id", data.thread_id);
        } else if (event === "tool") {
          updateAnswer((m) => ({ ...m, tools: [...m.tools, data.name] }));
        } else if (event === "token") {
          updateAnswer((m) => ({ ...m, text: m.text + data.text }));
        } else if (event === "error") {
          setError(data.message);
          // no empty bubble left behind if the answer never started
          setMessages((all) => (all[all.length - 1].text ? all : all.slice(0, -1)));
        }
      });
    } catch (e) {
      // refused before the stream started: take the question back so it can be sent again
      setMessages((all) => all.slice(0, -2));
      setInput(question);
      if (e instanceof ApiError && e.status === 401) {
        clearToken();
        setMe(null);
        setError("Your session has expired. Please sign in again.");
      } else if (e instanceof ApiError && e.status === 429) {
        setError(`Too many questions. Try again in ${e.retryAfter} seconds.`);
      } else {
        setError("Can't reach the assistant right now.");
      }
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    sessionStorage.removeItem("thread_id");
    threadId.current = null;
    setMessages([]);
    setError("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  if (loading) return <p className="p-4 text-neutral-500">Loading…</p>;
  if (!me) return <SignIn error={error} />;

  return (
    <section className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-xl border border-neutral-300 dark:border-neutral-700">
      <header className="flex items-center justify-between border-b border-neutral-300 p-3 dark:border-neutral-700">
        <div>
          <h1 className="font-semibold">{me.gym_name} assistant</h1>
          <p className="text-xs text-neutral-500">{ROLE_LABEL[me.role]} view</p>
        </div>
        <button onClick={newChat} disabled={busy} className="rounded-md border px-3 py-1 text-sm disabled:opacity-50">
          New chat
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-neutral-500">Ask a question, or try one of these:</p>
            {SUGGESTIONS[me.role].map((s) => (
              <button key={s} onClick={() => send(s)}
                      className="block w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user"
              ? "bg-blue-600 text-white" : "bg-neutral-100 dark:bg-neutral-800"}`}>
              {m.tools.length > 0 && (
                <p className="mb-1 text-xs text-neutral-500">
                  Looked up: {m.tools.map((t) => t.replaceAll("_", " ")).join(", ")}
                </p>
              )}
              {/* plain text only: React escapes it, so nothing from the model can run as HTML */}
              <p className="whitespace-pre-wrap">{m.text || (busy ? "…" : "")}</p>
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {error && <p className="px-3 pb-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-neutral-300 p-3 dark:border-neutral-700">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) onSubmit(e);
          }}
          placeholder={me.role === "MEMBER" ? "Ask about your membership…" : "Ask about your gym…"}
          maxLength={2000}
          rows={1}
          className="flex-1 resize-none rounded-md border bg-transparent px-3 py-2 text-sm"
        />
        <button type="submit" disabled={busy || !input.trim()}
                className="rounded-md bg-blue-600 px-4 text-sm text-white disabled:opacity-50">
          Send
        </button>
      </form>
    </section>
  );
}

// until the team's login page is merged, a token can be pasted here during development
function SignIn({ error }: { error: string }) {
  const [token, setToken] = useState("");
  return (
    <div className="mx-auto w-full max-w-md space-y-3 p-4">
      <p>Please sign in to use the assistant.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {process.env.NODE_ENV === "development" && (
        <form onSubmit={(e) => { e.preventDefault(); saveToken(token); window.location.reload(); }}
              className="space-y-2">
          <textarea value={token} onChange={(e) => setToken(e.target.value)} rows={4}
                    placeholder="Development: paste an access token"
                    className="w-full rounded-md border bg-transparent p-2 font-mono text-xs" />
          <button type="submit" className="rounded-md border px-3 py-1 text-sm">Use token</button>
        </form>
      )}
    </div>
  );
}
