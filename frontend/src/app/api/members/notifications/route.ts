import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { headers, newAccessToken } = await getAuthenticatedSession(req);
    const { searchParams } = new URL(req.url);

    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "30";

    const backendRes = await axios.get(
      `${API_URL}/api/members/notifications?page=${page}&limit=${limit}`,
      {
        headers,
        validateStatus: () => true,
      }
    );

    // If 404 Notifications Not Found, return []
    if (backendRes.status === 404) {
      const res = NextResponse.json([], { status: 200 });
      return attachSessionCookies(res, newAccessToken);
    }

    const res = NextResponse.json(backendRes.data, {
      status: backendRes.status,
    });
    return attachSessionCookies(res, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return NextResponse.json(
      { message: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { headers, newAccessToken } = await getAuthenticatedSession(req);

    const backendRes = await axios.patch(
      `${API_URL}/api/members/notifications`,
      {},
      {
        headers,
        validateStatus: () => true,
      }
    );

    // If backend throws 409 "All Notifications Already Mark As Read", return 200 OK
    if (backendRes.status === 409) {
      const res = NextResponse.json(
        { message: backendRes.data?.message || "Notifications already marked as read" },
        { status: 200 }
      );
      return attachSessionCookies(res, newAccessToken);
    }

    const res = NextResponse.json(backendRes.data, {
      status: backendRes.status,
    });
    return attachSessionCookies(res, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return NextResponse.json(
      { message: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}
