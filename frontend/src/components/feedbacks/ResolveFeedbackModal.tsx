"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  MessageSquare,
  Sparkles,
  Phone,
  Mail,
  ThumbsUp,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { FeedbackItem, FeedbackStatus } from "@/types/feedback";
import { useTranslation } from "react-i18next";

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
      // Default to RESOLVED if open, or current status
      setSelectedStatus(
        feedback.feedbackStatus === "OPEN" ? "RESOLVED" : feedback.feedbackStatus
      );
      setResolutionNote(feedback.resolutionNote || "");
      setValidationError(null);
    }
  }, [feedback]);

  if (!isOpen || !feedback) return null;

  const member = feedback.member;
  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Member";
  const initials = `${(member.firstName || "")[0] || ""}${(member.lastName || "")[0] || ""}`.toUpperCase() || "M";
  const photo = member.photo || member.profileImage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const noteTrimmed = resolutionNote.trim();
    if (noteTrimmed && noteTrimmed.length < 3) {
      setValidationError(t("resolutionNoteMinLength") || "Resolution note must be at least 3 characters.");
      return;
    }
    if (noteTrimmed && noteTrimmed.length > 1000) {
      setValidationError(t("resolutionNoteMaxLength") || "Resolution note cannot exceed 1000 characters.");
      return;
    }

    await onSave(feedback.id, selectedStatus, noteTrimmed || undefined);
    onClose();
  };

  const formattedDate = new Date(feedback.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-surface-bright rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/60 p-6 z-10 animate-in zoom-in-95 duration-200 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-outline-variant/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {t("feedbackResolution") || "Member Feedback & Resolution"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/50">
                <Lock className="w-3 h-3" />
                Immutable Member Submission
              </span>
            </div>
            <h3 className="font-headline text-lg font-bold text-on-surface mt-1">
              {t("reviewAndResolve") || "Review & Update Status"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member & Feedback Snapshot (Read-Only Section) */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-3">
          {/* Member Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 border border-outline-variant/50">
                {photo && photo !== "default-image.jpg" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-sm text-on-surface">{fullName}</h4>
                <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                  {member.phoneNumber && (
                    <span className="flex items-center gap-1" dir="ltr">
                      <Phone className="w-3 h-3 text-primary" />
                      {member.phoneNumber}
                    </span>
                  )}
                  {member.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-primary" />
                      {member.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-1 bg-surface-bright px-2.5 py-1 rounded-lg border border-outline-variant/50">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= feedback.rating
                      ? "text-amber-400 fill-amber-400"
                      : "text-outline-variant"
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-on-surface ml-1">
                {feedback.rating}.0
              </span>
            </div>
          </div>

          {/* Member's Actual Message */}
          <div className="p-3.5 rounded-xl bg-surface-bright border border-outline-variant/40 text-xs text-on-surface leading-relaxed relative">
            <MessageSquare className="w-4 h-4 text-primary absolute top-3.5 left-3.5 opacity-30 pointer-events-none" />
            <p className="pl-6 italic font-medium">&quot;{feedback.content}&quot;</p>
            <div className="mt-2 text-[10px] text-on-surface-variant text-right">
              Submitted on {formattedDate}
            </div>
          </div>
        </div>

        {/* Resolution Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface">
              {t("setFeedbackStatus") || "Set Resolution Status"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  {
                    value: "RESOLVED",
                    label: t("statusResolved") || "Resolved",
                    color: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
                    activeColor: "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20",
                  },
                  {
                    value: "IN_REVIEW",
                    label: t("statusInReview") || "In Review",
                    color: "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10",
                    activeColor: "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20",
                  },
                  {
                    value: "OPEN",
                    label: t("statusOpen") || "Open",
                    color: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
                    activeColor: "bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20",
                  },
                  {
                    value: "DISMISSED",
                    label: t("statusDismissed") || "Dismissed",
                    color: "border-slate-500/40 text-slate-600 dark:text-slate-400 bg-slate-500/10",
                    activeColor: "bg-slate-600 text-white font-bold shadow-md shadow-slate-600/20",
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedStatus(option.value)}
                  className={`py-2 px-3 rounded-xl text-xs transition-all cursor-pointer border text-center ${
                    selectedStatus === option.value
                      ? option.activeColor
                      : `${option.color} hover:opacity-90`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Note Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-on-surface">
              <label>{t("resolutionNote") || "Staff / Admin Resolution Note"}</label>
              <span className="text-[11px] font-normal text-on-surface-variant">
                {resolutionNote.length}/1000 characters
              </span>
            </div>
            <textarea
              rows={4}
              placeholder={
                t("resolutionNotePlaceholder") ||
                "Describe how this feedback was addressed (e.g. Spoke with member, cleaned locker room area, updated equipment settings)..."
              }
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full p-3 bg-surface-bright border border-outline-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-on-surface-variant/50 leading-relaxed resize-none"
            />
            {validationError && (
              <p className="text-[11px] text-error font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationError}
              </p>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl primary-gradient text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("saveResolution") || "Save Resolution"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
