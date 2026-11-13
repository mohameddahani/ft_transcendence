import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

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
}
