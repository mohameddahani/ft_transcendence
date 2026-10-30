import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

const AI_URL = process.env.AI_URL || "http://localhost:8000";

type Context = { params: Promise<{ path: string[] }> };

// forwards /api/ai/<path> to the AI service's /ai/<path>, adding the login token from the cookie
async function forward(req: NextRequest, { params }: Context) {
  const { path } = await params;
  if (path.some((part) => part === "." || part === "..")) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  const { token, newAccessToken } = await getAuthenticatedSession(req);
  const headers: Record<string, string> = { Authorization: `Bearer ${token ?? ""}` };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType; // JSON, or a file upload with its boundary

  try {
    const ai = await fetch(`${AI_URL}/ai/${path.map(encodeURIComponent).join("/")}`, {
      method: req.method,
      headers,
      body: req.method === "POST" ? await req.arrayBuffer() : undefined,
    });

    // the body is passed on as it arrives, so the chat keeps streaming
    const res = new NextResponse(ai.body, { status: ai.status });
    for (const name of ["content-type", "cache-control", "retry-after"]) {
      const value = ai.headers.get(name);
      if (value) res.headers.set(name, value);
    }
    res.headers.set("X-Accel-Buffering", "no");
    return attachSessionCookies(res, newAccessToken);
  } catch {
    return NextResponse.json({ detail: "The assistant is unavailable right now." }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
