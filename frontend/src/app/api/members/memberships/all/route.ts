import { NextRequest } from "next/server";
import { proxyMembershipsRequest } from "@/lib/server-memberships-proxy";

export async function GET(req: NextRequest) {
  return proxyMembershipsRequest(req, "/api/members/memberships/all", []);
}
