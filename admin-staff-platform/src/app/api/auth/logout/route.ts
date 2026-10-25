import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { parseJwtPayload } from "@/lib/auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  const authToken = req.cookies.get("auth_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const cookieParts: string[] = [];
    if (refreshToken) {
      cookieParts.push(`refresh_token=${refreshToken}`);
    }
    const rawCookie = req.headers.get("cookie");
    if (rawCookie) {
      cookieParts.push(rawCookie);
    }
    if (cookieParts.length > 0) {
      headers["Cookie"] = cookieParts.join("; ");
    }

    // Determine whether user is Member, Staff, or Admin to call the correct backend logout endpoint
    const tokenPayload = (authToken ? parseJwtPayload(authToken) : null) || (refreshToken ? parseJwtPayload(refreshToken) : null);
    const role = (tokenPayload?.role || "").toUpperCase();
    const logoutPath =
      role === "MEMBER"
        ? "/api/auth/members/logout"
        : role === "STAFF"
        ? "/api/auth/staffs/logout"
        : "/api/auth/admins/logout";

    await axios.post(`${API_URL}${logoutPath}`, {}, {
      headers,
      validateStatus: () => true,
    });
  } catch (error) {
    console.error("Backend logout proxy error:", error);
  }

  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );

  response.cookies.delete("auth_token");
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  response.cookies.delete("refresh_token");
  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 0,
  });

  return response;
}
