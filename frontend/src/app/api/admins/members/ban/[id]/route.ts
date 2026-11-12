import { NextRequest } from "next/server";
import axios from "axios";
import {
  getAuthenticatedSession,
  createProxyResponse,
} from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { headers, newAccessToken, isStaff } = await getAuthenticatedSession(req);

    const backendPath = isStaff
      ? `/api/staffs/members/ban/${id}`
      : `/api/admins/members/ban/${id}`;

    const backendRes = await axios.patch(
      `${API_URL}${backendPath}`,
      {},
      {
        headers,
        validateStatus: () => true,
      }
    );

    return createProxyResponse(backendRes.data, backendRes.status, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}
