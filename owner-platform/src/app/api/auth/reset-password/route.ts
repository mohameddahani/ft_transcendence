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
      return NextResponse.json(
        {
          _isError: true,
          statusCode: backendRes.status,
          ...(typeof data === "object" && data !== null
            ? data
            : { message: "Failed to reset password" }),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      data || { message: "Password reset successfully!" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        _isError: true,
        statusCode: 500,
        message: "Failed to reset password on backend service",
      },
      { status: 200 }
    );
  }
}

