import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "50";

    const userToken = req.cookies.get("auth_token")?.value;

    const backendRes = await fetchFromBackend(
      `/api/plans?page=${page}&limit=${limit}`,
      userToken,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    // If backend returns 404 "No Plan To Show", return empty array gracefully
    if (backendRes.status === 404) {
      return NextResponse.json({
        plans: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
      });
    }

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: backendRes.status });
    }

    const data = await backendRes.json();
    const plans = Array.isArray(data) ? data : [];

    return NextResponse.json({
      plans,
      total: plans.length,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("Error fetching plans from backend:", error);
    return NextResponse.json(
      { message: "Failed to retrieve plans from backend service" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planName, maxMembers, description, initialDurationDays, initialPrice } = body;

    if (!planName || maxMembers === undefined) {
      return NextResponse.json(
        { message: "planName and maxMembers are required" },
        { status: 400 }
      );
    }

    const userToken = req.cookies.get("auth_token")?.value;

    // 1. Create the plan
    const createPlanRes = await fetchFromBackend(
      "/api/plans",
      userToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: String(planName).trim(),
          maxMembers: Number(maxMembers),
          description: description ? String(description).trim() : undefined,
        }),
      }
    );

    if (!createPlanRes.ok) {
      const errorData = await createPlanRes.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: createPlanRes.status });
    }

    // 2. Fetch the newly created plan to get its ID
    const getPlansRes = await fetchFromBackend("/api/plans?page=1&limit=100", userToken);
    let createdPlan = null;
    if (getPlansRes.ok) {
      const plans = await getPlansRes.json();
      if (Array.isArray(plans)) {
        createdPlan = plans.find(
          (p: { planName: string }) => p.planName.toLowerCase() === planName.trim().toLowerCase()
        );
      }
    }

    // 3. If initial duration provided and plan found, add the duration
    if (
      createdPlan?.id &&
      initialDurationDays &&
      !isNaN(Number(initialDurationDays)) &&
      initialPrice !== undefined &&
      !isNaN(Number(initialPrice))
    ) {
      await fetchFromBackend(
        "/api/plans/durations",
        userToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: createdPlan.id,
            durationDays: Number(initialDurationDays),
            price: Number(initialPrice),
          }),
        }
      ).catch((err) => console.error("Failed to add initial duration:", err));
    }

    return NextResponse.json(
      { message: "Plan created successfully", plan: createdPlan },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { message: "Failed to create plan on backend service" },
      { status: 500 }
    );
  }
}

