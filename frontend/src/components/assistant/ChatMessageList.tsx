"use client";

/**
 * The transcript, and the one piece of behaviour that is easy to get wrong:
 * auto-scroll that stops the moment the user scrolls up.
 *
 * Following the newest token is right while the user is watching the bottom, and
 * hostile the second they scroll back to re-read something -- an answer arriving
 * token by token would yank them forward several times a second. So "pinned" is
 * measured from the scroll position rather than assumed, and re-measured on scroll.
 */

import { useEffect, useRef, useState } from "react";

import type { ChatMessage } from "@/lib/assistant/types";

import { StreamingMessage } from "./StreamingMessage";

/** Slack for a scroll position that counts as "at the bottom": a fractional device
 *  pixel or a mid-flight token must not read as the user scrolling away. */
const PINNED_SLACK_PX = 48;

export function ChatMessageList({
  messages,
  streaming,
}: {
  messages: ChatMessage[];
  streaming: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    const node = scroller.current;
    if (!node || !pinned) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, streaming, pinned]);

  function onScroll() {
    const node = scroller.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    setPinned(distance <= PINNED_SLACK_PX);
  }

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto px-4 py-4 sm:px-6"
      // The transcript grows while the user may be reading it, so changes are
      // announced politely instead of interrupting a screen reader mid-sentence.
      aria-live="polite"
      aria-busy={streaming}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        {messages.map((message, index) =>
          message.author === "user" ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-black/85 px-4 py-2.5 text-[15px] text-white dark:bg-white/90 dark:text-black">
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
              </div>
            </div>
          ) : (
            <StreamingMessage
              key={message.id}
              message={message}
              streaming={streaming && index === messages.length - 1}
            />
          ),
        )}
      </div>
    </div>
  );
}
