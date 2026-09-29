const AI_URL = process.env.NEXT_PUBLIC_AI_URL ?? "http://localhost:8000";
const TOKEN_KEY = "access_token"; // the same key the login page stores the backend's token in

export type Role = "ADMIN" | "STAFF" | "MEMBER";
export type Me = { role: Role; gym_name: string };
export type SavedMessage = { role: "user" | "model"; text: string };
export type DocumentInfo = { filename: string; visibility: "member" | "staff"; chunks: number };

export class ApiError extends Error {
  status: number;
  retryAfter: number;
  detail: string; // the server's own explanation, when it gives one

  constructor(status: number, retryAfter: number, detail: string) {
    super(`HTTP ${status}`);
    this.status = status;
    this.retryAfter = retryAfter;
    this.detail = detail;
  }
}

export const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token.trim());
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ""}` };
  // a file upload (FormData) must let the browser set its own Content-Type
  if (typeof init.body === "string") headers["Content-Type"] = "application/json";
  const response = await fetch(AI_URL + path, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, Number(response.headers.get("Retry-After") ?? 0),
                       typeof body.detail === "string" ? body.detail : "");
  }
  return response;
}

export async function getMe(): Promise<Me> {
  return (await call("/ai/me")).json();
}

export async function getThread(threadId: string): Promise<SavedMessage[]> {
  return (await call(`/ai/threads/${threadId}`)).json();
}

export async function listDocuments(): Promise<DocumentInfo[]> {
  return (await call("/ai/documents")).json();
}

export async function uploadDocument(file: File, visibility: string): Promise<DocumentInfo> {
  const form = new FormData();
  form.append("file", file);
  form.append("visibility", visibility);
  return (await call("/ai/documents", { method: "POST", body: form })).json();
}

export async function deleteDocument(filename: string): Promise<void> {
  await call(`/ai/documents/${encodeURIComponent(filename)}`, { method: "DELETE" });
}

// reads the server-sent events of /ai/chat as they arrive and calls onEvent for each one
export async function streamChat(
  question: string,
  threadId: string | null,
  onEvent: (event: string, data: Record<string, string>) => void,
) {
  const response = await call("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ question, thread_id: threadId }),
  });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop()!; // the last piece may be cut in the middle: keep it for the next read
    for (const block of events) {
      const name = block.match(/^event: (.*)$/m)?.[1];
      const data = block.match(/^data: (.*)$/m)?.[1];
      if (name && data) onEvent(name, JSON.parse(data));
    }
  }
}
