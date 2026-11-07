"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Star,
  Heart,
  Trash2,
  Calendar,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeedbackItem } from "@/types/feedback";
import { fetchMemberFeedbackById } from "@/lib/api/member-portal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

  const memberName =
    `${detail.member?.firstName || ""} ${detail.member?.lastName || ""}`.trim() ||
    detail.member?.userName ||
    "Gym Member";
  const initials =
    ((detail.member?.firstName?.[0] || "") + (detail.member?.lastName?.[0] || "")).toUpperCase() ||
    detail.member?.userName?.slice(0, 2).toUpperCase() ||
    "M";

  const rawPhoto = detail.member?.profileImageUrl || detail.member?.photo;
  const isPlaceholder =
    !rawPhoto ||
    rawPhoto === "default-image.jpg" ||
    rawPhoto === "default-member-image.jpg";
  const photo = !isPlaceholder ? rawPhoto : null;

  const formattedDate = new Date(detail.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isResolved = detail.feedbackStatus === "RESOLVED";
  const likeCount = detail.likeCount ?? detail._count?.likes ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-detail-title"
        className="w-full max-w-lg bg-card text-card-foreground rounded-2xl border border-border/60 shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 ring-1 ring-border/40 shrink-0">
              {photo && <AvatarImage src={photo} alt={memberName} />}
              <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-baseline gap-2">
                <h3
                  id="feedback-detail-title"
                  className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                >
                  {memberName}
                </h3>
                {isOwnFeedback && (
                  <span className="inline-flex items-center rounded-md px-1.5 py-0.2 text-[10px] font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {t("you") || "You"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-toota-muted mt-0.5">
                <Calendar className="size-3 shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>
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

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-toota-muted">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Updating review details...</span>
            </div>
          )}

          {/* Status & Rating Bar */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-toota-inner border border-border/40">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`size-4 ${
                    star <= detail.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
              <span className="font-mono text-xs font-semibold text-toota-ink ms-1">
                {detail.rating}.0 / 5.0
              </span>
            </div>

            {/* Micro-Badge Status */}
            {isResolved ? (
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("statusResolved") || "Resolved"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{t("statusUnderReview") || "Under Review"}</span>
              </span>
            )}
          </div>

          {/* Review Message */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-toota-muted uppercase tracking-wider">
              {t("review") || "Review"}
            </span>
            <div className="p-3.5 rounded-xl bg-toota-inner border border-border/40">
              <p className="text-xs text-toota-ink leading-relaxed">
                &ldquo;{detail.content}&rdquo;
              </p>
            </div>
          </div>

          {/* Management Resolution */}
          {detail.resolutionNote && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-toota-muted uppercase tracking-wider">
                {t("managementResponse") || "Management Response"}
              </span>
              <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5 shrink-0" />
                  <span>Gym Management</span>
                  {detail.resolvedAt && (
                    <span className="text-[11px] text-toota-muted font-normal font-mono ms-auto">
                      {new Date(detail.resolvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-toota-ink/90 leading-relaxed">
                  {detail.resolutionNote}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-border/40 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleLike(detail.id)}
            className={`toota-pill h-8 px-3 text-xs font-semibold cursor-pointer ${
              isLiked
                ? "border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
                : "border-border/40 text-toota-muted hover:text-toota-ink hover:bg-toota-inner"
            }`}
          >
            <Heart
              className={`size-3.5 me-1.5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`}
            />
            <span>{likeCount} {t("likes") || "Likes"}</span>
          </Button>

          <div className="flex items-center gap-2">
            {isOwnFeedback && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onDeleteRequest(detail)}
                className="toota-pill h-8 px-3 text-xs font-semibold cursor-pointer"
              >
                <Trash2 className="size-3.5 me-1.5" />
                <span>{t("delete") || "Delete"}</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="toota-pill h-8 px-4 text-xs font-semibold border-border/50 text-toota-ink cursor-pointer"
            >
              {t("close") || "Close"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
