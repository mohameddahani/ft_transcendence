import { NextRequest } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, createProxyResponse } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function PATCH(req: NextRequest) {
  try {
    const { headers, newAccessToken } = await getAuthenticatedSession(req);
    const body = await req.json();

    // Guard: Backend rejects edit-profile requests that contain email
    delete body.email;

    headers["Content-Type"] = "application/json";

    const backendRes = await axios.patch(
      `${API_URL}/api/users/members/edit-profile`,
      body,
      {
        headers,
        validateStatus: () => true,
      }
    );

    return createProxyResponse(backendRes.data, backendRes.status, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}
