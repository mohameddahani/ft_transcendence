import { NextRequest, NextResponse } from "next/server";
import { parseJwtPayload } from "@/lib/auth";
import {
  performTokenRefresh,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/server-auth";

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

    // 2. Reject Owner accounts if attempting admin portal
    const tokenPayload = parseJwtPayload(refreshToken);
    const roleUpper = (tokenPayload?.role || "").toUpperCase();

    if (roleUpper === "OWNER") {
      const response = NextResponse.json(
        { message: "Owner accounts are not permitted on this platform." },
        { status: 403 }
      );
      return clearAuthCookies(response);
    }

    // 3. Concurrency-safe token refresh with shared in-flight promise and grace period
    const result = await performTokenRefresh(refreshToken);

    if (result.error || !result.newAccessToken) {
      const response = NextResponse.json(
        { message: "Failed to refresh session or token expired" },
        { status: 401 }
      );
      return clearAuthCookies(response);
    }

    const response = NextResponse.json(
      { accessToken: result.newAccessToken, success: true },
      { status: 200 }
    );

    return setAuthCookies(response, {
      accessToken: result.newAccessToken,
      refreshToken: result.newRefreshToken,
    });
  } catch (error) {
    console.error("Error in refresh route handler:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred during token refresh" },
      { status: 500 }
    );
  }
}
