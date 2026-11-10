import { createStatsProxyHandler } from "@/lib/server-stats-proxy";

export const GET = createStatsProxyHandler(
  "/api/admins/visits/stats",
  "/api/staffs/visits/stats"
);

