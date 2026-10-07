import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";
import { parseJwtPayload, isTokenExpired, isAdminOrStaffUser } from "@/lib/auth";

// Protected routes that strictly require admin or staff authentication
const protectedRoutes = [
  "/dashboard",
  "/members",
  "/membership-plans",
  "/subscriptions",
  "/payments",
  "/staff",
  "/classes",
  "/reports",
  "/settings",
  "/profile",
  "/gymflow-subscription",
  "/check-in",
  "/feedbacks",
];

// Authentication routes that authenticated users shouldn't revisit
const authRoutes = ["/login"];

const API_URL = process.env.API_URL || "http://localhost:3000";

function hasAdminOrStaffAccess(token?: string): boolean {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  return isAdminOrStaffUser(payload) && !isTokenExpired(payload);
}

export async function proxy(request: NextRequest) {
  let token = request.cookies.get("auth_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  let newAccessToken: string | undefined = undefined;

  // If visiting protected route and access token is missing or expired, attempt refresh
  if (isProtectedRoute && (!token || isTokenExpired(token)) && refreshToken) {
    try {
      const tokenPayload = parseJwtPayload(refreshToken);
      const isStaffToken = tokenPayload?.role === "STAFF";
      const refreshPath = isStaffToken ? "/api/auth/staffs/refresh" : "/api/auth/admins/refresh";

      const refreshRes = await axios.post(
        `${API_URL}${refreshPath}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: `refresh_token=${refreshToken}`,
          },
          validateStatus: (status) => status >= 200 && status < 300,
        }
      );

      const data = refreshRes.data;
      if (data?.accessToken && hasAdminOrStaffAccess(data.accessToken)) {
        newAccessToken = data.accessToken;
        token = newAccessToken;
      }
    } catch {
      // Backend unavailable or refresh failed
    }
  }

  const authorized = hasAdminOrStaffAccess(token);

  // If user tries to access a protected route without valid admin/staff role
  if (isProtectedRoute) {
    if (!authorized) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);

      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete("auth_token");
        response.cookies.delete("refresh_token");
        loginUrl.searchParams.set("error", "session_expired");
      }
      return response;
    }
  }

  // If already authenticated as admin/staff and visiting /login, redirect directly to /dashboard
  if (isAuthRoute && authorized) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  if (newAccessToken) {
    response.cookies.set("auth_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
