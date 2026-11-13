import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  const authToken = req.cookies.get("auth_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // Best-effort notify backend logout
  if (authToken || refreshToken) {
    try {
      await axios
        .post(
          `${API_URL}/api/auth/owners/logout`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              ...(refreshToken ? { Cookie: `refresh_token=${refreshToken}` } : {}),
            },
            validateStatus: () => true,
          }
        )
        .catch(() => null);
    } catch {
      // Ignore network errors on logout
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Explicitly clear both auth_token and refresh_token
  response.cookies.delete("auth_token");
  response.cookies.delete("refresh_token");

  response.cookies.set("auth_token", "", {
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
    path: "/",
    maxAge: 0,
  });

  return response;
}
