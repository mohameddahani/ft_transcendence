import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";
import { parseJwtPayload, isTokenExpired, isAdminOrStaffUser, isMemberUser } from "@/lib/auth";

// Protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/members",
  "/membership-plans",
  "/subscriptions",
  "/payments",
  "/staffs",
  "/classes",
  "/reports",
  "/settings",
  "/profile",
  "/gymflow-subscription",
  "/check-in",
  "/feedbacks",
  "/operating-hours",
  "/visits",
  "/marketplace",
  "/assistant",
];

// Routes strictly forbidden to members (Admin & Staff management surfaces)
const memberForbiddenRoutes = [
  "/members",
  "/membership-plans",
  "/subscriptions",
  "/payments",
  "/staffs",
  "/classes",
  "/reports",
  "/gymflow-subscription",
  "/check-in",
  "/settings",
  "/assistant/documents",
];

// Admin-only routes that staff members are not permitted to access
const adminOnlyRoutes = [
  "/membership-plans",
  "/subscriptions",
  "/operating-hours",
  "/staffs",
  "/gymflow-subscription",
  "/assistant/documents",
];

// Authentication routes that authenticated users shouldn't revisit
const authRoutes = [
  "/login",
  "/admin/login",
  "/staff/login",
  "/staffs/login",
  "/member/login",
  "/members/login",
];

const API_URL = process.env.API_URL || "http://localhost:3000";

function hasAdminOrStaffAccess(token?: string): boolean {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  return (isAdminOrStaffUser(payload) || isMemberUser(payload)) && !isTokenExpired(payload);
}

export async function proxy(request: NextRequest) {
  let token = request.cookies.get("auth_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isProtectedRoute =
    !isAuthRoute &&
    protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

  let newAccessToken: string | undefined = undefined;

  // If visiting protected route and access token is missing or expired, attempt refresh
  if (isProtectedRoute && (!token || isTokenExpired(token)) && refreshToken) {
    try {
      const tokenPayload = parseJwtPayload(refreshToken);
      const role = (tokenPayload?.role || "").toUpperCase();
      const refreshPath =
        role === "MEMBER"
          ? "/api/auth/members/refresh"
          : role === "STAFF"
          ? "/api/auth/staffs/refresh"
          : "/api/auth/admins/refresh";

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

  // If user tries to access a protected route without valid admin/staff/member role
  if (isProtectedRoute) {
    if (!authorized) {
      const isMemberPath = pathname.startsWith("/member");
      const isStaffPath = pathname.startsWith("/staff");
      const targetLogin = isMemberPath
        ? "/member/login"
        : isStaffPath
        ? "/staff/login"
        : "/login";
      const loginUrl = new URL(targetLogin, request.url);
      loginUrl.searchParams.set("from", pathname);

      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete("auth_token");
        response.cookies.delete("refresh_token");
        loginUrl.searchParams.set("error", "session_expired");
      }
      return response;
    }

    // Enforce role-based access restrictions
    const tokenPayload = token ? parseJwtPayload(token) : null;
    const roleUpper = (tokenPayload?.role || "").toUpperCase();
    const isStaff = roleUpper === "STAFF";
    const isMember = roleUpper === "MEMBER";

    // Members cannot access Admin & Staff management portals
    if (isMember) {
      const isForbidden = memberForbiddenRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );
      if (isForbidden) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Staff cannot access Admin-only setup routes
    const isAdminOnlyRoute = adminOnlyRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isStaff && isAdminOnlyRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
