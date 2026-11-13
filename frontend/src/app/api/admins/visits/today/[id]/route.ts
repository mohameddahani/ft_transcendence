import { NextRequest } from "next/server";
import axios from "axios";
import {
  getAuthenticatedSession,
  createGracefulProxyResponse,
  createProxyResponse,
} from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { headers, newAccessToken, isStaff } = await getAuthenticatedSession(req);
    const { id } = await params;

    const endpoint = isStaff ? `/api/staffs/visits/today/${id}` : `/api/admins/visits/today/${id}`;

    const backendRes = await axios.get(`${API_URL}${endpoint}`, {
      headers,
      validateStatus: () => true,
    });

    return createGracefulProxyResponse(backendRes.data, backendRes.status, null, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}
