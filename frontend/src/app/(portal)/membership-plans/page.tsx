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
  Zap,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  fetchMembershipPlans,
  updateMembershipPlan,
} from "@/lib/api/membership-plans";
import {
  MembershipPlan,
  MembershipPlanDuration,
} from "@/types/membership-plan";
import CreatePlanModal from "@/components/membership-plans/CreatePlanModal";
import EditPlanModal from "@/components/membership-plans/EditPlanModal";
import DurationModal from "@/components/membership-plans/DurationModal";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
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

  // Status toggle tracker by plan ID
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

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
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Overview & Action Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("membershipPlans") || "Membership Plans"}
              </h1>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {totalPlans} {t("total") || "total"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t("plansSubtitle") ||
                "Create and configure subscription tiers, pricing, and access duration limits."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={loadPlans}
              disabled={isLoading}
              className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
            >
              <RefreshCw
                className={`size-3.5 me-2 ${isLoading ? "animate-spin text-toota-ink" : ""}`}
              />
              <span>{t("refresh") || "Refresh"}</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer"
            >
              <Plus className="size-4 me-1.5" />
              <span>{t("createNewPlan") || "Create New Plan"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Real Live Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Plans */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalPlans") || "Total Plans"}
            </span>
            <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-ink">
              <Layers className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-ink" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {totalPlans}
                </span>
              )}
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                {t("liveFromApi") || "Live"}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("allGymPlans") || "Configured membership tiers"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Active Plans */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("activePlans") || "Active Plans"}
            </span>
            <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-green">
              <CheckCircle2 className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-green" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {activePlansCount}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{totalPlans > 0 ? `${activePercent}%` : "—"}</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("availableForSignup") || "Open for member enrollment"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-green transition-all"
                style={{ width: `${Math.min(100, Math.max(0, activePercent))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Inactive Plans */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("inactivePlans") || "Inactive Plans"}
            </span>
            <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-red">
              <XCircle className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-red" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {inactivePlansCount}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{totalPlans > 0 ? `${inactivePercent}%` : "—"}</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("hiddenOrArchived") || "Hidden from new members"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-red transition-all"
                style={{ width: `${Math.min(100, Math.max(0, inactivePercent))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Total Durations */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("durationsCount") || "Duration Tiers"}
            </span>
            <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-ink">
              <Clock className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-ink" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {totalDurationsCount}
                </span>
              )}
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                {t("options") || "Options"}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("pricingOptionsAcrossPlans") || "Pricing options across all plans"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar Card */}
      <Card className="toota-card border-none p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs (Matching Members Page) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full md:w-auto">
          {[
            { id: "ALL", label: t("allStatuses") || "All Plans", count: totalPlans },
            { id: "ACTIVE", label: t("active") || "Active", count: activePlansCount },
            { id: "INACTIVE", label: t("inactive") || "Inactive", count: inactivePlansCount },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as "ALL" | "ACTIVE" | "INACTIVE")}
                className={`toota-pill h-9 px-3.5 text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                  isSelected
                    ? "active font-bold shadow-xs"
                    : "hover:bg-toota-inner text-toota-muted hover:text-toota-ink"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ms-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-white/20 text-white dark:bg-black/20 dark:text-black font-bold"
                      : "bg-toota-inner text-toota-muted"
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => {
            const isToggling = togglingPlanId === plan.id;
            const durations = plan.membershipPlanDurations || [];

            return (
              <Card
                key={plan.id}
                className="toota-card border-none flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Plan Title & Professional Status Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="size-8 rounded-lg bg-toota-inner flex items-center justify-center text-toota-ink shrink-0">
                          <Layers className="size-4" />
                        </div>
                        <h3 className="text-base font-semibold text-toota-ink truncate">
                          {plan.planName}
                        </h3>
                      </div>
                      <p className="text-xs text-toota-muted line-clamp-2 min-h-[32px]">
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
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
                        {t("durationsAndPricing") || "Durations & Pricing"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDurationPlan(plan);
                          setEditingDuration(null);
                        }}
                        className="text-xs font-semibold text-toota-ink hover:text-toota-green transition-colors cursor-pointer inline-flex items-center gap-1"
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
                        {durations.map((dur) => (
                          <div
                            key={dur.id}
                            className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-toota-inner border border-border/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="size-6 rounded-md bg-toota-card flex items-center justify-center text-toota-muted">
                                <Calendar className="size-3.5" />
                              </div>
                              <span className="text-xs font-medium text-toota-ink">
                                {dur.durationDays} {t("days") || "Days"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-end">
                                <span className="text-sm font-semibold text-toota-ink block leading-tight">
                                  {Number(dur.price).toFixed(2)} MAD
                                </span>
                                {dur.priceByG ? (
                                  <span className="text-[10px] font-medium text-toota-muted block leading-tight">
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
                              >
                                <Edit className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: ID & Edit Plan Button */}
                <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-toota-muted font-mono">
                    ID: {plan.id.slice(0, 8)}...
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingPlan(plan)}
                    className="h-8 px-3 rounded-lg text-xs font-medium cursor-pointer border-border/60 hover:bg-toota-inner"
                  >
                    <Edit className="size-3.5 me-1.5" />
                    <span>{t("editPlan") || "Edit Plan"}</span>
                  </Button>
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
    </div>
  );
}
