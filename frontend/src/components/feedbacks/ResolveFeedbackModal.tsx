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
    t("member");
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
        aria-describedby="resolve-feedback-description"
        className="w-full max-w-lg bg-card text-card-foreground rounded-2xl border border-border shadow-xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 id="resolve-feedback-title" className="text-base font-semibold tracking-tight text-toota-ink">
              {t("reviewAndResolve")}
            </h2>
            <p id="resolve-feedback-description" className="text-xs leading-5 text-muted-foreground mt-1">
              {t("feedbackResolutionSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-toota-ink hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 p-4 space-y-4 overflow-y-auto overscroll-contain">
            <section aria-labelledby="resolve-review-title" className="min-w-0 rounded-xl border border-border bg-background p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 max-w-full items-center gap-2">
                  <Avatar className="size-8 ring-1 ring-border shrink-0">
                    {photo && <AvatarImage src={photo} alt={fullName} />}
                    <AvatarFallback className="bg-card text-toota-ink font-semibold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-[13px] text-toota-ink [overflow-wrap:anywhere]">{fullName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex max-w-full flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 bg-card px-2 py-1 rounded-lg border border-border">
                    <Star aria-hidden="true" className="size-4 fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400" />
                    <span className="text-xs font-semibold text-toota-ink tabular-nums">{feedback.rating} / 5</span>
                  </div>
                  {starsDisagree(feedback) && (
                    <span
                      title={t("starsDisagreeHint")}
                      className="inline-flex items-center gap-1.5 rounded-md border border-amber-600/20 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 dark:border-amber-400/25 dark:bg-amber-950 dark:text-amber-200"
                    >
                      <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
                      <span>{t("mismatch")}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h3 id="resolve-review-title" className="text-xs font-semibold text-toota-ink">{t("memberReviewText")}</h3>
                <div role="region" aria-labelledby="resolve-review-title" tabIndex={0} className="max-h-28 overflow-y-auto overscroll-contain rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <p dir="auto" className="text-[13px] text-toota-ink leading-5 whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {feedback.content}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2">
                <Lock aria-hidden="true" className="size-3.5 shrink-0" />
                <span>{t("memberSubmissionImmutable")}</span>
              </div>
            </section>

            <fieldset className="min-w-0 space-y-2">
              <legend className="text-xs font-semibold text-toota-ink">{t("setFeedbackStatus")}</legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "RESOLVED" as FeedbackStatus, label: t("statusResolved"), dotClass: "bg-emerald-500" },
                  { value: "IN_REVIEW" as FeedbackStatus, label: t("statusInReview"), dotClass: "bg-blue-500" },
                  { value: "OPEN" as FeedbackStatus, label: t("statusOpen"), dotClass: "bg-amber-500" },
                  { value: "DISMISSED" as FeedbackStatus, label: t("statusDismissed"), dotClass: "bg-zinc-400" },
                ].map((option) => {
                  const isSelected = selectedStatus === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedStatus(option.value)}
                      aria-pressed={isSelected}
                      className={`flex min-h-9 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold text-start cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                        isSelected
                          ? "bg-toota-lime border-toota-lime text-zinc-950 shadow-xs"
                          : "bg-background border-border text-toota-ink hover:border-toota-lime hover:bg-toota-lime/10"
                      }`}
                    >
                      <span aria-hidden="true" className={`size-2 rounded-full ${option.dotClass} shrink-0`} />
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{option.label}</span>
                      {isSelected && <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="resolve-feedback-note" className="text-xs font-semibold text-toota-ink">
                  {t("resolutionNote")}
                </label>
                <span id="resolve-note-count" className="text-xs text-muted-foreground tabular-nums">
                  {resolutionNote.length} / 1000
                </span>
              </div>
              <textarea
                id="resolve-feedback-note"
                dir="auto"
                rows={3}
                placeholder={t("resolutionNotePlaceholder")}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                aria-invalid={Boolean(validationError)}
                aria-describedby={validationError ? "resolve-note-count resolve-note-error" : "resolve-note-count"}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-[13px] text-toota-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring leading-5 transition-colors resize-y"
              />
              {validationError && (
                <p id="resolve-note-error" role="alert" className="text-xs text-destructive font-medium flex items-start gap-2">
                  <AlertCircle aria-hidden="true" className="size-4 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2 p-3 sm:px-4 border-t border-border bg-card shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-9 h-auto rounded-lg px-3 py-2 text-xs font-semibold border-border bg-background text-toota-ink cursor-pointer whitespace-normal"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-9 h-auto rounded-lg px-3 py-2 text-xs font-semibold bg-toota-lime text-zinc-950 hover:bg-toota-lime/85 cursor-pointer whitespace-normal"
            >
              {isSubmitting ? <Loader2 aria-hidden="true" className="size-4 animate-spin me-1.5" /> : <CheckCircle2 aria-hidden="true" className="size-4 me-1.5" />}
              <span>{isSubmitting ? t("saving") : t("saveResolution")}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
