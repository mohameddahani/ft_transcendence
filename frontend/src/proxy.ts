import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseJwtPayload, isTokenExpired, isAdminOrStaffUser, isMemberUser } from "@/lib/auth";
import {
  performTokenRefresh,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/server-auth";

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

// Public authentication, password management, and verification routes
const publicAuthActionRoutes = [
  "/register",
  "/email-verification",
  "/email-change",
  "/forgot-password",
  "/reset-password",
  "/admin/forgot-password",
  "/member/forgot-password",
  "/member/reset-password",
  "/member/set-password",
  "/members/forgot-password",
  "/members/reset-password",
  "/members/set-password",
  "/staff/forgot-password",
  "/staff/reset-password",
  "/staff/set-password",
  "/staffs/forgot-password",
  "/staffs/reset-password",
  "/staffs/set-password",
];

function hasAdminOrStaffAccess(token?: string): boolean {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  return (isAdminOrStaffUser(payload) || isMemberUser(payload)) && !isTokenExpired(payload);
}

export async function proxy(request: NextRequest) {
  // logging request
  const { method, nextUrl } = request;
  console.log(`[frontend] ${method} ${nextUrl.pathname}${nextUrl.search}`);

  let token = request.cookies.get("auth_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isPublicAuthAction =
    publicAuthActionRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    ) ||
    pathname.includes("/set-password") ||
    pathname.includes("/reset-password") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/email-verification") ||
    pathname.includes("/email-change");

  const isProtectedRoute =
    !isAuthRoute &&
    !isPublicAuthAction &&
    protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

  let newAccessToken: string | undefined = undefined;
  let newRefreshToken: string | undefined = undefined;

  // If visiting protected route and access token is missing or expired, attempt refresh
  if (isProtectedRoute && (!token || isTokenExpired(token)) && refreshToken) {
    const refreshResult = await performTokenRefresh(refreshToken);
    if (refreshResult.newAccessToken && hasAdminOrStaffAccess(refreshResult.newAccessToken)) {
      newAccessToken = refreshResult.newAccessToken;
      newRefreshToken = refreshResult.newRefreshToken;
      token = newAccessToken;
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
      loginUrl.searchParams.set("error", "session_expired");

      const response = NextResponse.redirect(loginUrl);
      clearAuthCookies(response);
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

  if (newAccessToken || newRefreshToken) {
    setAuthCookies(response, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
