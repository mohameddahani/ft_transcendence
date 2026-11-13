import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, attachSessionCookies, createProxyResponse } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { headers, newAccessToken, isStaff, isMember } = await getAuthenticatedSession(req);
    const { searchParams } = new URL(req.url);

    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "50";

    const query = new URLSearchParams();
    query.set("page", page);
    query.set("limit", limit);

    searchParams.forEach((value, key) => {
      if (key !== "page" && key !== "limit") {
        query.set(key, value);
      }
    });

    const queryString = `?${query.toString()}`;

    // Route to members, staffs, or admins endpoint based on session role
    const backendPath = isMember
      ? `/api/members/membership-plans`
      : isStaff
      ? `/api/staffs/membership-plans`
      : `/api/admins/membership-plans`;

    const backendRes = await axios.get(
      `${API_URL}${backendPath}${queryString}`,
      {
        headers,
        validateStatus: () => true,
      }
    );

    // If backend returns 404 "No Membersship Plan To Show", return empty array with 200 OK
    if (
      backendRes.status === 404 &&
      typeof backendRes.data?.message === "string" &&
      (backendRes.data.message.toLowerCase().includes("no member") ||
        backendRes.data.message.toLowerCase().includes("not found"))
    ) {
      const res = NextResponse.json([], { status: 200 });
      return attachSessionCookies(res, newAccessToken);
    }

    return createProxyResponse(backendRes.data, backendRes.status, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { headers, newAccessToken } = await getAuthenticatedSession(req);
    const body = await req.json();

    const backendRes = await axios.post(
      `${API_URL}/api/admins/membership-plans`,
      body,
      {
        headers,
        validateStatus: () => true,
      }
    );

    return createProxyResponse(backendRes.data, backendRes.status, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}
