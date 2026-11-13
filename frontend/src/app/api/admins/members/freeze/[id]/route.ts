import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    {
      message:
        "Admins and staff can only activate or ban members. Setting status to pending is not permitted.",
    },
    { status: 403 }
  );
}
