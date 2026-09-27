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
      `/api/owners/users/pending/${id}`,
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
      { message: "User account moved to pending status" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error setting user to pending:", error);
    return NextResponse.json(
      { message: "Failed to set user account to pending on backend service" },
      { status: 500 }
    );
  }
}

