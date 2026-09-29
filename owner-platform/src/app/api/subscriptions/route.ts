import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";
import { Subscription } from "@/types/subscription";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const status = searchParams.get("status") || "ALL";
    const sortBy = searchParams.get("sortBy") || "latest-start";

    const userToken = req.cookies.get("auth_token")?.value;

    // Fetch full dataset from backend to determine true total count
    const backendRes = await fetchFromBackend(
      "/api/owners/subscriptions?page=1&limit=10000",
      userToken,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    // If backend returns 404 "No subscriptions To Show", return empty array gracefully
    if (backendRes.status === 404) {
      return NextResponse.json({
        subscriptions: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: backendRes.status });
    }

    const data = await backendRes.json();
    const rawSubs: Subscription[] = Array.isArray(data) ? data : [];

    // Filter by search and status
    const filteredSubs = rawSubs
      .filter((sub) => {
        if (status !== "ALL" && sub.subscriptionStatus !== status) {
          return false;
        }

        if (search) {
          const company = sub.user?.companyName?.toLowerCase() || "";
          const username = sub.user?.userName?.toLowerCase() || "";
          const adminId = sub.userId?.toLowerCase() || "";
          const planName = sub.plan?.planName?.toLowerCase() || "";

          if (
            !company.includes(search) &&
            !username.includes(search) &&
            !adminId.includes(search) &&
            !planName.includes(search)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "latest-start") {
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        }
        if (sortBy === "renewal-date") {
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        }
        if (sortBy === "company-az") {
          const compA = a.user?.companyName || a.user?.userName || "";
          const compB = b.user?.companyName || b.user?.userName || "";
          return compA.localeCompare(compB);
        }
        return 0;
      });

    const total = filteredSubs.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Dynamic slice for requested page & limit
    const startIndex = (page - 1) * limit;
    const paginatedSubs = filteredSubs.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      subscriptions: paginatedSubs,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching subscriptions from backend:", error);
    return NextResponse.json(
      { message: "Failed to retrieve subscriptions from backend service" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, planDurationId, userName } = body;

    if (!planId || !planDurationId || !userName) {
      return NextResponse.json(
        { message: "planId, planDurationId, and userName are required" },
        { status: 400 }
      );
    }

    const userToken = req.cookies.get("auth_token")?.value;

    const backendRes = await fetchFromBackend(
      "/api/owners/subscriptions",
      userToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          planDurationId,
          userName: String(userName).trim(),
        }),
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        data || { message: "Failed to activate subscription" },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(
      { message: "Subscription activated successfully", data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error activating subscription:", error);
    return NextResponse.json(
      { message: "Failed to activate subscription on backend service" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json(
        { message: "adminId is required to cancel a subscription" },
        { status: 400 }
      );
    }

    const userToken = req.cookies.get("auth_token")?.value;

    const backendRes = await fetchFromBackend(
      "/api/owners/subscriptions",
      userToken,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId }),
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        data || { message: "Failed to cancel subscription" },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(
      { message: "Subscription cancelled successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { message: "Failed to cancel subscription on backend service" },
      { status: 500 }
    );
  }
}
