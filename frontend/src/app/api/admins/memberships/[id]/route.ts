import { NextRequest } from "next/server";
import { proxyMembershipsRequest } from "@/lib/server-memberships-proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyMembershipsRequest(req, `/api/admins/memberships/${id}`, null);
}

