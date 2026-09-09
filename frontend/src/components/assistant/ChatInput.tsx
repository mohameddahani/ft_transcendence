"use client";

/**
 * The composer. Enter sends, Shift+Enter breaks a line, and the box is disabled
 * while an answer is streaming.
 *
 * Validation happens here *and* on the server -- the subject requires both, and they
 * are not redundant: this half exists so the user is told before a request is spent,
 * the server half because a browser is not the only thing that can POST to `/ai/chat`.
 */

import { useEffect, useRef, useState } from "react";

import { MAX_MESSAGE_CHARS } from "@/lib/assistant/session";

export function ChatInput({
  onSend,
  onStop,
  disabled,
  streaming,
}: {
  onSend: (message: string) => void;
  onStop: () => void;
  disabled: boolean;
  streaming: boolean;
}) {
  const [value, setValue] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const tooLong = value.length > MAX_MESSAGE_CHARS;
  const canSend = trimmed.length > 0 && !tooLong && !disabled;

  // Grow with the text instead of scrolling inside three lines, but stop before the
  // composer eats a phone screen.
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, [value]);

  // Disabling the textarea while an answer streams takes focus off it, and React
  // does not give it back when the attribute clears -- so after every answer the
  // caret was gone and the next question went nowhere until the user clicked the box
  // again. Found by typing into it in a real browser, which is the only place a lost
  // caret exists at all.
  const wasDisabled = useRef(disabled);
  useEffect(() => {
    if (wasDisabled.current && !disabled) box.current?.focus();
    wasDisabled.current = disabled;
  }, [disabled]);

  function submit() {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form
      className="border-t border-black/10 bg-background px-4 py-3 sm:px-6 dark:border-white/10"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={box}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            disabled={disabled}
            aria-label="Ask the assistant"
            aria-invalid={tooLong}
            placeholder={
              streaming ? "Answering…" : "Ask about members, revenue, attendance or feedback"
            }
            className="max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-black/15 bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-black/40 focus:border-black/40 disabled:opacity-60 dark:border-white/15 dark:placeholder:text-white/35 dark:focus:border-white/40"
          />

          {streaming ? (
            <button
              type="button"
              onClick={onStop}
              className="h-11 shrink-0 rounded-xl border border-black/15 px-4 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              className="h-11 shrink-0 rounded-xl bg-black/85 px-5 text-sm font-medium text-white disabled:opacity-40 hover:enabled:bg-black dark:bg-white/90 dark:text-black dark:hover:enabled:bg-white"
            >
              Send
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-black/45 dark:text-white/45">
          <span>Enter to send · Shift+Enter for a new line</span>
          {/* The counter appears only when it is close to mattering, so the normal
              case is not cluttered by a number nobody needs. */}
          {value.length > MAX_MESSAGE_CHARS * 0.8 ? (
            <span className={tooLong ? "text-red-600 dark:text-red-400" : undefined}>
              {value.length} / {MAX_MESSAGE_CHARS}
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
