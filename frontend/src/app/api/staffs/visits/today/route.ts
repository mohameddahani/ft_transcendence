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
    const search = searchParams.get("search");

    let backendPath = `/api/staffs/visits/today?page=${page}&limit=${limit}`;
    if (search && search.trim().length > 0) {
      backendPath += `&search=${encodeURIComponent(search.trim())}`;
    }

    const backendRes = await axios.get(`${API_URL}${backendPath}`, {
      headers,
      validateStatus: () => true,
    });

    // If backend returns 404 "There No Visits Today", return [] with status 200
    if (
      backendRes.status === 404 &&
      typeof backendRes.data?.message === "string" &&
      backendRes.data.message.toLowerCase().includes("no visits")
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

