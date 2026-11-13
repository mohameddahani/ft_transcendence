import { createDirectStatsProxyHandler } from "@/lib/server-stats-proxy";

export const GET = createDirectStatsProxyHandler("/api/staffs/memberships/stats");

