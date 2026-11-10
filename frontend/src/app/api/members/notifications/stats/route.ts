import { createDirectStatsProxyHandler } from "@/lib/server-stats-proxy";

export const GET = createDirectStatsProxyHandler("/api/members/notifications/stats");

