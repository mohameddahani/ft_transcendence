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
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isOwnerUser(
  userOrPayload?: { role?: string; userType?: string } | null
): boolean {
  if (!userOrPayload) return false;
  const role = (userOrPayload.role || userOrPayload.userType || "").toUpperCase();
  return role === "OWNER";
}

// Backward compatibility alias for dashboard portal role authorization
export function isAdminUser(
  userOrPayload?: { role?: string; userType?: string } | null
): boolean {
  return isOwnerUser(userOrPayload);
}
