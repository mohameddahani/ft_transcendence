import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

export async function POST(req: NextRequest) {
  try {
    const userToken = req.cookies.get("auth_token")?.value;
    const body = await req.json();

    const payload: Record<string, unknown> = {};
    if (body.email) payload.email = String(body.email).trim();
    if (body.currentPassword) payload.currentPassword = String(body.currentPassword).trim();

    const backendRes = await fetchFromBackend(
      "/api/users/owners/email-change",
      userToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(data || { message: "Failed to request email change" }, {
        status: backendRes.status,
      });
    }

    return NextResponse.json(
      data || { message: "A verification email has been sent to your new email address." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error requesting owner email change:", error);
    return NextResponse.json(
      { message: "Failed to request email change on backend service" },
      { status: 500 }
    );
  }
}

