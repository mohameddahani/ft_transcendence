"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Star,
  Heart,
  CheckCircle2,
  Clock,
  Trash2,
  Calendar,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeedbackItem } from "@/types/feedback";
import { fetchMemberFeedbackById } from "@/lib/api/member-portal";

interface MemberFeedbackDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: FeedbackItem | null;
  isLiked: boolean;
  onToggleLike: (id: string) => void;
  isOwnFeedback: boolean;
  onDeleteRequest: (feedback: FeedbackItem) => void;
}

export default function MemberFeedbackDetailModal({
  isOpen,
  onClose,
  feedback,
  isLiked,
  onToggleLike,
  isOwnFeedback,
  onDeleteRequest,
}: MemberFeedbackDetailModalProps) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<FeedbackItem | null>(feedback);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && feedback?.id) {
      setDetail(feedback);
      setIsLoading(true);
      fetchMemberFeedbackById(feedback.id)
        .then((fresh) => {
          if (fresh) setDetail(fresh);
        })
        .catch(() => {
          // Fallback to initial feedback
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, feedback]);

  if (!isOpen || !detail) return null;

  const memberName = `${detail.member.firstName || ""} ${detail.member.lastName || ""}`.trim() || "Gym Member";
  const initials = (detail.member.firstName?.[0] || "") + (detail.member.lastName?.[0] || "") || "M";
  const formattedDate = new Date(detail.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const isResolved = detail.feedbackStatus === "RESOLVED";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-detail-title"
        className="w-full max-w-xl bg-surface-container-lowest rounded-3xl border border-outline-variant/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-outline-variant/50 bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3">
            {detail.member.profileImage || detail.member.photo ? (
              <img
                src={(detail.member.profileImage || detail.member.photo) as string}
                alt={memberName}
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-primary/20 shadow-2xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center ring-2 ring-primary/20 shadow-2xs">
                {initials}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="feedback-detail-title"
                  className="font-headline font-bold text-base text-on-surface"
                >
                  {memberName}
                </h3>
                {isOwnFeedback && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wider">
                    {t("you") || "You"}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 opacity-60" />
                <span>{formattedDate}</span>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {isLoading && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}

          {/* Rating & Status Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40">
            {/* Stars */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= detail.rating
                      ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                      : "text-outline-variant/50"
                  }`}
                />
              ))}
              <span className="text-sm font-bold text-on-surface ms-1.5">
                {detail.rating}.0 / 5.0
              </span>
            </div>

            {/* Status Badge */}
            {isResolved ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("statusResolved") || "Resolved"}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>{t("statusUnderReview") || "Under review"}</span>
              </div>
            )}
          </div>

          {/* Feedback Content */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              {t("reviewDetails") || "Feedback Submission"}
            </span>
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 relative">
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
                &ldquo;{detail.content}&rdquo;
              </p>
            </div>
          </div>

          {/* Administrative Resolution Note (If resolved) */}
          {detail.resolutionNote && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide text-[11px]">
                  <ShieldCheck className="w-4 h-4" />
                  {t("managementResponse") || "Gym Management Response"}
                </span>
                {detail.resolvedAt && (
                  <span className="text-[10px] text-on-surface-variant">
                    {new Date(detail.resolvedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line">
                {detail.resolutionNote}
              </p>
            </div>
          )}

          {/* Interaction Row: Likes & Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => onToggleLike(detail.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isLiked
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/40"
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  isLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
                }`}
              />
              <span>
                {detail._count?.likes || 0} {t("likes") || "Likes"}
              </span>
            </button>

            {isOwnFeedback && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteRequest(detail);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error/10 border border-error/20 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t("delete") || "Delete"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-outline-variant/40 bg-surface-container-low/30 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors cursor-pointer"
          >
            {t("close") || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
