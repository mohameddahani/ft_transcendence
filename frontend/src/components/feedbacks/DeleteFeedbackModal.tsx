"use client";

import React from "react";
import { X, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface DeleteFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  contentSnippet?: string;
}

export default function DeleteFeedbackModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  contentSnippet,
}: DeleteFeedbackModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-feedback-title"
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
            id="delete-feedback-title"
            className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            {t("deleteFeedbackTitle") || "Delete Your Feedback"}
          </h3>
          <p className="text-xs text-toota-muted mt-1 leading-relaxed">
            {t("deleteFeedbackWarning") ||
              "Are you sure you want to permanently delete this feedback? This action cannot be reversed."}
          </p>

          {contentSnippet && (
            <div className="mt-3 p-3 rounded-xl bg-toota-inner border border-border/40 text-xs italic text-toota-muted line-clamp-3">
              &ldquo;{contentSnippet}&rdquo;
            </div>
          )}
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
                <span>{t("deletePermanently") || "Delete Feedback"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
