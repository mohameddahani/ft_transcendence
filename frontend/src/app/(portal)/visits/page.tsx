"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarCheck,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  Loader2,
  Ban,
  Eye,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  fetchUpcomingVisits,
  fetchTodayVisits,
  fetchTodayVisitById,
  cancelMemberVisit,
} from "@/lib/api/member-portal";
import { MemberVisit } from "@/types/member-portal";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BookVisitModal from "@/components/visits/BookVisitModal";

export default function MemberVisitsPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"upcoming" | "today">("upcoming");
  const [upcomingVisits, setUpcomingVisits] = useState<MemberVisit[]>([]);
  const [todayVisits, setTodayVisits] = useState<MemberVisit[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Single Item View Detail Modals
  const [selectedVisit, setSelectedVisit] = useState<MemberVisit | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [upcoming, today] = await Promise.all([
        fetchUpcomingVisits(1, 50).catch(() => []),
        fetchTodayVisits(1, 50).catch(() => []),
      ]);
      setUpcomingVisits(upcoming);
      setTodayVisits(today);
    } catch {
      toast.error(t("failedToLoadVisits", "Failed to load visits data"), {
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cancel Visit Handler
  const handleCancelVisit = async (visitId: string) => {
    setCancellingId(visitId);
    try {
      await cancelMemberVisit(visitId);
      toast.success(t("visitCancelledSuccessfully", "Visit successfully cancelled."), {
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
      setCancellingId(null);
    }
  };

  // Inspect Single Visit
  const handleInspectVisit = async (visitId: string) => {
    try {
      const visit = await fetchTodayVisitById(visitId);
      setSelectedVisit(visit);
    } catch {
      // Fallback to in-memory item
      const found = todayVisits.find((v) => v.id === visitId) || upcomingVisits.find((v) => v.id === visitId);
      if (found) setSelectedVisit(found);
    }
  };

  // Crisp Outlined Micro-Badges
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span suppressHydrationWarning>{t("ready", "Scheduled")}</span>
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span suppressHydrationWarning>{t("checkedIn", "Checked In")}</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
            <span suppressHydrationWarning>{t("cancelled", "Cancelled")}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
            <span>{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto pb-12">
      {/* 1. Top Header Card (Single Typographic Baseline Metric) */}
      <Card className="toota-card border-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h1
                suppressHydrationWarning
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
              >
                {t("myGymVisits", "My Workout Visits")}
              </h1>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {t("memberPortal", "Member Portal")}
              </span>
              <span
                suppressHydrationWarning
                className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums"
              >
                / {activeTab === "upcoming"
                  ? `${upcomingVisits.length} ${t("upcomingVisits", "upcoming")}`
                  : `${todayVisits.length} ${t("today", "today")}`}
              </span>
            </div>
            <p
              suppressHydrationWarning
              className="text-xs sm:text-sm text-toota-muted mt-1 font-normal"
            >
              {t(
                "myGymVisitsSubtitle",
                "Schedule workouts ahead of time and check upcoming sessions."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={loadData}
              disabled={isLoading}
              className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
            >
              <RefreshCw className={`size-3.5 me-2 ${isLoading ? "animate-spin text-toota-ink" : ""}`} />
              <span suppressHydrationWarning>{t("refresh", "Refresh")}</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsBookModalOpen(true)}
              className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5 me-1.5" />
              <span suppressHydrationWarning>{t("bookVisit", "Schedule Visit")}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Bento KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Metric 1: Upcoming Visits */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span
              suppressHydrationWarning
              className="text-xs font-semibold uppercase tracking-wider text-toota-muted"
            >
              {t("upcomingVisits", "Upcoming Visits")}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <Calendar className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between gap-2">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-ink" />
              ) : (
                <span className="text-3xl font-bold tracking-tight text-toota-ink font-mono">
                  {upcomingVisits.length}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span suppressHydrationWarning>{t("ready", "Scheduled")}</span>
              </span>
            </div>
            <p
              suppressHydrationWarning
              className="text-xs text-toota-muted mt-2 truncate"
            >
              {upcomingVisits.length > 0
                ? `${upcomingVisits.length} upcoming workouts reserved`
                : t("noUpcomingVisits", "No upcoming visits scheduled")}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  upcomingVisits.length > 0 ? "bg-amber-500" : "bg-toota-muted"
                }`}
                style={{ width: upcomingVisits.length > 0 ? "100%" : "0%" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Today's Schedule */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span
              suppressHydrationWarning
              className="text-xs font-semibold uppercase tracking-wider text-toota-muted"
            >
              {t("todaysVisits", "Visits Today")}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <Clock className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between gap-2">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-ink" />
              ) : (
                <span className="text-3xl font-bold tracking-tight text-toota-ink font-mono">
                  {todayVisits.length}
                </span>
              )}
              {todayVisits.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span suppressHydrationWarning>{t("today", "Today")}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                  <span>None</span>
                </span>
              )}
            </div>
            <p
              suppressHydrationWarning
              className="text-xs text-toota-muted mt-2 truncate"
            >
              {todayVisits.length > 0
                ? t("checkInAllowed", "Check-in ready upon arrival")
                : t("noVisitsToday", "No visits scheduled for today")}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  todayVisits.length > 0 ? "bg-toota-green" : "bg-toota-muted"
                }`}
                style={{ width: todayVisits.length > 0 ? "100%" : "0%" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Segmented Navigation Tabs */}
      <div className="p-1 rounded-2xl bg-toota-inner border border-border/40 inline-flex items-center gap-1 max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`toota-pill flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "upcoming"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold"
              : "text-toota-muted hover:text-toota-ink hover:bg-white/40 dark:hover:bg-zinc-800/40"
          }`}
        >
          <Calendar className="size-3.5" />
          <span suppressHydrationWarning>{t("upcomingVisits", "Upcoming Visits")}</span>
          <span className="font-mono text-[11px] tabular-nums opacity-75">
            ({upcomingVisits.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`toota-pill flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "today"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold"
              : "text-toota-muted hover:text-toota-ink hover:bg-white/40 dark:hover:bg-zinc-800/40"
          }`}
        >
          <Clock className="size-3.5" />
          <span suppressHydrationWarning>{t("todaysVisits", "Today's Schedule")}</span>
          <span className="font-mono text-[11px] tabular-nums opacity-75">
            ({todayVisits.length})
          </span>
        </button>
      </div>

      {/* 4. Tab 1: Upcoming Visits */}
      {activeTab === "upcoming" && (
        <div>
          {upcomingVisits.length === 0 ? (
            <Card className="toota-card border-none p-12 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-toota-inner text-toota-muted flex items-center justify-center mx-auto">
                <Calendar className="size-6" />
              </div>
              <h3
                suppressHydrationWarning
                className="font-semibold text-base text-toota-ink"
              >
                {t("noUpcomingVisits", "No Upcoming Visits Scheduled")}
              </h3>
              <p
                suppressHydrationWarning
                className="text-xs text-toota-muted max-w-sm mx-auto leading-relaxed"
              >
                {t(
                  "noUpcomingVisitsHint",
                  "You have no upcoming workout visits. Schedule one now to guarantee your gym slot!"
                )}
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setIsBookModalOpen(true)}
                  className="toota-pill h-9 px-4 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="size-3.5 me-1.5" />
                  <span suppressHydrationWarning>{t("bookVisit", "Schedule Visit")}</span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingVisits.map((visit) => {
                const dateObj = new Date(visit.visitDateAndTime);
                const isCancelling = cancellingId === visit.id;

                return (
                  <Card
                    key={visit.id}
                    className="toota-card border-none flex flex-col justify-between gap-4 p-5 hover:bg-toota-inner/30 transition-all shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {renderStatusBadge(visit.visitStatus)}
                        <span className="text-xs text-toota-muted font-mono tabular-nums">
                          {dateObj.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-toota-ink font-bold text-xl font-mono">
                          <Clock className="size-4 text-primary shrink-0" />
                          <span>
                            {dateObj.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {visit.membership?.membershipPlan?.planName && (
                          <p className="text-xs text-toota-muted mt-1">
                            {t("membership", "Plan")}: {visit.membership.membershipPlan.planName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInspectVisit(visit.id)}
                        className="toota-pill h-8 px-3 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
                      >
                        <Eye className="size-3.5 me-1 text-toota-muted" />
                        <span suppressHydrationWarning>{t("details", "Details")}</span>
                      </Button>

                      {visit.visitStatus === "READY" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelVisit(visit.id)}
                          disabled={isCancelling}
                          className="toota-pill h-8 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <Loader2 className="size-3.5 animate-spin me-1" />
                          ) : (
                            <Ban className="size-3.5 me-1" />
                          )}
                          <span suppressHydrationWarning>{t("cancelVisit", "Cancel")}</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Today's Visits */}
      {activeTab === "today" && (
        <div>
          {todayVisits.length === 0 ? (
            <Card className="toota-card border-none p-12 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-toota-inner text-toota-muted flex items-center justify-center mx-auto">
                <Clock className="size-6" />
              </div>
              <h3
                suppressHydrationWarning
                className="font-semibold text-base text-toota-ink"
              >
                {t("noVisitsToday", "No Visits Scheduled for Today")}
              </h3>
              <p
                suppressHydrationWarning
                className="text-xs text-toota-muted max-w-sm mx-auto leading-relaxed"
              >
                {t(
                  "noVisitsTodayHint",
                  "You don't have any workout visits scheduled for today. Feel free to book a slot whenever you're ready!"
                )}
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setIsBookModalOpen(true)}
                  className="toota-pill h-9 px-4 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="size-3.5 me-1.5" />
                  <span suppressHydrationWarning>{t("bookVisit", "Schedule Visit")}</span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayVisits.map((visit) => {
                const dateObj = new Date(visit.visitDateAndTime);
                const isCancelling = cancellingId === visit.id;

                return (
                  <Card
                    key={visit.id}
                    className="toota-card border-none flex flex-col justify-between gap-4 p-5 hover:bg-toota-inner/30 transition-all shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {renderStatusBadge(visit.visitStatus)}
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span suppressHydrationWarning>{t("today", "Today")}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-toota-inner text-toota-ink flex items-center justify-center shrink-0">
                          <Clock className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xl font-mono text-toota-ink">
                            {dateObj.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p
                            suppressHydrationWarning
                            className="text-xs text-toota-muted mt-0.5"
                          >
                            {t("checkInAllowed", "Check-in ready upon arrival")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInspectVisit(visit.id)}
                        className="toota-pill h-8 px-3 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
                      >
                        <Eye className="size-3.5 me-1 text-toota-muted" />
                        <span suppressHydrationWarning>{t("viewDetails", "Details")}</span>
                      </Button>

                      {visit.visitStatus === "READY" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelVisit(visit.id)}
                          disabled={isCancelling}
                          className="toota-pill h-8 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <Loader2 className="size-3.5 animate-spin me-1" />
                          ) : (
                            <Ban className="size-3.5 me-1" />
                          )}
                          <span suppressHydrationWarning>{t("cancel", "Cancel")}</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <BookVisitModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Inspect Visit Detail Modal */}
      {selectedVisit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150"
        >
          <Card className="toota-card border-none shadow-2xl relative w-full max-w-md p-6 space-y-5">
            <button
              type="button"
              onClick={() => setSelectedVisit(null)}
              className="absolute top-5 end-5 p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-toota-inner text-toota-ink flex items-center justify-center">
                <CalendarCheck className="size-5" />
              </div>
              <div>
                <h3
                  suppressHydrationWarning
                  className="font-semibold text-base text-toota-ink"
                >
                  {t("visitDetails", "Visit Details")}
                </h3>
                <p className="text-xs text-toota-muted font-mono tabular-nums">
                  {selectedVisit.id.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-toota-inner border border-border/40 space-y-2.5 text-xs text-toota-ink">
              <div className="flex items-center justify-between">
                <span className="text-toota-muted">{t("status", "Status")}:</span>
                {renderStatusBadge(selectedVisit.visitStatus)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-toota-muted">{t("scheduledTime", "Scheduled")}:</span>
                <span className="font-semibold text-toota-ink font-mono tabular-nums">
                  {new Date(selectedVisit.visitDateAndTime).toLocaleString()}
                </span>
              </div>
              {selectedVisit.membership?.membershipPlan?.planName && (
                <div className="flex items-center justify-between">
                  <span className="text-toota-muted">{t("membershipPlan", "Plan")}:</span>
                  <span className="font-semibold text-toota-ink">
                    {selectedVisit.membership.membershipPlan.planName}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={() => setSelectedVisit(null)}
              className="toota-pill w-full h-10 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
              variant="outline"
            >
              <span suppressHydrationWarning>{t("close", "Close")}</span>
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
