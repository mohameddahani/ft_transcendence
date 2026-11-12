import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

export async function GET(req: NextRequest) {
  try {
    const userToken = req.cookies.get("auth_token")?.value;

    const backendRes = await fetchFromBackend(
      "/api/users/owners/me",
      userToken,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: backendRes.status });
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Failed to retrieve owner profile from backend service" },
      { status: 500 }
    );
  }
}

