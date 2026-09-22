/**
 * One assistant turn, rendered while it is still arriving.
 *
 * There is no separate "finished" component and no re-render on completion: the text
 * grows as `token` events land and the same markdown pass runs over whatever has
 * arrived so far. A half-written `**bold` renders as the characters the model wrote
 * and resolves itself on the next token, which is the honest behaviour -- hiding
 * unterminated syntax would make text appear and disappear as it streams.
 */

import { Markdown } from "@/lib/assistant/markdown";
import type { ChatMessage } from "@/lib/assistant/types";

import { ToolActivity } from "./ToolActivity";

export function StreamingMessage({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming: boolean;
}) {
  const waiting = streaming && !message.text && !message.error;

  return (
    <div className="flex flex-col gap-2">
      {message.tools && message.tools.length > 0 ? <ToolActivity runs={message.tools} /> : null}

      {message.text ? (
        <div className="max-w-[95%] break-words">
          <Markdown text={message.text} />
        </div>
      ) : null}

      {message.sources && message.sources.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 text-xs text-black/55 dark:text-white/55" aria-label="Sources">
          {message.sources.map((source) => (
            <li
              key={source.n}
              className="rounded border border-black/10 px-1.5 py-0.5 dark:border-white/15"
            >
              {/* Only https: the link comes from our corpus, but an href is the one
                  place a string can become code (javascript:). */}
              {source.url?.startsWith("https://") ? (
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">
                  [{source.n}] {source.source_name}
                </a>
              ) : (
                <>
                  [{source.n}] {source.source_name}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {waiting ? (
        <p className="text-sm text-black/45 dark:text-white/45">Thinking…</p>
      ) : null}

      {message.truncated ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          The assistant ran out of lookups for this question — the answer above may be partial.
          Try asking for one thing at a time.
        </p>
      ) : null}

      {message.note ? (
        <p className="text-xs text-black/45 dark:text-white/45">{message.note}</p>
      ) : null}

      {message.error ? (
        <p
          role="status"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {message.error}
        </p>
      ) : null}
    </div>
  );
}
