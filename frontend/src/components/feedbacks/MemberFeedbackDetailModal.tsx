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
    t("member");
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
        className="w-full max-w-lg bg-card text-card-foreground rounded-2xl border border-border shadow-xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-border shrink-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="size-8 ring-1 ring-border shrink-0">
              {photo && <AvatarImage src={photo} alt={memberName} />}
              <AvatarFallback className="bg-background text-toota-ink font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="feedback-detail-title"
                  className="text-sm font-semibold tracking-tight text-toota-ink [overflow-wrap:anywhere]"
                >
                  {memberName}
                </h3>
                {isOwnFeedback && (
                  <span className="inline-flex items-center rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t("yourReview")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Calendar aria-hidden="true" className="size-3.5 shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>
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

        {/* Content Body */}
        <div className="min-h-0 flex-1 p-4 space-y-4 overflow-y-auto overscroll-contain">
          {isLoading && (
            <div role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              <span>{t("feedbackUpdatingDetails")}</span>
            </div>
          )}

          {/* Status & Rating Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex max-w-full flex-wrap items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  aria-hidden="true"
                  className={`size-3.5 ${
                    star <= detail.rating
                      ? "fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
              <span className="text-xs tabular-nums font-semibold text-toota-ink ms-1">
                {detail.rating} / 5
              </span>
            </div>

            {/* Micro-Badge Status */}
            {isResolved ? (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-950 dark:text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("statusResolved") || "Resolved"}</span>
              </span>
            ) : (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-amber-600/20 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:border-amber-400/25 dark:bg-amber-950 dark:text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{t("statusUnderReview") || "Under Review"}</span>
              </span>
            )}
          </div>

          {/* Review Message */}
          <section aria-labelledby="feedback-review-title" className="min-w-0 space-y-2">
            <h4 id="feedback-review-title" className="text-xs font-semibold text-toota-ink">
              {t("memberReviewText")}
            </h4>
            <p dir="auto" className="rounded-xl border border-border bg-background p-3 text-[13px] leading-5 text-toota-ink whitespace-pre-wrap [overflow-wrap:anywhere]">
              {detail.content}
            </p>
          </section>

          {/* Management Resolution */}
          {detail.resolutionNote && (
            <section aria-labelledby="feedback-response-title" className="p-3 rounded-xl bg-background border border-border border-s-2 border-s-emerald-500 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 id="feedback-response-title" className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" />
                  {t("managementResponse")}
                </h4>
                {detail.resolvedAt && (
                  <span className="text-xs text-muted-foreground ms-auto">
                    {new Date(detail.resolvedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p dir="auto" className="text-[13px] text-toota-ink leading-5 whitespace-pre-wrap [overflow-wrap:anywhere]">
                {detail.resolutionNote}
              </p>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:px-4 border-t border-border shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleLike(detail.id)}
            aria-label={t("feedbackLikeAction")}
            aria-pressed={isLiked}
            className={`h-9 rounded-lg px-3 text-xs font-semibold cursor-pointer ${
              isLiked
                ? "border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
                : "border-border bg-background text-toota-ink hover:bg-muted"
            }`}
          >
            <Heart
              aria-hidden="true"
              className={`size-3.5 me-1.5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`}
            />
            <span>{likeCount}</span>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {isOwnFeedback && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onDeleteRequest(detail)}
                className="h-9 rounded-lg px-3 text-xs font-semibold cursor-pointer"
              >
                <Trash2 aria-hidden="true" className="size-3.5 me-1.5" />
                <span>{t("delete") || "Delete"}</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 rounded-lg px-3 text-xs font-semibold border-border text-toota-ink cursor-pointer"
            >
              {t("close") || "Close"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
