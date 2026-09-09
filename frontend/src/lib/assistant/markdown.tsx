/**
 * A small markdown renderer that cannot inject HTML.
 *
 * **Why not `react-markdown` or `marked`:** not weight, safety. Every string this
 * renders came out of a language model, and part of it came out of the *database* --
 * `list_recent_feedback` returns text a gym member typed. The service fences that
 * text so the model treats it as data, but the fence stops the model obeying it; it
 * does nothing about a browser rendering it. A renderer that produces React elements
 * and never touches `dangerouslySetInnerHTML` has no XSS surface to reason about,
 * because there is no path from a member's comment to parsed HTML.
 *
 * The subset is what an answer about gym data actually uses: headings, bullet and
 * numbered lists, bold, italic, inline code. Anything else renders as its own text,
 * which is the right failure: the user sees the characters the model wrote.
 */

import type { ReactNode } from "react";

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).map((piece, index) => {
    const key = `${keyPrefix}-${index}`;
    if (piece.startsWith("**") && piece.endsWith("**") && piece.length > 4) {
      return <strong key={key}>{piece.slice(2, -2)}</strong>;
    }
    if (piece.startsWith("`") && piece.endsWith("`") && piece.length > 2) {
      return (
        <code key={key} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em] dark:bg-white/15">
          {piece.slice(1, -1)}
        </code>
      );
    }
    if (piece.startsWith("*") && piece.endsWith("*") && piece.length > 2) {
      return <em key={key}>{piece.slice(1, -1)}</em>;
    }
    return <span key={key}>{piece}</span>;
  });
}

type Block =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "paragraph"; lines: string[] };

function toBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  for (const rawLine of source.split("\n")) {
    const line = rawLine.trimEnd();
    const previous = blocks[blocks.length - 1];

    if (!line.trim()) continue;

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length <= 2 ? 2 : 3, text: heading[2] });
      continue;
    }

    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      const item = (bullet ?? numbered)![1];
      const ordered = Boolean(numbered);
      if (previous?.kind === "list" && previous.ordered === ordered) previous.items.push(item);
      else blocks.push({ kind: "list", ordered, items: [item] });
      continue;
    }

    // A hard-wrapped sentence continues its paragraph rather than starting one, so
    // an answer does not arrive as a column of one-line blocks.
    if (previous?.kind === "paragraph") previous.lines.push(line);
    else blocks.push({ kind: "paragraph", lines: [line] });
  }
  return blocks;
}

export function Markdown({ text }: { text: string }) {
  const blocks = toBlocks(text);

  return (
    <div className="flex flex-col gap-2 text-[15px] leading-relaxed">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        if (block.kind === "heading") {
          const size = block.level === 2 ? "text-base font-semibold" : "text-sm font-semibold";
          return (
            <p key={key} className={size}>
              {renderInline(block.text, key)}
            </p>
          );
        }
        if (block.kind === "list") {
          const items = block.items.map((item, i) => (
            <li key={`${key}-${i}`} className="ml-5 list-outside">
              {renderInline(item, `${key}-${i}`)}
            </li>
          ));
          return block.ordered ? (
            <ol key={key} className="flex list-decimal flex-col gap-1">
              {items}
            </ol>
          ) : (
            <ul key={key} className="flex list-disc flex-col gap-1">
              {items}
            </ul>
          );
        }
        return (
          <p key={key} className="whitespace-pre-wrap">
            {renderInline(block.lines.join(" "), key)}
          </p>
        );
      })}
    </div>
  );
}
