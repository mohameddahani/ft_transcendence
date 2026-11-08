import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload: Record<string, unknown> = {};
    if (body.email) payload.email = String(body.email).trim();

    const backendRes = await fetchFromBackend(
      "/api/auth/forgot-password",
      undefined,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(data || { message: "Failed to request password reset" }, {
        status: backendRes.status,
      });
    }

    return NextResponse.json(
      data || { message: "Password reset link dispatched to your email address." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error requesting forgot password:", error);
    return NextResponse.json(
      { message: "Failed to request password reset on backend service" },
      { status: 500 }
    );
  }
}

