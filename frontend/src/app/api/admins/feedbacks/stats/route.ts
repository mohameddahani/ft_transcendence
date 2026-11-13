import { createStatsProxyHandler } from "@/lib/server-stats-proxy";

export const GET = createStatsProxyHandler(
  "/api/admins/feedbacks/stats",
  "/api/staffs/feedbacks/stats"
);

