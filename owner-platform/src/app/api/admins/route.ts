import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";
import { AdminUser } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));
    const search = searchParams.get("search")?.trim() || "";

    const userToken = req.cookies.get("auth_token")?.value;

    let backendPath = `/api/owners/users?page=${page}&limit=${limit}`;
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

    // If backend returns 404 "No Users To Show", return empty array gracefully
    if (backendRes.status === 404) {
      return NextResponse.json({
        users: [],
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
      | AdminUser[]
      | { users?: AdminUser[]; data?: AdminUser[]; total?: number };
    const rawUsers: AdminUser[] = Array.isArray(data)
      ? data
      : data.users || data.data || [];

    const total = Array.isArray(data)
      ? (rawUsers.length < limit ? (page - 1) * limit + rawUsers.length : page * limit + 1)
      : (data.total ?? rawUsers.length);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      users: rawUsers,
      total,
      page,
      limit,
      totalPages,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to retrieve admins from backend service" },
      { status: 500 }
    );
  }
}
