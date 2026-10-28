import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { headers, newAccessToken, isStaff } = await getAuthenticatedSession(req);
    const body = await req.json();

    const endpoint = isStaff
      ? "/api/staffs/attendances/check-in/manual"
      : "/api/admins/attendances/check-in/manual";

    const backendRes = await axios.post(`${API_URL}${endpoint}`, body, {
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
