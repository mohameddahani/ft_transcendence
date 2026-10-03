import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { headers, newAccessToken, isStaff } = await getAuthenticatedSession(req);

    // If staff accesses, subscriptions are an admin-level feature
    if (isStaff) {
      const res = NextResponse.json(null, { status: 200 });
      return attachSessionCookies(res, newAccessToken);
    }

    const backendRes = await axios.get(`${API_URL}/api/admins/subscriptions/me`, {
      headers,
      validateStatus: () => true,
    });

    // If no active subscription is found, return null with status 200
    if (
      backendRes.status === 404 &&
      typeof backendRes.data?.message === "string" &&
      backendRes.data.message.toLowerCase().includes("no active subscription")
    ) {
      const res = NextResponse.json(null, { status: 200 });
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
