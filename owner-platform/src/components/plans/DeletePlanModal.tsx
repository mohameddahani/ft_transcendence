"use client";

import { X, Trash2, Loader2, AlertTriangle, Package } from "lucide-react";
import { PlatformPlan } from "@/types/plan";

interface DeletePlanModalProps {
  plan: PlatformPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export default function DeletePlanModal({
  plan,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeletePlanModalProps) {
  if (!isOpen || !plan) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-delete-plan-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-3 sm:p-layout-margin"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="bg-surface-container-high border border-outline-variant w-full max-w-md flex flex-col overflow-hidden shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-container-padding border-b border-outline-variant flex justify-between items-center bg-surface-container-highest shrink-0">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="size-5 shrink-0" />
            <h2
              id="modal-delete-plan-title"
              className="font-headline-md text-sm sm:text-headline-md text-on-surface font-bold"
            >
              Delete Platform Plan
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1.5 rounded-lg hover:bg-surface-container-high cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-layout-margin space-y-4">
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Are you sure you want to permanently delete plan{" "}
            <span className="font-bold text-on-surface">
              &quot;{plan.planName}&quot;
            </span>
            ? Deleting an unused plan also deletes all its durations.
          </p>

          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
            <p className="text-body-xs text-rose-400 font-medium leading-relaxed">
              <strong>Notice:</strong> Deletion will be rejected by the system if any admin subscription (active, expired, or cancelled) currently references this plan.
            </p>
          </div>

          <div className="bg-surface-container border border-outline-variant/60 rounded-lg p-3 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
              <Package className="size-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-body-sm text-on-surface block truncate">
                {plan.planName}
              </span>
              <span className="text-body-xs text-on-surface-variant block">
                {plan.durations?.length || 0} pricing duration(s) • Up to {plan.maxMembers} members
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-container-padding border-t border-outline-variant flex justify-end gap-2 bg-surface-container shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-outline-variant hover:bg-surface-container-highest transition-colors rounded-lg font-body-sm text-body-sm text-on-surface font-medium cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white transition-colors rounded-lg font-body-sm text-body-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                <span>Delete Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

