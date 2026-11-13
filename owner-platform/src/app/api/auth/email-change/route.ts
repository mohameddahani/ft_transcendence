import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

export async function POST(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";

    const backendRes = await fetchFromBackend(
      `/api/auth/email-change?token=${encodeURIComponent(token)}`,
      undefined,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
            : { message: "Failed to verify new email address" }),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      data || { message: "Email changed successfully!" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        _isError: true,
        statusCode: 500,
        message: "Failed to verify new email address on backend service",
      },
      { status: 200 }
    );
  }
}

