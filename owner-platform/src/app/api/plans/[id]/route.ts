import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { _isError: true, statusCode: 400, message: "Plan ID is required" },
        { status: 200 }
      );
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
      return NextResponse.json(
        {
          _isError: true,
          statusCode: backendRes.status,
          ...(typeof errorData === "object" && errorData !== null
            ? errorData
            : { message: String(errorData) }),
        },
        { status: 200 }
      );
    }

    const responseData = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      typeof responseData === "object" && responseData !== null
        ? responseData
        : { message: "Plan updated successfully" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { _isError: true, statusCode: 500, message: "Failed to update plan on backend service" },
      { status: 200 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { _isError: true, statusCode: 400, message: "Plan ID is required" },
        { status: 200 }
      );
    }

    const userToken = req.cookies.get("auth_token")?.value;

    const backendRes = await fetchFromBackend(
      `/api/plans/${id}`,
      userToken,
      {
        method: "DELETE",
      }
    );

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          _isError: true,
          statusCode: backendRes.status,
          ...(typeof errorData === "object" && errorData !== null
            ? errorData
            : { message: String(errorData) }),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Plan deleted successfully" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { _isError: true, statusCode: 500, message: "Failed to delete plan on backend service" },
      { status: 200 }
    );
  }
}
