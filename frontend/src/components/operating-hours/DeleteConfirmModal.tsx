"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  itemName?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
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
      <div className="relative w-full max-w-md toota-card border border-border/40 p-6 sm:p-7 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col bg-card text-toota-ink space-y-5">
        {/* Header with Baseline Metric */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/40">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
              / {t("confirmAction", "confirm delete")}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="space-y-3">
          <div className="flex items-start gap-3.5 p-4 rounded-xl toota-inner border border-border/40">
            <div className="size-9 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="size-4" />
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="text-toota-ink font-medium leading-relaxed">
                {description}
              </p>
              {itemName && (
                <div className="p-2.5 rounded-lg bg-card border border-border/40 font-mono text-[11px] text-toota-muted">
                  {itemName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons (Unified Toota Pill Outline Buttons) */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
          >
            <span>{t("cancel", "Cancel")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-rose-500/40 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin me-1.5" />
                <span>{t("deleting", "Deleting...")}</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5 me-1.5" />
                <span>{t("delete", "Delete")}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
