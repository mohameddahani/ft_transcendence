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
  AlertCircle,
  ThumbsUp,
  Download,
  Lock,
  ChevronRight,
  User,
  Phone,
  Mail,
  Sparkles,
  TrendingUp,
  Check,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FeedbackItem, FeedbackStatus } from "@/types/feedback";
import { fetchAllFeedbacks, updateFeedbackStatus } from "@/lib/api/feedbacks";
import ResolveFeedbackModal from "@/components/feedbacks/ResolveFeedbackModal";

export default function FeedbacksPage() {
  const { t } = useTranslation();

  // Data state
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | FeedbackStatus>("ALL");
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");

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
    if (total === 0) {
      return { total: 0, averageRating: 5.0, openCount: 0, resolvedCount: 0, positivePercent: 100 };
    }

    const sumRating = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    const averageRating = (sumRating / total).toFixed(1);

    const openCount = feedbacks.filter(
      (f) => f.feedbackStatus === "OPEN" || f.feedbackStatus === "IN_REVIEW"
    ).length;

    const resolvedCount = feedbacks.filter((f) => f.feedbackStatus === "RESOLVED").length;

    const positiveCount = feedbacks.filter(
      (f) => f.rating >= 4 || f.sentiment === "POSITIVE"
    ).length;
    const positivePercent = Math.round((positiveCount / total) * 100);

    return { total, averageRating, openCount, resolvedCount, positivePercent };
  }, [feedbacks]);

  // Filtered List
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const memberName = `${f.member.firstName || ""} ${f.member.lastName || ""}`.toLowerCase();
      const content = (f.content || "").toLowerCase();
      const note = (f.resolutionNote || "").toLowerCase();
      const email = (f.member.email || "").toLowerCase();
      const phone = (f.member.phoneNumber || "").toLowerCase();

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

      return true;
    });
  }, [feedbacks, searchTerm, statusFilter, ratingFilter]);

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
      "Status",
      "Member Feedback",
      "Resolution Note",
      "Submitted At",
      "Resolved At",
    ];

    const rows = filteredFeedbacks.map((f) => [
      `"${f.member.firstName || ""} ${f.member.lastName || ""}"`,
      f.rating,
      f.sentiment || "NEUTRAL",
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
                Quality & Sentiment
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
              Based on {stats.total} reviews
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
              Active Tickets
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Requires administrative review</span>
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
              Closed Tickets
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Documented with resolution notes
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
            {stats.positivePercent}%
            <span className="text-xs font-normal text-on-surface-variant ml-1.5">
              Happy Members
            </span>
          </div>
          {/* Visual bar */}
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${stats.positivePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder="Search feedback by member, keywords, or resolution note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-on-surface-variant/60"
          />
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-on-surface-variant shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | FeedbackStatus)
            }
            className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses ({feedbacks.length})</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div className="md:col-span-3 flex items-center gap-2">
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
            <option value="ALL">All Star Ratings</option>
            <option value={5}>★★★★★ 5 Stars Only</option>
            <option value={4}>★★★★☆ 4 Stars</option>
            <option value={3}>★★★☆☆ 3 Stars</option>
            <option value={2}>★★☆☆☆ 2 Stars</option>
            <option value={1}>★☆☆☆☆ 1 Star Only</option>
          </select>
        </div>
      </div>

      {/* Feedback Feed Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center rounded-2xl bg-surface-bright border border-outline-variant/60">
            <RefreshCw className="w-7 h-7 animate-spin text-primary mx-auto mb-2" />
            <p className="font-semibold text-on-surface text-sm">
              Loading member feedback...
            </p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface-bright border border-outline-variant/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant">
              <MessageSquare className="w-6 h-6 opacity-40" />
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">
                No feedback submissions found
              </p>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
                {searchTerm || statusFilter !== "ALL" || ratingFilter !== "ALL"
                  ? "No reviews match your current filter parameters."
                  : "When members submit reviews through the member mobile portal, they will appear here for staff review and resolution."}
              </p>
            </div>
          </div>
        ) : (
          filteredFeedbacks.map((item) => {
            const member = item.member;
            const fullName =
              `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
              "Member";
            const initials =
              `${(member.firstName || "")[0] || ""}${(member.lastName || "")[0] || ""}`.toUpperCase() ||
              "M";
            const photo = member.photo || member.profileImage;

            const isResolved = item.feedbackStatus === "RESOLVED";
            const isOpen = item.feedbackStatus === "OPEN";
            const isInReview = item.feedbackStatus === "IN_REVIEW";
            const isDismissed = item.feedbackStatus === "DISMISSED";

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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">
                          {fullName}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-medium">
                          • {submittedDate}
                        </span>
                      </div>
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

                  {/* Rating Stars & Status Badge */}
                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
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
                      {item.feedbackStatus}
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
                        Resolution Note
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
