import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    // 1. Extract refresh token from cookie, header, or body
    let refreshToken = req.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      const body = await req.json().catch(() => ({}));
      refreshToken = body?.refreshToken;
    }

    if (!refreshToken) {
      refreshToken = req.headers.get("x-refresh-token") || undefined;
    }

    if (!refreshToken) {
      return NextResponse.json(
        { message: "Refresh token is missing or not provided" },
        { status: 401 }
      );
    }

    // 2. Forward request to backend POST /api/auth/admins/refresh
    const backendRes = await axios
      .post(
        `${API_URL}/api/auth/admins/refresh`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: `refresh_token=${refreshToken}`,
          },
          validateStatus: () => true,
        }
      )
      .catch((err) => {
        console.error("Backend refresh request error:", err);
        return null;
      });

    if (!backendRes) {
      return NextResponse.json(
        { message: "Backend authentication service is unavailable" },
        { status: 503 }
      );
    }

    if (backendRes.status >= 400) {
      const errorData = backendRes.data || { message: "Failed to refresh session" };
      const response = NextResponse.json(errorData, { status: backendRes.status });

      // Refresh token is invalid/revoked/expired -> clear cookies
      response.cookies.delete("auth_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    const data = backendRes.data;
    const response = NextResponse.json(data, { status: 200 });

    // Forward any Set-Cookie headers from backend (e.g. if refresh token rotated)
    const rawCookies = backendRes.headers["set-cookie"];
    const setCookies = Array.isArray(rawCookies)
      ? rawCookies
      : typeof rawCookies === "string"
      ? [rawCookies]
      : [];
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
    }

    // Update auth_token cookie with the new accessToken
    if (data?.accessToken) {
      response.cookies.set("auth_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 15,
      });
    }

    // If backend returned rotated refresh token, ensure it's saved at path "/"
    let newRefreshToken = data?.refreshToken;
    if (!newRefreshToken) {
      for (const cookie of setCookies) {
        const match = cookie.match(/refresh_token=([^;]+)/);
        if (match) {
          newRefreshToken = match[1];
          break;
        }
      }
    }

    if (newRefreshToken) {
      response.cookies.set("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error("Error in refresh route handler:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred during token refresh" },
      { status: 500 }
    );
  }
}
