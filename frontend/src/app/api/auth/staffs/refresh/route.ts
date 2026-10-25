import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
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

    const backendRes = await axios
      .post(
        `${API_URL}/api/auth/staffs/refresh`,
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
        console.error("Backend staff refresh request error:", err);
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

      response.cookies.delete("auth_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    const data = backendRes.data;
    const response = NextResponse.json(data, { status: 200 });

    const rawCookies = backendRes.headers["set-cookie"];
    const setCookies = Array.isArray(rawCookies)
      ? rawCookies
      : typeof rawCookies === "string"
      ? [rawCookies]
      : [];
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
    }

    if (data?.accessToken) {
      response.cookies.set("auth_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 15,
      });
    }

    let nextRefreshToken = data?.refreshToken;
    if (!nextRefreshToken && rawCookies) {
      for (const cookieStr of setCookies) {
        const match = cookieStr.match(/refresh_token=([^;]+)/);
        if (match) {
          nextRefreshToken = match[1];
          break;
        }
      }
    }

    if (nextRefreshToken) {
      response.cookies.set("refresh_token", nextRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error: unknown) {
    console.error("Staff refresh proxy handler error:", error);
    return NextResponse.json(
      { message: "Internal server error during session refresh" },
      { status: 500 }
    );
  }
}
