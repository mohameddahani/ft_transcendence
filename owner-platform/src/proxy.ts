import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that strictly require platform owner authentication
const protectedRoutes = ["/admins", "/plans", "/subscriptions", "/settings", "/dashboard"];

// Authentication routes that authenticated owners shouldn't revisit
const authRoutes = ["/login"];

function parseJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isOwnerToken(token?: string): boolean {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  const role = (payload?.role || payload?.userType || "").toUpperCase();
  return role === "OWNER";
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const hasOwnerAccess = isOwnerToken(token);

  // If user tries to access root /
  if (pathname === "/") {
    if (hasOwnerAccess) {
      return NextResponse.redirect(new URL("/admins", request.url));
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
        // Token exists but is not an owner (e.g. admin or member) -> clear cookie
        response.cookies.delete("auth_token");
        loginUrl.searchParams.set("error", "unauthorized");
      }
      return response;
    }
  }

  // If already authenticated as owner and visiting /login, redirect directly to /admins
  if (isAuthRoute && hasOwnerAccess) {
    return NextResponse.redirect(new URL("/admins", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
