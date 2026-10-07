export interface TokenPayload {
  id?: string;
  email?: string;
  role?: string;
  userType?: string;
  exp?: number;
  iat?: number;
  jti?: string;
}

export function parseJwtPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    if (typeof window !== "undefined" && typeof window.atob === "function") {
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    }

    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isAdminOrStaffUser(
  userOrPayload?: { role?: string; userType?: string } | null
): boolean {
  if (!userOrPayload) return false;
  const role = (userOrPayload.role || userOrPayload.userType || "").toUpperCase();
  return role === "ADMIN" || role === "STAFF";
}

export function isTokenExpired(
  tokenOrPayload?: string | TokenPayload | null
): boolean {
  if (!tokenOrPayload) return true;
  const payload =
    typeof tokenOrPayload === "string"
      ? parseJwtPayload(tokenOrPayload)
      : tokenOrPayload;
  if (!payload || !payload.exp) return false;
  return Math.floor(Date.now() / 1000) >= payload.exp;
}
