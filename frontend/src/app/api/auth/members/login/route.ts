import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { parseJwtPayload } from "@/lib/auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const memberBody = {
      userName: (body.userName || body.email || "").trim(),
      password: body.password,
    };

    const backendRes = await axios.post(`${API_URL}/api/auth/members/login`, memberBody, {
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: () => true, // Forward all status codes
    });

    const data = backendRes.data;

    if (backendRes.status >= 400) {
      return NextResponse.json(data, {
        status: backendRes.status,
      });
    }

    // Normalize user object so Member accounts provide user profile
    if (data?.member) {
      if (data.member.admin?.companyName && !data.member.companyName) {
        data.member.companyName = data.member.admin.companyName;
      }
      if (!data?.user) {
        data.user = data.member;
      } else if (data.member.companyName && !data.user.companyName) {
        data.user.companyName = data.member.companyName;
      }
    }

    // Check user role from backend user object and JWT accessToken payload
    const jwtPayload = data?.accessToken ? parseJwtPayload(data.accessToken) : null;
    const role = (data?.user?.role || data?.member?.role || jwtPayload?.role || "").toUpperCase();

    if (role !== "MEMBER") {
      return NextResponse.json(
        {
          message: "Access denied. Only Member accounts are authorized on this endpoint.",
        },
        { status: 403 }
      );
    }

    const res = NextResponse.json(data, {
      status: 200,
    });

    // Forward any set-cookie headers from backend
    const rawCookies = backendRes.headers["set-cookie"];
    if (rawCookies) {
      const setCookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      for (const cookie of setCookies) {
        res.headers.append("set-cookie", cookie);
      }
    }

    // Set secure HTTP-only auth_token cookie with accessToken
    if (data?.accessToken) {
      res.cookies.set("auth_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 15,
      });
    }

    // Ensure refresh_token is accessible at path "/" for Next.js API routes & middleware
    let refreshToken = data?.refreshToken;
    if (!refreshToken && rawCookies) {
      const setCookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      for (const cookieStr of setCookies) {
        const match = cookieStr.match(/refresh_token=([^;]+)/);
        if (match) {
          refreshToken = match[1];
          break;
        }
      }
    }

    if (refreshToken) {
      res.cookies.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return res;
  } catch (error: unknown) {
    console.error("Member login proxy error:", error);
    const message = error instanceof Error ? error.message : "Failed to connect to backend server";
    return NextResponse.json(
      { message: `Proxy error: ${message}. Make sure backend is running on ${API_URL}` },
      { status: 502 }
    );
  }
}
