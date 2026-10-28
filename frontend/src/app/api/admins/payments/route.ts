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

    const query = new URLSearchParams();
    query.set("page", page);
    query.set("limit", limit);

    searchParams.forEach((value, key) => {
      if (key !== "page" && key !== "limit") {
        query.set(key, value);
      }
    });

    const queryString = `?${query.toString()}`;
    const backendPath = isStaff ? "/api/staffs/payments" : "/api/admins/payments";

    const backendRes = await axios.get(`${API_URL}${backendPath}${queryString}`, {
      headers,
      validateStatus: () => true,
    });

    // If backend returns 404 "There Is No Payments To Show", return empty array with 200 OK
    if (
      backendRes.status === 404 &&
      typeof backendRes.data?.message === "string" &&
      (backendRes.data.message.toLowerCase().includes("no payment") ||
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
