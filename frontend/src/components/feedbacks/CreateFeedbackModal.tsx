"use client";

import React, { useState } from "react";
import {
  X,
  Star,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { createMemberFeedback } from "@/lib/api/member-portal";
import { Button } from "@/components/ui/button";

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "feedbackRatingPoor",
  2: "feedbackRatingFair",
  3: "feedbackRatingGood",
  4: "feedbackRatingVeryGood",
  5: "feedbackRatingExceptional",
};

const SUGGESTED_TOPICS = [
  "feedbackTopicCleanliness",
  "feedbackTopicEquipment",
  "feedbackTopicLockers",
  "feedbackTopicTrainers",
  "feedbackTopicCooling",
  "feedbackTopicAtmosphere",
];

export default function CreateFeedbackModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateFeedbackModalProps) {
  const { t } = useTranslation();

  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentActiveRating = hoveredRating || rating;
  const charCount = content.trim().length;
  const isContentValid = charCount >= 3 && charCount <= 1000;

  const handleTopicClick = (topic: string) => {
    setContent((prev) => {
      const trimmed = prev.trim();
      const prompt = t("feedbackTopicPrompt", { topic });
      if (!trimmed) return `${prompt} `;
      if (trimmed.includes(topic)) return prev;
      return `${trimmed}\n${prompt} `;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isContentValid) {
      setErrorMsg(t("feedbackLengthError"));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createMemberFeedback({
        rating,
        content: content.trim(),
      });
      toast.success(
        t("feedbackCreatedSuccess") || "Thank you! Your feedback has been published."
      );
      setContent("");
      setRating(5);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data;
      const message = Array.isArray(errorData?.message)
        ? errorData?.message.join(", ")
        : errorData?.message || t("feedbackSubmitError");
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-feedback-title"
        className="w-full max-w-lg bg-card text-card-foreground rounded-2xl border border-border/60 shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/40 shrink-0">
          <div>
            <h2
              id="create-feedback-title"
              className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              {t("shareYourFeedback") || "Share Your Feedback"}
            </h2>
            <p className="text-xs text-toota-muted mt-0.5">
              {t("feedbackHelpCommunity") ||
                "Tell us about your workout experience and facility quality."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Star Rating Section */}
          <fieldset className="min-w-0 space-y-3 rounded-2xl border border-border bg-background p-4">
            <legend className="px-1 text-sm font-semibold text-toota-ink">
              {t("overallRating")}
            </legend>
            <p id="feedback-rating-hint" className="text-xs leading-relaxed text-toota-muted">
              {t("feedbackRatingHint")}
            </p>
            <div
              className="grid grid-cols-5 gap-2"
              role="group"
              aria-label={t("overallRating")}
              aria-describedby="feedback-rating-hint"
              onMouseLeave={() => setHoveredRating(null)}
            >
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = starValue <= currentActiveRating;
                const isSelected = starValue === rating;
                const ratingLabel = t(RATING_LABELS[starValue]);
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isSelected
                        ? "border-toota-lime bg-toota-lime text-zinc-950 shadow-xs"
                        : "border-border bg-card text-toota-ink hover:border-toota-lime hover:bg-toota-lime/10"
                    }`}
                    title={ratingLabel}
                    aria-pressed={isSelected}
                    aria-label={t("feedbackRatingOption", { value: starValue, label: ratingLabel })}
                  >
                    <Star
                      aria-hidden="true"
                      className={`size-5 transition-colors ${
                        isSelected
                          ? `text-zinc-950 ${isFilled ? "fill-current" : ""}`
                          : isFilled
                          ? "fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400"
                          : "text-toota-muted"
                      }`}
                    />
                    <span className="tabular-nums">{starValue}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-toota-ink">
              <span>{t(RATING_LABELS[currentActiveRating])}</span>
              <span className="rounded-lg border border-border bg-card px-2 py-1 text-xs tabular-nums">
                {currentActiveRating} / 5
              </span>
            </div>
          </fieldset>

          {/* Quick Suggestions / Topics */}
          <section aria-labelledby="feedback-topics-title" className="space-y-3">
            <div>
              <h3 id="feedback-topics-title" className="text-sm font-semibold text-toota-ink flex items-center gap-2">
                <Sparkles aria-hidden="true" className="size-4 text-toota-ink" />
                {t("suggestedTopics")}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-toota-muted">{t("feedbackTopicsHint")}</p>
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
              {SUGGESTED_TOPICS.map((topicKey) => {
                const topic = t(topicKey);
                const isAdded = content.includes(topic);
                return (
                  <button
                    key={topicKey}
                    type="button"
                    onClick={() => handleTopicClick(topic)}
                    aria-label={isAdded ? t("feedbackTopicAdded", { topic }) : topic}
                    className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                      isAdded
                        ? "border-toota-lime bg-toota-lime/10 text-toota-ink"
                        : "border-border bg-background text-toota-ink hover:border-toota-lime hover:bg-toota-lime/10"
                    }`}
                  >
                    {isAdded ? <Check aria-hidden="true" className="size-4 shrink-0" /> : <Plus aria-hidden="true" className="size-4 shrink-0" />}
                    <span className="min-w-0 [overflow-wrap:anywhere]">{topic}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Feedback Content Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="feedback-content"
                className="text-xs font-semibold text-toota-muted uppercase tracking-wider"
              >
                {t("yourReview") || "Your Feedback"}
              </label>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  charCount > 1000
                    ? "text-destructive font-semibold"
                    : charCount < 3
                    ? "text-toota-muted"
                    : "text-toota-green font-semibold"
                }`}
              >
                {charCount} / 1000
              </span>
            </div>

            <textarea
              id="feedback-content"
              rows={4}
              required
              minLength={3}
              maxLength={1000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                t("feedbackPlaceholder") ||
                "Describe what went well during your visit, cleanliness, workout equipment, or suggestions for the gym staff..."
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-toota-inner border border-border/40 text-toota-ink placeholder:text-toota-muted focus:outline-hidden focus:ring-1 focus:ring-zinc-400 text-xs leading-relaxed transition-all resize-none"
            />
          </div>

          {/* Modal Footer Actions */}
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
              disabled={isSubmitting || !isContentValid}
              className="toota-pill h-9 px-4 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin me-1.5" />
                  <span>{t("submitting") || "Publishing..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5 me-1.5" />
                  <span>{t("submitFeedback") || "Publish Feedback"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
