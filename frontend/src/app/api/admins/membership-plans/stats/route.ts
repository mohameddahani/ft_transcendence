import { createStatsProxyHandler } from "@/lib/server-stats-proxy";

export const GET = createStatsProxyHandler(
  "/api/admins/membership-plans/stats",
  "/api/staffs/membership-plans/stats"
);

