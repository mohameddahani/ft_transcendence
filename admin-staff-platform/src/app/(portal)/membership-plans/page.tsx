"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Plus,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Building,
  Check,
  Zap,
  MoreVertical,
  Activity,
  Layers,
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

export default function MembershipPlansPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [durationPlan, setDurationPlan] = useState<MembershipPlan | null>(null);
  const [editingDuration, setEditingDuration] = useState<MembershipPlanDuration | null>(null);

  // Status toggle loading state tracker by plan ID
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMembershipPlans();
      setPlans(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load membership plans from backend");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // Quick toggle active / inactive directly from plan card
  const handleToggleActive = async (plan: MembershipPlan) => {
    const newStatus = !plan.isActive;
    setTogglingPlanId(plan.id);

    try {
      await updateMembershipPlan(plan.id, {
        isActive: newStatus,
      });

      toast.success(
        `Plan "${plan.planName}" is now ${newStatus ? "ACTIVE (Green)" : "INACTIVE (Red)"}`
      );
      await loadPlans();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to update plan status");
      }
    } finally {
      setTogglingPlanId(null);
    }
  };

  // Filtered and searched plans
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

  return (
    <div className="space-y-8 max-w-container-max mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            {t("membershipPlans")}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {t("plansSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadPlans}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant text-on-surface text-sm font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`}
            />
            <span className="hidden sm:inline">{t("refresh")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 primary-gradient text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("createNewPlan")}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Plans */}
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs flex items-center gap-4 transition-all hover:border-primary/30">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">{t("total")}</p>
            <p className="text-2xl font-bold text-on-surface">{totalPlans}</p>
          </div>
        </div>

        {/* Active Plans (Green) */}
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs flex items-center gap-4 transition-all hover:border-emerald-500/30">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">{t("activePlans")}</p>
            <p className="text-2xl font-bold text-emerald-500">{activePlansCount}</p>
          </div>
        </div>

        {/* Inactive Plans (Red) */}
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs flex items-center gap-4 transition-all hover:border-rose-500/30">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">{t("inactive")}</p>
            <p className="text-2xl font-bold text-rose-500">{inactivePlansCount}</p>
          </div>
        </div>

        {/* Duration Options */}
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs flex items-center gap-4 transition-all hover:border-secondary/30">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">{t("durationsCount")}</p>
            <p className="text-2xl font-bold text-on-surface">{totalDurationsCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`${t("search")}...`}
            className="w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary-container outline-none transition-all"
          />
        </div>

        {/* Status Filters with active/inactive indicators */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-outline-variant/60 w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-surface-container-lowest text-on-surface shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t("allStatuses")} ({totalPlans})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-emerald-500/15 text-emerald-500 shadow-xs border border-emerald-500/20"
                : "text-on-surface-variant hover:text-emerald-500"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t("active")} ({activePlansCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("INACTIVE")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "INACTIVE"
                ? "bg-rose-500/15 text-rose-500 shadow-xs border border-rose-500/20"
                : "text-on-surface-variant hover:text-rose-500"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{t("inactive")} ({inactivePlansCount})</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton / Spinner */}
      {isLoading && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-body-md text-on-surface-variant font-medium">
            {t("savingChanges")}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && plans.length === 0 && (
        <div className="p-16 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="font-headline font-bold text-xl text-on-surface">
            {t("noPlansFound")}
          </h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mt-1.5 mb-6">
            {t("plansSubtitle")}
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 primary-gradient text-white font-bold rounded-xl text-sm shadow-lg hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("createNewPlan")}</span>
          </button>
        </div>
      )}

      {/* No matching filter results */}
      {!isLoading && plans.length > 0 && filteredPlans.length === 0 && (
        <div className="p-12 bg-surface-container-lowest rounded-2xl border border-outline-variant text-center">
          <p className="text-sm text-on-surface-variant font-medium">
            {t("noPlansFound")}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
            }}
            className="mt-3 text-xs text-primary font-bold hover:underline cursor-pointer"
          >
            {t("clearFilters")}
          </button>
        </div>
      )}

      {/* Plans Grid with Rich Micro-animations and Red/Green Indicators */}
      {!isLoading && filteredPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const isToggling = togglingPlanId === plan.id;
            const durations = plan.membershipPlanDurations || [];

            return (
              <div
                key={plan.id}
                className={`group flex flex-col justify-between bg-surface-container-lowest rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden relative ${
                  plan.isActive
                    ? "border-outline-variant hover:border-emerald-500/40"
                    : "border-rose-500/30 bg-rose-500/[0.01] hover:border-rose-500/50"
                }`}
              >
                {/* Decorative Top Accent Gradient */}
                <div
                  className={`h-1.5 w-full ${
                    plan.isActive
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : "bg-gradient-to-r from-rose-500 to-red-400"
                  }`}
                />

                <div className="p-6 space-y-5">
                  {/* Card Header: Title, Status Badge (Red/Green), & Edit Action */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-headline font-bold text-xl text-on-surface group-hover:text-primary transition-colors">
                        {plan.planName}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 min-h-[32px]">
                        {plan.description || "—"}
                      </p>
                    </div>

                    {/* Active/Inactive Status Badge (Red / Green) */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(plan)}
                      disabled={isToggling}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                        plan.isActive
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            plan.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                      )}
                      <span>{plan.isActive ? t("active") : t("inactive")}</span>
                    </button>
                  </div>

                  {/* Privileges Badge: Weekly Visit Quota */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      <Zap className="w-3.5 h-3.5" />
                      <span>
                        {plan.weeklyVisitLimit === 7
                          ? t("unlimitedVisits")
                          : `${plan.weeklyVisitLimit} ${t("visitsPerWeek")}`}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-surface-container-low text-on-surface-variant border border-outline-variant">
                      <Clock className="w-3.5 h-3.5 text-secondary" />
                      <span>{durations.length} {t("durationsCount")}</span>
                    </span>
                  </div>

                  {/* Durations & Pricing Section */}
                  <div className="pt-2 border-t border-outline-variant/60">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("durationsCount")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDurationPlan(plan);
                          setEditingDuration(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t("addDuration")}</span>
                      </button>
                    </div>

                    {durations.length === 0 ? (
                      <div className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-dashed border-outline-variant text-center">
                        <p className="text-xs text-on-surface-variant">
                          {t("noPlansFound")}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDurationPlan(plan);
                            setEditingDuration(null);
                          }}
                          className="mt-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          + {t("addDuration")}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {durations.map((dur) => (
                          <div
                            key={dur.id}
                            className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 transition-colors group/item"
                          >
                            <div className="flex items-center gap-2.5">
                              <Calendar className="w-4 h-4 text-secondary" />
                              <span className="text-xs font-bold text-on-surface">
                                {dur.durationDays} {t("days")}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-primary">
                                ${Number(dur.price).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setDurationPlan(plan);
                                  setEditingDuration(dur);
                                }}
                                title={t("editDuration")}
                                className="p-1 hover:bg-surface-container-lowest rounded-lg text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Edit Plan Details Button */}
                <div className="p-4 px-6 bg-surface-container-low/40 border-t border-outline-variant/60 flex items-center justify-between">
                  <span className="text-[11px] text-on-surface-variant font-mono">
                    {t("id")}: {plan.id.slice(0, 8)}...
                  </span>

                  <button
                    type="button"
                    onClick={() => setEditingPlan(plan)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container border border-outline-variant transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-primary" />
                    <span>{t("editPlan")}</span>
                  </button>
                </div>
              </div>
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
