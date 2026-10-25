"use client";

import React from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-feedback-title"
        className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant/60 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center shrink-0 ring-4 ring-error/5">
            <Trash2 className="w-6 h-6" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3
            id="delete-feedback-title"
            className="text-base font-headline font-bold text-on-surface"
          >
            {t("deleteFeedbackTitle") || "Delete Your Feedback"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
            {t("deleteFeedbackWarning") ||
              "Are you sure you want to permanently delete this feedback? This action cannot be reversed."}
          </p>

          {contentSnippet && (
            <div className="mt-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs italic text-on-surface-variant line-clamp-3">
              &ldquo;{contentSnippet}&rdquo;
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            {t("cancel") || "Cancel"}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-error text-white text-xs font-bold hover:bg-error/90 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("deleting") || "Deleting..."}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{t("deletePermanently") || "Delete Feedback"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
