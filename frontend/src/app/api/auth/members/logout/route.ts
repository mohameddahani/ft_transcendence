import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { clearAuthCookies } from "@/lib/server-auth";

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

    // Call backend member logout API
    await axios.post(
      `${API_URL}/api/auth/members/logout`,
      {},
      {
        headers,
        validateStatus: () => true,
      }
    );
  } catch (error) {
    console.error("Backend member logout proxy error:", error);
  }

  const response = NextResponse.json(
    { success: true, message: "Member logged out successfully" },
    { status: 200 }
  );

  return clearAuthCookies(response);
}
