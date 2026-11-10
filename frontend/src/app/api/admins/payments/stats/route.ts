import { createStatsProxyHandler } from "@/lib/server-stats-proxy";

export const GET = createStatsProxyHandler(
  "/api/admins/payments/stats",
  "/api/staffs/payments/stats"
);

