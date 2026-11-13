import { NextRequest } from "next/server";
import axios from "axios";
import {
  getAuthenticatedSession,
  createGracefulProxyResponse,
  createProxyResponse,
} from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { headers, newAccessToken, isStaff, isMember } = await getAuthenticatedSession(req);
    const { searchParams } = new URL(req.url);

    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "50";

    const queryString = `?page=${page}&limit=${limit}`;
    const basePath = isMember
      ? "/api/members/special-hours"
      : isStaff
      ? "/api/staffs/special-hours"
      : "/api/admins/special-hours";
    const backendPath = `${basePath}${queryString}`;

    const backendRes = await axios.get(`${API_URL}${backendPath}`, {
      headers,
      validateStatus: () => true,
    });

    return createGracefulProxyResponse(backendRes.data, backendRes.status, [], newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { headers, newAccessToken } = await getAuthenticatedSession(req);
    const body = await req.json();

    const backendRes = await axios.post(`${API_URL}/api/admins/special-hours`, body, {
      headers,
      validateStatus: () => true,
    });

    return createProxyResponse(backendRes.data, backendRes.status, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}
