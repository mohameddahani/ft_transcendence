"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageSquare,
  Star,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  ChevronRight,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FeedbackItem, FeedbackStatus, SentimentType } from "@/types/feedback";
import { fetchAllFeedbacks, updateFeedbackStatus } from "@/lib/api/feedbacks";
import ResolveFeedbackModal from "@/components/feedbacks/ResolveFeedbackModal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import MemberFeedbackView from "@/components/feedbacks/MemberFeedbackView";

const SENTIMENT_STYLES: Record<SentimentType, string> = {
  POSITIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  NEUTRAL: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  NEGATIVE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

// 5 stars with an angry text, or 1 star with a happy one: worth a second look
const starsDisagree = (f: FeedbackItem) =>
  (f.rating >= 4 && f.sentiment === "NEGATIVE") ||
  (f.rating <= 2 && f.sentiment === "POSITIVE");

function AdminStaffFeedbackView() {
  const { t } = useTranslation();

  // Data state
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | FeedbackStatus>("ALL");
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  const [sentimentFilter, setSentimentFilter] = useState<"ALL" | "NONE" | SentimentType>("ALL");

  // Modal state
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Feedbacks
  const loadFeedbacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllFeedbacks(1, 100);
      setFeedbacks(data);
      console.log(data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load member feedback roster.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const bySentiment = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0, NONE: 0 };
    for (const f of feedbacks) {
      if (f.sentiment && bySentiment[f.sentiment] !== undefined) {
        bySentiment[f.sentiment] += 1;
      } else {
        bySentiment.NONE += 1;
      }
    }
    const analysedCount =
      bySentiment.POSITIVE + bySentiment.NEUTRAL + bySentiment.NEGATIVE;
    const positivePercent =
      analysedCount > 0
        ? Math.round((bySentiment.POSITIVE / analysedCount) * 100)
        : null;

    if (total === 0) {
      return {
        total: 0,
        averageRating: "5.0",
        openCount: 0,
        resolvedCount: 0,
        positivePercent: null,
        analysedCount: 0,
        bySentiment,
      };
    }

    const sumRating = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    const averageRating = (sumRating / total).toFixed(1);

    const openCount = feedbacks.filter(
      (f) => f.feedbackStatus === "OPEN" || f.feedbackStatus === "IN_REVIEW"
    ).length;

    const resolvedCount = feedbacks.filter(
      (f) => f.feedbackStatus === "RESOLVED"
    ).length;

    return {
      total,
      averageRating,
      openCount,
      resolvedCount,
      positivePercent,
      analysedCount,
      bySentiment,
    };
  }, [feedbacks]);

  // Filtered List
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const memberName = `${f.member?.firstName || ""} ${f.member?.lastName || ""}`.toLowerCase();
      const content = (f.content || "").toLowerCase();
      const note = (f.resolutionNote || "").toLowerCase();
      const email = (f.member?.email || "").toLowerCase();
      const phone = (f.member?.phoneNumber || "").toLowerCase();

      // Search matching
      if (
        searchTerm &&
        !memberName.includes(searchTerm.toLowerCase()) &&
        !content.includes(searchTerm.toLowerCase()) &&
        !note.includes(searchTerm.toLowerCase()) &&
        !email.includes(searchTerm.toLowerCase()) &&
        !phone.includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Status matching
      if (statusFilter !== "ALL" && f.feedbackStatus !== statusFilter) {
        return false;
      }

      // Rating matching
      if (ratingFilter !== "ALL" && f.rating !== ratingFilter) {
        return false;
      }

      // Sentiment matching ("NONE" = not analysed yet)
      if (sentimentFilter === "NONE" && f.sentiment) return false;
      if (
        sentimentFilter !== "ALL" &&
        sentimentFilter !== "NONE" &&
        f.sentiment !== sentimentFilter
      ) {
        return false;
      }

      return true;
    });
  }, [feedbacks, searchTerm, statusFilter, ratingFilter, sentimentFilter]);

  // Handle Update Status & Resolution Note
  const handleSaveResolution = async (
    id: string,
    status: FeedbackStatus,
    note?: string
  ) => {
    setIsSubmitting(true);
    try {
      await updateFeedbackStatus(id, {
        feedbackStatus: status,
        resolutionNote: note,
      });

      toast.success(t("feedbackUpdatedSuccess") || "Feedback status updated successfully!");
      await loadFeedbacks();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to update feedback status.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredFeedbacks.length === 0) {
      toast.info("No feedback records available to export.");
      return;
    }

    const headers = [
      "Member Name",
      "Rating",
      "Sentiment",
      "Sentiment Confidence",
      "Status",
      "Member Feedback",
      "Resolution Note",
      "Submitted At",
      "Resolved At",
    ];

    const rows = filteredFeedbacks.map((f) => [
      `"${f.member?.firstName || ""} ${f.member?.lastName || ""}"`,
      f.rating,
      f.sentiment ?? "",
      f.sentimentScore ?? "",
      f.feedbackStatus,
      `"${f.content.replace(/"/g, '""')}"`,
      `"${(f.resolutionNote || "").replace(/"/g, '""')}"`,
      f.createdAt ? f.createdAt.split("T")[0] : "",
      f.resolvedAt ? f.resolvedAt.split("T")[0] : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `gymflow_feedbacks_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Feedback records exported to CSV!");
  };

  return (
    <div className="space-y-6 max-w-container-max mx-auto pb-16">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl primary-gradient text-white flex items-center justify-center shadow-md shadow-primary/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {t("navFeedback") || "Member Feedback & Reviews"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                {t("qualitySentiment")}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {t("feedbacksSubtitle") ||
                "Monitor member satisfaction, review incoming feedback, and document resolution notes."}
            </p>
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadFeedbacks}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-variant transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t("refresh") || "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-variant transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>{t("export") || "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Satisfaction & Sentiment Metrics Quad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Average Rating */}
        <div className="p-4 rounded-2xl bg-surface-bright border border-outline-variant/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {t("averageRating") || "Average Satisfaction"}
            </span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-bold font-headline text-on-surface flex items-baseline gap-1.5">
            <span>{stats.averageRating}</span>
            <span className="text-xs font-normal text-on-surface-variant">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${
                  star <= Math.round(Number(stats.averageRating))
                    ? "fill-amber-400 text-amber-400"
                    : "text-outline-variant"
                }`}
              />
            ))}
            <span className="text-on-surface-variant ml-1 font-normal">
              {t("basedOnReviewsCount", { count: stats.total })}
            </span>
          </div>
        </div>

        {/* Metric 2: Open / Pending Action */}
        <div className="p-4 rounded-2xl bg-surface-bright border border-outline-variant/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {t("pendingReview") || "Awaiting Resolution"}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-headline text-amber-600 dark:text-amber-400">
            {stats.openCount}
            <span className="text-xs font-normal text-on-surface-variant ml-1.5">
              {t("activeTickets")}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{t("requiresAdminReview")}</span>
          </p>
        </div>

        {/* Metric 3: Successfully Resolved */}
        <div className="p-4 rounded-2xl bg-surface-bright border border-outline-variant/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {t("resolvedTickets") || "Resolved Inquiries"}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-headline text-emerald-600 dark:text-emerald-400">
            {stats.resolvedCount}
            <span className="text-xs font-normal text-on-surface-variant ml-1.5">
              {t("closedTickets")}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            {t("documentedWithNotes")}
          </p>
        </div>

        {/* Metric 4: Positive Sentiment Ratio */}
        <div className="p-4 rounded-2xl bg-surface-bright border border-outline-variant/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {t("positiveSentiment") || "Positive Sentiment"}
            </span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-headline text-primary">
            {stats.positivePercent === null ? "—" : `${stats.positivePercent}%`}
            <span className="text-xs font-normal text-on-surface-variant ml-1.5">
              {t("ofAnalysedComments", { count: stats.analysedCount })}
            </span>
          </div>
          {/* Visual bar */}
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${stats.positivePercent ?? 0}%` }}
            />
          </div>
          {/* Sentiment split breakdown links */}
          <div className="flex items-center gap-2 pt-1 text-[10px] font-semibold flex-wrap">
            <button
              type="button"
              onClick={() => setSentimentFilter("POSITIVE")}
              className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              title={t("positiveOnly")}
            >
              {stats.bySentiment.POSITIVE} {t("sentiment_POSITIVE")?.toLowerCase()}
            </button>
            <span className="text-outline-variant/60">•</span>
            <button
              type="button"
              onClick={() => setSentimentFilter("NEUTRAL")}
              className="text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
              title={t("neutralOnly")}
            >
              {stats.bySentiment.NEUTRAL} {t("sentiment_NEUTRAL")?.toLowerCase()}
            </button>
            <span className="text-outline-variant/60">•</span>
            <button
              type="button"
              onClick={() => setSentimentFilter("NEGATIVE")}
              className="text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              title={t("negativeOnly")}
            >
              {stats.bySentiment.NEGATIVE} {t("sentiment_NEGATIVE")?.toLowerCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant">
        {/* Search Input */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder={t("searchFeedbackPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-on-surface-variant/60"
          />
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-on-surface-variant shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | FeedbackStatus)
            }
            className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none cursor-pointer"
          >
            <option value="ALL">{t("allStatuses")} ({feedbacks.length})</option>
            <option value="OPEN">{t("statusOpen")}</option>
            <option value="IN_REVIEW">{t("statusInReview")}</option>
            <option value="RESOLVED">{t("statusResolved")}</option>
            <option value="DISMISSED">{t("statusDismissed")}</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div className="lg:col-span-2 flex items-center gap-2">
          <Star className="w-4 h-4 text-on-surface-variant shrink-0" />
          <select
            value={ratingFilter}
            onChange={(e) =>
              setRatingFilter(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value)
              )
            }
            className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none cursor-pointer"
          >
            <option value="ALL">{t("allStarRatings")}</option>
            <option value={5}>{t("fiveStarsOnly")}</option>
            <option value={4}>{t("fourStars")}</option>
            <option value={3}>{t("threeStars")}</option>
            <option value={2}>{t("twoStars")}</option>
            <option value={1}>{t("oneStarOnly")}</option>
          </select>
        </div>

        {/* Sentiment Filter */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-on-surface-variant shrink-0" />
          <select
            value={sentimentFilter}
            onChange={(e) =>
              setSentimentFilter(e.target.value as typeof sentimentFilter)
            }
            className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none cursor-pointer"
          >
            <option value="ALL">{t("allSentiments")}</option>
            <option value="NEGATIVE">
              {t("negativeOnly")} ({stats.bySentiment.NEGATIVE})
            </option>
            <option value="NEUTRAL">
              {t("neutralOnly")} ({stats.bySentiment.NEUTRAL})
            </option>
            <option value="POSITIVE">
              {t("positiveOnly")} ({stats.bySentiment.POSITIVE})
            </option>
            <option value="NONE">
              {t("sentimentNotAnalysed")} ({stats.bySentiment.NONE})
            </option>
          </select>
        </div>
      </div>

      {/* Feedback Feed Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center rounded-2xl bg-surface-bright border border-outline-variant/60">
            <RefreshCw className="w-7 h-7 animate-spin text-primary mx-auto mb-2" />
            <p className="font-semibold text-on-surface text-sm">
              {t("loadingFeedback")}
            </p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface-bright border border-outline-variant/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant">
              <MessageSquare className="w-6 h-6 opacity-40" />
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">
                {t("noFeedbackSubmissions")}
              </p>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
                {searchTerm ||
                statusFilter !== "ALL" ||
                ratingFilter !== "ALL" ||
                sentimentFilter !== "ALL"
                  ? t("noMatchingFilterReviews")
                  : t("emptyFeedbackPortalHint")}
              </p>
            </div>
          </div>
        ) : (
          filteredFeedbacks.map((item) => {
            const member = item.member;
            const fullName =
              `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
              "Member";
            const initials =
              `${(member?.firstName || "")[0] || ""}${(member?.lastName || "")[0] || ""}`.toUpperCase() ||
              "M";
            const photo = member?.profileImageUrl;

            const isResolved = item.feedbackStatus === "RESOLVED";
            const isOpen = item.feedbackStatus === "OPEN";
            const isInReview = item.feedbackStatus === "IN_REVIEW";

            const submittedDate = new Date(item.createdAt).toLocaleDateString(
              undefined,
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            );

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-surface-bright border border-outline-variant/60 shadow-xs space-y-4 hover:border-outline-variant transition-all"
              >
                {/* Card Top Row: Member info, Rating & Status Pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 border border-outline-variant/50">
                      {photo ? (
                         
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">
                          {fullName}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-medium">
                          • {submittedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars, Mismatch Warning, Sentiment Badge & Status Pill */}
                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/40">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= item.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-outline-variant"
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-on-surface ml-1">
                        {item.rating}.0
                      </span>
                    </div>

                    {/* Mismatch Warning Icon (when stars and sentiment disagree) */}
                    {starsDisagree(item) && (
                      <span
                        title={t("starsDisagreeHint")}
                        className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 cursor-help"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="hidden sm:inline">{t("starsDisagreeHint")}</span>
                      </span>
                    )}

                    {/* Sentiment Badge */}
                    {item.sentiment ? (
                      <span
                        title={t("sentimentConfidenceHint")}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-help ${
                          SENTIMENT_STYLES[item.sentiment]
                        }`}
                      >
                        {t(`sentiment_${item.sentiment}`)} ·{" "}
                        {Math.round(Number(item.sentimentScore ?? 0) * 100)}%
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-outline-variant text-on-surface-variant">
                        {t("sentimentNotAnalysed")}
                      </span>
                    )}

                    {/* Status Pill */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                        isResolved
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : isInReview
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : isOpen
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isResolved
                            ? "bg-emerald-500"
                            : isInReview
                            ? "bg-blue-500"
                            : isOpen
                            ? "bg-amber-500 animate-pulse"
                            : "bg-slate-500"
                        }`}
                      />
                      {isResolved
                        ? t("statusResolved")
                        : isInReview
                        ? t("statusInReview")
                        : isOpen
                        ? t("statusOpen")
                        : t("statusDismissed")}
                    </span>
                  </div>
                </div>

                {/* Member Review Body (Immutable) */}
                <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 text-xs text-on-surface leading-relaxed relative">
                  <p className="font-normal text-on-surface/90">
                    &quot;{item.content}&quot;
                  </p>
                </div>

                {/* Resolution Note Callout (If resolved or note exists) */}
                {item.resolutionNote && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {t("resolutionNoteShort")}
                      </span>
                      {item.resolvedAt && (
                        <span className="text-[10px] text-on-surface-variant font-normal">
                          Resolved on {new Date(item.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-on-surface-variant leading-relaxed text-[11px]">
                      {item.resolutionNote}
                    </p>
                  </div>
                )}

                {/* Card Action Row */}
                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30 text-xs">
                  <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Lock className="w-3 h-3 opacity-60" />
                      Member submission immutable
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFeedback(item);
                      setIsResolveModalOpen(true);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isResolved
                        ? "bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/50"
                        : "primary-gradient text-white shadow-xs hover:opacity-95 active:scale-[0.98]"
                    }`}
                  >
                    <span>
                      {isResolved
                        ? t("editResolutionNote") || "Edit Resolution Note"
                        : t("reviewAndResolve") || "Review & Resolve"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve / Status Update Modal */}
      <ResolveFeedbackModal
        isOpen={isResolveModalOpen}
        onClose={() => {
          setIsResolveModalOpen(false);
          setSelectedFeedback(null);
        }}
        feedback={selectedFeedback}
        onSave={handleSaveResolution}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default function FeedbacksPage() {
  const { role, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (role === "Member") {
    return <MemberFeedbackView />;
  }

  return <AdminStaffFeedbackView />;
}
