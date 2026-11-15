import { NextRequest } from "next/server";
import axios from "axios";
import {
  getAuthenticatedSession,
  createGracefulProxyResponse,
  createProxyResponse,
} from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { headers, newAccessToken, isStaff } = await getAuthenticatedSession(req);

    const backendPath = isStaff
      ? `/api/staffs/membership-plans/${id}`
      : `/api/admins/membership-plans/${id}`;

    const backendRes = await axios.get(`${API_URL}${backendPath}`, {
      headers,
      validateStatus: () => true,
    });

    return createGracefulProxyResponse(backendRes.data, backendRes.status, null, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { headers, newAccessToken } = await getAuthenticatedSession(req);
    const body = await req.json();

    const backendRes = await axios.patch(
      `${API_URL}/api/admins/membership-plans/${id}`,
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
      `${API_URL}/api/admins/membership-plans/${id}`,
      {
        headers,
        validateStatus: () => true,
      }
    );

    const payload =
      backendRes.data !== undefined && backendRes.data !== "" && backendRes.data !== null
        ? backendRes.data
        : { message: "Membership plan deleted successfully" };

    return createProxyResponse(payload, backendRes.status, newAccessToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}
