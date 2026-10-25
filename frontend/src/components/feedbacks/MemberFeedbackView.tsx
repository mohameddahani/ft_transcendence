"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageSquare,
  Star,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Heart,
  Trash2,
  Sparkles,
  UserCheck,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FeedbackItem } from "@/types/feedback";
import {
  fetchMemberFeedbacks,
  deleteMemberFeedback,
  likeMemberFeedback,
  removeLikeMemberFeedback,
} from "@/lib/api/member-portal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import CreateFeedbackModal from "./CreateFeedbackModal";
import MemberFeedbackDetailModal from "./MemberFeedbackDetailModal";
import DeleteFeedbackModal from "./DeleteFeedbackModal";

export default function MemberFeedbackView() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();

  // Storage key for user likes
  const likedStorageKey = `member_liked_feedbacks_${user?.id || "default"}`;

  // State
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Filters
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "RESOLVED" | "OPEN">("ALL");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [deletingFeedback, setDeletingFeedback] = useState<FeedbackItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Initialize liked IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(likedStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLikedIds(new Set(parsed));
        }
      }
    } catch {
      // ignore
    }
  }, [likedStorageKey]);

  // Load Feedbacks
  const loadFeedbacks = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await fetchMemberFeedbacks(1, 100);
      setFeedbacks(data);
    } catch {
      toast.error(
        t("failedToLoadFeedbacks") || "Failed to load member feedback roster."
      );
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  // Handle Like / Unlike with optimistic UI
  const handleToggleLike = async (feedbackId: string) => {
    const isCurrentlyLiked = likedIds.has(feedbackId);
    const nextLiked = new Set(likedIds);

    // Optimistic state updates
    if (isCurrentlyLiked) {
      nextLiked.delete(feedbackId);
    } else {
      nextLiked.add(feedbackId);
    }
    setLikedIds(nextLiked);

    try {
      localStorage.setItem(likedStorageKey, JSON.stringify(Array.from(nextLiked)));
    } catch {
      // ignore
    }

    // Optimistically update feedback likes count
    setFeedbacks((prev) =>
      prev.map((item) => {
        if (item.id === feedbackId) {
          const currentCount = item._count?.likes ?? 0;
          return {
            ...item,
            _count: {
              ...item._count,
              likes: Math.max(0, currentCount + (isCurrentlyLiked ? -1 : 1)),
            },
          };
        }
        return item;
      })
    );

    // Update detail modal if open
    setSelectedFeedback((prev) => {
      if (prev && prev.id === feedbackId) {
        const currentCount = prev._count?.likes ?? 0;
        return {
          ...prev,
          _count: {
            ...prev._count,
            likes: Math.max(0, currentCount + (isCurrentlyLiked ? -1 : 1)),
          },
        };
      }
      return prev;
    });

    // Fire API request
    try {
      if (isCurrentlyLiked) {
        await removeLikeMemberFeedback(feedbackId);
      } else {
        await likeMemberFeedback(feedbackId);
      }
    } catch (err: unknown) {
      const errorStatus = (err as { response?: { status?: number } })?.response?.status;
      // If 409 conflict (e.g. backend already registered the state), keep local state in sync
      if (errorStatus === 409) {
        // Ignored as harmless race condition
        return;
      }
      toast.error(
        isCurrentlyLiked
          ? "Failed to remove like. Please try again."
          : "Failed to like feedback. Please try again."
      );
      // Revert if unexpected error
      loadFeedbacks(false);
    }
  };

  // Handle Delete Feedback
  const handleConfirmDelete = async () => {
    if (!deletingFeedback) return;
    setIsDeleting(true);
    try {
      await deleteMemberFeedback(deletingFeedback.id);
      toast.success(
        t("feedbackDeletedSuccess") || "Your feedback has been deleted."
      );
      setFeedbacks((prev) => prev.filter((item) => item.id !== deletingFeedback.id));
      setDeletingFeedback(null);
      if (selectedFeedback?.id === deletingFeedback.id) {
        setIsDetailModalOpen(false);
        setSelectedFeedback(null);
      }
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string } } })?.response?.data;
      toast.error(errorData?.message || "Failed to delete feedback.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute Statistics
  const stats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) {
      return {
        total: 0,
        averageRating: "5.0",
        myCount: 0,
        positivePercent: 100,
        totalLikes: 0,
      };
    }

    const sumRating = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    const averageRating = (sumRating / total).toFixed(1);

    const myCount = feedbacks.filter((f) => user?.id && f.member.id === user.id).length;
    const positiveCount = feedbacks.filter((f) => (f.rating || 0) >= 4).length;
    const positivePercent = Math.round((positiveCount / total) * 100);

    const totalLikes = feedbacks.reduce((acc, f) => acc + (f._count?.likes || 0), 0);

    return {
      total,
      averageRating,
      myCount,
      positivePercent,
      totalLikes,
    };
  }, [feedbacks, user?.id]);

  // Filtered List
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      // Scope tab filter
      if (activeTab === "mine" && (!user?.id || f.member.id !== user.id)) {
        return false;
      }

      // Search term filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const memberName = `${f.member.firstName || ""} ${f.member.lastName || ""}`.toLowerCase();
        const content = (f.content || "").toLowerCase();
        const resolutionNote = (f.resolutionNote || "").toLowerCase();
        if (
          !memberName.includes(query) &&
          !content.includes(query) &&
          !resolutionNote.includes(query)
        ) {
          return false;
        }
      }

      // Rating filter
      if (ratingFilter !== "ALL" && f.rating !== ratingFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "RESOLVED" && f.feedbackStatus !== "RESOLVED") {
        return false;
      }
      if (statusFilter === "OPEN" && f.feedbackStatus === "RESOLVED") {
        return false;
      }

      return true;
    });
  }, [feedbacks, activeTab, searchTerm, ratingFilter, statusFilter, user?.id]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/50 shadow-2xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("communityVoices") || "Athlete Community Voices"}</span>
          </div>
          <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-on-surface tracking-tight">
            {t("memberFeedbacksTitle") || "Facility Feedback & Reviews"}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
            {t("memberFeedbacksSubtitle") ||
              "Share your workout experience, give kudos to coaches, suggest improvements, and see responses from facility management."}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => loadFeedbacks(true)}
            title={t("refresh") || "Refresh"}
            aria-label={t("refresh") || "Refresh"}
            className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/50 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl primary-gradient text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("shareFeedback") || "Share Feedback"}</span>
          </button>
        </div>
      </div>

      {/* Modern Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Average Rating */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {t("averageRating") || "Facility Rating"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
                {stats.averageRating}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">/ 5.0</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center ring-2 ring-amber-400/20 shadow-2xs">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        {/* 2. Total Reviews */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {t("totalReviews") || "Community Reviews"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
                {stats.total}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {t("submissions") || "posts"}
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-2 ring-primary/20 shadow-2xs">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* 3. My Submissions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {t("myReviews") || "My Submissions"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
                {stats.myCount}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {t("published") || "published"}
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center ring-2 ring-emerald-500/20 shadow-2xs">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Community Likes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {t("positiveExperience") || "Satisfaction"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
                {stats.positivePercent}%
              </span>
              <span className="text-xs text-emerald-500 font-bold">★ 4+ rating</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center ring-2 ring-rose-500/20 shadow-2xs">
            <Heart className="w-5 h-5 fill-rose-500/20" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/50 shadow-2xs space-y-4">
        {/* Top Filter Row: Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Scope Segmented Switch */}
          <div className="flex items-center p-1 rounded-2xl bg-surface-container-low border border-outline-variant/40 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-surface-container-lowest text-on-surface shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>{t("allFeedbacks") || "All Community Feedback"}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-[10px] font-semibold">
                {stats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("mine")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "mine"
                  ? "bg-surface-container-lowest text-on-surface shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>{t("myFeedbacks") || "My Feedback"}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                {stats.myCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                t("searchFeedbacksPlaceholder") ||
                "Search reviews, member names, or resolution notes..."
              }
              className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:border-primary transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-on-surface"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Bottom Filter Row: Rating & Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/40 text-xs">
          {/* Star Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-on-surface-variant mr-1">
              {t("ratingFilter") || "Rating:"}
            </span>
            {(["ALL", 5, 4, 3, 2, 1] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRatingFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  ratingFilter === r
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/40"
                }`}
              >
                {r === "ALL" ? t("all") || "All" : `${r} ★`}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-on-surface-variant mr-1">
              {t("status") || "Status:"}
            </span>
            {(["ALL", "RESOLVED", "OPEN"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  statusFilter === s
                    ? "bg-surface-container-high text-on-surface border border-outline-variant font-bold shadow-2xs"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/40"
                }`}
              >
                {s === "ALL"
                  ? t("all") || "All"
                  : s === "RESOLVED"
                  ? t("statusResolved") || "Resolved"
                  : t("statusUnderReview") || "Under Review"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Cards Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/50 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-surface-container-high" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-32 bg-surface-container-high rounded" />
                  <div className="h-3 w-20 bg-surface-container rounded" />
                </div>
              </div>
              <div className="h-4 w-28 bg-surface-container rounded" />
              <div className="h-14 w-full bg-surface-container rounded-xl" />
              <div className="h-9 w-full bg-surface-container rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-surface-container-lowest border border-outline-variant/50 shadow-2xs space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs ring-4 ring-primary/5">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-base text-on-surface">
              {activeTab === "mine"
                ? t("noPersonalFeedback") || "You haven't submitted any feedback yet"
                : searchTerm || ratingFilter !== "ALL" || statusFilter !== "ALL"
                ? t("noMatchingFeedback") || "No reviews match your filter criteria"
                : t("noFeedbackYet") || "No community reviews published yet"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              {activeTab === "mine"
                ? t("shareYourFirstReview") ||
                  "Share your opinion about facility equipment, locker rooms, or coaching to help improve the gym."
                : t("beTheFirstToReview") ||
                  "Be the first member to share your workout experience with the community!"}
            </p>
          </div>

          <div className="pt-2">
            {searchTerm || ratingFilter !== "ALL" || statusFilter !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setRatingFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              >
                {t("resetFilters") || "Reset Filters"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl primary-gradient text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t("shareFeedback") || "Share Feedback"}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Feedbacks Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeedbacks.map((item) => {
            const isOwn = Boolean(user?.id && item.member.id === user.id);
            const memberName = `${item.member.firstName || ""} ${item.member.lastName || ""}`.trim() || "Gym Member";
            const initials = (item.member.firstName?.[0] || "") + (item.member.lastName?.[0] || "") || "M";
            const isLiked = likedIds.has(item.id);
            const isResolved = item.feedbackStatus === "RESOLVED";
            const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/50 hover:border-primary/30 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between group space-y-4"
              >
                {/* Card Top: Author, Date & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.member.profileImage || item.member.photo ? (
                      <img
                        src={(item.member.profileImage || item.member.photo) as string}
                        alt={memberName}
                        className="w-10 h-10 rounded-2xl object-cover ring-2 ring-primary/20 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center ring-2 ring-primary/20 shrink-0 select-none">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-headline font-bold text-sm text-on-surface truncate">
                          {memberName}
                        </span>
                        {isOwn && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider shrink-0">
                            {t("you") || "You"}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 opacity-60" />
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  {isResolved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t("statusResolved") || "Resolved"}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{t("statusUnderReview") || "Under Review"}</span>
                    </span>
                  )}
                </div>

                {/* Stars Rating */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= item.rating
                          ? "fill-amber-400 text-amber-400 drop-shadow-2xs"
                          : "text-outline-variant/40"
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-on-surface-variant ms-1.5">
                    {item.rating}.0
                  </span>
                </div>

                {/* Feedback Content Text */}
                <p className="text-xs sm:text-sm text-on-surface leading-relaxed line-clamp-4 whitespace-pre-line italic">
                  &ldquo;{item.content}&rdquo;
                </p>

                {/* Management Resolution Note Snippet (If resolved) */}
                {item.resolutionNote && (
                  <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t("managementResponse") || "Management Response"}
                    </span>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {item.resolutionNote}
                    </p>
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between gap-2">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                      isLiked
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold"
                        : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/40"
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-transform ${
                        isLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
                      }`}
                    />
                    <span>{item._count?.likes ?? 0}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* View Details Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFeedback(item);
                        setIsDetailModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t("viewDetails") || "Details"}</span>
                    </button>

                    {/* Delete button (only for own feedback) */}
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => setDeletingFeedback(item)}
                        title={t("deleteFeedback") || "Delete your review"}
                        className="p-1.5 rounded-xl text-error/70 hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Feedback Modal */}
      <CreateFeedbackModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadFeedbacks(false)}
      />

      {/* Member Feedback Detail Modal */}
      <MemberFeedbackDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFeedback(null);
        }}
        feedback={selectedFeedback}
        isLiked={Boolean(selectedFeedback && likedIds.has(selectedFeedback.id))}
        onToggleLike={handleToggleLike}
        isOwnFeedback={Boolean(user?.id && selectedFeedback && selectedFeedback.member.id === user.id)}
        onDeleteRequest={(item) => {
          setIsDetailModalOpen(false);
          setDeletingFeedback(item);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteFeedbackModal
        isOpen={Boolean(deletingFeedback)}
        onClose={() => setDeletingFeedback(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        contentSnippet={deletingFeedback?.content}
      />
    </div>
  );
}
