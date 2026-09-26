import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

export async function PATCH(req: NextRequest) {
  try {
    const userToken = req.cookies.get("auth_token")?.value;
    const body = await req.json();

    // Prepare payload, omitting empty password if not changed
    const payload: Record<string, unknown> = {};
    if (body.firstName) payload.firstName = String(body.firstName).trim();
    if (body.lastName) payload.lastName = String(body.lastName).trim();
    if (body.gender) payload.gender = String(body.gender).toUpperCase();
    if (body.birthDate) payload.birthDate = new Date(body.birthDate).toISOString();
    if (body.email) payload.email = String(body.email).trim();
    if (body.phoneNumber) payload.phoneNumber = String(body.phoneNumber).replace(/\s+/g, "");
    if (body.companyName) payload.companyName = String(body.companyName).trim();
    if (body.password && String(body.password).trim().length > 0) {
      payload.password = String(body.password).trim();
    }

    const backendRes = await fetchFromBackend(
      "/api/users/owners/edit-profile",
      userToken,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(data || { message: "Failed to update profile" }, {
        status: backendRes.status,
      });
    }

    return NextResponse.json(
      { message: "Profile updated successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating owner profile:", error);
    return NextResponse.json(
      { message: "Failed to update owner profile on backend service" },
      { status: 500 }
    );
  }
}

