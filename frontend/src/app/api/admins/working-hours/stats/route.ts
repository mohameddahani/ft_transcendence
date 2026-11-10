import { createStatsProxyHandler } from "@/lib/server-stats-proxy";

export const GET = createStatsProxyHandler(
  "/api/admins/working-hours/stats",
  "/api/staffs/working-hours/stats"
);

