"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  ArrowRight,
  User,
  CreditCard,
  MessageSquareQuote,
  Loader2,
  CheckCircle2,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  fetchMyActiveMembership,
  fetchUpcomingVisits,
  fetchTodayVisits,
  fetchMemberAttendances,
  fetchMemberWorkingHours,
  cancelMemberVisit,
} from "@/lib/api/member-portal";
import {
  MemberMembership,
  MemberVisit,
  MemberAttendance,
  formatMembershipDuration,
} from "@/types/member-portal";
import { WorkingHour } from "@/types/working-hours";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BookVisitModal from "@/components/visits/BookVisitModal";

export default function MemberDashboardView() {
  const { t } = useTranslation();
  const { fullName, companyName, photo, initials } = useCurrentUser();

  const [membership, setMembership] = useState<MemberMembership | null>(null);
  const [upcomingVisits, setUpcomingVisits] = useState<MemberVisit[]>([]);
  const [todayVisits, setTodayVisits] = useState<MemberVisit[]>([]);
  const [attendances, setAttendances] = useState<MemberAttendance[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [cancellingVisitId, setCancellingVisitId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [m, uv, tv, att, wh] = await Promise.all([
        fetchMyActiveMembership().catch(() => null),
        fetchUpcomingVisits(1, 10).catch(() => []),
        fetchTodayVisits(1, 10).catch(() => []),
        fetchMemberAttendances(1, 10).catch(() => []),
        fetchMemberWorkingHours(1, 10).catch(() => []),
      ]);

      setMembership(m);
      setUpcomingVisits(uv);
      setTodayVisits(tv);
      setAttendances(att);
      setWorkingHours(wh);
    } catch {
      // Fail gracefully
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Today's day index: 0=Sun -> 7, 1=Mon, ..., 6=Sat
  const todayDayIndex = (() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  })();

  const todayHours = workingHours.find((h) => h.dayOfWeek === todayDayIndex);

  // Next scheduled workout (today's visit takes precedence, then upcoming)
  const nextVisit = todayVisits[0] || upcomingVisits[0];

  // Expiration days calculation
  const daysLeft = membership?.expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(membership.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  // Total duration calculation for progress bar
  const durationDaysTotal =
    membership?.expiresAt && membership?.startDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(membership.expiresAt).getTime() -
              new Date(membership.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 30;

  const percentRemaining =
    daysLeft !== null
      ? Math.min(100, Math.max(0, Math.round((daysLeft / durationDaysTotal) * 100)))
      : 0;

  // Handle visit cancellation
  const handleCancelVisit = async (visitId: string) => {
    setCancellingVisitId(visitId);
    try {
      await cancelMemberVisit(visitId);
      toast.success(t("visitCancelledSuccessfully") || "Visit successfully cancelled.", {
        position: "top-right",
      });
      await loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to cancel visit";
      toast.error(msg || "Failed to cancel visit", {
        position: "top-right",
      });
    } finally {
      setCancellingVisitId(null);
    }
  };

  // Helper date formatters
  const formatFriendlyDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const todayStr = new Date().toDateString();
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
    const targetStr = d.toDateString();

    if (targetStr === todayStr) return t("today") || "Today";
    if (targetStr === tomorrowStr) return t("tomorrow") || "Tomorrow";
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatFriendlyTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Crisp Outlined Micro-Badge Renderer
  const renderMembershipStatusBadge = (status?: string | null) => {
    const s = (status || "").toUpperCase();
    if (s === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Active</span>
        </span>
      );
    }
    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>Pending</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
        <span>Expired</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* 1. Member Hero Header Card (shadcn Card) */}
      <Card className="toota-card border-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <Avatar className="size-16 sm:size-20 ring-1 ring-border/50 shrink-0 shadow-2xs">
              {photo && <AvatarImage src={photo} alt={fullName} className="object-cover" />}
              <AvatarFallback className="bg-toota-ink text-white font-bold text-xl sm:text-2xl font-mono">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {t("welcomeBack") || "Welcome back"}, {fullName}
                </h1>
                {companyName && (
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                    / {companyName}
                  </span>
                )}
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {t("memberPortal") || "Member Portal"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-toota-muted font-normal">
                {t("memberDashboardSubtitle") ||
                  "Here is an overview of your active membership, workout schedule, and gym hours."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={loadData}
              disabled={isLoading}
              className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner text-toota-ink"
            >
              <RefreshCw className={`size-3.5 me-2 ${isLoading ? "animate-spin text-toota-ink" : ""}`} />
              <span>{t("refresh") || "Refresh"}</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsBookModalOpen(true)}
              className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5 me-1.5" />
              <span>{t("bookVisit") || "Book Visit"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Real Live Operational KPI Grid (4 Bento Cards with Restrained Green Accent) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Active Membership */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("activeMembership") || "Active Membership"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-green">
              <CreditCard className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between gap-2">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-green" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-toota-ink truncate">
                  {membership ? membership.membershipPlan.planName : t("noActiveMembership") || "No Plan"}
                </span>
              )}
              {renderMembershipStatusBadge(membership?.membershipStatus)}
            </div>

            <p className="text-xs text-toota-muted mt-2">
              {membership
                ? `${membership.membershipPlan.weeklyVisitLimit} ${t("visitsPerWeek") || "visits/wk"} · ${formatMembershipDuration(membership.membershipPlanDuration)}`
                : t("noActiveMembershipHint") || "Contact reception to subscribe"}
            </p>

            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  membership?.membershipStatus === "ACTIVE"
                    ? "bg-toota-green"
                    : "bg-toota-muted"
                }`}
                style={{ width: `${membership ? percentRemaining : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Next Scheduled Workout */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("nextWorkout") || "Next Workout"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <Calendar className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between gap-2">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-ink" />
              ) : nextVisit ? (
                <span className="text-3xl font-bold font-mono tracking-tight text-toota-ink">
                  {formatFriendlyTime(nextVisit.visitDateAndTime)}
                </span>
              ) : (
                <span className="text-2xl font-bold tracking-tight text-toota-muted">
                  {t("noWorkoutScheduled") || "None"}
                </span>
              )}

              {nextVisit ? (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{formatFriendlyDate(nextVisit.visitDateAndTime)}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                  <span>Unscheduled</span>
                </span>
              )}
            </div>

            <p className="text-xs text-toota-muted mt-2 truncate">
              {nextVisit
                ? new Date(nextVisit.visitDateAndTime).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : t("bookVisitPrompt") || "Book a session to reserve your spot"}
            </p>

            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  nextVisit ? "bg-toota-green" : "bg-toota-muted"
                }`}
                style={{ width: nextVisit ? "100%" : "0%" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Today's Facility Hours */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("todayGymHours") || "Today's Gym Hours"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <Clock className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between gap-2">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-ink" />
              ) : todayHours && !todayHours.isClosed ? (
                <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-toota-ink">
                  {todayHours.startTime} – {todayHours.endTime}
                </span>
              ) : todayHours?.isClosed ? (
                <span className="text-2xl font-bold tracking-tight text-toota-red">
                  {t("closedToday") || "Closed"}
                </span>
              ) : (
                <span className="text-xl font-bold tracking-tight text-toota-muted">
                  {t("scheduleUnset") || "Standard Hours"}
                </span>
              )}

              {todayHours && !todayHours.isClosed ? (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{t("openToday") || "Open today"}</span>
                </span>
              ) : todayHours?.isClosed ? (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{t("closedToday") || "Closed"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                  <span>Unset</span>
                </span>
              )}
            </div>

            <p className="text-xs text-toota-muted mt-2 truncate">
              {t("lastEntryAdvisory") || "Last entry 30 mins before closing"}
            </p>

            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  todayHours && !todayHours.isClosed ? "bg-toota-green" : "bg-toota-muted"
                }`}
                style={{ width: todayHours && !todayHours.isClosed ? "100%" : "0%" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Workouts Completed */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalWorkoutsCompleted") || "Completed Workouts"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-green">
              <CalendarCheck className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between gap-2">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-green" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {attendances.length}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Sessions</span>
              </span>
            </div>

            <p className="text-xs text-toota-muted mt-2 truncate">
              {attendances.length > 0
                ? `${t("lastCheckinMethod") || "Last Check-in"}: ${
                    attendances[0].attendanceMethod === "QR_CODE"
                      ? t("qrCheckIn") || "QR Check-in"
                      : t("manualCheckIn") || "Front Desk"
                  }`
                : t("noAttendancesYet") || "No recorded sessions yet"}
            </p>

            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-green transition-all"
                style={{ width: `${Math.min(100, Math.max(15, attendances.length * 10))}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Middle Bento Grid: Membership Dossier & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Active Membership Dossier (2 cols on lg) */}
        <Card className="toota-card border-none lg:col-span-2 flex flex-col justify-between">
          <CardHeader className="p-0 pb-4 border-b border-border/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {t("activeMembership") || "Active Membership"}
                </CardTitle>
                {membership && (
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                    / {membership.membershipPlan.planName}
                  </span>
                )}
              </div>
              {membership && renderMembershipStatusBadge(membership.membershipStatus)}
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4 flex-1">
            {membership ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-2xl font-bold tracking-tight text-toota-ink">
                      {membership.membershipPlan.planName}
                    </h3>
                    {daysLeft !== null && (
                      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                        <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {daysLeft} {t("daysRemaining") || "days remaining"}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-toota-muted mt-1.5">
                    {membership.membershipPlan.description ||
                      "Full gym facility access subscription plan."}
                  </p>
                </div>

                {/* Clean Metric Wells */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-toota-inner border border-border/40">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted">
                      {t("weeklyAllowance") || "Weekly Allowance"}
                    </p>
                    <p className="text-sm font-bold font-mono text-toota-ink mt-0.5">
                      {membership.membershipPlan.weeklyVisitLimit}{" "}
                      {t("visitsPerWeek") || "visits/wk"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-toota-inner border border-border/40">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted">
                      {t("planDuration") || "Plan Duration"}
                    </p>
                    <p className="text-sm font-bold font-mono text-toota-ink mt-0.5">
                      {formatMembershipDuration(membership.membershipPlanDuration)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-toota-inner border border-border/40 col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted">
                      {t("validUntil") || "Valid Until"}
                    </p>
                    <p className="text-sm font-bold font-mono text-toota-ink mt-0.5">
                      {new Date(membership.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Today's Workout Alert Banner if a visit is scheduled today */}
                {todayVisits.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-toota-inner border border-emerald-500/30 flex items-center justify-between gap-3 mt-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="size-4 text-toota-green shrink-0" />
                      <span className="text-xs font-medium text-toota-ink truncate">
                        Workout pass scheduled today for {formatFriendlyTime(todayVisits[0].visitDateAndTime)}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-toota-green shrink-0">
                      Ready for check-in
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <CreditCard className="size-8 text-toota-muted mx-auto opacity-40" />
                <p className="font-semibold text-sm text-toota-ink">
                  {t("noActiveMembership") || "No Active Membership"}
                </p>
                <p className="text-xs text-toota-muted max-w-sm mx-auto">
                  {t("noActiveMembershipHint") ||
                    "Visit the front desk to activate or renew your subscription."}
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-0 pt-4 mt-4 border-t border-border/40">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-toota-ink hover:underline"
            >
              <span>{t("manageMembershipInProfile") || "Manage Membership in Profile"}</span>
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </CardFooter>
        </Card>

        {/* Card 2: Upcoming Bookings Roster (1 col on lg) */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-4 border-b border-border/40">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("upcomingBookings") || "Upcoming Bookings"}
              </CardTitle>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {upcomingVisits.length}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4 flex-1">
            {upcomingVisits.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingVisits.slice(0, 3).map((visit) => {
                  const isCancelling = cancellingVisitId === visit.id;
                  return (
                    <div
                      key={visit.id}
                      className="p-3 rounded-xl bg-toota-inner border border-border/40 flex items-center justify-between gap-3 hover:border-border/80 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold font-mono text-toota-ink">
                          {formatFriendlyTime(visit.visitDateAndTime)}
                        </p>
                        <p className="text-[11px] text-toota-muted mt-0.5 truncate">
                          {formatFriendlyDate(visit.visitDateAndTime)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>Scheduled</span>
                        </span>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isCancelling}
                          onClick={() => handleCancelVisit(visit.id)}
                          className="h-7 w-7 p-0 text-toota-muted hover:text-toota-red hover:bg-destructive/10 cursor-pointer rounded-lg"
                        >
                          {isCancelling ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <X className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Calendar className="size-8 text-toota-muted mx-auto opacity-40" />
                <p className="font-semibold text-sm text-toota-ink">
                  {t("noUpcomingWorkouts") || "No upcoming workout sessions scheduled."}
                </p>
                <p className="text-xs text-toota-muted">
                  {t("bookVisitPrompt") ||
                    "Book your next visit to stay on track with your fitness goals."}
                </p>
                <Button
                  type="button"
                  onClick={() => setIsBookModalOpen(true)}
                  className="toota-pill mt-2 h-8 px-3.5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="size-3 me-1" />
                  <span>{t("bookVisit") || "Schedule Visit"}</span>
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-0 pt-4 mt-4 border-t border-border/40">
            <Link
              href="/visits"
              className="toota-pill w-full h-9 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner inline-flex items-center justify-center gap-1.5 text-toota-ink"
            >
              <span>{t("viewAllVisits") || "View All Visits"}</span>
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* 4. Quick Action Hub (4 Bento Cards with Consistent Toota Tokens) */}
      <div>
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t("quickActionHub") || "Quick Hub"}
          </h2>
          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
            / 4 shortcuts
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/visits"
            className="p-5 rounded-2xl toota-card border-none hover:bg-toota-inner/60 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-ink mb-3 group-hover:scale-105 transition-transform">
                <CalendarCheck className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-toota-ink group-hover:underline">
                {t("navVisits") || "Visits"}
              </h3>
              <p className="text-[11px] text-toota-muted mt-0.5">
                {t("visitsCardDesc") || "Book slots & view attendances"}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-toota-ink mt-4 pt-3 border-t border-border/30">
              <span>{t("viewAllVisits") || "View visits"}</span>
              <ArrowRight className="size-3 rtl:rotate-180" />
            </div>
          </Link>

          <Link
            href="/operating-hours"
            className="p-5 rounded-2xl toota-card border-none hover:bg-toota-inner/60 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-ink mb-3 group-hover:scale-105 transition-transform">
                <Clock className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-toota-ink group-hover:underline">
                {t("navOpeningHours") || "Gym Hours"}
              </h3>
              <p className="text-[11px] text-toota-muted mt-0.5">
                {todayHours && !todayHours.isClosed
                  ? `${todayHours.startTime} – ${todayHours.endTime}`
                  : t("hoursCardDesc") || "View daily facility timetable"}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-toota-ink mt-4 pt-3 border-t border-border/30">
              <span>{t("viewSchedule") || "View schedule"}</span>
              <ArrowRight className="size-3 rtl:rotate-180" />
            </div>
          </Link>

          <Link
            href="/profile"
            className="p-5 rounded-2xl toota-card border-none hover:bg-toota-inner/60 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-ink mb-3 group-hover:scale-105 transition-transform">
                <User className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-toota-ink group-hover:underline">
                {t("navProfile") || "Profile"}
              </h3>
              <p className="text-[11px] text-toota-muted mt-0.5">
                {t("profileCardDesc") || "Photos, credentials & history"}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-toota-ink mt-4 pt-3 border-t border-border/30">
              <span>{t("viewProfile") || "View profile"}</span>
              <ArrowRight className="size-3 rtl:rotate-180" />
            </div>
          </Link>

          <Link
            href="/feedbacks"
            className="p-5 rounded-2xl toota-card border-none hover:bg-toota-inner/60 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-ink mb-3 group-hover:scale-105 transition-transform">
                <MessageSquareQuote className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-toota-ink group-hover:underline">
                {t("navFeedback") || "Feedback"}
              </h3>
              <p className="text-[11px] text-toota-muted mt-0.5">
                {t("feedbackCardDesc") || "Share gym thoughts & suggestions"}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-toota-ink mt-4 pt-3 border-t border-border/30">
              <span>{t("leaveFeedback") || "Leave feedback"}</span>
              <ArrowRight className="size-3 rtl:rotate-180" />
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Recent Activity Log */}
      <Card className="toota-card border-none p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("recentAttendances") || "Recent Check-in Activity"}
            </h3>
            <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
              / {attendances.length} {t("total") || "total"}
            </span>
          </div>

          <Link
            href="/visits"
            className="text-xs text-toota-ink font-semibold hover:underline flex items-center gap-1"
          >
            <span>{t("viewAll") || "View all"}</span>
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Link>
        </div>

        {attendances.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Info className="size-7 text-toota-muted mx-auto opacity-40" />
            <p className="text-xs text-toota-muted max-w-sm mx-auto">
              {t("noRecentActivity") ||
                "No check-in history yet. Your completed workouts will appear here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {attendances.slice(0, 4).map((item) => {
              const d = new Date(item.checkedInAt);
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-toota-inner border border-border/40 hover:border-border/80 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-toota-muted">
                    <span className="font-semibold text-toota-ink">
                      {d.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="font-mono font-medium">
                      {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>
                      {item.attendanceMethod === "QR_CODE"
                        ? t("qrCheckIn") || "QR Check-in"
                        : t("manualCheckIn") || "Front Desk Check-in"}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 6. Book Visit Modal */}
      <BookVisitModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => {
          loadData();
          setIsBookModalOpen(false);
        }}
      />
    </div>
  );
}
