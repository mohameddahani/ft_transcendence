import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { headers, newAccessToken, isStaff } = await getAuthenticatedSession(req);

    if (isStaff) {
      const res = NextResponse.json([], { status: 200 });
      return attachSessionCookies(res, newAccessToken);
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "50";

    const queryString = `?page=${page}&limit=${limit}`;
    const backendPath = `/api/admins/subscriptions/all${queryString}`;

    const backendRes = await axios.get(`${API_URL}${backendPath}`, {
      headers,
      validateStatus: () => true,
    });

    // If backend returns 404 "No Subscriptions Found", return [] with status 200
    if (
      backendRes.status === 404 &&
      typeof backendRes.data?.message === "string" &&
      backendRes.data.message.toLowerCase().includes("no subscriptions")
    ) {
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
