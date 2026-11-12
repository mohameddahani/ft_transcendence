"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  Edit2,
  RefreshCw,
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { PlatformPlan, PlanDuration } from "@/types/plan";
import AddPlanModal from "./AddPlanModal";
import EditPlanModal from "./EditPlanModal";
import AddDurationModal from "./AddDurationModal";
import EditDurationModal from "./EditDurationModal";
import DeletePlanModal from "./DeletePlanModal";
import DeleteDurationModal from "./DeleteDurationModal";
import AnimatedCounter from "./AnimatedCounter";
import { cn } from "@/lib/utils";

export default function PlansDashboard() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [editPlanModalPlan, setEditPlanModalPlan] = useState<PlatformPlan | null>(null);
  const [durationModalPlan, setDurationModalPlan] = useState<PlatformPlan | null>(null);
  const [editDurationState, setEditDurationState] = useState<{
    plan: PlatformPlan;
    duration: PlanDuration;
  } | null>(null);

  // Delete state
  const [planToDelete, setPlanToDelete] = useState<PlatformPlan | null>(null);
  const [durationToDelete, setDurationToDelete] = useState<{
    plan: PlatformPlan;
    duration: PlanDuration;
  } | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [isDeletingDuration, setIsDeletingDuration] = useState(false);

  // Toggling state
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);
  const [togglingDurationId, setTogglingDurationId] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("NAME");

  // Fetch plans from backend API
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ plans: PlatformPlan[]; total: number }>(
        "/api/plans?page=1&limit=50"
      );
      if (response.data && Array.isArray(response.data.plans)) {
        setPlans(response.data.plans);
      } else if (Array.isArray(response.data)) {
        setPlans(response.data);
      } else {
        setPlans([]);
      }
    } catch {
      setError("Unable to load platform plans. Please check backend connection.");
      toast.error("Failed to load platform plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      if (!ignore) {
        void fetchPlans();
      }
    });
    return () => {
      ignore = true;
    };
  }, [fetchPlans]);

  // Toggle plan active status
  const handleToggleStatus = async (plan: PlatformPlan) => {
    if (togglingPlanId) return;
    setTogglingPlanId(plan.id);

    const newStatus = !plan.isActive;
    try {
      await api.patch(`/api/plans/${plan.id}`, { isActive: newStatus });
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: newStatus } : p))
      );
      toast.success(
        `Plan "${plan.planName}" is now ${newStatus ? "ACTIVE" : "INACTIVE"}`
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not update plan status.";
      toast.error(msg);
      void fetchPlans();
    } finally {
      setTogglingPlanId(null);
    }
  };

  // Toggle duration active status
  const handleToggleDurationStatus = async (
    plan: PlatformPlan,
    duration: PlanDuration
  ) => {
    if (togglingDurationId) return;
    setTogglingDurationId(duration.id);

    const newStatus = duration.isActive === false; // If false -> activate (true), else deactivate (false)
    try {
      await api.patch(`/api/plans/durations/${duration.id}`, {
        planId: plan.id,
        isActive: newStatus,
      });

      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== plan.id) return p;
          return {
            ...p,
            durations: (p.durations || []).map((d) =>
              d.id === duration.id ? { ...d, isActive: newStatus } : d
            ),
          };
        })
      );

      toast.success(
        `${duration.durationDays}-day duration is now ${newStatus ? "ACTIVE" : "INACTIVE"}`
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not update duration status.";
      toast.error(msg);
      void fetchPlans();
    } finally {
      setTogglingDurationId(null);
    }
  };

  // Delete Plan
  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    setIsDeletingPlan(true);

    try {
      await api.delete(`/api/plans/${planToDelete.id}`);
      toast.success(`Plan "${planToDelete.planName}" deleted successfully!`);
      setPlanToDelete(null);
      await fetchPlans();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not delete plan.";
      toast.error(msg);
    } finally {
      setIsDeletingPlan(false);
    }
  };

  // Delete Duration
  const handleDeleteDuration = async () => {
    if (!durationToDelete) return;
    setIsDeletingDuration(true);

    try {
      await api.delete(`/api/plans/durations/${durationToDelete.duration.id}`);
      toast.success(
        `${durationToDelete.duration.durationDays}-day duration deleted successfully!`
      );
      setDurationToDelete(null);
      await fetchPlans();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not delete duration.";
      toast.error(msg);
    } finally {
      setIsDeletingDuration(false);
    }
  };

  // Filtered and sorted plans
  const filteredPlans = useMemo(() => {
    return plans
      .filter((plan) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          plan.planName.toLowerCase().includes(query) ||
          (plan.description && plan.description.toLowerCase().includes(query));

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && plan.isActive) ||
          (statusFilter === "INACTIVE" && !plan.isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "NAME") {
          return a.planName.localeCompare(b.planName);
        }
        if (sortBy === "MEMBERS") {
          return b.maxMembers - a.maxMembers;
        }
        if (sortBy === "PRICE") {
          const minPriceA =
            a.durations && a.durations.length > 0
              ? Math.min(...a.durations.map((d) => Number(d.price)))
              : 0;
          const minPriceB =
            b.durations && b.durations.length > 0
              ? Math.min(...b.durations.map((d) => Number(d.price)))
              : 0;
          return minPriceB - minPriceA;
        }
        return 0;
      });
  }, [plans, searchTerm, statusFilter, sortBy]);

  // System Stats
  const stats = useMemo(() => {
    const totalActive = plans.filter((p) => p.isActive).length;
    const totalInactive = plans.filter((p) => !p.isActive).length;
    const topTier = [...plans].sort((a, b) => b.maxMembers - a.maxMembers)[0]?.planName || "—";
    const totalDurations = plans.reduce(
      (acc, p) => acc + (p.durations ? p.durations.length : 0),
      0
    );
    return { totalActive, totalInactive, topTier, totalDurations };
  }, [plans]);

  return (
    <div className="space-y-layout-margin pb-12">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low border border-outline-variant p-layout-margin rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-title-lg sm:text-headline-lg text-on-surface font-bold tracking-tight">
              Subscription Plans
            </h1>
            <span className="bg-primary/10 text-primary text-label-sm font-semibold px-2 py-0.5 rounded-full border border-primary/20">
              {plans.length} Tiers
            </span>
          </div>
          <p className="font-body-md text-body-sm sm:text-body-md text-on-surface-variant mt-1">
            Configure pricing tiers, member thresholds, and platform billing cycles.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => void fetchPlans()}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface rounded-lg transition-colors font-body-sm text-body-sm font-medium cursor-pointer"
            title="Refresh plans list"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddPlanOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg transition-colors font-body-sm text-body-sm font-semibold cursor-pointer shadow-sm"
          >
            <Plus className="size-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search plans by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-9 pr-4 py-2 text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex bg-surface-container-low border border-outline-variant rounded-lg p-1">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1 rounded text-body-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer",
                  statusFilter === status
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant rounded-lg px-2.5 py-1">
            <Filter className="size-3.5 text-on-surface-variant" />
            <span className="text-[11px] text-on-surface-variant font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-body-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="NAME" className="bg-surface-container text-on-surface">
                Name (A-Z)
              </option>
              <option value="MEMBERS" className="bg-surface-container text-on-surface">
                Capacity (High-Low)
              </option>
              <option value="PRICE" className="bg-surface-container text-on-surface">
                Price (High-Low)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 shrink-0" />
            <span className="text-body-sm font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchPlans()}
            className="text-body-sm underline hover:text-rose-300 font-semibold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && plans.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-container-padding">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-surface-container-low border border-outline-variant h-64 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && plans.length === 0 && !error && (
        <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="size-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary mb-3">
            <Package className="size-6" />
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            No Platform Plans Found
          </h2>
          <p className="font-body-md text-body-sm text-on-surface-variant max-w-sm mt-1 mb-6">
            Get started by defining your first subscription tier with membership quotas and pricing.
          </p>
          <button
            type="button"
            onClick={() => setIsAddPlanOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg transition-colors font-body-sm text-body-sm font-semibold cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Create First Plan</span>
          </button>
        </div>
      )}

      {/* Filtered 0-Result State */}
      {!loading && plans.length > 0 && filteredPlans.length === 0 && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-8 text-center">
          <p className="font-body-md text-body-md text-on-surface font-medium">
            No plans match your current search or filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
            }}
            className="mt-3 text-body-sm text-primary hover:underline font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Plans Grid */}
      {!loading && filteredPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-container-padding">
          {filteredPlans.map((plan) => {
            const durations = plan.durations || [];

            return (
              <div
                key={plan.id}
                className={cn(
                  "bg-surface-container-low border transition-all rounded-xl flex flex-col justify-between overflow-hidden shadow-xs",
                  plan.isActive
                    ? "border-outline-variant hover:border-primary/40"
                    : "border-outline-variant/60 opacity-80"
                )}
              >
                {/* Card Header */}
                <div className="p-container-padding border-b border-outline-variant/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="size-7 rounded bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                          <Package className="size-4" />
                        </div>
                        <h2 className="font-headline-md text-title-md font-bold text-on-surface truncate">
                          {plan.planName}
                        </h2>
                      </div>
                      <div className="flex items-center gap-1.5 text-body-xs text-on-surface-variant font-mono-data mt-0.5">
                        <Users className="size-3.5 text-primary shrink-0" />
                        <span>Up to {plan.maxMembers.toLocaleString()} Gym Members</span>
                      </div>
                    </div>

                    {/* Status Pill & Switch */}
                    <div className="flex flex-col items-end shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={plan.isActive}
                        disabled={togglingPlanId === plan.id}
                        onClick={() => handleToggleStatus(plan)}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 disabled:opacity-50",
                          plan.isActive
                            ? "bg-emerald-500 focus-visible:ring-emerald-400"
                            : "bg-rose-500 focus-visible:ring-rose-400"
                        )}
                        title={`Click to set ${plan.isActive ? "Inactive" : "Active"}`}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                            plan.isActive ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                      <span
                        className={cn(
                          "text-[11px] mt-1 font-medium",
                          plan.isActive ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                        )}
                      >
                        {plan.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-container-padding flex-1 space-y-container-padding">
                  <p className="font-body-md text-body-md text-on-surface-variant min-h-[36px]">
                    {plan.description || "No specific tier description provided."}
                  </p>

                  {/* Durations & Pricing */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                        DURATIONS & PRICING
                      </span>
                      <button
                        type="button"
                        onClick={() => setDurationModalPlan(plan)}
                        className="text-primary hover:underline text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        title="Add duration"
                      >
                        <Plus className="size-3" />
                        <span>Add</span>
                      </button>
                    </div>
                    {durations.length === 0 ? (
                      <p className="text-body-sm text-on-surface-variant/60 italic">
                        No pricing durations configured yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {durations.map((duration) => {
                          const isDurActive = duration.isActive !== false;
                          const isTogglingDur = togglingDurationId === duration.id;

                          return (
                            <div
                              key={duration.id}
                              className="group bg-surface-container-high border border-outline-variant hover:border-primary/50 transition-colors px-2.5 py-1 rounded flex items-center gap-2 shadow-xs"
                            >
                              <span className="font-mono-data text-body-sm text-primary font-bold">
                                {duration.durationDays} Days
                              </span>
                              <span className="w-[1px] h-3 bg-outline-variant" />
                              <span className="font-mono-data text-body-sm text-on-surface font-semibold">
                                ${Number(duration.price).toFixed(2)}
                              </span>

                              {/* Duration Active Toggle Badge */}
                              <button
                                type="button"
                                onClick={() => handleToggleDurationStatus(plan, duration)}
                                disabled={isTogglingDur}
                                className={cn(
                                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer disabled:opacity-50 border ml-0.5",
                                  isDurActive
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                                )}
                                title={
                                  isDurActive
                                    ? "Click to deactivate duration"
                                    : "Click to activate duration"
                                }
                              >
                                {isTogglingDur ? (
                                  <Loader2 className="size-2.5 animate-spin" />
                                ) : (
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      isDurActive ? "bg-emerald-400" : "bg-rose-400"
                                    )}
                                  />
                                )}
                                <span>{isDurActive ? "Active" : "Inactive"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditDurationState({ plan, duration })}
                                className="text-on-surface-variant hover:text-primary transition-colors p-0.5 rounded hover:bg-surface-container-highest cursor-pointer ml-0.5"
                                title="Edit duration & price"
                                aria-label={`Edit duration ${duration.durationDays} days`}
                              >
                                <Edit2 className="size-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDurationToDelete({ plan, duration })
                                }
                                className="text-on-surface-variant hover:text-rose-400 transition-colors p-0.5 rounded hover:bg-surface-container-highest cursor-pointer"
                                title="Delete duration"
                                aria-label={`Delete duration ${duration.durationDays} days`}
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-1.5 bg-surface-container-low border-t border-outline-variant grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-1">
                  <button
                    type="button"
                    onClick={() => setEditPlanModalPlan(plan)}
                    className="flex items-center justify-center gap-1.5 py-2 min-h-[38px] hover:bg-surface-container-high transition-colors font-body-sm text-body-sm text-on-surface rounded cursor-pointer border border-transparent font-medium"
                    title="Edit Plan Details"
                  >
                    <Edit2 className="size-3.5 text-primary" />
                    <span>Edit Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationModalPlan(plan)}
                    className="flex items-center justify-center gap-1.5 py-2 min-h-[38px] hover:bg-surface-container-high transition-colors font-body-sm text-body-sm text-primary rounded cursor-pointer border border-transparent font-medium"
                  >
                    <Clock className="size-3.5" />
                    <span>+ Duration</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(plan)}
                    disabled={togglingPlanId === plan.id}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 min-h-[38px] transition-all font-body-sm text-body-sm font-semibold rounded cursor-pointer border disabled:opacity-50",
                      plan.isActive
                        ? "text-rose-400 bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50"
                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                    )}
                    title={plan.isActive ? "Deactivate plan" : "Activate plan"}
                  >
                    {togglingPlanId === plan.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : plan.isActive ? (
                      <XCircle className="size-3.5 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                    )}
                    <span>{plan.isActive ? "Deactivate" : "Activate"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanToDelete(plan)}
                    className="flex items-center justify-center gap-1.5 py-2 min-h-[38px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors font-body-sm text-body-sm font-semibold rounded cursor-pointer border border-transparent"
                    title="Delete Plan"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* System Stats Bar */}
      <div className="mt-layout-margin grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-container-padding">
        <div className="bg-surface-container-low border border-outline-variant p-3 sm:p-container-padding rounded-lg">
          <div className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant opacity-70 mb-1 uppercase font-bold tracking-wider">
            TOTAL ACTIVE PLANS
          </div>
          <div className="font-headline-md text-headline-md text-primary font-mono-data font-bold">
            <AnimatedCounter value={stats.totalActive} />
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant p-3 sm:p-container-padding rounded-lg">
          <div className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant opacity-70 mb-1 uppercase font-bold tracking-wider">
            INACTIVE PLANS
          </div>
          <div className="font-headline-md text-headline-md text-amber-400 font-mono-data font-bold">
            <AnimatedCounter value={stats.totalInactive} />
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant p-3 sm:p-container-padding rounded-lg">
          <div className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant opacity-70 mb-1 uppercase font-bold tracking-wider">
            TOP CAPACITY TIER
          </div>
          <div className="font-headline-md text-headline-md text-on-surface font-bold truncate">
            {stats.topTier}
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant p-3 sm:p-container-padding rounded-lg">
          <div className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant opacity-70 mb-1 uppercase font-bold tracking-wider">
            CONFIGURED DURATIONS
          </div>
          <div className="font-headline-md text-headline-md text-on-surface font-mono-data font-bold">
            <AnimatedCounter value={stats.totalDurations} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPlanModal
        isOpen={isAddPlanOpen}
        onClose={() => setIsAddPlanOpen(false)}
        onSuccess={fetchPlans}
      />

      <EditPlanModal
        plan={editPlanModalPlan}
        isOpen={!!editPlanModalPlan}
        onClose={() => setEditPlanModalPlan(null)}
        onSuccess={fetchPlans}
      />

      <AddDurationModal
        plan={durationModalPlan}
        isOpen={!!durationModalPlan}
        onClose={() => setDurationModalPlan(null)}
        onSuccess={fetchPlans}
      />

      <EditDurationModal
        plan={editDurationState?.plan || null}
        duration={editDurationState?.duration || null}
        isOpen={!!editDurationState}
        onClose={() => setEditDurationState(null)}
        onSuccess={fetchPlans}
      />

      <DeletePlanModal
        plan={planToDelete}
        isOpen={Boolean(planToDelete)}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeletePlan}
        isDeleting={isDeletingPlan}
      />

      <DeleteDurationModal
        plan={durationToDelete?.plan || null}
        duration={durationToDelete?.duration || null}
        isOpen={Boolean(durationToDelete)}
        onClose={() => setDurationToDelete(null)}
        onConfirm={handleDeleteDuration}
        isDeleting={isDeletingDuration}
      />
    </div>
  );
}
