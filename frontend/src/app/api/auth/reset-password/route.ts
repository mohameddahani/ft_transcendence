import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createProxyResponse } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const body = await req.json();

    const backendRes = await axios.post(
      `${API_URL}/api/auth/reset-password?token=${encodeURIComponent(token)}`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      }
    );

    if (backendRes.status >= 400) {
      return createProxyResponse(backendRes.data, backendRes.status);
    }

    const res = NextResponse.json(backendRes.data, {
      status: backendRes.status,
    });

    const rawCookies = backendRes.headers["set-cookie"];
    if (rawCookies) {
      const setCookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      for (const cookie of setCookies) {
        res.headers.append("set-cookie", cookie);
      }
    }

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}

