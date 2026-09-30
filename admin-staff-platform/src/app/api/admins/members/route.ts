import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const { searchParams } = new URL(req.url);

    // Backend requires page and limit as integers via ParseIntPipe
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "50";

    const query = new URLSearchParams();
    query.set("page", page);
    query.set("limit", limit);

    // Forward any other query params
    searchParams.forEach((value, key) => {
      if (key !== "page" && key !== "limit") {
        query.set(key, value);
      }
    });

    const queryString = `?${query.toString()}`;

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

    const backendRes = await axios.get(`${API_URL}/api/admins/members${queryString}`, {
      headers,
      validateStatus: () => true,
    });

    // If backend returns 404 "Members Not Found!" (meaning 0 members currently registered in DB),
    // return an empty array with 200 OK so UI displays the empty state cleanly.
    if (
      backendRes.status === 404 &&
      typeof backendRes.data?.message === "string" &&
      backendRes.data.message.toLowerCase().includes("not found")
    ) {
      return NextResponse.json([], { status: 200 });
    }

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

    const backendRes = await axios.post(`${API_URL}/api/admins/members`, body, {
      headers,
      validateStatus: () => true,
    });

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
