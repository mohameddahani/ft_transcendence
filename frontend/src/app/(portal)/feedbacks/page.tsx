"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
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
  Inbox,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FeedbackItem, FeedbackStatus, SentimentType } from "@/types/feedback";
import { fetchAllFeedbacks, updateFeedbackStatus } from "@/lib/api/feedbacks";
import ResolveFeedbackModal from "@/components/feedbacks/ResolveFeedbackModal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import MemberFeedbackView from "@/components/feedbacks/MemberFeedbackView";
import Pagination from "@/components/ui/Pagination";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

// 5 stars with an angry text, or 1 star with a happy one: worth a second look
const starsDisagree = (f: FeedbackItem) =>
  (f.rating >= 4 && f.sentiment === "NEGATIVE") ||
  (f.rating <= 2 && f.sentiment === "POSITIVE");

function AdminStaffFeedbackView() {
  const { t } = useTranslation();
  const { companyName } = useCurrentUser();

  // Data state
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [pagedFeedbacks, setPagedFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | FeedbackStatus>("ALL");
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  const [sentimentFilter, setSentimentFilter] = useState<"ALL" | "NONE" | SentimentType>("ALL");

  // Modal state
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Feedbacks from server
  const loadFeedbacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allData, pageData] = await Promise.all([
        fetchAllFeedbacks(1, 500),
        fetchAllFeedbacks(1, pageSize),
      ]);
      setFeedbacks(allData);
      setPagedFeedbacks(pageData);
      setCurrentPage(1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("loadFeedbackFailed") || "Failed to load member feedback roster.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [t, pageSize]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  // Statistics calculation across full dataset
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, ratingFilter, sentimentFilter]);

  // Filtered List
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const memberName = `${f.member?.firstName || ""} ${f.member?.lastName || ""}`.toLowerCase();
      const content = (f.content || "").toLowerCase();
      const note = (f.resolutionNote || "").toLowerCase();
      const email = (f.member?.email || "").toLowerCase();
      const phone = (f.member?.phoneNumber || "").toLowerCase();
      const username = (f.member?.userName || "").toLowerCase();

      // Search matching
      if (
        searchTerm &&
        !memberName.includes(searchTerm.toLowerCase()) &&
        !content.includes(searchTerm.toLowerCase()) &&
        !note.includes(searchTerm.toLowerCase()) &&
        !email.includes(searchTerm.toLowerCase()) &&
        !phone.includes(searchTerm.toLowerCase()) &&
        !username.includes(searchTerm.toLowerCase())
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

  // Paginated Feedbacks
  const isFiltering = Boolean(
    searchTerm ||
    statusFilter !== "ALL" ||
    ratingFilter !== "ALL" ||
    sentimentFilter !== "ALL"
  );
  const totalItems = isFiltering ? filteredFeedbacks.length : feedbacks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedFeedbacks = useMemo(() => {
    if (isFiltering) {
      const start = (currentPage - 1) * pageSize;
      return filteredFeedbacks.slice(start, start + pageSize);
    }
    return pagedFeedbacks.length > 0
      ? pagedFeedbacks
      : feedbacks.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [isFiltering, filteredFeedbacks, pagedFeedbacks, feedbacks, currentPage, pageSize]);

  // Handle page changes with explicit API calls when not filtering
  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    if (!isFiltering) {
      setIsPageLoading(true);
      try {
        const pageData = await fetchAllFeedbacks(newPage, pageSize);
        setPagedFeedbacks(pageData);
      } catch {
        // fail gracefully
      } finally {
        setIsPageLoading(false);
      }
    }
  };

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
      toast.info(t("noFeedbackToExport") || "No feedback records available to export.");
      return;
    }

    const headers = [
      "Member Name",
      "Username",
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
      `"${f.member?.userName || ""}"`,
      f.rating,
      f.sentiment ?? "",
      f.sentimentScore ?? "",
      f.feedbackStatus,
      `"${(f.content || "").replace(/"/g, '""')}"`,
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

    toast.success(t("feedbackExportSuccess") || "Feedback records exported to CSV!");
  };

  // Facility resolution fallback
  const gymFacilityName =
    companyName ||
    feedbacks[0]?.admin?.companyName ||
    "";

  // Crisp Outlined Micro-Badge for Feedback Status
  const renderFeedbackStatusBadge = (statusStr: FeedbackStatus | string) => {
    const s = (statusStr || "").toUpperCase();
    if (s === "RESOLVED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{t("statusResolved") || "Resolved"}</span>
        </span>
      );
    }
    if (s === "IN_REVIEW") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
          <span>{t("statusInReview") || "In Review"}</span>
        </span>
      );
    }
    if (s === "OPEN") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{t("statusOpen") || "Open"}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
        <span>{t("statusDismissed") || "Dismissed"}</span>
      </span>
    );
  };

  // Crisp Outlined Micro-Badge for Sentiment
  const renderSentimentBadge = (
    sentiment?: SentimentType | null,
    score?: number | string | null
  ) => {
    if (sentiment === "POSITIVE") {
      const pct = Math.round(Number(score ?? 0) * 100);
      return (
        <span
          title={t("sentimentConfidenceHint") || "AI Sentiment Analysis"}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{t("sentiment_POSITIVE") || "Positive"}{pct > 0 ? ` · ${pct}%` : ""}</span>
        </span>
      );
    }
    if (sentiment === "NEUTRAL") {
      const pct = Math.round(Number(score ?? 0) * 100);
      return (
        <span
          title={t("sentimentConfidenceHint") || "AI Sentiment Analysis"}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
          <span>{t("sentiment_NEUTRAL") || "Neutral"}{pct > 0 ? ` · ${pct}%` : ""}</span>
        </span>
      );
    }
    if (sentiment === "NEGATIVE") {
      const pct = Math.round(Number(score ?? 0) * 100);
      return (
        <span
          title={t("sentimentConfidenceHint") || "AI Sentiment Analysis"}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{t("sentiment_NEGATIVE") || "Negative"}{pct > 0 ? ` · ${pct}%` : ""}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
        <span>{t("sentimentNotAnalysed") || "Not Analyzed"}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Top Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("navFeedback") || "Member Feedback & Reviews"}
              </h1>
              {gymFacilityName && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {gymFacilityName}
                </span>
              )}
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {stats.total} {t("total") || "total"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t("feedbacksSubtitle") ||
                "Monitor member satisfaction, review incoming feedback, and document resolution notes."}
            </p>
          </div>

          {/* Global Header Actions */}
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={loadFeedbacks}
              disabled={isLoading}
              className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
            >
              <RefreshCw className={`size-3.5 me-2 ${isLoading ? "animate-spin" : ""}`} />
              <span>{t("refresh") || "Refresh"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportCSV}
              className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
            >
              <Download className="size-3.5 me-2 text-toota-muted" />
              <span>{t("export") || "Export CSV"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 4 Bento Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Average Satisfaction */}
        <Card className="toota-card border-none">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between text-xs text-toota-muted">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-toota-muted">
                {t("averageRating") || "Average Satisfaction"}
              </CardTitle>
              <Star className="size-4 text-amber-500 fill-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-toota-ink">
                {stats.averageRating}
              </span>
              <span className="font-mono text-xs text-toota-muted tabular-nums">
                / 5.0
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-500">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-3 ${
                      star <= Math.round(Number(stats.averageRating))
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-300 dark:text-zinc-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-toota-muted font-normal ml-1">
                {t("basedOnReviewsCount", { count: stats.total })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Awaiting Resolution */}
        <Card className="toota-card border-none">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between text-xs text-toota-muted">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-toota-muted">
                {t("pendingReview") || "Awaiting Resolution"}
              </CardTitle>
              <Clock className="size-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-toota-ink">
                {stats.openCount}
              </span>
              <span className="font-mono text-xs text-toota-muted tabular-nums">
                / {stats.total} {t("total", "total")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{t("activeTickets", "Needs Review")}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Successfully Resolved */}
        <Card className="toota-card border-none">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between text-xs text-toota-muted">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-toota-muted">
                {t("resolvedTickets", "Resolved Inquiries")}
              </CardTitle>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-toota-ink">
                {stats.resolvedCount}
              </span>
              <span className="font-mono text-xs text-toota-muted tabular-nums">
                / {stats.total} {t("total", "total")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("documentedWithNotes", "Documented")}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Positive Sentiment Ratio */}
        <Card className="toota-card border-none">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between text-xs text-toota-muted">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-toota-muted">
                {t("positiveSentiment", "Positive Sentiment")}
              </CardTitle>
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-toota-ink">
                {stats.positivePercent === null ? "—" : `${stats.positivePercent}%`}
              </span>
              <span className="font-mono text-xs text-toota-muted tabular-nums">
                / {stats.analysedCount} {t("analyzed", "analyzed")}
              </span>
            </div>
            {/* Visual bar */}
            <div className="w-full bg-toota-inner h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${stats.positivePercent ?? 0}%` }}
              />
            </div>
            {/* Sentiment split breakdown links */}
            <div className="flex items-center gap-2 pt-0.5 text-[10px] font-medium flex-wrap">
              <button
                type="button"
                onClick={() => setSentimentFilter("POSITIVE")}
                className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                title={t("positiveOnly") || "Filter positive reviews"}
              >
                {stats.bySentiment.POSITIVE} {t("sentiment_POSITIVE")?.toLowerCase() || "positive"}
              </button>
              <span className="text-toota-muted">•</span>
              <button
                type="button"
                onClick={() => setSentimentFilter("NEUTRAL")}
                className="text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                title={t("neutralOnly") || "Filter neutral reviews"}
              >
                {stats.bySentiment.NEUTRAL} {t("sentiment_NEUTRAL")?.toLowerCase() || "neutral"}
              </button>
              <span className="text-toota-muted">•</span>
              <button
                type="button"
                onClick={() => setSentimentFilter("NEGATIVE")}
                className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                title={t("negativeOnly") || "Filter negative reviews"}
              >
                {stats.bySentiment.NEGATIVE} {t("sentiment_NEGATIVE")?.toLowerCase() || "negative"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="toota-card border-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
            <Input
              type="text"
              placeholder={t("searchFeedbackPlaceholder") || "Search by member, comment, note..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-toota-inner border-border/40 text-xs text-toota-ink placeholder:text-toota-muted rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <Filter className="size-4 text-toota-muted shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | FeedbackStatus)
              }
              className="w-full h-10 px-3 bg-toota-inner border border-border/40 rounded-xl text-xs font-medium text-toota-ink focus:outline-hidden focus:ring-1 focus:ring-zinc-400 cursor-pointer"
            >
              <option value="ALL">{t("allStatuses") || "All Statuses"} ({feedbacks.length})</option>
              <option value="OPEN">{t("statusOpen") || "Open"}</option>
              <option value="IN_REVIEW">{t("statusInReview") || "In Review"}</option>
              <option value="RESOLVED">{t("statusResolved") || "Resolved"}</option>
              <option value="DISMISSED">{t("statusDismissed") || "Dismissed"}</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <Star className="size-4 text-toota-muted shrink-0" />
            <select
              value={ratingFilter}
              onChange={(e) =>
                setRatingFilter(
                  e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                )
              }
              className="w-full h-10 px-3 bg-toota-inner border border-border/40 rounded-xl text-xs font-medium text-toota-ink focus:outline-hidden focus:ring-1 focus:ring-zinc-400 cursor-pointer"
            >
              <option value="ALL">{t("allStarRatings") || "All Ratings"}</option>
              <option value={5}>{t("fiveStarsOnly") || "5 Stars"}</option>
              <option value={4}>{t("fourStars") || "4 Stars"}</option>
              <option value={3}>{t("threeStars") || "3 Stars"}</option>
              <option value={2}>{t("twoStars") || "2 Stars"}</option>
              <option value={1}>{t("oneStarOnly") || "1 Star"}</option>
            </select>
          </div>

          {/* Sentiment Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <Sparkles className="size-4 text-toota-muted shrink-0" />
            <select
              value={sentimentFilter}
              onChange={(e) =>
                setSentimentFilter(e.target.value as typeof sentimentFilter)
              }
              className="w-full h-10 px-3 bg-toota-inner border border-border/40 rounded-xl text-xs font-medium text-toota-ink focus:outline-hidden focus:ring-1 focus:ring-zinc-400 cursor-pointer"
            >
              <option value="ALL">{t("allSentiments") || "All Sentiments"}</option>
              <option value="NEGATIVE">
                {t("negativeOnly") || "Negative"} ({stats.bySentiment.NEGATIVE})
              </option>
              <option value="NEUTRAL">
                {t("neutralOnly") || "Neutral"} ({stats.bySentiment.NEUTRAL})
              </option>
              <option value="POSITIVE">
                {t("positiveOnly") || "Positive"} ({stats.bySentiment.POSITIVE})
              </option>
              <option value="NONE">
                {t("sentimentNotAnalysed") || "Not Analyzed"} ({stats.bySentiment.NONE})
              </option>
            </select>
          </div>
        </div>
      </Card>

      {/* Feedback Feed Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="toota-card border-none p-16 text-center">
            <Loader2 className="size-8 animate-spin text-toota-ink mx-auto mb-3" />
            <p className="font-medium text-toota-ink text-sm">
              {t("loadingFeedback") || "Loading member feedback roster..."}
            </p>
          </Card>
        ) : paginatedFeedbacks.length === 0 ? (
          <Card className="toota-card border-none p-16 text-center space-y-3">
            <div className="size-14 rounded-2xl bg-toota-inner flex items-center justify-center mx-auto text-toota-muted">
              <Inbox className="size-7 opacity-50" />
            </div>
            <div>
              <p className="font-semibold text-toota-ink text-base">
                {t("noFeedbackSubmissions") || "No feedback submissions found"}
              </p>
              <p className="text-xs text-toota-muted max-w-sm mx-auto mt-1">
                {isFiltering
                  ? t("noMatchingFilterReviews") || "No feedback matches the selected filters. Try broadening your criteria."
                  : t("emptyFeedbackPortalHint") || "Members have not submitted any feedback reviews yet."}
              </p>
            </div>
          </Card>
        ) : (
          paginatedFeedbacks.map((item) => {
            const member = item.member;
            const fullName =
              `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
              member?.userName ||
              "Member";
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

            const isResolved = item.feedbackStatus === "RESOLVED";

            const submittedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—";

            return (
              <Card
                key={item.id}
                className="toota-card border-none p-5 space-y-4 hover:border-border/80 transition-all group"
              >
                {/* Card Top Row: Member info, Rating, Mismatch, Sentiment & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 ring-1 ring-border/40 shrink-0">
                      {photo && (
                        <AvatarImage src={photo} alt={fullName} />
                      )}
                      <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-toota-ink">
                          {fullName}
                        </span>
                        <span className="text-[11px] text-toota-muted font-normal">
                          • {submittedDate}
                        </span>
                      </div>
                      {member?.userName && (
                        <p className="text-[11px] font-mono text-toota-muted truncate">
                          @{member.userName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rating Stars, Mismatch Warning, Sentiment Badge & Status Pill */}
                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                    {/* Stars */}
                    <div className="flex items-center gap-1 bg-toota-inner px-2 py-1 rounded-lg border border-border/40">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`size-3 ${
                              star <= item.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-zinc-300 dark:text-zinc-700"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-toota-ink ml-1 font-mono">
                        {item.rating}.0
                      </span>
                    </div>

                    {/* Mismatch Warning Micro-Badge */}
                    {starsDisagree(item) && (
                      <span
                        title={t("starsDisagreeHint") || "Rating stars and comment sentiment diverge"}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-amber-200 dark:ring-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                      >
                        <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                        <span className="hidden sm:inline">
                          {t("starsDisagreeHint") || "Rating discrepancy"}
                        </span>
                      </span>
                    )}

                    {/* Sentiment Badge */}
                    {renderSentimentBadge(item.sentiment, item.sentimentScore)}

                    {/* Status Badge */}
                    {renderFeedbackStatusBadge(item.feedbackStatus)}
                  </div>
                </div>

                {/* Member Review Body (Immutable) */}
                <div className="p-3.5 rounded-xl bg-toota-inner text-xs text-toota-ink leading-relaxed border border-border/40">
                  <p className="font-normal">
                    &quot;{item.content}&quot;
                  </p>
                </div>

                {/* Resolution Note Callout (If resolved or note exists) */}
                {item.resolutionNote && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-semibold text-emerald-700 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        {t("resolutionNoteShort", "Resolution Note")}
                      </span>
                      {item.resolvedAt && (
                        <span className="text-[10px] text-toota-muted font-normal font-mono">
                          {t("resolvedOn", "Resolved on")} {new Date(item.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-toota-ink/90 leading-relaxed text-[11px]">
                      {item.resolutionNote}
                    </p>
                  </div>
                )}

                {/* Card Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <div className="flex items-center gap-1.5 text-toota-muted text-[11px]">
                    <Lock className="size-3 opacity-60 shrink-0" />
                    <span>{t("memberSubmissionImmutable", "Member submission immutable")}</span>
                  </div>

                  <Button
                    type="button"
                    variant={isResolved ? "outline" : "default"}
                    onClick={() => {
                      setSelectedFeedback(item);
                      setIsResolveModalOpen(true);
                    }}
                    className={`toota-pill h-8 px-3.5 text-xs font-semibold cursor-pointer ${
                      isResolved
                        ? "border-border/50 hover:bg-toota-inner text-toota-ink"
                        : ""
                    }`}
                  >
                    <span>
                      {isResolved
                        ? t("editResolutionNote") || "Edit Resolution Note"
                        : t("reviewAndResolve") || "Review & Resolve"}
                    </span>
                    <ChevronRight className="size-3.5 ms-1 rtl:rotate-180" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        isLoading={isPageLoading}
        itemLabel={t("feedbacks") || "feedbacks"}
      />

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
        <Loader2 className="size-8 text-toota-ink animate-spin" />
      </div>
    );
  }

  if (role === "Member") {
    return <MemberFeedbackView />;
  }

  return <AdminStaffFeedbackView />;
}
