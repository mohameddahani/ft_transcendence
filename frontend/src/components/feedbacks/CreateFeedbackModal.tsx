"use client";

import React, { useState } from "react";
import {
  X,
  Star,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
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

const RATING_DESCRIPTIONS: Record<
  number,
  { label: string; tone: string }
> = {
  1: {
    label: "Poor",
    tone: "Experienced significant issues that need immediate attention.",
  },
  2: {
    label: "Fair",
    tone: "Below expectations, noticeable room for facility improvements.",
  },
  3: {
    label: "Good",
    tone: "Standard satisfactory workout session, decent facilities.",
  },
  4: {
    label: "Very Good",
    tone: "High quality gear, clean workout floor, friendly staff.",
  },
  5: {
    label: "Exceptional",
    tone: "Peak fitness environment, immaculate facility & top equipment!",
  },
};

const SUGGESTED_TOPICS = [
  "Gym Cleanliness",
  "Equipment Availability",
  "Locker Rooms",
  "Trainer Support",
  "Air Conditioning",
  "Atmosphere & Music",
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
  const ratingInfo = RATING_DESCRIPTIONS[currentActiveRating] || RATING_DESCRIPTIONS[5];
  const charCount = content.trim().length;
  const isContentValid = charCount >= 3 && charCount <= 1000;

  const handleTopicClick = (topic: string) => {
    setContent((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return `Regarding ${topic}: `;
      if (trimmed.includes(topic)) return prev;
      return `${trimmed}\nRegarding ${topic}: `;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isContentValid) {
      setErrorMsg("Feedback must contain between 3 and 1000 characters.");
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
        : errorData?.message || "Failed to submit feedback. Please try again.";
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
            <div className="flex items-baseline gap-2">
              <h2
                id="create-feedback-title"
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
              >
                {t("shareYourFeedback") || "Share Your Feedback"}
              </h2>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {currentActiveRating}.0 ★
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-0.5">
              {t("feedbackHelpCommunity") ||
                "Tell us about your workout experience and facility quality."}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Star Rating Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-toota-muted uppercase tracking-wider">
              {t("overallRating") || "Your Experience Rating"}
            </label>

            <div className="p-4 rounded-xl bg-toota-inner border border-border/40 flex flex-col items-center gap-2 text-center">
              {/* Stars */}
              <div
                className="flex items-center gap-2"
                onMouseLeave={() => setHoveredRating(null)}
              >
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= currentActiveRating;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoveredRating(starValue)}
                      className="p-1.5 rounded-lg hover:scale-110 active:scale-95 transition-all cursor-pointer focus:outline-hidden"
                      title={`${starValue} Star`}
                      aria-label={`${starValue} Star`}
                    >
                      <Star
                        className={`size-6 transition-colors ${
                          isFilled
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-300 dark:text-zinc-700"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Rating Label */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs font-semibold text-toota-ink">
                  {currentActiveRating} / 5 • {ratingInfo.label}
                </span>
                <span className="text-[11px] text-toota-muted max-w-xs">
                  {ratingInfo.tone}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Suggestions / Topics */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-toota-muted flex items-center gap-1.5">
              <Sparkles className="size-3 text-amber-500" />
              {t("suggestedTopics") || "Tap to mention specific topics:"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicClick(topic)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-toota-inner hover:bg-zinc-200/60 dark:hover:bg-zinc-800 border border-border/40 text-toota-muted hover:text-toota-ink transition-all cursor-pointer active:scale-95"
                >
                  + {topic}
                </button>
              ))}
            </div>
          </div>

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
