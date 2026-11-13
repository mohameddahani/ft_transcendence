import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createProxyResponse } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await axios.post(`${API_URL}/api/auth/register`, body, {
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: () => true, // Forward all status codes (200, 400, 401, 500)
    });

    if (backendRes.status >= 400) {
      return createProxyResponse(backendRes.data, backendRes.status);
    }

    const res = NextResponse.json(backendRes.data, {
      status: backendRes.status,
    });

    // Forward any set-cookie headers from backend if present
    const rawCookies = backendRes.headers["set-cookie"];
    if (rawCookies) {
      const setCookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      for (const cookie of setCookies) {
        res.headers.append("set-cookie", cookie);
      }
    }

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to connect to backend server";
    return createProxyResponse(
      { message: `Proxy error: ${message}. Make sure backend is running on ${API_URL}` },
      502
    );
  }
}
