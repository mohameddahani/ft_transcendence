import { NextRequest } from "next/server";
import axios from "axios";
import { createProxyResponse } from "@/lib/server-auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const rawCookies = req.headers.get("cookie");
    if (rawCookies) {
      headers["Cookie"] = rawCookies;
    }

    const backendRes = await axios.get(`${API_URL}/api/users/admins/me`, {
      headers,
      validateStatus: () => true,
    });

    return createProxyResponse(backendRes.data, backendRes.status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return createProxyResponse({ message: `Proxy error: ${message}` }, 502);
  }
}
