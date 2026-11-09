import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { headers, newAccessToken, isStaff, isMember } = await getAuthenticatedSession(req);

    // Backend only has admin notifications; return [] for staff to prevent 401/403 cascade
    if (isStaff) {
      const res = NextResponse.json([], { status: 200 });
      return attachSessionCookies(res, newAccessToken);
    }

    const { searchParams } = new URL(req.url);

    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const queryString = `?page=${page}&limit=${limit}`;
    const backendPath = isMember
      ? `/api/members/notifications${queryString}`
      : `/api/admins/notifications${queryString}`;

    const backendRes = await axios.get(`${API_URL}${backendPath}`, {
      headers,
      validateStatus: () => true,
    });

    // If backend throws 404 "Notifications Not Found" or route not registered, return [] with status 200
    if (
      backendRes.status === 404 &&
      typeof backendRes.data?.message === "string" &&
      (backendRes.data.message.toLowerCase().includes("not found") ||
       backendRes.data.message.toLowerCase().includes("cannot get"))
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

export async function PATCH(req: NextRequest) {
  try {
    const { headers, newAccessToken, isStaff, isMember } = await getAuthenticatedSession(req);

    if (isStaff) {
      const res = NextResponse.json({ message: "Not applicable for staff" }, { status: 200 });
      return attachSessionCookies(res, newAccessToken);
    }

    const backendPath = isMember
      ? `/api/members/notifications`
      : `/api/admins/notifications`;

    const backendRes = await axios.patch(
      `${API_URL}${backendPath}`,
      {},
      {
        headers,
        validateStatus: () => true,
      }
    );

    // If backend throws 409 "All Notifications Already Mark As Read", treat as successful 200
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
