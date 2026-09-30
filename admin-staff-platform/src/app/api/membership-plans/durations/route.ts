import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const body = await req.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const rawCookies = req.headers.get("cookie");
    if (rawCookies) {
      headers["Cookie"] = rawCookies;
    }

    const backendRes = await axios.post(
      `${API_URL}/api/membership-plans/durations`,
      body,
      {
        headers,
        validateStatus: () => true,
      }
    );

    return NextResponse.json(backendRes.data, {
      status: backendRes.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return NextResponse.json(
      { message: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}
