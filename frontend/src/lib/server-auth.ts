import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { parseJwtPayload, isTokenExpired } from "@/lib/auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export interface AuthenticatedSession {
  token?: string;
  headers: Record<string, string>;
  newAccessToken?: string;
  newRefreshToken?: string;
  isStaff: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

export interface RefreshResult {
  newAccessToken?: string;
  newRefreshToken?: string;
  error?: unknown;
}

interface CachedRotation {
  refreshToken: string;
  newAccessToken: string;
  newRefreshToken?: string;
  timestamp: number;
}

// Global rotation map to bridge newAccessToken to rotated newRefreshToken
// for routes that only pass newAccessToken to attachSessionCookies()
const tokenRotationMap = new Map<string, string>();

// In-flight refresh promise deduplication (prevents concurrent backend rotation calls)
let inFlightRefreshPromise: Promise<RefreshResult> | null = null;
let inFlightToken: string | null = null;

// Grace-period cache: if concurrent requests hit Next.js with the same refresh token
// within 15 seconds, return the newly rotated tokens instead of triggering backend reuse conflicts
let lastSuccessfulRotation: CachedRotation | null = null;

/**
 * Extracts rotated refresh token from backend response (checks data and set-cookie header).
 */
export function extractRefreshTokenFromResponse(backendRes: {
  headers?: Record<string, unknown>;
  data?: unknown;
}): string | undefined {
  const data = backendRes.data as Record<string, unknown> | undefined;
  if (data?.newRefreshToken && typeof data.newRefreshToken === "string") {
    return data.newRefreshToken;
  }
  if (data?.refreshToken && typeof data.refreshToken === "string") {
    return data.refreshToken;
  }
  const rawCookies =
    backendRes.headers?.["set-cookie"] ||
    (typeof (backendRes.headers as Record<string, unknown>)?.getSetCookie === "function"
      ? ((backendRes.headers as Record<string, unknown>).getSetCookie as () => string[])()
      : undefined);

  if (rawCookies) {
    const list = Array.isArray(rawCookies) ? rawCookies : [String(rawCookies)];
    for (const cookieStr of list) {
      const match = String(cookieStr).match(/refresh_token=([^;]+)/);
      if (match) {
        return match[1];
      }
    }
  }
  return undefined;
}

/**
 * Concurrency-safe, deduplicated token refresh with 15s grace period.
 * Protects against strict single-use Refresh Token Rotation race conditions.
 */
export async function performTokenRefresh(refreshToken: string): Promise<RefreshResult> {
  if (!refreshToken) return {};

  const now = Date.now();

  // 1. Check if this exact refresh token was already rotated in the last 15 seconds
  if (
    lastSuccessfulRotation &&
    lastSuccessfulRotation.refreshToken === refreshToken &&
    now - lastSuccessfulRotation.timestamp < 15000
  ) {
    return {
      newAccessToken: lastSuccessfulRotation.newAccessToken,
      newRefreshToken: lastSuccessfulRotation.newRefreshToken,
    };
  }

  // 2. If a refresh is already in-flight for this token, join the existing promise
  if (inFlightRefreshPromise && inFlightToken === refreshToken) {
    return inFlightRefreshPromise;
  }

  // 3. Initiate single refresh call to backend
  inFlightToken = refreshToken;
  inFlightRefreshPromise = (async () => {
    try {
      const tokenPayload = parseJwtPayload(refreshToken);
      const roleUpper = (tokenPayload?.role || "").toUpperCase();
      const refreshPath =
        roleUpper === "MEMBER"
          ? "/api/auth/members/refresh"
          : roleUpper === "STAFF"
          ? "/api/auth/staffs/refresh"
          : "/api/auth/admins/refresh";

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

      const data = refreshRes.data as Record<string, unknown> | undefined;
      const newAccessToken = typeof data?.accessToken === "string" ? data.accessToken : undefined;
      const newRefreshToken = extractRefreshTokenFromResponse(refreshRes);

      if (newAccessToken) {
        lastSuccessfulRotation = {
          refreshToken,
          newAccessToken,
          newRefreshToken,
          timestamp: Date.now(),
        };

        if (newRefreshToken) {
          tokenRotationMap.set(newAccessToken, newRefreshToken);
        }

        return { newAccessToken, newRefreshToken };
      }

      return {};
    } catch (err) {
      return { error: err };
    } finally {
      inFlightRefreshPromise = null;
      inFlightToken = null;
    }
  })();

  return inFlightRefreshPromise;
}

/**
 * Sets auth cookies with proper domain/path settings on Next.js response.
 * Forces path="/" and avoids duplicate cookie collisions.
 */
export function setAuthCookies(
  res: NextResponse,
  tokens: { accessToken?: string; refreshToken?: string }
): NextResponse {
  if (tokens.accessToken) {
    res.cookies.set("auth_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    });
  }

  if (tokens.refreshToken) {
    res.cookies.set("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Eradicate any conflicting legacy cookie at /api/auth path without overwriting path="/"
    res.headers.append(
      "set-cookie",
      `refresh_token=; Path=/api/auth; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Strict${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );
  }

  return res;
}

/**
 * Completely clears auth cookies across all paths (/ and /api/auth).
 */
export function clearAuthCookies(res: NextResponse): NextResponse {
  res.cookies.delete("auth_token");
  res.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  res.cookies.delete("refresh_token");
  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  // Clear /api/auth path via raw header append to avoid overwriting path="/" in res.cookies
  res.headers.append(
    "set-cookie",
    `refresh_token=; Path=/api/auth; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Strict${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );

  return res;
}

/**
 * Extracts and validates auth tokens from incoming Next.js request.
 * If accessToken is missing or expired, seamlessly attempts refresh using refreshToken.
 * Correctly captures rotated newRefreshToken for the response.
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
  let newRefreshToken: string | undefined = undefined;

  // If token is missing or expired, attempt concurrency-safe refresh via backend
  if ((!token || isTokenExpired(token)) && refreshToken) {
    const result = await performTokenRefresh(refreshToken);
    if (result.newAccessToken) {
      newAccessToken = result.newAccessToken;
      newRefreshToken = result.newRefreshToken;
      token = newAccessToken;
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
    let forwardCookies = rawCookies;
    if (newAccessToken) {
      forwardCookies = forwardCookies.replace(/auth_token=[^;]+/, `auth_token=${newAccessToken}`);
    }
    if (newRefreshToken) {
      forwardCookies = forwardCookies.replace(/refresh_token=[^;]+/, `refresh_token=${newRefreshToken}`);
    }
    headers["Cookie"] = forwardCookies;
  }

  const payload = token ? parseJwtPayload(token) : null;
  const rawRole = (payload?.role || "").toUpperCase();
  const isStaff = rawRole === "STAFF";
  const isAdmin = rawRole === "ADMIN";
  const isMember = rawRole === "MEMBER";

  return {
    token,
    headers,
    newAccessToken,
    newRefreshToken,
    isStaff,
    isAdmin,
    isMember,
  };
}

/**
 * Attaches refreshed token cookies (both auth_token and rotated refresh_token)
 * if rotation or refresh occurred during request processing.
 */
export function attachSessionCookies(
  res: NextResponse,
  sessionOrToken?: string | AuthenticatedSession,
  explicitRefreshToken?: string
): NextResponse {
  let accessToken: string | undefined = undefined;
  let refreshToken: string | undefined = explicitRefreshToken;

  if (typeof sessionOrToken === "string") {
    accessToken = sessionOrToken;
    if (!refreshToken) {
      refreshToken = tokenRotationMap.get(accessToken);
      tokenRotationMap.delete(accessToken);
    }
  } else if (sessionOrToken && typeof sessionOrToken === "object") {
    accessToken = sessionOrToken.newAccessToken;
    refreshToken = sessionOrToken.newRefreshToken || explicitRefreshToken;
    if (accessToken && !refreshToken) {
      refreshToken = tokenRotationMap.get(accessToken);
      tokenRotationMap.delete(accessToken);
    }
  }

  return setAuthCookies(res, { accessToken, refreshToken });
}

/**
 * Creates a clean JSON NextResponse.
 * When the backend returns an error status (>= 400), it encapsulates the error
 * with HTTP 200 OK and `_isError: true` so the browser's native XMLHttpRequest/Fetch
 * does not log red HTTP 4xx/5xx network errors in DevTools Console.
 */
export function createProxyResponse(
  backendData: unknown,
  backendStatus: number,
  sessionOrToken?: string | AuthenticatedSession,
  explicitRefreshToken?: string
): NextResponse {
  if (backendStatus >= 400) {
    const errorPayload = {
      _isError: true,
      statusCode: backendStatus,
      ...(typeof backendData === "object" && backendData !== null
        ? (backendData as Record<string, unknown>)
        : { message: String(backendData) }),
    };
    const res = NextResponse.json(errorPayload, { status: 200 });
    return attachSessionCookies(res, sessionOrToken, explicitRefreshToken);
  }

  const res = NextResponse.json(backendData, { status: backendStatus });
  return attachSessionCookies(res, sessionOrToken, explicitRefreshToken);
}
