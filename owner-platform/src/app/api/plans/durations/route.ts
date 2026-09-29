import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, durationDays, price } = body;

    if (!planId || durationDays === undefined || price === undefined) {
      return NextResponse.json(
        { message: "planId, durationDays, and price are required" },
        { status: 400 }
      );
    }

    const userToken = req.cookies.get("auth_token")?.value;

    const backendRes = await fetchFromBackend(
      "/api/plans/durations",
      userToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          durationDays: Number(durationDays),
          price: Number(price),
        }),
      }
    );

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: backendRes.status });
    }

    return NextResponse.json(
      { message: "Plan duration added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding plan duration:", error);
    return NextResponse.json(
      { message: "Failed to add plan duration on backend service" },
      { status: 500 }
    );
  }
}

