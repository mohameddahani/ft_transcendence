import { NextResponse } from "next/server";
import { parseJwtPayload, isAdminUser } from "@/lib/auth";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    // Exact endpoint for authentication
    const backendRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);

    if (backendRes) {
      const data = await backendRes.json().catch(() => ({}));

      // If backend rejected credentials (401, 400, etc.)
      if (!backendRes.ok) {
        return NextResponse.json(data, { status: backendRes.status });
      }

      // Check user role from backend user object and JWT access token
      const jwtPayload = data?.accessToken ? parseJwtPayload(data.accessToken) : null;
      const isRoleOwner =
        isAdminUser(data?.user) ||
        isAdminUser(jwtPayload);

      // Strictly deny non-owner accounts (e.g. ADMIN or MEMBER)
      if (!isRoleOwner) {
        return NextResponse.json(
          {
            message: "Access denied. Only platform owner accounts are authorized to log into this portal.",
          },
          { status: 403 }
        );
      }

      // Role is ADMIN -> Authorize and set cookies
      const res = NextResponse.json(data, { status: 200 });

      // Forward cookies from backend (including refresh_token)
      const setCookies = backendRes.headers.getSetCookie?.() ?? [];
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

      return res;
    }
  } catch (err) {
    console.error("Backend login fetch error:", err);
  }

  // Development / Demo credentials fallback when backend service is offline
  // if (
  //   (body.email === "admin@kinetic.internal" || body.email === "admin@example.com") &&
  //   (body.password === "admin123" || body.password === "••••••••" || body.password === "password")
  // ) {
  //   const mockToken =
  //     "header." +
  //     Buffer.from(JSON.stringify({ email: body.email, role: "ADMIN" })).toString("base64") +
  //     ".signature";

  //   const res = NextResponse.json(
  //     {
  //       message: "Login successful (Demo Mode)",
  //       accessToken: mockToken,
  //       user: { email: body.email, role: "ADMIN" },
  //     },
  //     { status: 200 }
  //   );

  //   res.cookies.set("auth_token", mockToken, {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === "production",
  //     sameSite: "lax",
  //     path: "/",
  //     maxAge: 60 * 60 * 24 * 7,
  //   });

  //   return res;
  // }

  return NextResponse.json(
    { message: "Backend service unavailable. Please ensure the API is running or use valid credentials." },
    { status: 401 }
  );
}