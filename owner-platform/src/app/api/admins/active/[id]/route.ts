import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const userToken = req.cookies.get("auth_token")?.value;

    const backendRes = await fetchFromBackend(
      `/api/owners/users/active/${id}`,
      userToken,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: backendRes.status });
    }

    return NextResponse.json(
      { message: "User account activated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error activating user account:", error);
    return NextResponse.json(
      { message: "Failed to activate user account on backend service" },
      { status: 500 }
    );
  }
}

