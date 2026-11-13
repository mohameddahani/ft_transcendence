import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

/**
 * Creates a Next.js Route Handler for statistics endpoints.
 * Automatically handles HttpOnly cookie extraction, JWT Bearer header injection,
 * automatic Admin vs. Staff role resolution, and session token rotation.
 */
export function createStatsProxyHandler(adminPath: string, staffPath?: string) {
  return async function GET(req: NextRequest) {
    try {
      const { headers, newAccessToken, isStaff } = await getAuthenticatedSession(req);
      const backendPath = isStaff && staffPath ? staffPath : adminPath;

      const backendRes = await axios.get(`${API_URL}${backendPath}`, {
        headers,
        validateStatus: () => true,
      });

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
  };
}

/**
 * Creates a Next.js Route Handler for member, staff-only, or owner statistics endpoints.
 */
export function createDirectStatsProxyHandler(targetPath: string) {
  return async function GET(req: NextRequest) {
    try {
      const { headers, newAccessToken } = await getAuthenticatedSession(req);

      const backendRes = await axios.get(`${API_URL}${targetPath}`, {
        headers,
        validateStatus: () => true,
      });

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
  };
}

