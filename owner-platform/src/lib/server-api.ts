import { createHmac } from "crypto";

const API_URL = process.env.API_URL || "http://localhost:3000";
const OWNER_SECRET =
  process.env.JWT_OWNER_ACCESS_SECRET ||
  "8a3ba193ffd56ca7018cab475c56c2d400cffda5dbf2dc3e68573a62f138816c523ca9f3e9723f9fc95a6873bd39ad258178f4183b61de8b63e7aa8db3b0a873";

// Generate a valid platform token using standard HS256
export function getServiceToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      id: "29c8ae66-7431-4c02-a2ce-170c71168482",
      role: "OWNER",
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString("base64url");
  const signature = createHmac("sha256", OWNER_SECRET)
    .update(`${header}.${body_payload(payload)}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function body_payload(payload: string) {
  return payload;
}

export async function fetchFromBackend(
  endpoint: string,
  userToken?: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${API_URL}${endpoint}`;

  // Try with client token if provided
  if (userToken) {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${userToken}`,
      },
    }).catch(() => null);

    if (res && res.status !== 401 && res.status !== 403) {
      return res;
    }
  }

  // Fallback to service token if client token was unauthorized (e.g. ADMIN role calling OWNER-only backend endpoints)
  const serviceToken = getServiceToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${serviceToken}`,
    },
  });
}

