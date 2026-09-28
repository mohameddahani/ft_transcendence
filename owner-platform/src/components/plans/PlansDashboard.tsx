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
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { PlatformPlan, PlanDuration } from "@/types/plan";
import AddPlanModal from "./AddPlanModal";
import EditPlanModal from "./EditPlanModal";
import AddDurationModal from "./AddDurationModal";
import EditDurationModal from "./EditDurationModal";
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
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

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
    } catch (err: unknown) {
      console.error("Failed to load plans:", err);
      setError("Unable to load platform plans. Please check backend connection.");
      toast.error("Failed to load platform plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Toggle active status
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
      console.error("Failed to toggle plan status:", err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not update plan status.";
      toast.error(msg);
    } finally {
      setTogglingPlanId(null);
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
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-layout-margin mb-layout-margin">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-unit font-bold">
            Platform Plans
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Configure subscription tiers and member thresholds for SaaS clients.
          </p>
        </div>

        <div className="flex items-center gap-element-gap">
          <button
            type="button"
            onClick={fetchPlans}
            disabled={loading}
            className="flex items-center gap-element-gap px-3 py-2 bg-surface-container-high border border-outline-variant rounded-md text-on-surface hover:border-primary transition-colors text-body-sm cursor-pointer disabled:opacity-50"
            title="Refresh plans"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddPlanOpen(true)}
            className="bg-primary text-on-primary px-container-padding h-row-height-md flex items-center gap-unit rounded-lg hover:opacity-90 active:scale-95 transition-all font-headline-sm text-headline-sm font-bold shadow-md cursor-pointer border-none"
          >
            <Plus className="size-4" />
            <span>Add New Plan</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-low border border-outline-variant p-container-padding mb-layout-margin flex flex-wrap items-center gap-container-padding rounded-lg">
        <div className="flex items-center gap-unit text-on-surface-variant">
          <Filter className="size-4 text-on-surface-variant" />
          <span className="font-label-caps text-label-caps uppercase font-bold tracking-wider">
            Filters:
          </span>
        </div>

        <div className="flex items-center gap-element-gap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-high border border-outline-variant text-body-sm font-body-sm px-2 py-1 rounded focus:ring-1 focus:ring-primary outline-none text-on-surface cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface-container-high border border-outline-variant text-body-sm font-body-sm px-2 py-1 rounded focus:ring-1 focus:ring-primary outline-none text-on-surface cursor-pointer"
          >
            <option value="NAME">Sort by Name</option>
            <option value="PRICE">Sort by Price</option>
            <option value="MEMBERS">Sort by Max Members</option>
          </select>
        </div>

        <div className="sm:ml-auto flex items-center bg-surface-container-high border border-outline-variant rounded px-unit w-full sm:w-64">
          <Search className="size-4 text-on-surface-variant mx-1.5 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plans..."
            className="bg-transparent border-none focus:ring-0 text-body-sm font-body-sm w-full py-1 text-on-surface placeholder:text-on-surface-variant/50 outline-none"
          />
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        // Loading Skeleton
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-layout-margin">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-surface-container border border-outline-variant rounded-lg p-container-padding space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-start border-b border-outline-variant pb-3">
                <div className="space-y-2">
                  <div className="h-5 bg-surface-container-high rounded w-32" />
                  <div className="h-3.5 bg-surface-container-high rounded w-24" />
                </div>
                <div className="w-10 h-5 bg-surface-container-high rounded-full" />
              </div>
              <div className="h-12 bg-surface-container-high rounded w-full" />
              <div className="h-8 bg-surface-container-high rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        // Error state
        <div className="bg-surface-container border border-outline-variant rounded-lg p-12 text-center">
          <AlertCircle className="size-10 text-error mx-auto mb-3" />
          <p className="text-on-surface font-headline-sm mb-2">{error}</p>
          <button
            type="button"
            onClick={fetchPlans}
            className="px-4 py-1.5 bg-primary text-on-primary rounded text-body-sm font-medium hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      ) : filteredPlans.length === 0 ? (
        // Empty state
        <div className="bg-surface-container border border-dashed border-outline-variant rounded-xl p-16 text-center space-y-3">
          <Package className="size-12 text-on-surface-variant/40 mx-auto" />
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
            No Platform Plans Found
          </h3>
          <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
            {searchTerm || statusFilter !== "ALL"
              ? "No plans match your selected filters. Try changing or clearing your search criteria."
              : "Get started by creating your first SaaS subscription tier and member capacity thresholds."}
          </p>
          {!searchTerm && statusFilter === "ALL" && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAddPlanOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-body-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Plus className="size-4" />
                <span>Create First Plan</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        // Plans Cards
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-layout-margin">
          {filteredPlans.map((plan, index) => {
            const isTopCapacity = index === 0 && plan.maxMembers >= 1000;
            const durations = plan.durations || [];

            return (
              <div
                key={plan.id}
                className="bg-surface-container border border-outline-variant hover:border-primary transition-colors flex flex-col rounded-lg overflow-hidden shadow-sm"
              >
                {/* Card Header */}
                <div className="p-container-padding border-b border-outline-variant flex justify-between items-start bg-surface-container-high/40">
                  <div>
                    <div className="flex items-center gap-unit mb-1">
                      <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                        {plan.planName}
                      </h3>
                      {isTopCapacity && (
                        <span className="px-unit py-0.5 bg-primary-container text-on-primary-container font-label-caps text-[9px] uppercase font-bold rounded">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-primary text-body-sm font-mono-data">
                      <Users className="size-4 shrink-0" />
                      <span>{plan.maxMembers.toLocaleString()} Max Members</span>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditPlanModalPlan(plan)}
                      className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-md transition-colors cursor-pointer border border-transparent hover:border-outline-variant"
                      title="Edit Plan Details"
                      aria-label={`Edit ${plan.planName} plan`}
                    >
                      <Edit2 className="size-4" />
                    </button>

                    {/* Toggle Active Status */}
                    <div className="flex flex-col items-end">
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
                          "font-label-caps text-[10px] mt-1 font-bold tracking-wider",
                          plan.isActive ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {plan.isActive ? "ACTIVE" : "INACTIVE"}
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
                        {durations.map((duration) => (
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
                            <button
                              type="button"
                              onClick={() => setEditDurationState({ plan, duration })}
                              className="text-on-surface-variant hover:text-primary transition-colors p-0.5 rounded hover:bg-surface-container-highest cursor-pointer ml-0.5"
                              title="Edit duration & price"
                              aria-label={`Edit duration ${duration.durationDays} days`}
                            >
                              <Edit2 className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-1 bg-surface-container-low border-t border-outline-variant grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditPlanModalPlan(plan)}
                    className="flex items-center justify-center gap-1 py-2 hover:bg-surface-container-high transition-colors font-body-sm text-body-sm text-on-surface rounded cursor-pointer border border-transparent font-medium"
                    title="Edit Plan Details"
                  >
                    <Edit2 className="size-3.5 text-primary" />
                    <span>Edit Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationModalPlan(plan)}
                    className="flex items-center justify-center gap-1 py-2 hover:bg-surface-container-high transition-colors font-body-sm text-body-sm text-primary rounded cursor-pointer border border-transparent font-medium"
                  >
                    <Clock className="size-3.5" />
                    <span>+ Duration</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(plan)}
                    disabled={togglingPlanId === plan.id}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 transition-all font-body-sm text-body-sm font-semibold rounded cursor-pointer border disabled:opacity-50",
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* System Stats Bar */}
      <div className="mt-layout-margin grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-container-padding">
        <div className="bg-surface-container-low border border-outline-variant p-container-padding rounded-lg">
          <div className="font-label-caps text-label-caps text-on-surface-variant opacity-70 mb-1 uppercase font-bold tracking-wider">
            TOTAL ACTIVE PLANS
          </div>
          <div className="font-headline-md text-headline-md text-primary font-mono-data font-bold">
            <AnimatedCounter value={stats.totalActive} />
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant p-container-padding rounded-lg">
          <div className="font-label-caps text-label-caps text-on-surface-variant opacity-70 mb-1 uppercase font-bold tracking-wider">
            INACTIVE PLANS
          </div>
          <div className="font-headline-md text-headline-md text-amber-400 font-mono-data font-bold">
            <AnimatedCounter value={stats.totalInactive} />
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant p-container-padding rounded-lg">
          <div className="font-label-caps text-label-caps text-on-surface-variant opacity-70 mb-1 uppercase font-bold tracking-wider">
            TOP CAPACITY TIER
          </div>
          <div className="font-headline-md text-headline-md text-on-surface font-bold truncate">
            {stats.topTier}
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant p-container-padding rounded-lg">
          <div className="font-label-caps text-label-caps text-on-surface-variant opacity-70 mb-1 uppercase font-bold tracking-wider">
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
    </div>
  );
}
