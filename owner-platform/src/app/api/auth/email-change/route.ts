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
      return NextResponse.json(data || { message: "Failed to verify new email address" }, {
        status: backendRes.status,
      });
    }

    return NextResponse.json(
      data || { message: "Email changed successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error confirming email change:", error);
    return NextResponse.json(
      { message: "Failed to verify new email address on backend service" },
      { status: 500 }
    );
  }
}

