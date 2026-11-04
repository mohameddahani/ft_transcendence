import { NextRequest, NextResponse } from "next/server";
import {
  performTokenRefresh,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/server-auth";

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
  } catch (error: unknown) {
    console.error("Staff refresh proxy handler error:", error);
    return NextResponse.json(
      { message: "Internal server error during session refresh" },
      { status: 500 }
    );
  }
}
