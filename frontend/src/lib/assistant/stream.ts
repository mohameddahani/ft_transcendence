/**
 * Reading `text/event-stream` with `fetch` + `ReadableStream`.
 *
 * **Not `EventSource`**, and that is the design decision worth being able to defend:
 * `EventSource` can only issue a GET, and it cannot set headers -- so it cannot send
 * `Authorization: Bearer`. The alternatives are putting the token in the query string
 * (where it lands in every access log and browser history entry) or reading the
 * stream by hand. This is reading it by hand.
 *
 * What `EventSource` gives up in exchange: automatic reconnection with `Last-Event-ID`.
 * That is fine here. A chat turn is not a feed -- silently replaying half an answer
 * would be worse than showing the user an error and letting them ask again.
 */

import type { AssistantEvent } from "./types";

export class RateLimited extends Error {
  constructor(
    readonly retryAfterSeconds: number,
    message: string,
  ) {
    super(message);
    this.name = "RateLimited";
  }
}

export class RequestFailed extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RequestFailed";
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string };
}

async function readErrorEnvelope(response: Response): Promise<{ code: string; message: string }> {
  try {
    const body = (await response.json()) as ErrorBody;
    return {
      code: body.error?.code ?? "internal_error",
      message: body.error?.message ?? "The request could not be completed.",
    };
  } catch {
    // A proxy, a gateway, or anything else that answers with something other than
    // our envelope. The status still tells the user something true.
    return { code: "internal_error", message: `Request failed (${response.status}).` };
  }
}

/**
 * Split a growing buffer into complete SSE frames.
 *
 * A frame ends at a blank line, and a network chunk can end anywhere -- including
 * mid-frame, mid-line, or between the `event:` line and its `data:` line. Returning
 * the unconsumed tail is the whole job: dropping it loses a token, and parsing it
 * early yields half a JSON object.
 */
function splitFrames(buffer: string): { frames: string[]; rest: string } {
  const parts = buffer.split("\n\n");
  return { frames: parts.slice(0, -1), rest: parts[parts.length - 1] ?? "" };
}

function parseFrame(frame: string): AssistantEvent | null {
  let name = "";
  let payload = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    else if (line.startsWith("data:")) payload += line.slice(5).trim();
    // A line starting with ":" is a comment/keepalive. Ignored, by the spec.
  }
  if (!name || !payload) return null;
  try {
    return { type: name, data: JSON.parse(payload) } as AssistantEvent;
  } catch {
    // Never let one malformed frame end the turn: the frames after it are still
    // good, and the user would rather have most of an answer than none of it.
    return null;
  }
}

export interface ChatRequest {
  baseUrl: string;
  token: string;
  message: string;
  threadId: string | null;
  signal: AbortSignal;
}

/**
 * Yields events until the stream closes. Throws before yielding anything if the
 * request is refused -- a 401, 400 or 429 arrives with a real status code because
 * the server settles all of those before it starts streaming.
 */
export async function* streamChat(request: ChatRequest): AsyncGenerator<AssistantEvent> {
  const response = await fetch(`${request.baseUrl}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${request.token}` },
    body: JSON.stringify({
      message: request.message,
      ...(request.threadId ? { thread_id: request.threadId } : {}),
    }),
    signal: request.signal,
  });

  if (response.status === 429) {
    // Readable only because the service lists Retry-After in its CORS
    // `expose_headers`; without that a cross-origin fetch cannot see it at all.
    const header = response.headers.get("Retry-After");
    const { message } = await readErrorEnvelope(response);
    throw new RateLimited(Number(header) || 60, message);
  }

  if (!response.ok || !response.body) {
    const { code, message } = await readErrorEnvelope(response);
    throw new RequestFailed(response.status, code, message);
  }

  const reader = response.body.getReader();
  // `stream: true` keeps a multi-byte character that straddles two chunks intact.
  // Arabic and French both appear in this corpus, so this is not hypothetical.
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { frames, rest } = splitFrames(buffer);
      buffer = rest;
      for (const frame of frames) {
        const event = parseFrame(frame);
        if (event) yield event;
      }
    }
    // A final frame with no trailing blank line still has to be delivered.
    const last = parseFrame(buffer);
    if (last) yield last;
  } finally {
    // Runs on an abort too, which is what actually releases the connection when the
    // user navigates away mid-answer.
    reader.releaseLock();
  }
}
