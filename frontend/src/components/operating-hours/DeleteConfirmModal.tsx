"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-surface-bright rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 p-6 z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="font-headline text-lg font-bold text-on-surface">
            {title}
          </h3>
          <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
            {description}
          </p>

          {itemName && (
            <div className="mt-3 p-3 rounded-xl bg-surface-container border border-outline-variant/50 text-xs font-semibold text-on-surface">
              {itemName}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-bold hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-error text-white text-sm font-bold shadow-md hover:bg-error/90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("deleting")}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{t("delete")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
