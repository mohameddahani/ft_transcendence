"use client";

import React, { useState } from "react";
import {
  X,
  Star,
  MessageSquare,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { createMemberFeedback } from "@/lib/api/member-portal";

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RATING_DESCRIPTIONS: Record<
  number,
  { label: string; tone: string; color: string }
> = {
  1: {
    label: "Poor",
    tone: "Experienced significant issues that need immediate attention.",
    color: "text-rose-500",
  },
  2: {
    label: "Fair",
    tone: "Below expectations, noticeable room for facility improvements.",
    color: "text-amber-500",
  },
  3: {
    label: "Good",
    tone: "Standard satisfactory workout session, decent facilities.",
    color: "text-yellow-500",
  },
  4: {
    label: "Very Good",
    tone: "High quality gear, clean workout floor, friendly staff.",
    color: "text-emerald-500",
  },
  5: {
    label: "Exceptional",
    tone: "Peak fitness environment, immaculate facility & top equipment!",
    color: "text-primary",
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-feedback-title"
        className="w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-outline-variant/50 bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="create-feedback-title"
                className="font-headline font-bold text-lg text-on-surface tracking-tight"
              >
                {t("shareYourFeedback") || "Share Your Feedback"}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                {t("feedbackHelpCommunity") ||
                  "Tell us about your workout experience and facility quality."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-error/10 border border-error/20 text-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Star Rating Section */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t("overallRating") || "Your Experience Rating"}
            </label>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col items-center gap-2.5 text-center">
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
                      className="p-1.5 rounded-xl hover:scale-115 active:scale-95 transition-all cursor-pointer focus:outline-hidden"
                      title={`${starValue} Star`}
                      aria-label={`${starValue} Star`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]"
                            : "text-outline-variant/70 hover:text-outline-variant"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Rating Label */}
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-sm font-bold tracking-tight ${ratingInfo.color}`}>
                  {currentActiveRating} / 5 • {ratingInfo.label}
                </span>
                <span className="text-[11px] text-on-surface-variant max-w-xs">
                  {ratingInfo.tone}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Suggestions / Topics */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              {t("suggestedTopics") || "Tap to mention specific topics:"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicClick(topic)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface-container-low hover:bg-surface-container border border-outline-variant/50 text-on-surface-variant hover:text-on-surface transition-all cursor-pointer active:scale-95"
                >
                  + {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Content Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="feedback-content"
                className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
              >
                {t("yourReview") || "Your Feedback"}
              </label>
              <span
                className={`text-[11px] font-medium ${
                  charCount > 1000
                    ? "text-error font-bold"
                    : charCount < 3
                    ? "text-on-surface-variant"
                    : "text-primary"
                }`}
              >
                {charCount} / 1000 characters
              </span>
            </div>

            <textarea
              id="feedback-content"
              rows={5}
              required
              minLength={3}
              maxLength={1000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                t("feedbackPlaceholder") ||
                "Describe what went well during your visit, cleanliness, workout equipment, or suggestions for the gym staff..."
              }
              className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/50 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm leading-relaxed transition-all resize-none shadow-inner"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-outline-variant/60 text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            >
              {t("cancel") || "Cancel"}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isContentValid}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl primary-gradient text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("submitting") || "Publishing..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("submitFeedback") || "Publish Feedback"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
