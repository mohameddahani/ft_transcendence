import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Target relayer endpoint (reads server-side env or falls back to public env / default port 3333)
const RELAYER_API_URL =
  process.env.RELAYER_API_URL ||
  process.env.API_URL_RELAYER ||
  process.env.NEXT_PUBLIC_API_URL_RELAYER ||
  "http://localhost:3333/blockchain/relayer";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Validate payload shape
    if (
      !payload ||
      typeof payload !== "object" ||
      !payload.from ||
      !payload.to ||
      !payload.data ||
      !payload.signature
    ) {
      return NextResponse.json(
        { error: "Invalid forward request payload: missing required fields." },
        { status: 400 }
      );
    }

    // Server-to-server call to the blockchain relayer microservice
    const backendRes = await axios.post(RELAYER_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: () => true, // Forward exact HTTP status without throwing on 4xx/5xx
      timeout: 30000, // Blockchain tx estimation/submission can take a few seconds
    });

    return NextResponse.json(backendRes.data, {
      status: backendRes.status,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to connect to blockchain relayer service";
    return NextResponse.json(
      { error: `Relayer proxy error: ${message}` },
      { status: 502 }
    );
  }
}

