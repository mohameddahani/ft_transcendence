import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  extractRefreshTokenFromResponse,
  setAuthCookies,
  createProxyResponse,
} from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const memberBody = {
      userName: (body.userName || body.username || "").trim(),
      password: body.password,
    };

    // Forward login request to backend member authentication endpoint
    const backendRes = await axios.post(
      `${API_URL}/api/auth/members/login`,
      memberBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      }
    );

    const data = backendRes.data;

    if (backendRes.status >= 400) {
      return createProxyResponse(data, backendRes.status);
    }

    const userRole = data?.member?.role || data?.user?.role;
    if (userRole !== "MEMBER") {
      return createProxyResponse(
        {
          message: "Access denied. Only Member accounts are authorized on this endpoint.",
        },
        403
      );
    }

    const res = NextResponse.json(data, {
      status: 200,
    });

    const accessToken = data?.accessToken;
    const refreshToken = extractRefreshTokenFromResponse(backendRes);

    setAuthCookies(res, { accessToken, refreshToken });

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to connect to backend server";
    return createProxyResponse(
      { message: `Proxy error: ${message}. Make sure backend is running on ${API_URL}` },
      502
    );
  }
}
