import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  getAuthenticatedSession,
  attachSessionCookies,
  createGracefulProxyResponse,
  createProxyResponse,
} from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { headers, newAccessToken } = await getAuthenticatedSession(req);

    const backendRes = await axios.get(
      `${API_URL}/api/members/notifications/${id}`,
      {
        headers,
        validateStatus: () => true,
      }
    );

    return createGracefulProxyResponse(backendRes.data, backendRes.status, null, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { headers, newAccessToken } = await getAuthenticatedSession(req);

    const backendRes = await axios.patch(
      `${API_URL}/api/members/notifications/${id}`,
      {},
      {
        headers,
        validateStatus: () => true,
      }
    );

    // If backend throws 409 "The Notification Already Mark As Read", return 200 OK
    if (backendRes.status === 409) {
      const res = NextResponse.json(
        { message: backendRes.data?.message || "Notification already marked as read" },
        { status: 200 }
      );
      return attachSessionCookies(res, newAccessToken);
    }

    return createProxyResponse(backendRes.data, backendRes.status, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}
