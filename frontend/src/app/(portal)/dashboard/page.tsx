"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  Layers,
  AlertCircle,
  Plus,
  ArrowRight,
  Loader2,
  RefreshCw,
  Star,
  MessageSquareQuote,
  ThumbsUp,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchMembers } from "@/lib/api/members";
import { fetchMembershipPlans } from "@/lib/api/membership-plans";
import { fetchAllFeedbacks } from "@/lib/api/feedbacks";
import { BackendMember } from "@/types/member";
import { MembershipPlan } from "@/types/membership-plan";
import { FeedbackItem } from "@/types/feedback";
import axios from "axios";
import { useTranslation } from "react-i18next";
import MemberDashboardView from "@/components/dashboard/MemberDashboardView";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

interface MemberReviewLeader {
  id: string;
  name: string;
  avatarUrl?: string | null;
  rating: number;
  content: string;
  likes: number;
  createdAt: string;
  initials: string;
}

function AdminStaffDashboardView() {
  const { t } = useTranslation();
  const { fullName, companyName, role } = useCurrentUser();
  const [members, setMembers] = useState<BackendMember[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [membersData, plansData, feedbacksData] = await Promise.all([
        fetchMembers(),
        fetchMembershipPlans().catch(() => []),
        fetchAllFeedbacks(1, 50).catch(() => []),
      ]);
      setMembers(membersData);
      setPlans(plansData);
      setFeedbacks(feedbacksData);
    } catch (err: unknown) {
      let msg = "Failed to load dashboard data";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalMembers = members.length;
  const activeMembers = members.filter(
    (m) => m.memberships?.[0]?.membershipStatus === "ACTIVE"
  ).length;
  const expiredMembers = members.filter(
    (m) => m.memberships?.[0]?.membershipStatus === "EXPIRED"
  ).length;
  const bannedMembers = members.filter(
    (m) => m.accountStatus === "BANNED"
  ).length;
  const inactiveOrOther = totalMembers - activeMembers;
  const activePercent =
    totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
  const inactivePercent =
    totalMembers > 0 ? Math.round((inactiveOrOther / totalMembers) * 100) : 0;

  // Real Member Reviews Leaderboard data derived from fetchAllFeedbacks()
  const leaderboardData: MemberReviewLeader[] = useMemo(() => {
    if (!feedbacks || feedbacks.length === 0) {
      return [];
    }
    // Sort by rating (highest first), then by likes
    const sorted = [...feedbacks].sort((a, b) => {
      const aRating = typeof a.rating === "number" ? a.rating : 0;
      const bRating = typeof b.rating === "number" ? b.rating : 0;
      const diff = bRating - aRating;
      if (diff !== 0) return diff;
      const aLikes = a.likeCount ?? a._count?.likes ?? 0;
      const bLikes = b.likeCount ?? b._count?.likes ?? 0;
      return bLikes - aLikes;
    });

    return sorted.map((f) => {
      const member = f.member;
      const name =
        `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
        member?.userName ||
        "Gym Member";
      const initials =
        (member?.firstName?.[0] || "") + (member?.lastName?.[0] || "") ||
        (member?.userName?.[0] ? member.userName[0].toUpperCase() : "M");
      const avatarUrl = member?.profileImageUrl || member?.photo || null;

      return {
        id: f.id,
        name,
        avatarUrl,
        rating: typeof f.rating === "number" ? f.rating : Number(f.rating) || 5,
        content: f.content || "",
        likes: f.likeCount ?? f._count?.likes ?? 0,
        createdAt: f.createdAt,
        initials: initials.toUpperCase(),
      };
    });
  }, [feedbacks]);

  // Feedback statistics computed from real feedback data
  const feedbackStats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) {
      return {
        averageRating: "5.0",
        positivePercent: 100,
        positiveCount: 0,
        openCount: 0,
        resolvedCount: 0,
        totalLikes: 0,
      };
    }
    const sum = feedbacks.reduce(
      (acc, f) => acc + (typeof f.rating === "number" ? f.rating : Number(f.rating) || 0),
      0
    );
    const avg = (sum / total).toFixed(1);
    const positive = feedbacks.filter((f) => (Number(f.rating) || 0) >= 4).length;
    const positivePct = Math.round((positive / total) * 100);
    const open = feedbacks.filter(
      (f) => f.feedbackStatus === "OPEN" || f.feedbackStatus === "IN_REVIEW"
    ).length;
    const resolved = feedbacks.filter(
      (f) => f.feedbackStatus === "RESOLVED"
    ).length;
    const likes = feedbacks.reduce(
      (acc, f) => acc + (f.likeCount ?? f._count?.likes ?? 0),
      0
    );

    return {
      averageRating: avg,
      positivePercent: positivePct,
      positiveCount: positive,
      openCount: open,
      resolvedCount: resolved,
      totalLikes: likes,
    };
  }, [feedbacks]);

  // Podium (Top 3) & Runner-up list
  const podium = useMemo(() => {
    return {
      first: leaderboardData[0] || null,
      second: leaderboardData[1] || null,
      third: leaderboardData[2] || null,
    };
  }, [leaderboardData]);

  const runnersUp = useMemo(() => {
    return leaderboardData.slice(3, 8);
  }, [leaderboardData]);

  const getStatusLabel = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "ACTIVE") return t("active") || "Active";
    if (s === "PENDING") return t("pending") || "Pending";
    if (s === "BANNED") return t("banned") || "Banned";
    if (s === "EXPIRED") return t("expired") || "Expired";
    if (s === "CANCELLED") return t("cancelled") || "Cancelled";
    if (s === "INACTIVE") return t("inactive") || "Inactive";
    return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "";
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    const label = getStatusLabel(status);

    if (s === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    if (s === "EXPIRED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    if (s === "BANNED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
        <span>{label}</span>
      </span>
    );
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "M";
  };

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12 select-none">
      {/* Welcome & Overview Header */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("welcomeBack") || "Welcome back"}, {fullName}
              </h1>
              {companyName && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {companyName}
                </span>
              )}
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {role}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t("dashboardSubtitle") ||
                "Real-time facility performance and live member insights."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={loadDashboardData}
              disabled={isLoading}
              className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
            >
              <RefreshCw
                className={`size-3.5 me-2 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>{t("refresh") || "Refresh"}</span>
            </Button>

            <Link href="/members">
              <Button className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer">
                <span>{t("viewAllMembers") || "View all members"}</span>
                <ArrowRight className="size-3.5 ms-2 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Real Live Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Members */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalMembers") || "Total Members"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <Users className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-ink" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {totalMembers}
                </span>
              )}
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                {t("liveFromApi") || "Live"}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("registeredInGym") || "Registered gym members"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Active Subscriptions */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("activeSubscriptions") || "Active Subscriptions"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-green">
              <UserCheck className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-green" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {activeMembers}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{totalMembers > 0 ? `${activePercent}%` : "—"}</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("totalActiveMembers") || "Total active members"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-green transition-all"
                style={{ width: `${Math.min(100, Math.max(0, activePercent))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Inactive / Other Status */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("inactiveOrOther") || "Inactive / Other"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-muted">
              <UserX className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-muted" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {inactiveOrOther}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{totalMembers > 0 ? `${inactivePercent}%` : "—"}</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2 truncate">
              {expiredMembers > 0 || bannedMembers > 0
                ? `${expiredMembers} ${t("expired") || "expired"} · ${bannedMembers} ${t("banned") || "banned"}`
                : t("inactive") || "Inactive status"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-muted transition-all"
                style={{ width: `${Math.min(100, Math.max(0, inactivePercent))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Membership Plans */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("navMembershipPlans") || "Membership Plans"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <Layers className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-ink" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {plans.length}
                </span>
              )}
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                Plans
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              Available gym membership plans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MEMBER REVIEWS LEADERBOARD SECTION (100% Real Feedback Data) */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Left Card: Member Satisfaction Overview (Live Data) */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[52px] font-medium tracking-tight text-toota-ink leading-none">
                    {feedbackStats.averageRating}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((starIndex) => {
                      const avgNum = parseFloat(feedbackStats.averageRating);
                      const isFull = starIndex <= Math.floor(avgNum);
                      const isHalf = !isFull && starIndex <= Math.ceil(avgNum) && avgNum % 1 >= 0.25;
                      return (
                        <Star
                          key={starIndex}
                          className={`size-5 ${
                            isFull
                              ? "fill-amber-400 text-amber-400"
                              : isHalf
                              ? "fill-amber-400/50 text-amber-400/50"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-toota-muted mt-1.5 font-normal">
                  Member Satisfaction & Verified Feedback Index
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{feedbackStats.positivePercent}% Positive</span>
              </span>
            </div>

            {/* Satisfaction Index Track */}
            <div className="toota-track">
              <div
                className="toota-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(15, feedbackStats.positivePercent)
                  )}%`,
                }}
              >
                Satisfaction index
              </div>
              <span
                className="toota-mark"
                style={{
                  left: `${Math.min(
                    96,
                    Math.max(15, feedbackStats.positivePercent)
                  )}%`,
                }}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-semibold text-toota-ink">
                {feedbackStats.positiveCount} High Ratings
              </span>
            </div>
          </div>

          {/* Breakdown Pills & Featured Review */}
          <div className="toota-inner mt-2">
            <div className="flex items-center justify-between text-xs mb-3 text-toota-muted font-medium">
              <span>Feedback Overview</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="size-3.5" />
                  {feedbackStats.totalLikes} Likes
                </span>
                <span>{feedbacks.length} Reviews Total</span>
              </div>
            </div>

            {feedbacks.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-background/50 border border-border/40 flex items-start gap-3">
                <MessageSquareQuote className="size-5 text-toota-muted shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {feedbacks[0].member?.profileImageUrl ? (
                        <Avatar className="size-5 ring-1 ring-border/40 shrink-0">
                          <AvatarImage
                            src={feedbacks[0].member.profileImageUrl}
                            alt={feedbacks[0].member.firstName || "Member"}
                          />
                          <AvatarFallback className="text-[9px]">
                            {getInitials(
                              feedbacks[0].member.firstName,
                              feedbacks[0].member.lastName
                            )}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                      <p className="text-xs font-semibold text-toota-ink truncate">
                        {feedbacks[0].member?.firstName || ""}{" "}
                        {feedbacks[0].member?.lastName || feedbacks[0].member?.userName || "Member"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-toota-ink">
                        {Number(feedbacks[0].rating ?? 5).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs italic text-toota-ink line-clamp-2">
                    &quot;{feedbacks[0].content}&quot;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-toota-muted mt-2">
                    <span>
                      {feedbacks[0].createdAt
                        ? new Date(feedbacks[0].createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                    {feedbacks[0].sentiment ? (
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-full ${
                          feedbacks[0].sentiment === "POSITIVE"
                            ? "bg-toota-green/15 text-toota-green"
                            : feedbacks[0].sentiment === "NEGATIVE"
                            ? "bg-toota-red/15 text-toota-red"
                            : "bg-toota-muted/15 text-toota-muted"
                        }`}
                      >
                        {feedbacks[0].sentiment}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-toota-muted italic text-center py-2">
                Awaiting first member feedback.
              </p>
            )}
          </div>
        </Card>

        {/* Right Card: Leaderboard of Members with Their Reviews (Podium + List) */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-toota-ink flex items-center gap-1.5">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span>Top Member Reviews</span>
              </h3>
              <Link
                href="/feedbacks"
                className="text-xs font-medium text-toota-muted hover:text-toota-ink hover:underline"
              >
                View all ({feedbacks.length})
              </Link>
            </div>

            {/* Podium View (Top 3 Reviewed Members) */}
            {leaderboardData.length > 0 ? 
            (
              <div className="flex justify-around items-end mb-6 pt-2 pb-1 border-b border-border/30">
                {/* 2nd Place (Left) */}
                {podium.second ? (
                  <div className="flex flex-col items-center gap-1 text-[10px]">
                    <Avatar className="size-12 ring-2 ring-border/50">
                      {podium.second.avatarUrl && (
                        <AvatarImage
                          src={podium.second.avatarUrl}
                          alt={podium.second.name}
                        />
                      )}
                      <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                        {podium.second.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-mono font-medium ring-1 ring-inset ring-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 mt-1">
                      <Star className="size-2.5 fill-amber-400 text-amber-400" />
                      <span>{podium.second.rating.toFixed(1)}</span>
                    </span>
                    <span className="text-[11px] font-medium text-toota-ink truncate max-w-[75px]">
                      {podium.second.name.split(" ")[0]}
                    </span>
                    <span className="text-[9px] text-toota-muted font-bold px-1.5 py-0.2 rounded-full bg-toota-inner">
                      2nd
                    </span>
                  </div>
                ) : (
                  <div className="size-12" />
                )}

                {/* 1st Place (Center - Highest Podium) */}
                {podium.first && (
                  <div className="flex flex-col items-center gap-1 text-[10px] -translate-y-1">
                    <Avatar className="size-16 ring-3 ring-amber-400/60 shadow-md">
                      {podium.first.avatarUrl && (
                        <AvatarImage
                          src={podium.first.avatarUrl}
                          alt={podium.first.name}
                        />
                      )}
                      <AvatarFallback className="bg-toota-inner text-toota-ink font-bold text-sm">
                        {podium.first.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200 mt-1 shadow-2xs">
                      <Star className="size-3 fill-amber-500 text-amber-500" />
                      <span>{podium.first.rating.toFixed(1)}</span>
                    </span>
                    <span className="text-xs font-bold text-toota-ink truncate max-w-[85px]">
                      {podium.first.name.split(" ")[0]}
                    </span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15">
                      1st
                    </span>
                  </div>
                )}

                {/* 3rd Place (Right) */}
                {podium.third ? (
                  <div className="flex flex-col items-center gap-1 text-[10px]">
                    <Avatar className="size-11 ring-2 ring-border/50">
                      {podium.third.avatarUrl && (
                        <AvatarImage
                          src={podium.third.avatarUrl}
                          alt={podium.third.name}
                        />
                      )}
                      <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                        {podium.third.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-mono font-medium ring-1 ring-inset ring-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 mt-1">
                      <Star className="size-2.5 fill-amber-400 text-amber-400" />
                      <span>{podium.third.rating.toFixed(1)}</span>
                    </span>
                    <span className="text-[11px] font-medium text-toota-ink truncate max-w-[75px]">
                      {podium.third.name.split(" ")[0]}
                    </span>
                    <span className="text-[9px] text-toota-muted font-bold px-1.5 py-0.2 rounded-full bg-toota-inner">
                      3rd
                    </span>
                  </div>
                ) : (
                  <div className="size-11" />
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-toota-muted text-xs">
                No member reviews recorded yet.
              </div>
            )}
          </div>

          {/* List of Other Member Reviews */}
          <ul className="flex flex-col gap-3 list-none p-0 mt-1">
            {runnersUp.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-toota-inner transition-colors"
              >
                <Avatar className="size-9 ring-1 ring-border/40 shrink-0">
                  {item.avatarUrl && (
                    <AvatarImage src={item.avatarUrl} alt={item.name} />
                  )}
                  <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                    {item.initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-toota-ink leading-tight truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-toota-muted line-clamp-1 mt-0.5">
                    {item.content || "Verified Member Review"}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0">
                  <Star className="size-2.5 fill-amber-400 text-amber-400" />
                  <span>{item.rating.toFixed(1)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Real Members Data Table from GET /api/admins/members */}
      <Card className="toota-card border-none p-0 overflow-hidden">
        <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-border/40">
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("recentMembers") || "Recent Members"}
            </CardTitle>
            <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
              / {totalMembers} {t("navMembers") || "members"}
            </span>
          </div>
          <Link
            href="/members"
            className="text-xs font-semibold text-toota-ink hover:underline flex items-center gap-1"
          >
            <span>{t("viewAllMembers") || "View all"}</span>
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {/* Loading State */}
          {isLoading && (
            <div className="py-16 text-center text-toota-muted flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-toota-ink" />
              <p className="text-xs">Loading members...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="p-6 m-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error loading members</p>
                <p className="mt-0.5">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadDashboardData}
                  className="mt-2 text-xs h-7 rounded-full"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && members.length === 0 && (
            <div className="py-16 text-center px-4">
              <div className="size-12 rounded-full bg-toota-inner flex items-center justify-center mx-auto mb-3 text-toota-muted">
                <Users className="size-6" />
              </div>
              <h4 className="font-medium text-base text-toota-ink">
                {t("noMembersYet") || "No members registered yet"}
              </h4>
              <p className="text-xs text-toota-muted max-w-sm mx-auto mt-1 mb-4">
                {t("clickAddMember") ||
                  "Start by adding members to your facility."}
              </p>
              <Link href="/members">
                <Button className="toota-pill h-10 px-5 text-xs font-semibold">
                  <Plus className="size-3.5 me-1.5" />
                  <span>{t("viewAllMembers") || "View All"}</span>
                </Button>
              </Link>
            </div>
          )}

          {/* Members Table */}
          {!isLoading && !error && members.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent text-[11px] font-semibold text-toota-muted uppercase tracking-wider bg-black/[0.02] dark:bg-white/[0.02]">
                  <TableHead className="px-6 py-3.5">
                    {t("member") || "Member"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("username") || "Username"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("phone") || "Phone"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("status") || "Status"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("planName") || "Plan"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("joinedDate") || "Joined"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40 text-xs">
                {members.slice(0, 10).map((member) => {
                  const memberName =
                    `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                    member.userName ||
                    "Member";
                  const avatarUrl = member.profileImageUrl || member.photo || null;

                  const firstMembership = member.memberships?.[0];
                  const membershipStatus = firstMembership?.membershipStatus;
                  const isAccountBanned = member.accountStatus === "BANNED";
                  const isAccountPending = member.accountStatus === "PENDING";

                  let statusText = "INACTIVE";
                  if (isAccountBanned) {
                    statusText = "BANNED";
                  } else if (isAccountPending) {
                    statusText = "PENDING";
                  } else if (membershipStatus) {
                    statusText = membershipStatus;
                  } else if (member.accountStatus) {
                    statusText = member.accountStatus;
                  }

                  const matchedPlan = plans.find(
                    (p) => p.id === firstMembership?.membershipPlanId
                  );
                  const activePlan =
                    firstMembership?.membershipPlan?.planName ||
                    firstMembership?.membershipPlan?.name ||
                    matchedPlan?.planName ||
                    (firstMembership ? t("standardPlan") || "Standard Plan" : "—");

                  const joinedDate = member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString()
                    : "—";

                  return (
                    <TableRow
                      key={member.id}
                      className="border-border/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="px-6 py-3.5">
                        <Link
                          href={`/members/${member.id}`}
                          className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
                        >
                          <Avatar className="size-9 ring-1 ring-border/40 shrink-0">
                            {avatarUrl && (
                              <AvatarImage
                                src={avatarUrl}
                                alt={memberName}
                              />
                            )}
                            <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                              {getInitials(member.firstName, member.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-toota-ink group-hover:underline truncate">
                              {memberName}
                            </p>
                            <p className="text-[11px] text-toota-muted truncate">
                              {member.email}
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-toota-muted font-mono text-[11px]">
                        {member.userName ? `@${member.userName}` : "—"}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-toota-muted">
                        {member.phoneNumber || "—"}
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        {renderStatusBadge(statusText)}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-toota-ink font-normal">
                        <div>
                          <span>{activePlan}</span>
                          {firstMembership?.expiresAt && (
                            <span className="block text-[10px] text-toota-muted font-normal mt-0.5">
                              {t("expiryDate") || "Expires"}:{" "}
                              {new Date(
                                firstMembership.expiresAt
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-toota-muted">
                        {joinedDate}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { role, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 text-toota-ink animate-spin" />
      </div>
    );
  }

  if (role === "Member") {
    return <MemberDashboardView />;
  }

  return <AdminStaffDashboardView />;
}
