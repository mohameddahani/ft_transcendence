import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { token, newAccessToken } = await getAuthenticatedSession(req);
    const formData = await req.formData();

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const backendRes = await fetch(`${API_URL}/api/users/members/profile-image`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await backendRes.json().catch(() => null);
    const res = NextResponse.json(data || { success: backendRes.ok }, {
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

export async function DELETE(req: NextRequest) {
  try {
    const { headers, newAccessToken } = await getAuthenticatedSession(req);

    const backendRes = await axios.delete(
      `${API_URL}/api/users/members/profile-image`,
      {
        headers,
        validateStatus: () => true,
      }
    );

    // If backend returns 400 because there is no profile image, treat as idempotent success (200 OK)
    const status =
      backendRes.status === 400 &&
      typeof backendRes.data?.message === "string" &&
      backendRes.data.message.toLowerCase().includes("no profile image")
        ? 200
        : backendRes.status;

    const res = NextResponse.json(
      status === 200 && backendRes.status === 400
        ? { message: "Profile image is already removed", ...backendRes.data }
        : backendRes.data,
      { status }
    );
    return attachSessionCookies(res, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return NextResponse.json(
      { message: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}
