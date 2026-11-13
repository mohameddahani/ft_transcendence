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
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";
    const search = searchParams.get("search");

    const endpoint = isStaff ? "/api/staffs/visits/today" : "/api/admins/visits/today";
    let backendPath = `${endpoint}?page=${page}&limit=${limit}`;
    if (search && search.trim().length > 0) {
      backendPath += `&search=${encodeURIComponent(search.trim())}`;
    }

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
