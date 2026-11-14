import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000";

// the platform's plans are public: forwarded to the backend as they are, no login needed
export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ message: "page and limit must be whole numbers (limit up to 100)" }, { status: 400 });
  }
  try {
    const backendRes = await axios.get(`${API_URL}/api/plans`, {
      params: { page, limit },
      timeout: 8000, // never leave the popup waiting on a backend that doesn't answer
      validateStatus: () => true,
    });
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ message: "The plans are unavailable right now." }, { status: 502 });
  }
}
