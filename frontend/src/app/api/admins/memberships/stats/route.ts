import { createStatsProxyHandler } from "@/lib/server-stats-proxy";

export const GET = createStatsProxyHandler(
  "/api/admins/memberships/stats",
  "/api/staffs/memberships/stats"
);

