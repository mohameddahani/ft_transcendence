import { NextRequest } from "next/server";
import axios from "axios";
import {
  getAuthenticatedSession,
  createGracefulProxyResponse,
  createProxyResponse,
} from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function proxyMembershipsRequest(
  req: NextRequest,
  path: string,
  fallbackEmpty: unknown = []
) {
  try {
    const { headers, newAccessToken } = await getAuthenticatedSession(req);
    const searchParams = req.nextUrl.searchParams.toString();
    const targetUrl = `${API_URL}${path}${searchParams ? `?${searchParams}` : ""}`;

    const backendRes = await axios.get(targetUrl, {
      headers,
      validateStatus: () => true,
    });

    return createGracefulProxyResponse(
      backendRes.data,
      backendRes.status,
      fallbackEmpty,
      newAccessToken
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}

