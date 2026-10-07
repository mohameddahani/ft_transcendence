import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";
import { parseJwtPayload, isTokenExpired } from "@/lib/auth";

// Protected routes that strictly require platform owner authentication
const protectedRoutes = [
  "/admins",
  "/plans",
  "/subscriptions",
  "/dashboard",
  "/profile",
];

// Authentication routes that authenticated owners shouldn't revisit
const authRoutes = ["/login"];

const API_URL = process.env.API_URL || "http://localhost:3000";

function isOwnerToken(token?: string): boolean {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  const role = (payload?.role || payload?.userType || "").toUpperCase();
  return role === "OWNER";
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

  // If visiting protected route (or root) and access token is missing or expired, attempt refresh
  if ((isProtectedRoute || pathname === "/") && (!token || isTokenExpired(token)) && refreshToken) {
    try {
      const refreshRes = await axios.post(
        `${API_URL}/api/auth/owners/refresh`,
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
      if (data?.accessToken && isOwnerToken(data.accessToken)) {
        newAccessToken = data.accessToken;
        token = newAccessToken;
      }
    } catch {
      // Backend unavailable or refresh failed
    }
  }

  const hasOwnerAccess = isOwnerToken(token) && !isTokenExpired(token);

  // If user tries to access root /
  if (pathname === "/") {
    if (hasOwnerAccess) {
      const response = NextResponse.redirect(new URL("/admins", request.url));
      if (newAccessToken) {
        response.cookies.set("auth_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
      return response;
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user tries to access a protected route without valid owner role
  if (isProtectedRoute) {
    if (!hasOwnerAccess) {
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

  // If already authenticated as owner and visiting /login, redirect directly to /admins
  if (isAuthRoute && hasOwnerAccess) {
    return NextResponse.redirect(new URL("/admins", request.url));
  }

  // Pass refreshed cookie to downstream server components
  const response = NextResponse.next();

  if (newAccessToken) {
    response.cookies.set("auth_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
