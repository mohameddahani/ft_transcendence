import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Plan ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const userToken = req.cookies.get("auth_token")?.value;

    const backendRes = await fetchFromBackend(
      `/api/plans/${id}`,
      userToken,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: backendRes.status });
    }

    return NextResponse.json({ message: "Plan updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { message: "Failed to update plan on backend service" },
      { status: 500 }
    );
  }
}

