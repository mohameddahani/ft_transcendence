import { createDirectStatsProxyHandler } from "@/lib/server-stats-proxy";

export const GET = createDirectStatsProxyHandler("/api/members/payments/stats");

