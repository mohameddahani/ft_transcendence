import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { headers, newAccessToken, isStaff } = await getAuthenticatedSession(req);
    const { searchParams } = new URL(req.url);

    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "50";

    const queryString = `?page=${page}&limit=${limit}`;
    const basePath = isStaff ? "/api/staffs/special-hours" : "/api/admins/special-hours";
    const backendPath = `${basePath}${queryString}`;

    const backendRes = await axios.get(`${API_URL}${backendPath}`, {
      headers,
      validateStatus: () => true,
    });

    // If backend returns 404 "There is No Special Hours To show", return [] with 200 OK
    if (
      backendRes.status === 404 &&
      typeof backendRes.data?.message === "string" &&
      (backendRes.data.message.toLowerCase().includes("no special hours") ||
       backendRes.data.message.toLowerCase().includes("not found"))
    ) {
      const res = NextResponse.json([], { status: 200 });
      return attachSessionCookies(res, newAccessToken);
    }

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

export async function POST(req: NextRequest) {
  try {
    const { headers, newAccessToken } = await getAuthenticatedSession(req);
    const body = await req.json();

    const backendRes = await axios.post(`${API_URL}/api/admins/special-hours`, body, {
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
