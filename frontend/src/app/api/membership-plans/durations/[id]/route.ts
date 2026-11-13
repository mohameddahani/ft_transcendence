import { NextRequest } from "next/server";
import axios from "axios";
import { getAuthenticatedSession, createProxyResponse } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { headers, newAccessToken } = await getAuthenticatedSession(req);
    const body = await req.json();

    const backendRes = await axios.patch(
      `${API_URL}/api/admins/membership-plans/durations/${id}`,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { headers, newAccessToken } = await getAuthenticatedSession(req);

    const backendRes = await axios.delete(
      `${API_URL}/api/admins/membership-plans/durations/${id}`,
      {
        headers,
        validateStatus: () => true,
      }
    );

    const payload =
      backendRes.data !== undefined && backendRes.data !== "" && backendRes.data !== null
        ? backendRes.data
        : { message: "Membership plan duration deleted successfully" };

    return createProxyResponse(payload, backendRes.status, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}
