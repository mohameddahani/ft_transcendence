import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  const body = await req.json();

  const backendRes = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json().catch(() => ({}));

  // Collect cookies from the backend
  const setCookies = backendRes.headers.getSetCookie();

  // Build the response using the standard Web Response API
  const headers = new Headers();
  headers.set("content-type", "application/json");
  for (const cookie of setCookies) {
    headers.append("set-cookie", cookie);
  }

  return new Response(JSON.stringify(data), {
    status: backendRes.status,
    headers,
  });
}