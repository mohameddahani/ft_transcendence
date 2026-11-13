import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const formData = await req.formData();

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const backendRes = await fetch(
      `${API_URL}/api/users/admins/profile-image`,
      {
        method: "POST",
        headers,
        body: formData,
      }
    );

    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data || { success: backendRes.ok }, {
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

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const rawCookies = req.headers.get("cookie");
    if (rawCookies) {
      headers["Cookie"] = rawCookies;
    }

    const backendRes = await axios.delete(
      `${API_URL}/api/users/admins/profile-image`,
      {
        headers,
        validateStatus: () => true,
      }
    );

    // If backend returns 400 because there is no profile image, treat as idempotent success (200 OK)
    if (
      backendRes.status === 400 &&
      typeof backendRes.data?.message === "string" &&
      backendRes.data.message.toLowerCase().includes("no profile image")
    ) {
      return NextResponse.json(
        { message: "Profile image is already removed", ...backendRes.data },
        { status: 200 }
      );
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
