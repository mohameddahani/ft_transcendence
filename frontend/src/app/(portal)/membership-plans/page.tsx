"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Zap,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  fetchMembershipPlans,
  updateMembershipPlan,
  deleteMembershipPlan,
  deleteMembershipPlanDuration,
  toggleMembershipPlanDurationActive,
} from "@/lib/api/membership-plans";
import {
  MembershipPlan,
  MembershipPlanDuration,
} from "@/types/membership-plan";
import CreatePlanModal from "@/components/membership-plans/CreatePlanModal";
import EditPlanModal from "@/components/membership-plans/EditPlanModal";
import DurationModal from "@/components/membership-plans/DurationModal";
import DeletePlanModal from "@/components/membership-plans/DeletePlanModal";
import DeleteDurationModal from "@/components/membership-plans/DeleteDurationModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MembershipPlansPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [durationPlan, setDurationPlan] = useState<MembershipPlan | null>(null);
  const [editingDuration, setEditingDuration] = useState<MembershipPlanDuration | null>(null);

  // Delete state
  const [planToDelete, setPlanToDelete] = useState<MembershipPlan | null>(null);
  const [durationToDelete, setDurationToDelete] = useState<{
    plan: MembershipPlan;
    duration: MembershipPlanDuration;
  } | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [isDeletingDuration, setIsDeletingDuration] = useState(false);

  // Status toggle tracker by plan ID & duration ID
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);
  const [togglingDurationId, setTogglingDurationId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchMembershipPlans();
      setPlans(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(
          t("plansLoadFailed", {
            defaultValue: "Failed to load membership plans from backend",
          })
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Quick toggle active / inactive directly from plan card
  const handleToggleActive = async (plan: MembershipPlan) => {
    const newStatus = !plan.isActive;
    setTogglingPlanId(plan.id);

    try {
      await updateMembershipPlan(plan.id, {
        isActive: newStatus,
      });

      // Optimistically update local state
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: newStatus } : p))
      );

      toast.success(
        t("planStatusUpdated", {
          defaultValue: `Plan "${plan.planName}" is now ${newStatus ? "Active" : "Inactive"}`,
          name: plan.planName,
          status: newStatus ? "Active" : "Inactive",
        })
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(
          t("planStatusUpdateFailed", {
            defaultValue: "Failed to update plan status",
          })
        );
      }
      await loadPlans();
    } finally {
      setTogglingPlanId(null);
    }
  };

  // Quick toggle active / inactive directly on duration
  const handleToggleDurationActive = async (
    plan: MembershipPlan,
    dur: MembershipPlanDuration
  ) => {
    const newActive = dur.isActive === false; // If currently false -> activate (true), else deactivate (false)
    setTogglingDurationId(dur.id);

    try {
      await toggleMembershipPlanDurationActive(dur.id, plan.id, newActive);

      // Optimistically update local state
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== plan.id) return p;
          return {
            ...p,
            membershipPlanDurations: (p.membershipPlanDurations || []).map((d) =>
              d.id === dur.id ? { ...d, isActive: newActive } : d
            ),
          };
        })
      );

      toast.success(
        t("durationStatusUpdated", {
          defaultValue: `${dur.durationDays}-day duration is now ${newActive ? "Active" : "Inactive"}`,
        })
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(
          t("durationStatusUpdateFailed", {
            defaultValue: "Failed to update duration status",
          })
        );
      }
      await loadPlans();
    } finally {
      setTogglingDurationId(null);
    }
  };

  // Delete Plan
  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    setIsDeletingPlan(true);

    try {
      await deleteMembershipPlan(planToDelete.id);
      toast.success(
        t("planDeletedSuccess", {
          defaultValue: `Plan "${planToDelete.planName}" deleted successfully!`,
        })
      );
      setPlanToDelete(null);
      await loadPlans();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(
          t("planDeleteFailed", {
            defaultValue: "Failed to delete membership plan",
          })
        );
      }
    } finally {
      setIsDeletingPlan(false);
    }
  };

  // Delete Duration
  const handleDeleteDuration = async () => {
    if (!durationToDelete) return;
    setIsDeletingDuration(true);

    try {
      await deleteMembershipPlanDuration(durationToDelete.duration.id);
      toast.success(
        t("durationDeletedSuccess", {
          defaultValue: `${durationToDelete.duration.durationDays}-day duration deleted successfully!`,
        })
      );
      setDurationToDelete(null);
      await loadPlans();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(
          t("durationDeleteFailed", {
            defaultValue: "Failed to delete plan duration",
          })
        );
      }
    } finally {
      setIsDeletingDuration(false);
    }
  };

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch =
        plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.description || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && plan.isActive) ||
        (statusFilter === "INACTIVE" && !plan.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [plans, searchTerm, statusFilter]);

  // Statistics calculation
  const totalPlans = plans.length;
  const activePlansCount = plans.filter((p) => p.isActive).length;
  const inactivePlansCount = totalPlans - activePlansCount;
  const totalDurationsCount = plans.reduce(
    (acc, p) => acc + (p.membershipPlanDurations?.length || 0),
    0
  );

  const activePercent =
    totalPlans > 0 ? Math.round((activePlansCount / totalPlans) * 100) : 0;
  const inactivePercent =
    totalPlans > 0 ? Math.round((inactivePlansCount / totalPlans) * 100) : 0;

  return (
    <div className="@container/plans flex w-full min-w-0 flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Overview & Action Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-toota-inner flex items-center justify-center text-toota-ink shrink-0">
              <Layers className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-toota-ink">
                  {t("navMembershipPlans") || "Membership Plans"}
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-toota-inner text-toota-muted">
                  {totalPlans} {totalPlans === 1 ? t("planTier") || "Tier" : t("planTiers") || "Tiers"}
                </span>
              </div>
              <p className="text-xs text-toota-muted mt-0.5">
                {t("plansSubtitle") ||
                  "Configure membership tiers, duration options, weekly visit quotas, and pricing."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadPlans}
              disabled={isLoading}
              className="toota-pill h-9 px-3.5 text-xs font-semibold border-border/50 text-toota-ink hover:bg-toota-inner cursor-pointer"
            >
              <RefreshCw className={`size-3.5 me-2 ${isLoading ? "animate-spin" : ""}`} />
              <span>{t("refresh") || "Refresh"}</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer bg-toota-side text-white hover:bg-black transition-all shadow-sm"
            >
              <Plus className="size-3.5 me-2" />
              <span>{t("createNewPlan") || "Create New Plan"}</span>
            </Button>
          </div>
        </div>

        {/* Metric Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-border/40">
          <div className="p-3.5 rounded-xl bg-toota-inner">
            <span className="text-[11px] font-semibold text-toota-muted uppercase tracking-wider block">
              {t("totalPlans") || "Total Plans"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-toota-ink">{totalPlans}</span>
              <span className="text-[11px] text-toota-muted">{t("tiersAvailable") || "tiers"}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-toota-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-toota-muted uppercase tracking-wider">
                {t("activePlans") || "Active Plans"}
              </span>
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-toota-ink">{activePlansCount}</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {activePercent}%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-toota-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-toota-muted uppercase tracking-wider">
                {t("inactivePlans") || "Inactive Plans"}
              </span>
              <XCircle className="size-3.5 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-toota-ink">{inactivePlansCount}</span>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                {inactivePercent}%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-toota-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-toota-muted uppercase tracking-wider">
                {t("durationOptions") || "Durations"}
              </span>
              <Clock className="size-3.5 text-toota-muted" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-toota-ink">{totalDurationsCount}</span>
              <span className="text-[11px] text-toota-muted">{t("pricingOptions") || "pricing tiers"}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <Card className="toota-card border-none flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Segment */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-toota-inner w-full md:w-auto">
          {(
            [
              { key: "ALL", label: t("all") || "All", count: totalPlans },
              { key: "ACTIVE", label: t("active") || "Active", count: activePlansCount },
              { key: "INACTIVE", label: t("inactive") || "Inactive", count: inactivePlansCount },
            ] as const
          ).map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`flex-1 md:flex-none h-8 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  isSelected
                    ? "bg-toota-side text-white shadow-2xs"
                    : "text-toota-muted hover:text-toota-ink hover:bg-toota-card/50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] tabular-nums ${
                    isSelected
                      ? "bg-white/20 text-white font-bold"
                      : "bg-toota-inner text-toota-muted dark:bg-white/10 dark:text-toota-ink"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Control */}
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="size-4 text-toota-muted absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder={t("searchPlansPlaceholder") || "Search plans by name or description..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 rounded-full bg-toota-inner border-border/40 ps-10 pe-4 text-xs text-toota-ink placeholder:text-toota-muted focus-visible:ring-1 focus-visible:ring-[#a3e635] focus-visible:border-[#a3e635] transition-all"
          />
        </div>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && plans.length === 0 && (
        <div className="grid grid-cols-1 @min-[48rem]/plans:grid-cols-2 @min-[78rem]/plans:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="toota-card border-none h-72 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State (No plans in backend) */}
      {!isLoading && plans.length === 0 && (
        <Card className="toota-card border-none p-12 text-center flex flex-col items-center justify-center">
          <div className="size-14 rounded-2xl bg-toota-inner flex items-center justify-center text-toota-ink mb-4">
            <Layers className="size-7" />
          </div>
          <h2 className="text-lg font-semibold text-toota-ink">
            {t("noPlansFound") || "No membership plans found"}
          </h2>
          <p className="text-xs sm:text-sm text-toota-muted max-w-md mt-1 mb-6">
            {t("plansSubtitle") ||
              "Create your first subscription plan to start enrolling members with custom pricing tiers and access durations."}
          </p>
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-4 rounded-lg text-xs font-semibold cursor-pointer bg-toota-side text-white hover:bg-black"
          >
            <Plus className="size-3.5 me-2" />
            <span>{t("createNewPlan") || "Create New Plan"}</span>
          </Button>
        </Card>
      )}

      {/* Filtered 0-Result State */}
      {!isLoading && plans.length > 0 && filteredPlans.length === 0 && (
        <Card className="toota-card border-none p-12 text-center">
          <p className="text-sm font-medium text-toota-ink">
            {t("noMatchingPlans") || "No matching membership plans found"}
          </p>
          <p className="text-xs text-toota-muted mt-1">
            {t("tryAdjustingFilters") || "Try adjusting your search query or status filter."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
            }}
            className="h-8 px-3 rounded-lg text-xs font-medium cursor-pointer mt-4 border-border/50 hover:bg-toota-inner"
          >
            {t("clearFilters") || "Clear Filters"}
          </Button>
        </Card>
      )}

      {/* Plan Cards Grid */}
      {!isLoading && filteredPlans.length > 0 && (
        <div className="grid grid-cols-1 @min-[48rem]/plans:grid-cols-2 @min-[78rem]/plans:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => {
            const isToggling = togglingPlanId === plan.id;
            const durations = plan.membershipPlanDurations || [];

            return (
              <Card
                key={plan.id}
                className="toota-card min-w-0 border-none flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Plan Title & Professional Status Button */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 basis-40">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="size-8 rounded-lg bg-toota-inner flex items-center justify-center text-toota-ink shrink-0">
                          <Layers className="size-4" />
                        </div>
                        <h3 className="min-w-0 text-base font-semibold text-toota-ink [overflow-wrap:anywhere]">
                          {plan.planName}
                        </h3>
                      </div>
                      <p className="text-xs text-toota-muted line-clamp-2 min-h-[32px] [overflow-wrap:anywhere]">
                        {plan.description || "—"}
                      </p>
                    </div>

                    {/* Status Button: Crisp Outlined Micro-Badge */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(plan)}
                      disabled={isToggling}
                      title={
                        plan.isActive
                          ? (t("deactivatePlan") || "Click to deactivate plan")
                          : (t("activatePlan") || "Click to activate plan")
                      }
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 cursor-pointer transition-all shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${
                        plan.isActive
                          ? "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="size-3 animate-spin shrink-0" />
                      ) : (
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            plan.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                      )}
                      <span>
                        {plan.isActive ? (t("active") || "Active") : (t("inactive") || "Inactive")}
                      </span>
                    </button>
                  </div>

                  {/* Quotas & Badges Bar */}
                  <div className="flex items-center gap-2 flex-wrap pt-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                      <Zap className="size-3 text-zinc-500 shrink-0" />
                      <span>
                        {plan.weeklyVisitLimit === 7
                          ? (t("unlimitedVisits") || "Unlimited Visits")
                          : `${plan.weeklyVisitLimit} ${t("visitsPerWeek") || "Visits / Week"}`}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                      <Clock className="size-3 text-zinc-400 shrink-0" />
                      <span>
                        {durations.length}{" "}
                        {durations.length === 1
                          ? (t("durationOption") || "Duration")
                          : (t("durationOptions") || "Durations")}
                      </span>
                    </span>
                  </div>

                  {/* Durations & Pricing Container */}
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
                        {t("durationsAndPricing") || "Durations & Pricing"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDurationPlan(plan);
                          setEditingDuration(null);
                        }}
                        className="text-xs font-semibold text-toota-ink hover:text-toota-green transition-colors cursor-pointer inline-flex shrink-0 items-center gap-1"
                      >
                        <Plus className="size-3.5" />
                        <span>{t("addDuration") || "Add Duration"}</span>
                      </button>
                    </div>

                    {durations.length === 0 ? (
                      <div className="p-4 rounded-xl bg-toota-inner border border-dashed border-border/60 text-center">
                        <p className="text-xs text-toota-muted">
                          {t("noDurationsConfigured") || "No duration options configured yet."}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDurationPlan(plan);
                            setEditingDuration(null);
                          }}
                          className="mt-2 text-xs font-semibold text-toota-ink hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="size-3.5" />
                          <span>{t("addFirstDuration") || "Add first duration"}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {durations.map((dur) => {
                          const isDurActive = dur.isActive !== false;
                          const isTogglingDur = togglingDurationId === dur.id;

                          return (
                            <div
                              key={dur.id}
                              className="flex min-w-0 flex-wrap items-center justify-between gap-3 p-2.5 px-3 rounded-xl bg-toota-inner border border-border/40 transition-colors"
                            >
                              <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2.5">
                                <div className="size-6 rounded-md bg-toota-card flex items-center justify-center text-toota-muted shrink-0">
                                  <Calendar className="size-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-medium text-toota-ink block [overflow-wrap:anywhere]">
                                    {dur.durationDays} {t("days") || "Days"}
                                  </span>
                                </div>

                                {/* Active / Inactive Duration Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleDurationActive(plan, dur)}
                                  disabled={isTogglingDur}
                                  title={
                                    isDurActive
                                      ? t("deactivateDuration") || "Click to deactivate duration"
                                      : t("activateDuration") || "Click to activate duration"
                                  }
                                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium cursor-pointer transition-all border shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${
                                    isDurActive
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                                  }`}
                                >
                                  {isTogglingDur ? (
                                    <Loader2 className="size-2.5 animate-spin shrink-0" />
                                  ) : (
                                    <span
                                      className={`size-1.5 rounded-full shrink-0 ${
                                        isDurActive ? "bg-emerald-500" : "bg-rose-500"
                                      }`}
                                    />
                                  )}
                                  <span>
                                    {isDurActive ? (t("active") || "Active") : (t("inactive") || "Inactive")}
                                  </span>
                                </button>
                              </div>

                              <div className="ms-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
                                <div className="min-w-0 max-w-full text-end">
                                  <span className="text-sm font-semibold text-toota-ink block leading-tight [overflow-wrap:anywhere]">
                                    {Number(dur.price).toFixed(2)} MAD
                                  </span>
                                  {dur.priceByG ? (
                                    <span className="text-[10px] font-medium text-toota-muted block leading-tight [overflow-wrap:anywhere]">
                                      {dur.priceByG} G
                                    </span>
                                  ) : null}
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setDurationPlan(plan);
                                    setEditingDuration(dur);
                                  }}
                                  className="size-7 rounded-md text-toota-muted hover:text-toota-ink hover:bg-toota-card cursor-pointer"
                                  title={t("editDuration") || "Edit duration"}
                                >
                                  <Edit className="size-3.5" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setDurationToDelete({ plan, duration: dur })
                                  }
                                  className="size-7 rounded-md text-toota-muted hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                  title={t("deleteDuration") || "Delete duration"}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: ID & Edit / Delete Plan Buttons */}
                <div className="mt-5 pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-toota-muted font-mono truncate">
                    ID: {plan.id.slice(0, 8)}...
                  </span>

                  <div className="ms-auto flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingPlan(plan)}
                      className="h-8 px-3 rounded-lg text-xs font-medium cursor-pointer border-border/60 hover:bg-toota-inner"
                    >
                      <Edit className="size-3.5 me-1.5" />
                      <span>{t("editPlan") || "Edit"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPlanToDelete(plan)}
                      className="h-8 px-2.5 rounded-lg text-xs font-medium cursor-pointer border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50"
                      title={t("deletePlan") || "Delete Plan"}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreatePlanModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadPlans}
      />

      <EditPlanModal
        plan={editingPlan}
        isOpen={Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        onSuccess={loadPlans}
      />

      <DurationModal
        plan={durationPlan}
        durationToEdit={editingDuration}
        isOpen={Boolean(durationPlan)}
        onClose={() => {
          setDurationPlan(null);
          setEditingDuration(null);
        }}
        onSuccess={loadPlans}
      />

      <DeletePlanModal
        isOpen={Boolean(planToDelete)}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeletePlan}
        isDeleting={isDeletingPlan}
        plan={planToDelete}
      />

      <DeleteDurationModal
        isOpen={Boolean(durationToDelete)}
        onClose={() => setDurationToDelete(null)}
        onConfirm={handleDeleteDuration}
        isDeleting={isDeletingDuration}
        plan={durationToDelete?.plan || null}
        duration={durationToDelete?.duration || null}
      />
    </div>
  );
}
