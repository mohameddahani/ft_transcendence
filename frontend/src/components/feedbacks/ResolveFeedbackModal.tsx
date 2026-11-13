"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  Lock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { FeedbackItem, FeedbackStatus } from "@/types/feedback";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const starsDisagree = (f: FeedbackItem) => {
  const sentiment = f.sentimentType || f.sentiment;
  return (
    (f.rating >= 4 && sentiment === "NEGATIVE") ||
    (f.rating <= 2 && sentiment === "POSITIVE")
  );
};

interface ResolveFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: FeedbackItem | null;
  onSave: (id: string, status: FeedbackStatus, note?: string) => Promise<void>;
  isSubmitting: boolean;
}

export default function ResolveFeedbackModal({
  isOpen,
  onClose,
  feedback,
  onSave,
  isSubmitting,
}: ResolveFeedbackModalProps) {
  const { t } = useTranslation();

  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus>("RESOLVED");
  const [resolutionNote, setResolutionNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (feedback) {
      setSelectedStatus(
        feedback.feedbackStatus === "OPEN" ? "RESOLVED" : feedback.feedbackStatus
      );
      setResolutionNote(feedback.resolutionNote || "");
      setValidationError(null);
    }
  }, [feedback]);

  if (!isOpen || !feedback) return null;

  const member = feedback.member;
  const fullName =
    `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
    member?.userName ||
    "Gym Member";
  const initials =
    ((member?.firstName?.[0] || "") + (member?.lastName?.[0] || "")).toUpperCase() ||
    member?.userName?.slice(0, 2).toUpperCase() ||
    "M";

  const rawPhoto = member?.profileImageUrl || member?.photo;
  const isPlaceholder =
    !rawPhoto ||
    rawPhoto === "default-image.jpg" ||
    rawPhoto === "default-member-image.jpg";
  const photo = !isPlaceholder ? rawPhoto : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const noteTrimmed = resolutionNote.trim();
    if (noteTrimmed && noteTrimmed.length < 3) {
      setValidationError(
        t("resolutionNoteMinLength") || "Resolution note must be at least 3 characters."
      );
      return;
    }
    if (noteTrimmed && noteTrimmed.length > 1000) {
      setValidationError(
        t("resolutionNoteMaxLength") || "Resolution note cannot exceed 1000 characters."
      );
      return;
    }

    await onSave(feedback.id, selectedStatus, noteTrimmed || undefined);
    onClose();
  };

  const formattedDate = new Date(feedback.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resolve-feedback-title"
        className="w-full max-w-lg bg-card text-card-foreground rounded-2xl border border-border/60 shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/40 shrink-0">
          <div>
            <div className="flex items-baseline gap-2">
              <h3
                id="resolve-feedback-title"
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
              >
                {t("reviewAndResolve") || "Review & Update Status"}
              </h3>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {feedback.rating}.0 ★
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-0.5">
              {t("feedbackResolutionSubtitle", "Review member review and document administrative action taken.")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Member & Review Snapshot */}
          <div className="p-3.5 rounded-xl bg-toota-inner border border-border/40 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-9 ring-1 ring-border/40 shrink-0">
                  {photo && <AvatarImage src={photo} alt={fullName} />}
                  <AvatarFallback className="bg-background text-toota-ink font-semibold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h4 className="font-semibold text-xs text-toota-ink">{fullName}</h4>
                  <p className="text-[11px] text-toota-muted font-mono">{formattedDate}</p>
                </div>
              </div>

              {/* Rating & Mismatch Indicator */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-lg border border-border/40">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span className="font-mono text-xs font-semibold text-toota-ink">
                    {feedback.rating}.0
                  </span>
                </div>

                {starsDisagree(feedback) && (
                  <span
                    title={t("starsDisagreeHint", "Stars and words disagree")}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-amber-200 dark:ring-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                  >
                    <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                    <span>{t("mismatch", "Mismatch")}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quoted Content */}
            <div className="p-3 rounded-lg bg-background border border-border/40 text-xs text-toota-ink leading-relaxed">
              <p className="italic">&ldquo;{feedback.content}&rdquo;</p>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-toota-muted">
              <Lock className="size-3 opacity-60" />
              <span>{t("memberSubmissionImmutable", "Member submission is immutable")}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status Selection (Crisp Outlined Micro-Badge styled buttons) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-toota-muted uppercase tracking-wider">
                {t("setFeedbackStatus") || "Set Resolution Status"}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    value: "RESOLVED" as FeedbackStatus,
                    label: t("statusResolved") || "Resolved",
                    dotClass: "bg-emerald-500",
                  },
                  {
                    value: "IN_REVIEW" as FeedbackStatus,
                    label: t("statusInReview") || "In Review",
                    dotClass: "bg-blue-500",
                  },
                  {
                    value: "OPEN" as FeedbackStatus,
                    label: t("statusOpen") || "Open",
                    dotClass: "bg-amber-500",
                  },
                  {
                    value: "DISMISSED" as FeedbackStatus,
                    label: t("statusDismissed") || "Dismissed",
                    dotClass: "bg-zinc-400",
                  },
                ].map((option) => {
                  const isSelected = selectedStatus === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedStatus(option.value)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer transition-all ${
                        isSelected
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs ring-1 ring-zinc-900 dark:ring-zinc-100"
                          : "bg-toota-inner text-toota-ink hover:bg-zinc-200/60 dark:hover:bg-zinc-800 border border-border/40"
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${option.dotClass} shrink-0`} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resolution Note */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-toota-muted uppercase tracking-wider">
                  {t("resolutionNote") || "Resolution Note"}
                </label>
                <span className="font-mono text-[11px] text-toota-muted tabular-nums">
                  {resolutionNote.length} / 1000
                </span>
              </div>

              <textarea
                rows={3}
                placeholder={
                  t("resolutionNotePlaceholder") ||
                  "Describe action taken (e.g. Spoke with member, scheduled equipment repair, cleaned locker rooms)..."
                }
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-toota-inner border border-border/40 text-toota-ink placeholder:text-toota-muted focus:outline-hidden focus:ring-1 focus:ring-zinc-400 text-xs leading-relaxed transition-all resize-none"
              />

              {validationError && (
                <p className="text-[11px] text-destructive font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{validationError}</span>
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="toota-pill h-9 px-4 text-xs font-semibold border-border/50 text-toota-ink cursor-pointer"
              >
                {t("cancel") || "Cancel"}
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="toota-pill h-9 px-4 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin me-1.5" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 me-1.5" />
                    <span>{t("saveResolution") || "Save Resolution"}</span>
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
