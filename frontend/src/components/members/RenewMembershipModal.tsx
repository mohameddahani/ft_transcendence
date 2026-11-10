"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  Receipt,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { fetchMembershipPlans } from "@/lib/api/membership-plans";
import { updateMember } from "@/lib/api/members";
import { BackendMember } from "@/types/member";
import { MembershipPlan } from "@/types/membership-plan";
import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/ui/CustomSelect";

interface RenewMembershipModalProps {
  member: BackendMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RenewMembershipModal({
  member,
  isOpen,
  onClose,
  onSuccess,
}: RenewMembershipModalProps) {
  const { t } = useTranslation();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedDurationId, setSelectedDurationId] = useState<string>("");
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active membership info
  const activeMembership = useMemo(() => {
    if (!member?.memberships || member.memberships.length === 0) return null;
    return (
      member.memberships.find((m) => m.membershipStatus === "ACTIVE") ||
      member.memberships[0]
    );
  }, [member]);

  // Load available membership plans
  const loadPlans = useCallback(async () => {
    setIsLoadingPlans(true);
    try {
      const loaded = await fetchMembershipPlans(1, 100);
      const activePlans = loaded.filter((p) => p.isActive);
      setPlans(activePlans);

      // Default to member's current plan if available, else first active plan
      const currentPlanId = activeMembership?.membershipPlanId;
      const matchedCurrent = activePlans.find((p) => p.id === currentPlanId);
      const defaultPlan = matchedCurrent || activePlans[0];

      if (defaultPlan) {
        setSelectedPlanId(defaultPlan.id);
        const durations = defaultPlan.membershipPlanDurations || [];
        const currentDurationId = activeMembership?.membershipPlanDurationId;
        const matchedDuration = durations.find((d) => d.id === currentDurationId);
        setSelectedDurationId(matchedDuration ? matchedDuration.id : durations[0]?.id || "");
      }
    } catch {
      toast.error(t("plansLoadFailed", "Failed to load membership plans"));
    } finally {
      setIsLoadingPlans(false);
    }
  }, [activeMembership, t]);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    } else {
      setSelectedPlanId("");
      setSelectedDurationId("");
    }
  }, [isOpen, loadPlans]);

  // Current selected plan and durations
  const currentPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId]
  );

  const currentDurations = useMemo(
    () => currentPlan?.membershipPlanDurations || [],
    [currentPlan]
  );

  const selectedDuration = useMemo(
    () => currentDurations.find((d) => d.id === selectedDurationId),
    [currentDurations, selectedDurationId]
  );

  // Handle plan change
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const chosenPlan = plans.find((p) => p.id === planId);
    const durations = chosenPlan?.membershipPlanDurations || [];
    setSelectedDurationId(durations[0]?.id || "");
  };

  // Preview new expiration date
  const newExpirationDate = useMemo(() => {
    if (!selectedDuration) return "—";
    const now = new Date();
    const expiry = new Date(now.getTime() + selectedDuration.durationDays * 24 * 60 * 60 * 1000);
    return expiry.toLocaleDateString();
  }, [selectedDuration]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !member) return null;

  const memberName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.userName || "Member";
  const memberInitials = ((member.firstName?.[0] || "") + (member.lastName?.[0] || "")).toUpperCase() || "M";
  const isExpired = activeMembership?.membershipStatus === "EXPIRED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !selectedDurationId) {
      toast.error(t("selectPlanAndDuration", "Please select both a plan and a duration"));
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMember(member.id, {
        membershipPlanId: selectedPlanId,
        membershipPlanDurationId: selectedDurationId,
      });

      toast.success(
        t("subscriptionRenewedSuccess", {
          name: memberName,
          plan: currentPlan?.planName,
          defaultValue: `Membership for "${memberName}" activated with "${currentPlan?.planName}"!`,
        })
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        const msg = err.response.data.message;
        if (Array.isArray(msg)) {
          msg.forEach((m) => toast.error(m));
        } else {
          toast.error(msg);
        }
      } else {
        toast.error(t("renewFailed", "Failed to renew membership subscription"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg toota-card border border-border/40 p-0 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col">
        <div className="p-6 sm:p-7 overflow-y-auto bg-card text-toota-ink custom-scrollbar space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="size-4" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-toota-ink">
                  {isExpired
                    ? t("renewMembership", "Renew Member Subscription")
                    : t("assignNewPlan", "Renew / Change Plan")}
                </h3>
              </div>
              <p className="text-xs text-toota-muted mt-1">
                {t(
                  "renewSubtitle",
                  "Activate a new membership cycle and record the transaction payment."
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Member Capsule Info */}
          <div className="p-3.5 rounded-xl bg-toota-inner border border-border/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-card border border-border/40 text-toota-ink flex items-center justify-center font-bold font-mono text-xs shrink-0 shadow-2xs">
                {memberInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-toota-ink truncate">{memberName}</p>
                <p className="text-[11px] text-toota-muted font-mono truncate">
                  {member.email || `@${member.userName || "member"}`}
                </p>
              </div>
            </div>

            {/* Current Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                isExpired
                  ? "ring-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "ring-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  isExpired ? "bg-rose-500" : "bg-emerald-500"
                }`}
              />
              <span>
                {isExpired
                  ? t("expired", "Expired")
                  : activeMembership?.membershipStatus || t("active", "Active")}
              </span>
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isLoadingPlans ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-toota-muted">
                <Loader2 className="size-6 animate-spin text-toota-ink" />
                <span className="text-xs font-mono">Loading available plans...</span>
              </div>
            ) : plans.length === 0 ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p>
                  {t(
                    "noPlansFound",
                    "No active membership plans found. Please configure a membership plan first."
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Plan Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink flex items-center justify-between">
                    <span>
                      {t("selectPlan", "Membership Plan")} <span className="text-rose-500">*</span>
                    </span>
                    {currentPlan && (
                      <span className="text-[10px] text-toota-muted font-mono">
                        {currentPlan.weeklyVisitLimit} {t("visitsPerWeek", "visits/wk")}
                      </span>
                    )}
                  </label>
                  <CustomSelect
                    value={selectedPlanId}
                    onChange={(val) => handlePlanChange(String(val))}
                    className="rounded-xl bg-card"
                    placeholder={t("chooseTier", "Select a membership tier")}
                    options={plans.map((p) => ({
                      value: p.id,
                      label: `${p.planName} (${p.weeklyVisitLimit} ${t("visitsPerWeek", "visits/wk")})`,
                    }))}
                  />
                </div>

                {/* 2. Duration & Billing Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("selectDuration", "Plan Duration & Billing")} <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={selectedDurationId}
                    onChange={(val) => setSelectedDurationId(String(val))}
                    disabled={currentDurations.length === 0}
                    className="rounded-xl bg-card"
                    placeholder={
                      currentDurations.length === 0
                        ? t("noDurationsAvailable", "No durations available")
                        : t("selectDuration", "Select duration")
                    }
                    options={currentDurations.map((d) => ({
                      value: d.id,
                      label: `${d.durationDays} ${t("days", "days")} — ${Number(d.price).toFixed(2)} MAD`,
                    }))}
                  />
                </div>

                {/* 3. Cycle & Receipt Preview */}
                {selectedDuration && (
                  <div className="p-4 rounded-xl bg-toota-inner border border-border/40 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-toota-ink border-b border-border/30 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Receipt className="size-3.5 text-toota-green" />
                        <span>{t("subscriptionOverview", "Subscription Overview")}</span>
                      </span>
                      <span className="font-mono text-toota-green">
                        {Number(selectedDuration.price).toFixed(2)} MAD
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-toota-muted block">
                          {t("effectiveDate", "Starts")}
                        </span>
                        <span className="font-medium text-toota-ink flex items-center gap-1 mt-0.5">
                          <Clock className="size-3 text-toota-muted" />
                          <span>{new Date().toLocaleDateString()}</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-toota-muted block">
                          {t("newExpiresAt", "New Expiry")}
                        </span>
                        <span className="font-medium text-toota-ink flex items-center gap-1 mt-0.5">
                          <Calendar className="size-3 text-emerald-500" />
                          <span>{newExpirationDate}</span>
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-toota-muted leading-relaxed pt-1">
                      {t(
                        "autoInvoiceNotice",
                        "A successful payment entry will automatically be logged in the member's payment history."
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
              >
                <span>{t("cancel", "Cancel")}</span>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedPlanId || !selectedDurationId || plans.length === 0}
                className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin me-1.5" />
                    <span>{t("activatingSubscription", "Activating...")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 me-1.5" />
                    <span>{t("confirmAndActivate", "Activate Subscription")}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
