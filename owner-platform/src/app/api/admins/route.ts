import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";
import { AdminUser } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const status = searchParams.get("status") || "ALL";
    const verified = searchParams.get("verified") || "ALL";

    const userToken = req.cookies.get("auth_token")?.value;

    // Fetch full dataset from backend to determine true total count
    const backendRes = await fetchFromBackend(
      "/api/owners/users?page=1&limit=10000",
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
      return NextResponse.json(errorData, { status: backendRes.status });
    }

    const data = await backendRes.json();
    const rawUsers: AdminUser[] = Array.isArray(data) ? data : [];

    // Filter by search, status, and verified
    const filteredUsers = rawUsers.filter((u) => {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
      const userName = (u.userName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const company = (u.companyName || "").toLowerCase();
      const phone = (u.phoneNumber || "").toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        userName.includes(search) ||
        email.includes(search) ||
        company.includes(search) ||
        phone.includes(search);

      const matchesStatus = status === "ALL" || u.accountStatus === status;

      const matchesVerified =
        verified === "ALL" ||
        (verified === "VERIFIED" && u.isAccountVerified) ||
        (verified === "UNVERIFIED" && !u.isAccountVerified);

      return matchesSearch && matchesStatus && matchesVerified;
    });

    const total = filteredUsers.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Dynamic slice for requested page & limit
    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      users: paginatedUsers,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching admins from backend:", error);
    return NextResponse.json(
      { message: "Failed to retrieve admins from backend service" },
      { status: 500 }
    );
  }
}
