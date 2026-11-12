import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  getAuthenticatedSession,
  attachSessionCookies,
  createProxyResponse,
} from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { headers, newAccessToken } = await getAuthenticatedSession(req);
    const { searchParams } = new URL(req.url);

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
    const backendRes = await axios.get(`${API_URL}/api/staffs/members${queryString}`, {
      headers,
      validateStatus: () => true,
    });

    if (
      backendRes.status === 404 &&
      typeof backendRes.data?.message === "string" &&
      backendRes.data.message.toLowerCase().includes("not found")
    ) {
      const res = NextResponse.json([], { status: 200 });
      return attachSessionCookies(res, newAccessToken);
    }

    return createProxyResponse(backendRes.data, backendRes.status, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}

