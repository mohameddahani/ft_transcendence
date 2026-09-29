import { NextResponse } from "next/server";
import axios from "axios";
import { parseJwtPayload, isOwnerUser } from "@/lib/auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    // Exact endpoint for authentication
    const backendRes = await axios
      .post(`${API_URL}/api/auth/login`, body, {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
      })
      .catch(() => null);

    if (backendRes) {
      const data = backendRes.data ?? {};

      // If backend rejected credentials (401, 400, etc.)
      if (backendRes.status >= 400) {
        return NextResponse.json(data, { status: backendRes.status });
      }

      // Check user role from backend user object and JWT access token
      const jwtPayload = data?.accessToken ? parseJwtPayload(data.accessToken) : null;
      const isRoleOwner =
        isOwnerUser(data?.user) ||
        isOwnerUser(jwtPayload);

      // Strictly deny non-owner accounts (e.g. ADMIN or MEMBER)
      if (!isRoleOwner) {
        return NextResponse.json(
          {
            message: "Access denied. Only platform owner accounts are authorized to log into this portal.",
          },
          { status: 403 }
        );
      }

      // Role is OWNER -> Authorize and set cookies
      const res = NextResponse.json(data, { status: 200 });

      // Forward cookies from backend (including refresh_token)
      const rawCookies = backendRes.headers["set-cookie"];
      const setCookies = Array.isArray(rawCookies)
        ? rawCookies
        : typeof rawCookies === "string"
        ? [rawCookies]
        : [];
      for (const cookie of setCookies) {
        res.headers.append("set-cookie", cookie);
      }

      // Set secure HTTP-only auth_token cookie with the accessToken
      if (data?.accessToken) {
        res.cookies.set("auth_token", data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }

      // Ensure refresh_token is accessible at path: "/" for Next.js API routes & middleware
      let refreshToken = data?.refreshToken;
      if (!refreshToken) {
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
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }

      return res;
    }
  } catch (err) {
    console.error("Backend login fetch error:", err);
  }

  return NextResponse.json(
    { message: "Backend service unavailable. Please ensure the API is running or use valid credentials." },
    { status: 401 }
  );
}