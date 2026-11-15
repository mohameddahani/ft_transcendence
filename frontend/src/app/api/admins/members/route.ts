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
    const { headers, newAccessToken, isStaff } = await getAuthenticatedSession(req);
    const { searchParams } = new URL(req.url);

    // Backend requires page and limit as integers via ParseIntPipe
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const query = new URLSearchParams();
    query.set("page", page);
    query.set("limit", limit);

    searchParams.forEach((value, key) => {
      if (key !== "page" && key !== "limit") {
        query.set(key, value);
      }
    });

    const queryString = `?${query.toString()}`;
    const backendPath = isStaff ? "/api/staffs/members" : "/api/admins/members";

    const backendRes = await axios.get(`${API_URL}${backendPath}${queryString}`, {
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
    const { headers, newAccessToken, isStaff } = await getAuthenticatedSession(req);
    const body = await req.json();

    const backendPath = isStaff ? "/api/staffs/members" : "/api/admins/members";
    const backendRes = await axios.post(`${API_URL}${backendPath}`, body, {
      headers,
      validateStatus: () => true,
    });

    return createProxyResponse(backendRes.data, backendRes.status, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}
