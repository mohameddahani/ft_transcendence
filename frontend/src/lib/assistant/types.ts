/**
 * The wire protocol, as the browser sees it (AI_SPECS 3.2 and 3.6).
 *
 * Kept in one file and imported everywhere so that when the knowledge branch adds
 * `sources` in phase 3, exactly one type changes and TypeScript names every place
 * that has to handle it.
 */

export type Role = "ADMIN" | "MEMBER";

export interface Identity {
  role: Role;
  gym: string;
  member_name: string | null;
}

/** `route` is `structured` today; `knowledge` and `advisory` arrive with RAG. */
export interface MetaEvent {
  thread_id: string;
  route: "structured" | "knowledge" | "advisory";
}

export interface ToolEvent {
  name: string;
  status: "running" | "done" | "error";
}

export interface TokenEvent {
  text: string;
}

export interface DoneEvent {
  finish_reason: "stop" | "max_tool_rounds" | string;
}

/** The same envelope the non-streaming errors use, delivered as an event instead. */
export interface ErrorEvent {
  code: string;
  message: string;
}

/** `GET /ai/threads/{id}` — a stored conversation, already in this file's shape. */
export interface StoredMessage {
  author: "user" | "assistant";
  text: string;
  tools: string[];
}

export type AssistantEvent =
  | { type: "meta"; data: MetaEvent }
  | { type: "tool"; data: ToolEvent }
  | { type: "token"; data: TokenEvent }
  | { type: "done"; data: DoneEvent }
  | { type: "error"; data: ErrorEvent };

/**
 * AI_SPECS 6 requires all five. `rate_limited` is separate from `error` because it
 * is the one failure the user can act on: it has a time attached, and telling them
 * "try again in 12 seconds" is a different screen from "something went wrong".
 */
export type PanelState = "idle" | "streaming" | "error" | "rate_limited" | "empty";

export interface ToolRun {
  name: string;
  status: ToolEvent["status"];
}

export interface ChatMessage {
  id: string;
  author: "user" | "assistant";
  text: string;
  /** Only on assistant turns: what it did to answer, in the order it did it. */
  tools?: ToolRun[];
  /** Set when the turn ended without a complete answer. */
  error?: string;
  /** Something the user did, not something that went wrong -- "Stopped." reads as a
   *  failure in red and as a fact in grey, and it is a fact. */
  note?: string;
  truncated?: boolean;
}
