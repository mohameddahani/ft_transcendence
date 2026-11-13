"use client";

import React from "react";
import { X, Trash2, Loader2, AlertTriangle, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { MembershipPlan } from "@/types/membership-plan";

interface DeletePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  plan: MembershipPlan | null;
}

export default function DeletePlanModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  plan,
}: DeletePlanModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !plan) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-plan-title"
        className="w-full max-w-md bg-card text-card-foreground rounded-2xl border border-border/60 shadow-xl p-5 overflow-hidden animate-in zoom-in-95 duration-150 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="size-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="size-5" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div>
          <h3
            id="delete-plan-title"
            className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            {t("deletePlanTitle") || "Delete Membership Plan"}
          </h3>
          <p className="text-xs text-toota-muted mt-1 leading-relaxed">
            {t("deletePlanWarning") ||
              "Are you sure you want to permanently delete this plan? Deleting an unused plan also deletes all its durations. Deletion is blocked if any active, expired, or cancelled memberships reference this plan."}
          </p>

          <div className="mt-3 p-3 rounded-xl bg-toota-inner border border-border/40 flex items-center gap-3">
            <div className="size-8 rounded-lg bg-toota-card flex items-center justify-center text-toota-ink shrink-0">
              <Layers className="size-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-toota-ink block truncate">
                {plan.planName}
              </span>
              <span className="text-[11px] text-toota-muted block">
                {plan.membershipPlanDurations?.length || 0}{" "}
                {plan.membershipPlanDurations?.length === 1
                  ? t("durationOption") || "duration option"
                  : t("durationOptions") || "duration options"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="toota-pill h-9 px-4 text-xs font-semibold border-border/50 text-toota-ink cursor-pointer"
          >
            {t("cancel") || "Cancel"}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="toota-pill h-9 px-4 text-xs font-semibold cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin me-1.5" />
                <span>{t("deleting") || "Deleting..."}</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5 me-1.5" />
                <span>{t("deletePermanently") || "Delete Plan"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

