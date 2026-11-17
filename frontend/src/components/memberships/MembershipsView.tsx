"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  ShieldCheck,
  Clock,
  Ban,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTranslation } from "react-i18next";
import { Membership, MembershipStatus } from "@/types/membership";
import {
  fetchAdminMemberships,
  fetchStaffMemberships,
  fetchMemberMemberships,
  fetchMemberActiveMembership,
} from "@/lib/api/memberships";
import {
  fetchAdminMembershipStats,
  fetchStaffMembershipStats,
  fetchMemberMembershipStats,
  MembershipStats,
} from "@/lib/api/stats";
import { fetchMembershipPlans } from "@/lib/api/membership-plans";
import MembershipTable from "./MembershipTable";
import MembershipDetailsModal from "./MembershipDetailsModal";
import { MembershipStatusBadge, formatDurationString } from "./MembershipFields";

const PAGE_SIZE = 10;

export default function MembershipsView() {
  const { role, companyName } = useCurrentUser();
  const { t } = useTranslation();

  const isAdmin = role === "Admin";
  const isStaff = role === "Staff";
  const isMember = role === "Member";

  // Data states
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [stats, setStats] = useState<MembershipStats>({
    activeCount: 0,
    expiredCount: 0,
    cancelledCount: 0,
    total: 0,
  });
  const [plans, setPlans] = useState<{ id: string; planName: string }[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

  // Loading & Modal states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Load plans for filter dropdown
  useEffect(() => {
    if (isAdmin || isStaff) {
      fetchMembershipPlans(1, 100)
        .then((data) => {
          if (Array.isArray(data)) {
            setPlans(data.map((p) => ({ id: p.id, planName: p.planName })));
          }
        })
        .catch(() => {});
    }
  }, [isAdmin, isStaff]);

  // Load stats
  const loadStats = useCallback(
    async (force = false) => {
      setIsStatsLoading(true);
      try {
        let res: MembershipStats;
        if (isAdmin) {
          res = await fetchAdminMembershipStats(force);
        } else if (isStaff) {
          res = await fetchStaffMembershipStats(force);
        } else {
          res = await fetchMemberMembershipStats(force);
        }
        if (res) setStats(res);
      } catch {
        // graceful fallback
      } finally {
        setIsStatsLoading(false);
      }
    },
    [isAdmin, isStaff]
  );

  // Load memberships list
  const loadMemberships = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterStatus =
        statusFilter === "ALL" ? undefined : (statusFilter as MembershipStatus);
      const planId = selectedPlanId || undefined;

      // Probe one extra to check if next page exists
      const fetchLimit = PAGE_SIZE + 1;

      let records: Membership[] = [];
      if (isAdmin) {
        records = await fetchAdminMemberships({
          page,
          limit: fetchLimit,
          search: searchQuery,
          membershipStatus: filterStatus,
          membershipPlanId: planId,
        });
      } else if (isStaff) {
        records = await fetchStaffMemberships({
          page,
          limit: fetchLimit,
          search: searchQuery,
          membershipStatus: filterStatus,
          membershipPlanId: planId,
        });
      } else {
        records = await fetchMemberMemberships({
          page,
          limit: fetchLimit,
          membershipStatus: filterStatus,
          membershipPlanId: planId,
        });
      }

      if (records.length > PAGE_SIZE) {
        setHasNextPage(true);
        setMemberships(records.slice(0, PAGE_SIZE));
      } else {
        setHasNextPage(false);
        setMemberships(records);
      }
    } catch {
      setMemberships([]);
      setHasNextPage(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isStaff, page, searchQuery, statusFilter, selectedPlanId]);

  // Load member active membership if member
  useEffect(() => {
    if (isMember) {
      fetchMemberActiveMembership()
        .then((data) => setActiveMembership(data))
        .catch(() => {});
    }
  }, [isMember]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  // Plan options fallback from loaded records if plans catalog failed
  const availablePlanOptions = useMemo(() => {
    if (plans.length > 0) return plans;
    const map = new Map<string, string>();
    memberships.forEach((m) => {
      if (m.membershipPlan?.id && m.membershipPlan?.planName) {
        map.set(m.membershipPlan.id, m.membershipPlan.planName);
      }
    });
    return Array.from(map.entries()).map(([id, planName]) => ({ id, planName }));
  }, [plans, memberships]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setSelectedPlanId("");
    setSearchQuery("");
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "ALL" || Boolean(selectedPlanId) || Boolean(searchQuery.trim());

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-16 @container/memberships">
      {/* Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("membershipsTitle", "Memberships")}
              </h1>
              {companyName && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {companyName}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {isMember
                ? t(
                    "memberMembershipsSubtitle",
                    "View your active membership privileges and past subscription history."
                  )
                : t(
                    "membershipsSubtitle",
                    "Manage member subscriptions, track active tiers, and oversee expiration rosters."
                  )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                loadStats(true);
                loadMemberships();
              }}
              className="toota-pill h-9 px-3.5 text-xs font-semibold border-border/60 hover:bg-toota-inner text-toota-ink cursor-pointer"
            >
              <RefreshCw
                className={`size-3.5 me-1.5 ${isLoading || isStatsLoading ? "animate-spin" : ""}`}
              />
              <span>{t("refresh", "Refresh")}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Member Active Membership Spotlight Card */}
      {isMember && activeMembership && (
        <Card className="toota-card border-none p-5 bg-card text-toota-ink">
          <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-toota-lime" />
              <h2 className="text-sm font-semibold text-toota-ink">
                {t("currentActiveMembership", "Current Active Membership")}
              </h2>
            </div>
            <MembershipStatusBadge status={activeMembership.membershipStatus} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-3.5 rounded-xl bg-toota-inner space-y-1">
              <span className="text-[11px] text-toota-muted uppercase font-semibold block">
                {t("plan", "Plan")}
              </span>
              <span className="font-bold text-sm text-toota-ink block">
                {activeMembership.membershipPlan?.planName}
              </span>
              <span className="text-xs text-toota-muted flex items-center gap-1">
                <Zap className="size-3 text-toota-muted" />
                {activeMembership.membershipPlan?.weeklyVisitLimit !== undefined
                  ? `${activeMembership.membershipPlan.weeklyVisitLimit} ${t("visitsPerWeek", "visits/week")}`
                  : "—"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-toota-inner space-y-1">
              <span className="text-[11px] text-toota-muted uppercase font-semibold block">
                {t("duration", "Duration")}
              </span>
              <span className="font-bold text-sm text-toota-ink block">
                {formatDurationString(activeMembership.membershipPlanDuration)}
              </span>
              <span className="text-xs text-toota-muted">
                {t("standardScheduleInEffect", "Active cycle")}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-toota-inner space-y-1">
              <span className="text-[11px] text-toota-muted uppercase font-semibold block">
                {t("expiresAt", "Expiration Date")}
              </span>
              <span className="font-mono font-bold text-sm text-toota-ink block">
                {activeMembership.expiresAt
                  ? new Date(activeMembership.expiresAt).toLocaleDateString()
                  : "—"}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {t("facilityOpenActive", "Open for Training")}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* KPI Stats Command Center with 4 Lucide Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <Card className="toota-card border-none p-5 flex flex-col justify-between bg-card text-toota-ink">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalMemberships", "Total Memberships")}
            </span>
            <div className="size-9 rounded-xl bg-toota-inner flex items-center justify-center text-toota-ink shadow-xs">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <span className="text-2xl font-bold tracking-tight text-toota-ink font-mono tabular-nums">
              {stats.total}
            </span>
            <p className="text-xs text-toota-muted mt-1">
              {t("allRecordedMemberships", "All recorded memberships")}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Active */}
        <Card className="toota-card border-none p-5 flex flex-col justify-between bg-card text-toota-ink">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("activeMemberships", "Active")}
            </span>
            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <ShieldCheck className="size-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {stats.activeCount}
            </span>
            <p className="text-xs text-toota-muted mt-1">
              {t("currentlyActiveSubscriptions", "Currently active access")}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Expired */}
        <Card className="toota-card border-none p-5 flex flex-col justify-between bg-card text-toota-ink">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("expiredMemberships", "Expired")}
            </span>
            <div className="size-9 rounded-xl bg-zinc-500/10 text-zinc-500 flex items-center justify-center shadow-xs">
              <Clock className="size-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <span className="text-2xl font-bold tracking-tight text-toota-ink font-mono tabular-nums">
              {stats.expiredCount}
            </span>
            <p className="text-xs text-toota-muted mt-1">
              {t("elapsedCycles", "Elapsed cycles")}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Cancelled */}
        <Card className="toota-card border-none p-5 flex flex-col justify-between bg-card text-toota-ink">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("cancelledMemberships", "Cancelled")}
            </span>
            <div className="size-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-xs">
              <Ban className="size-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono tabular-nums">
              {stats.cancelledCount}
            </span>
            <p className="text-xs text-toota-muted mt-1">
              {t("terminatedEarly", "Terminated early")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="toota-card border-none p-4 bg-card text-toota-ink space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-toota-inner overflow-x-auto flex-wrap">
            {[
              { key: "ALL", label: t("all", "All"), count: stats.total },
              { key: "ACTIVE", label: t("active", "Active"), count: stats.activeCount },
              { key: "EXPIRED", label: t("expired", "Expired"), count: stats.expiredCount },
              { key: "CANCELLED", label: t("cancelled", "Cancelled"), count: stats.cancelledCount },
            ].map((tab) => {
              const isSelected = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleStatusFilterChange(tab.key)}
                  aria-pressed={isSelected}
                  className={`toota-pill h-8 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-toota-ink text-toota-main shadow-xs"
                      : "text-toota-muted hover:text-toota-ink hover:bg-toota-card/50"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                      isSelected
                        ? "bg-toota-main/20 text-toota-main"
                        : "bg-toota-inner text-toota-muted dark:bg-white/10 dark:text-toota-ink"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input (Admin/Staff) & Plan Dropdown */}
          <div className="flex items-center gap-2 flex-1 md:max-w-lg">
            {!isMember && (
              <div className="relative flex-1">
                <Search className="size-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
                <Input
                  type="text"
                  placeholder={
                    t("searchMembershipsPlaceholder") ||
                    "Search by member name or username..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-full bg-toota-inner border-border/40 ps-10 pe-4 text-xs text-toota-ink placeholder:text-toota-muted focus-visible:ring-1 focus-visible:ring-toota-lime"
                />
              </div>
            )}

            {/* Plan Selector */}
            {availablePlanOptions.length > 0 && (
              <div className="relative shrink-0">
                <select
                  value={selectedPlanId}
                  onChange={(e) => {
                    setSelectedPlanId(e.target.value);
                    setPage(1);
                  }}
                  aria-label={t("filterByPlan", "Filter by Plan")}
                  className="h-10 px-3.5 rounded-full bg-toota-inner border border-border/40 text-xs font-medium text-toota-ink focus:outline-hidden focus:ring-1 focus:ring-toota-lime cursor-pointer"
                >
                  <option value="">{t("allPlans", "All Plans")}</option>
                  {availablePlanOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.planName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="toota-pill h-10 px-3 text-xs text-toota-muted hover:text-toota-ink hover:bg-toota-inner cursor-pointer shrink-0"
              >
                <span>{t("resetFilters", "Reset")}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Table / Cards */}
      <MembershipTable
        memberships={memberships}
        isLoading={isLoading}
        onSelectMembership={(item) => {
          setSelectedMembership(item);
          setIsDetailModalOpen(true);
        }}
        isMemberRole={isMember}
      />

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-toota-muted font-mono">
          {t("pageNumber", { page })}
        </span>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="toota-pill h-8 px-3 text-xs font-semibold border-border/60 hover:bg-toota-inner text-toota-ink cursor-pointer disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5 me-1 rtl:rotate-180" />
            <span>{t("previous", "Previous")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasNextPage || isLoading}
            onClick={() => setPage((p) => p + 1)}
            className="toota-pill h-8 px-3 text-xs font-semibold border-border/60 hover:bg-toota-inner text-toota-ink cursor-pointer disabled:opacity-40"
          >
            <span>{t("next", "Next")}</span>
            <ChevronRight className="size-3.5 ms-1 rtl:rotate-180" />
          </Button>
        </div>
      </div>

      {/* Details Modal */}
      <MembershipDetailsModal
        membership={selectedMembership}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMembership(null);
        }}
      />
    </div>
  );
}
