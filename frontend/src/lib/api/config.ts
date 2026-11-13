export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:3000";

/**
 * Combines the API_URL from .env with the given endpoint path.
 * Example: getApiEndpoint("/api/admins/members") -> "http://localhost:3000/api/admins/members"
 */
export function getApiEndpoint(endpoint: string): string {
  const base = API_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}
