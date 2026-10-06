import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { parseJwtPayload, isTokenExpired } from "@/lib/auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export interface AuthenticatedSession {
  token?: string;
  headers: Record<string, string>;
  newAccessToken?: string;
  isStaff: boolean;
  isAdmin: boolean;
}

/**
 * Extracts and validates auth tokens from incoming Next.js request.
 * If accessToken is missing or expired, seamlessly attempts refresh using refreshToken.
 */
export async function getAuthenticatedSession(
  req: NextRequest
): Promise<AuthenticatedSession> {
  let token =
    req.cookies.get("auth_token")?.value ||
    req.cookies.get("access_token")?.value;
  const refreshToken =
    req.cookies.get("refresh_token")?.value;
  let newAccessToken: string | undefined = undefined;

  // If token is missing or expired, attempt refresh via backend
  if ((!token || isTokenExpired(token)) && refreshToken) {
    try {
      const tokenPayload = parseJwtPayload(refreshToken);
      const isStaffToken = tokenPayload?.role === "STAFF";
      const refreshPath = isStaffToken ? "/api/auth/staffs/refresh" : "/api/auth/admins/refresh";

      const refreshRes = await axios.post(
        `${API_URL}${refreshPath}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: `refresh_token=${refreshToken}`,
          },
          validateStatus: (status) => status >= 200 && status < 300,
        }
      );

      const data = refreshRes.data;
      if (data?.accessToken) {
        newAccessToken = data.accessToken;
        token = newAccessToken;
      }
    } catch {
      // Refresh failed or backend unavailable
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const rawCookies = req.headers.get("cookie");
  if (rawCookies) {
    headers["Cookie"] = rawCookies;
  }

  const payload = token ? parseJwtPayload(token) : null;
  const isStaff = payload?.role === "STAFF";
  const isAdmin = payload?.role === "ADMIN";

  return {
    token,
    headers,
    newAccessToken,
    isStaff,
    isAdmin,
  };
}

/**
 * Attaches refreshed token cookie if rotation or refresh occurred during request processing.
 */
export function attachSessionCookies(
  res: NextResponse,
  newAccessToken?: string
): NextResponse {
  if (newAccessToken) {
    res.cookies.set("auth_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15,
    });
  }
  return res;
}
