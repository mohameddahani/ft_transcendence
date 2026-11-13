import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";
import { Subscription } from "@/types/subscription";

/**
 * GET /api/owners/subscriptions
 * Fetches all platform subscriptions with pagination and search.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const search = searchParams.get("search")?.trim() || "";

    const userToken = req.cookies.get("auth_token")?.value;

    let backendPath = `/api/owners/subscriptions?page=${page}&limit=${limit}`;
    if (search) {
      backendPath += `&search=${encodeURIComponent(search)}`;
    }

    const backendRes = await fetchFromBackend(
      backendPath,
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

    const data = (await backendRes.json()) as
      | Subscription[]
      | { subscriptions?: Subscription[]; data?: Subscription[]; total?: number };
    const rawSubs: Subscription[] = Array.isArray(data)
      ? data
      : data.subscriptions || data.data || [];

    const total = Array.isArray(data)
      ? (rawSubs.length < limit ? (page - 1) * limit + rawSubs.length : page * limit + 1)
      : (data.total ?? rawSubs.length);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      subscriptions: rawSubs,
      total,
      page,
      limit,
      totalPages,
    });
  } catch {
    return NextResponse.json(
      {
        _isError: true,
        statusCode: 500,
        message: "Failed to retrieve subscriptions from backend service",
      },
      { status: 200 }
    );
  }
}

/**
 * POST /api/owners/subscriptions
 * Activates a subscription for a given gym administrator account.
 * Payload: { planId: string, planDurationId: string, userName: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { planId, planDurationId, userName } = body || {};

    if (!planId || !planDurationId || !userName) {
      return NextResponse.json(
        {
          _isError: true,
          statusCode: 400,
          message: "planId, planDurationId, and userName are required",
        },
        { status: 200 }
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
          userName: typeof userName === "string" ? userName.trim() : userName,
        }),
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

    const data = await backendRes.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        _isError: true,
        statusCode: 500,
        message: "Failed to activate subscription. Internal server error.",
      },
      { status: 200 }
    );
  }
}

/**
 * PATCH /api/owners/subscriptions
 * Cancels the active subscription for an administrator.
 * Payload: { adminId: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { adminId } = body || {};

    if (!adminId) {
      return NextResponse.json(
        {
          _isError: true,
          statusCode: 400,
          message: "adminId is required to cancel a subscription",
        },
        { status: 200 }
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

    const data = await backendRes.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        _isError: true,
        statusCode: 500,
        message: "Failed to cancel subscription. Internal server error.",
      },
      { status: 200 }
    );
  }
}

