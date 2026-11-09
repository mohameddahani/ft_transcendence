import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

export async function POST(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const body = await req.json();

    const payload: Record<string, unknown> = {};
    if (body.password) payload.password = String(body.password).trim();

    const backendRes = await fetchFromBackend(
      `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
      undefined,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(data || { message: "Failed to reset password" }, {
        status: backendRes.status,
      });
    }

    return NextResponse.json(
      data || { message: "Password reset successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { message: "Failed to reset password on backend service" },
      { status: 500 }
    );
  }
}

