"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  UserCheck,
  Ban,
  ArrowRight,
  Eye,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  fetchUpcomingVisits,
  fetchTodayVisits,
  fetchTodayVisitById,
  cancelMemberVisit,
  fetchMemberAttendances,
  fetchMemberAttendanceById,
} from "@/lib/api/member-portal";
import { MemberVisit, MemberAttendance } from "@/types/member-portal";
import BookVisitModal from "@/components/visits/BookVisitModal";

export default function MemberVisitsPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"upcoming" | "today" | "attendances">("upcoming");
  const [upcomingVisits, setUpcomingVisits] = useState<MemberVisit[]>([]);
  const [todayVisits, setTodayVisits] = useState<MemberVisit[]>([]);
  const [attendances, setAttendances] = useState<MemberAttendance[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Single Item View Detail Modals
  const [selectedVisit, setSelectedVisit] = useState<MemberVisit | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<MemberAttendance | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [upcoming, today, att] = await Promise.all([
        fetchUpcomingVisits(1, 50).catch(() => []),
        fetchTodayVisits(1, 50).catch(() => []),
        fetchMemberAttendances(1, 50).catch(() => []),
      ]);
      setUpcomingVisits(upcoming);
      setTodayVisits(today);
      setAttendances(att);
    } catch {
      toast.error(t("failedToLoadVisits") || "Failed to load visits data", {
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cancel Visit Handler
  const handleCancelVisit = async (visitId: string) => {
    setCancellingId(visitId);
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
      setCancellingId(null);
    }
  };

  // Inspect Single Visit
  const handleInspectVisit = async (visitId: string) => {
    setIsDetailLoading(true);
    try {
      const visit = await fetchTodayVisitById(visitId);
      setSelectedVisit(visit);
    } catch {
      // Fallback to in-memory item
      const found = todayVisits.find((v) => v.id === visitId) || upcomingVisits.find((v) => v.id === visitId);
      if (found) setSelectedVisit(found);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Inspect Single Attendance
  const handleInspectAttendance = async (attendanceId: string) => {
    setIsDetailLoading(true);
    try {
      const att = await fetchMemberAttendanceById(attendanceId);
      setSelectedAttendance(att);
    } catch {
      const found = attendances.find((a) => a.id === attendanceId);
      if (found) setSelectedAttendance(found);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {t("ready") || "Scheduled"}
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("checkedIn") || "Checked In"}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-error/10 text-error border border-error/20">
            <XCircle className="w-3.5 h-3.5" />
            {t("cancelled") || "Cancelled"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner & Quick Booking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 mb-1">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{t("visitsAndAttendances") || "Visits & Attendances"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-on-surface">
            {t("myGymVisits") || "My Workout Visits"}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            {t("myGymVisitsSubtitle") ||
              "Schedule workouts ahead of time, check upcoming sessions, and review your workout history."}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold border border-outline-variant/60 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t("refresh") || "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 primary-gradient text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("bookVisit") || "Schedule Visit"}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {t("upcomingVisits") || "Upcoming Visits"}
            </p>
            <p className="text-2xl font-bold font-headline text-on-surface mt-1">
              {upcomingVisits.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {t("todaysVisits") || "Visits Today"}
            </p>
            <p className="text-2xl font-bold font-headline text-primary mt-1">
              {todayVisits.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {t("totalAttendances") || "Completed Check-ins"}
            </p>
            <p className="text-2xl font-bold font-headline text-emerald-600 dark:text-emerald-400 mt-1">
              {attendances.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "upcoming"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>
            {t("upcomingVisits") || "Upcoming Visits"} ({upcomingVisits.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "today"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {t("todaysVisits") || "Today's Schedule"} ({todayVisits.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("attendances")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "attendances"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>
            {t("attendanceHistory") || "Attendance History"} ({attendances.length})
          </span>
        </button>
      </div>

      {/* Tab 1: Upcoming Visits */}
      {activeTab === "upcoming" && (
        <div className="space-y-4">
          {upcomingVisits.length === 0 ? (
            <div className="p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                {t("noUpcomingVisits") || "No Upcoming Visits Scheduled"}
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                {t("noUpcomingVisitsHint") ||
                  "You have no upcoming workout visits. Schedule one now to guarantee your gym slot!"}
              </p>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 primary-gradient text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t("bookVisit") || "Schedule Visit"}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingVisits.map((visit) => {
                const dateObj = new Date(visit.visitDateAndTime);
                const isCancelling = cancellingId === visit.id;

                return (
                  <div
                    key={visit.id}
                    className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex flex-col justify-between gap-4 hover:border-primary/30 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {getStatusBadge(visit.visitStatus)}
                        <span className="text-[11px] text-on-surface-variant font-mono">
                          {dateObj.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-on-surface font-headline font-extrabold text-xl">
                          <Clock className="w-5 h-5 text-primary shrink-0" />
                          <span>
                            {dateObj.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {visit.membership?.membershipPlan?.planName && (
                          <p className="text-xs text-on-surface-variant mt-1">
                            {t("membership") || "Plan"}: {visit.membership.membershipPlan.planName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectVisit(visit.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t("details") || "Details"}</span>
                      </button>

                      {visit.visitStatus === "READY" && (
                        <button
                          type="button"
                          onClick={() => handleCancelVisit(visit.id)}
                          disabled={isCancelling}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-error/10 hover:bg-error/20 text-error text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                          <span>{t("cancelVisit") || "Cancel"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Today's Visits */}
      {activeTab === "today" && (
        <div className="space-y-4">
          {todayVisits.length === 0 ? (
            <div className="p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                {t("noVisitsToday") || "No Visits Scheduled for Today"}
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                {t("noVisitsTodayHint") ||
                  "You don't have any workout visits scheduled for today. Feel free to book a slot whenever you're ready!"}
              </p>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 primary-gradient text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t("bookVisit") || "Schedule Visit"}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayVisits.map((visit) => {
                const dateObj = new Date(visit.visitDateAndTime);
                const isCancelling = cancellingId === visit.id;

                return (
                  <div
                    key={visit.id}
                    className="p-5 rounded-3xl bg-surface-container-lowest border border-primary/20 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {getStatusBadge(visit.visitStatus)}
                        <span className="text-xs font-bold text-primary">
                          {t("today") || "Today"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-headline font-extrabold text-xl text-on-surface">
                            {dateObj.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {t("checkInAllowed") || "Check-in ready upon arrival"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectVisit(visit.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t("viewDetails") || "View Details"}</span>
                      </button>

                      {visit.visitStatus === "READY" && (
                        <button
                          type="button"
                          onClick={() => handleCancelVisit(visit.id)}
                          disabled={isCancelling}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-error/10 hover:bg-error/20 text-error text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                          <span>{t("cancel") || "Cancel"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Attendance History */}
      {activeTab === "attendances" && (
        <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between">
            <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              {t("attendanceLogs") || "Check-in Logs"}
            </h3>
            <span className="text-xs text-on-surface-variant font-mono">
              {attendances.length} {t("sessions") || "sessions"}
            </span>
          </div>

          {attendances.length === 0 ? (
            <div className="p-12 text-center text-xs text-on-surface-variant">
              {t("noAttendancesYet") || "No attendance check-ins recorded yet."}
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/40">
              {attendances.map((item) => {
                const checkedInDate = new Date(item.checkedInAt);
                return (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-headline font-bold text-sm text-on-surface">
                          {checkedInDate.toLocaleDateString(undefined, {
                            weekday: "long",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-2">
                          <span className="font-mono">
                            {checkedInDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-primary">
                            {item.attendanceMethod === "QR_CODE" ? (
                              <>
                                <QrCode className="w-3 h-3" />
                                {t("qrCheckIn") || "QR Check-in"}
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                {t("manualCheckIn") || "Front Desk Check-in"}
                              </>
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleInspectAttendance(item.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/50 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t("viewDetails") || "Details"}</span>
                      </button>
                    </div>
                  </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xl p-6 sm:p-8 space-y-5">
            <button
              type="button"
              onClick={() => setSelectedVisit(null)}
              className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-on-surface">
                  {t("visitDetails") || "Visit Details"}
                </h3>
                <p className="text-xs text-on-surface-variant font-mono">
                  {selectedVisit.id.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">{t("status") || "Status"}:</span>
                {getStatusBadge(selectedVisit.visitStatus)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">{t("scheduledTime") || "Scheduled"}:</span>
                <span className="font-semibold text-on-surface">
                  {new Date(selectedVisit.visitDateAndTime).toLocaleString()}
                </span>
              </div>
              {selectedVisit.membership?.membershipPlan?.planName && (
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">{t("membershipPlan") || "Plan"}:</span>
                  <span className="font-semibold text-on-surface">
                    {selectedVisit.membership.membershipPlan.planName}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedVisit(null)}
              className="w-full py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs border border-outline-variant/60 cursor-pointer"
            >
              {t("close") || "Close"}
            </button>
          </div>
        </div>
      )}

      {/* Inspect Attendance Detail Modal */}
      {selectedAttendance && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xl p-6 sm:p-8 space-y-5">
            <button
              type="button"
              onClick={() => setSelectedAttendance(null)}
              className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-on-surface">
                  {t("attendanceDetails") || "Attendance Details"}
                </h3>
                <p className="text-xs text-on-surface-variant font-mono">
                  {selectedAttendance.id.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">{t("checkedInAt") || "Checked In At"}:</span>
                <span className="font-semibold text-on-surface">
                  {new Date(selectedAttendance.checkedInAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">{t("method") || "Method"}:</span>
                <span className="font-bold text-primary">
                  {selectedAttendance.attendanceMethod === "QR_CODE" ? "QR Code" : "Manual Front Desk"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedAttendance(null)}
              className="w-full py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs border border-outline-variant/60 cursor-pointer"
            >
              {t("close") || "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
