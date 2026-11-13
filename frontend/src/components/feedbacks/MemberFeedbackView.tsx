"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageSquareQuote,
  Star,
  Plus,
  RefreshCw,
  Search,
  Heart,
  Trash2,
  UserCheck,
  ShieldCheck,
  Eye,
  Loader2,
  Inbox,
  Filter,
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
import { fetchMemberFeedbackStats, FeedbackStats } from "@/lib/api/stats";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import CreateFeedbackModal from "./CreateFeedbackModal";
import MemberFeedbackDetailModal from "./MemberFeedbackDetailModal";
import DeleteFeedbackModal from "./DeleteFeedbackModal";
import Pagination from "@/components/ui/Pagination";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function MemberFeedbackView() {
  const { t } = useTranslation();
  const { user, companyName } = useCurrentUser();

  // Storage key for user likes
  const likedStorageKey = `member_liked_feedbacks_${user?.id || "default"}`;

  // Data state
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [memberFeedbackStats, setMemberFeedbackStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Pagination (10 elements per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

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

  // Load Feedbacks from server
  const loadFeedbacks = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [statsData, allData] = await Promise.all([
        fetchMemberFeedbackStats().catch(() => null),
        fetchMemberFeedbacks(1, 1000).catch(() => []),
      ]);

      setMemberFeedbackStats(statsData);
      setFeedbacks(allData);

      // Track liked IDs
      const liked = new Set<string>();
      allData.forEach((item) => {
        if (item.isLiked && item.id) {
          liked.add(item.id);
        }
      });
      setLikedIds(liked);
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
    const targetItem = feedbacks.find((item) => item.id === feedbackId);
    const isCurrentlyLiked = targetItem ? Boolean(targetItem.isLiked) : likedIds.has(feedbackId);
    const nextLiked = new Set(likedIds);

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

    const updateItemLikes = (item: FeedbackItem) => {
      if (item.id === feedbackId) {
        const currentCount = item.likeCount ?? item._count?.likes ?? 0;
        const newCount = Math.max(0, currentCount + (isCurrentlyLiked ? -1 : 1));
        return {
          ...item,
          isLiked: !isCurrentlyLiked,
          likeCount: newCount,
          _count: {
            ...item._count,
            likes: newCount,
          },
        };
      }
      return item;
    };

    setFeedbacks((prev) => prev.map(updateItemLikes));

    setSelectedFeedback((prev) => {
      if (prev && prev.id === feedbackId) {
        const currentCount = prev.likeCount ?? prev._count?.likes ?? 0;
        const newCount = Math.max(0, currentCount + (isCurrentlyLiked ? -1 : 1));
        return {
          ...prev,
          isLiked: !isCurrentlyLiked,
          likeCount: newCount,
          _count: {
            ...prev._count,
            likes: newCount,
          },
        };
      }
      return prev;
    });

    try {
      if (isCurrentlyLiked) {
        await removeLikeMemberFeedback(feedbackId);
      } else {
        await likeMemberFeedback(feedbackId);
      }
    } catch (err: unknown) {
      const errorStatus = (err as { response?: { status?: number } })?.response?.status;
      if (errorStatus === 409) return;
      toast.error(
        isCurrentlyLiked
          ? "Failed to remove like. Please try again."
          : "Failed to like feedback. Please try again."
      );
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

  // Compute Statistics from dedicated stats endpoint or dataset
  const stats = useMemo(() => {
    const rawTotal = feedbacks.length;
    const total =
      memberFeedbackStats?.total && memberFeedbackStats.total >= rawTotal
        ? memberFeedbackStats.total
        : rawTotal;

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
    const averageRating =
      feedbacks.length > 0
        ? (sumRating / feedbacks.length).toFixed(1)
        : memberFeedbackStats?.averageRating !== null && memberFeedbackStats?.averageRating !== undefined
        ? Number(memberFeedbackStats.averageRating).toFixed(1)
        : "5.0";

    const myFeedbacksCount = feedbacks.filter((f) => user?.id && f.member?.id === user.id).length;
    const myCount = memberFeedbackStats?.myCount ?? myFeedbacksCount;

    const positiveCount = feedbacks.filter((f) => (f.rating || 0) >= 4).length;
    const positivePercent = total > 0 ? Math.round((positiveCount / total) * 100) : 100;

    const totalLikes = feedbacks.reduce((acc, f) => acc + (f.likeCount ?? f._count?.likes ?? 0), 0);

    return {
      total,
      averageRating,
      myCount,
      positivePercent,
      totalLikes,
    };
  }, [memberFeedbackStats, feedbacks, user?.id]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, ratingFilter, statusFilter]);

  // Filtered List
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (activeTab === "mine" && (!user?.id || f.member?.id !== user.id)) {
        return false;
      }

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const memberName = `${f.member?.firstName || ""} ${f.member?.lastName || ""}`.toLowerCase();
        const username = (f.member?.userName || "").toLowerCase();
        const content = (f.content || "").toLowerCase();
        const resolutionNote = (f.resolutionNote || "").toLowerCase();
        if (
          !memberName.includes(query) &&
          !username.includes(query) &&
          !content.includes(query) &&
          !resolutionNote.includes(query)
        ) {
          return false;
        }
      }

      if (ratingFilter !== "ALL" && f.rating !== ratingFilter) {
        return false;
      }

      if (statusFilter === "RESOLVED" && f.feedbackStatus !== "RESOLVED") {
        return false;
      }
      if (statusFilter === "OPEN" && f.feedbackStatus === "RESOLVED") {
        return false;
      }

      return true;
    });
  }, [feedbacks, activeTab, searchTerm, ratingFilter, statusFilter, user?.id]);

  const isFiltering = Boolean(
    activeTab !== "all" ||
    searchTerm ||
    ratingFilter !== "ALL" ||
    statusFilter !== "ALL"
  );

  const totalItems = filteredFeedbacks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Safely clamp currentPage if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Display only 10 elements on the page
  const displayFeedbacks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFeedbacks.slice(start, start + pageSize);
  }, [filteredFeedbacks, currentPage, pageSize]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Crisp Outlined Micro-Badge Renderer
  const renderStatusBadge = (statusStr: string) => {
    const s = (statusStr || "").toUpperCase();
    if (s === "RESOLVED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{t("statusResolved") || "Resolved"}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>{t("statusUnderReview") || "Under Review"}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* 1. Header Card (shadcn Card with Baseline Metric) */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("memberFeedbacksTitle") || "Member Feedback & Reviews"}
              </h1>
              {companyName && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {companyName}
                </span>
              )}
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {stats.total} {t("total") || "total"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t("memberFeedbacksSubtitle") ||
                "Share your workout experience, suggest improvements, and browse facility reviews."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => loadFeedbacks(true)}
              disabled={isLoading}
              className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
            >
              <RefreshCw className={`size-3.5 me-2 ${isLoading ? "animate-spin" : ""}`} />
              <span>{t("refresh") || "Refresh"}</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5 me-1.5" />
              <span>{t("shareFeedback") || "Share Feedback"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Live Operational Metrics (4 Bento Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Average Facility Rating */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("averageRating") || "Facility Rating"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-amber-500">
              <Star className="size-5 fill-amber-400 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                {stats.averageRating}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span>/ 5.0</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {stats.total} {t("communityReviews") || "community ratings recorded"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Total Community Reviews */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalReviews") || "Community Reviews"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <MessageSquareQuote className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                {stats.total}
              </span>
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                Total
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {stats.totalLikes} {t("likes") || "community likes received"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: My Submissions */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("myReviews") || "My Submissions"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-green">
              <UserCheck className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                {stats.myCount}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Published</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("submittedByYou") || "Reviews published under your account"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Athlete Satisfaction */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("positiveExperience") || "Satisfaction"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-green">
              <Heart className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                {stats.positivePercent}%
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Positive</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              Rated 4 or 5 stars by members
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-green transition-all"
                style={{ width: `${Math.min(100, Math.max(0, stats.positivePercent))}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filter & Search Toolbar Card */}
      <Card className="toota-card border-none">
        <div className="space-y-4">
          {/* Top Row: Scope Tabs & Search Box */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Scope Switch */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-toota-inner w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`toota-pill h-9 px-4 text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === "all"
                    ? "bg-toota-ink text-background dark:bg-white dark:text-black font-semibold shadow-xs"
                    : "bg-transparent text-toota-muted hover:text-toota-ink"
                }`}
              >
                <span>{t("allFeedbacks") || "All Reviews"}</span>
                <span className="font-mono text-[11px] tabular-nums ms-1.5 opacity-70">
                  ({stats.total})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("mine")}
                className={`toota-pill h-9 px-4 text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === "mine"
                    ? "bg-toota-ink text-background dark:bg-white dark:text-black font-semibold shadow-xs"
                    : "bg-transparent text-toota-muted hover:text-toota-ink"
                }`}
              >
                <span>{t("myFeedbacks") || "My Reviews"}</span>
                <span className="font-mono text-[11px] tabular-nums ms-1.5 opacity-70">
                  ({stats.myCount})
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none rtl:left-auto rtl:right-3.5" />
              <Input
                type="text"
                placeholder={
                  t("searchFeedbacksPlaceholder") ||
                  "Search reviews, member names, or resolution notes..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-toota-inner border-border/40 text-xs text-toota-ink placeholder:text-toota-muted rounded-xl focus-visible:ring-1 focus-visible:ring-[#a3e635] focus-visible:border-[#a3e635] rtl:pl-4 rtl:pr-10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-toota-muted hover:text-toota-ink cursor-pointer rtl:right-auto rtl:left-3"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Rating & Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40 text-xs">
            {/* Rating Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-toota-muted me-1">
                {t("ratingFilter") || "Rating:"}
              </span>
              {(["ALL", 5, 4, 3, 2, 1] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRatingFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    ratingFilter === r
                      ? "bg-toota-ink text-background dark:bg-white dark:text-black shadow-2xs"
                      : "bg-toota-inner border border-border/40 text-toota-muted hover:text-toota-ink"
                  }`}
                >
                  {r === "ALL" ? t("all") || "All" : `${r} ★`}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-toota-muted shrink-0" />
              <span className="text-[11px] font-semibold text-toota-muted me-1">
                {t("status") || "Status:"}
              </span>
              {(["ALL", "RESOLVED", "OPEN"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === s
                      ? "bg-toota-ink text-background dark:bg-white dark:text-black shadow-2xs"
                      : "bg-toota-inner border border-border/40 text-toota-muted hover:text-toota-ink"
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
      </Card>

      {/* 4. Feedback Feed Roster (Displaying exactly 10 items for the current page) */}
      {isLoading ? (
        <Card className="toota-card border-none p-16 text-center">
          <Loader2 className="size-8 animate-spin text-toota-ink mx-auto mb-3" />
          <p className="font-medium text-toota-ink text-sm">
            {t("loadingFeedback") || "Loading member feedback roster..."}
          </p>
        </Card>
      ) : displayFeedbacks.length === 0 ? (
        <Card className="toota-card border-none p-16 text-center space-y-3">
          <div className="size-14 rounded-2xl bg-toota-inner flex items-center justify-center mx-auto text-toota-muted">
            <Inbox className="size-7 opacity-50" />
          </div>
          <div>
            <p className="font-semibold text-toota-ink text-base">
              {activeTab === "mine"
                ? t("noPersonalFeedback") || "You haven't submitted any feedback yet"
                : isFiltering
                ? t("noMatchingFeedback") || "No reviews match your filter criteria"
                : t("noFeedbackYet") || "No community reviews published yet"}
            </p>
            <p className="text-xs text-toota-muted max-w-sm mx-auto mt-1">
              {activeTab === "mine"
                ? t("shareYourFirstReview") ||
                  "Share your opinion about facility equipment, cleanliness, or trainers."
                : t("beTheFirstToReview") ||
                  "Be the first member to share your workout experience with the community!"}
            </p>
          </div>

          <div className="pt-2">
            {isFiltering ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setRatingFilter("ALL");
                  setStatusFilter("ALL");
                  setActiveTab("all");
                }}
                className="toota-pill h-9 px-4 text-xs font-semibold cursor-pointer"
              >
                {t("resetFilters") || "Reset Filters"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="size-3.5 me-1.5" />
                <span>{t("shareFeedback") || "Share Feedback"}</span>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayFeedbacks.map((item, idx) => {
            const isOwn = Boolean(user?.id && item.member?.id === user.id);
            const memberName =
              `${item.member?.firstName || ""} ${item.member?.lastName || ""}`.trim() ||
              item.member?.userName ||
              "Gym Member";
            const initials =
              ((item.member?.firstName?.[0] || "") + (item.member?.lastName?.[0] || "")).toUpperCase() ||
              item.member?.userName?.slice(0, 2).toUpperCase() ||
              "M";

            const rawPhoto = item.member?.profileImageUrl || item.member?.photo;
            const isPlaceholder =
              !rawPhoto ||
              rawPhoto === "default-image.jpg" ||
              rawPhoto === "default-member-image.jpg";
            const photo = !isPlaceholder ? rawPhoto : null;

            const isLiked = Boolean(item.isLiked ?? likedIds.has(item.id));
            const likeCount = item.likeCount ?? item._count?.likes ?? 0;
            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—";

            return (
              <Card
                key={item.id || `feedback-${idx}`}
                className="toota-card border-none flex flex-col justify-between"
              >
                <CardHeader className="p-0 pb-3 flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-10 ring-1 ring-border/40 shrink-0">
                      {photo && <AvatarImage src={photo} alt={memberName} />}
                      <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-toota-ink truncate">
                          {memberName}
                        </p>
                        {isOwn && (
                          <span className="inline-flex items-center rounded-md px-1.5 py-0.2 text-[10px] font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {t("you") || "You"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-toota-muted mt-0.5">
                        {formattedDate}
                      </p>
                    </div>
                  </div>

                  {renderStatusBadge(item.feedbackStatus)}
                </CardHeader>

                <CardContent className="p-0 py-2 space-y-2.5 flex-1">
                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-3.5 ${
                          star <= item.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-mono font-semibold text-toota-ink ms-1">
                      {item.rating}.0
                    </span>
                  </div>

                  {/* Quoted Feedback Text */}
                  <p className="text-xs text-toota-ink italic leading-relaxed line-clamp-3">
                    &ldquo;{item.content}&rdquo;
                  </p>

                  {/* Management Response Snippet if resolved */}
                  {item.resolutionNote && (
                    <div className="p-3 rounded-xl bg-toota-inner border border-emerald-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="size-3.5 shrink-0" />
                        <span>{t("managementResponse") || "Management Response"}</span>
                      </div>
                      <p className="text-xs text-toota-muted line-clamp-2">
                        {item.resolutionNote}
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-0 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  {/* Like Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleLike(item.id)}
                    className={`toota-pill h-8 px-3 text-xs font-semibold cursor-pointer ${
                      isLiked
                        ? "border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
                        : "border-border/40 text-toota-muted hover:text-toota-ink hover:bg-toota-inner"
                    }`}
                  >
                    <Heart
                      className={`size-3.5 me-1.5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`}
                    />
                    <span>{likeCount}</span>
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFeedback(item);
                        setIsDetailModalOpen(true);
                      }}
                      className="h-8 px-2.5 text-xs font-semibold text-toota-ink hover:bg-toota-inner rounded-full cursor-pointer"
                    >
                      <Eye className="size-3.5 me-1" />
                      <span>{t("viewDetails") || "Details"}</span>
                    </Button>

                    {isOwn && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingFeedback(item)}
                        className="h-8 w-8 p-0 text-toota-muted hover:text-toota-red hover:bg-destructive/10 rounded-full cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. Pagination Footer (Exactly 10 per page) */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          isLoading={false}
          itemLabel={t("feedbacks") || "reviews"}
        />
      )}

      {/* Modals */}
      <CreateFeedbackModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadFeedbacks(false)}
      />

      <MemberFeedbackDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFeedback(null);
        }}
        feedback={selectedFeedback}
        isLiked={Boolean(selectedFeedback && (selectedFeedback.isLiked ?? likedIds.has(selectedFeedback.id)))}
        onToggleLike={handleToggleLike}
        isOwnFeedback={Boolean(user?.id && selectedFeedback?.member?.id === user.id)}
        onDeleteRequest={(item) => {
          setIsDetailModalOpen(false);
          setDeletingFeedback(item);
        }}
      />

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
