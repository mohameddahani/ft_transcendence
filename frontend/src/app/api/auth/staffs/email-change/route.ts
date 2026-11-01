import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";

    const backendRes = await axios.post(
      `${API_URL}/api/auth/staffs/email-change?token=${encodeURIComponent(token)}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      }
    );

    return NextResponse.json(backendRes.data, {
      status: backendRes.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error connecting to backend";
    return NextResponse.json(
      { message: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}

