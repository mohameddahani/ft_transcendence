import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userToken = req.cookies.get("auth_token")?.value;

    const backendRes = await fetchFromBackend(
      `/api/owners/subscriptions/${id}`,
      userToken,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
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

    const subscription = await backendRes.json();
    return NextResponse.json(subscription);
  } catch {
    return NextResponse.json(
      {
        _isError: true,
        statusCode: 500,
        message: "Failed to retrieve subscription details",
      },
      { status: 200 }
    );
  }
}

