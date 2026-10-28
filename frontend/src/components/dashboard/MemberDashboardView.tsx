"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  User,
  CreditCard,
  MessageSquareQuote,
  Building,
  Award,
  Flame,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  fetchMyActiveMembership,
  fetchUpcomingVisits,
  fetchTodayVisits,
  fetchMemberAttendances,
  fetchMemberWorkingHours,
} from "@/lib/api/member-portal";
import {
  MemberMembership,
  MemberVisit,
  MemberAttendance,
  formatMembershipDuration,
} from "@/types/member-portal";
import { WorkingHour } from "@/types/working-hours";

export default function MemberDashboardView() {
  const { t } = useTranslation();
  const { fullName, companyName, photo, initials } = useCurrentUser();

  const [membership, setMembership] = useState<MemberMembership | null>(null);
  const [upcomingVisits, setUpcomingVisits] = useState<MemberVisit[]>([]);
  const [todayVisits, setTodayVisits] = useState<MemberVisit[]>([]);
  const [attendances, setAttendances] = useState<MemberAttendance[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [m, uv, tv, att, wh] = await Promise.all([
        fetchMyActiveMembership().catch(() => null),
        fetchUpcomingVisits(1, 5).catch(() => []),
        fetchTodayVisits(1, 5).catch(() => []),
        fetchMemberAttendances(1, 5).catch(() => []),
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

  // Today's day number in JS: 0=Sun, 1=Mon, ..., 6=Sat -> converted to 1:Mon..7:Sun
  const todayDayIndex = (() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  })();

  const todayHours = workingHours.find((h) => h.dayOfWeek === todayDayIndex);

  // Next scheduled workout
  const nextVisit = todayVisits[0] || upcomingVisits[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ring-4 ring-primary/20 overflow-hidden bg-surface-container flex items-center justify-center shrink-0 shadow-sm">
            {photo ? (
              <img src={photo} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center font-headline font-bold text-2xl">
                {initials}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {companyName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  <Building className="w-3 h-3" />
                  {companyName}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                {t("memberPortal") || "Member Portal"}
              </span>
            </div>

            <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface">
              {t("welcomeBack") || "Welcome back"}, {fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {t("memberDashboardSubtitle") ||
                "Here is an overview of your active membership, workout schedule, and gym hours."}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold border border-outline-variant/60 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t("refresh") || "Refresh"}</span>
          </button>
          <Link
            href="/visits"
            className="flex items-center gap-2 px-4 py-2.5 primary-gradient text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t("bookVisit") || "Book Visit"}</span>
          </Link>
        </div>
      </div>

      {/* Grid: Active Membership & Next Workout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Active Membership (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-surface-container-lowest border border-primary/20 shadow-sm p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Award className="w-4 h-4" />
                {t("activeMembership") || "Active Membership"}
              </span>
              {membership && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {membership.membershipStatus}
                </span>
              )}
            </div>

            {membership ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold font-headline text-on-surface">
                    {membership.membershipPlan.planName}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {membership.membershipPlan.description || "Full gym access plan."}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/50">
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                      {t("weeklyLimit") || "Weekly Allowance"}
                    </p>
                    <p className="text-base font-bold font-headline text-on-surface mt-0.5">
                      {membership.membershipPlan.weeklyVisitLimit} {t("visitsPerWeek") || "visits/wk"}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/50">
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                      {t("planDuration") || "Duration"}
                    </p>
                    <p className="text-base font-bold font-headline text-on-surface mt-0.5">
                      {formatMembershipDuration(membership.membershipPlanDuration)}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/50 col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                      {t("expiresOn") || "Valid Until"}
                    </p>
                    <p className="text-base font-bold font-headline text-primary mt-0.5">
                      {new Date(membership.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <CreditCard className="w-8 h-8 text-on-surface-variant mx-auto opacity-60" />
                <p className="font-bold text-sm text-on-surface">
                  {t("noActiveMembership") || "No Active Membership"}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {t("noActiveMembershipHint") || "Contact front desk to activate your subscription."}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-outline-variant/50 flex items-center justify-between">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>{t("viewMembershipDetails") || "Manage Membership in Profile"}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        {/* Card 2: Next Workout Schedule (1 col) */}
        <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                {t("nextWorkout") || "Next Workout"}
              </span>
            </div>

            {nextVisit ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1.5">
                  <span className="text-[11px] font-bold text-primary uppercase">
                    {new Date(nextVisit.visitDateAndTime).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <p className="text-2xl font-extrabold font-headline text-on-surface">
                    {new Date(nextVisit.visitDateAndTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {t("rememberToArriveOnTime") || "Pass code is valid for 30 minutes after your booked time."}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <Calendar className="w-8 h-8 text-on-surface-variant mx-auto opacity-50" />
                <p className="font-bold text-sm text-on-surface">
                  {t("noWorkoutScheduled") || "No Workout Scheduled"}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {t("bookVisitPrompt") || "Book your next visit to stay on track with your goals."}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-outline-variant/50">
            <Link
              href="/visits"
              className="w-full py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold border border-outline-variant/60 flex items-center justify-center gap-1.5 transition-all"
            >
              <span>{t("viewAllVisits") || "View All Visits"}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/visits"
          className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/40 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <h3 className="font-headline font-bold text-sm text-on-surface">
            {t("navVisits") || "Visits"}
          </h3>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {t("visitsCardDesc") || "Book slots & view attendances"}
          </p>
        </Link>

        <Link
          href="/operating-hours"
          className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/40 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-headline font-bold text-sm text-on-surface">
            {t("navOpeningHours") || "Gym Hours"}
          </h3>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {todayHours && !todayHours.isClosed
              ? `${todayHours.startTime} - ${todayHours.endTime}`
              : t("checkTimetable") || "View daily facility timetable"}
          </p>
        </Link>

        <Link
          href="/profile"
          className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/40 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <User className="w-5 h-5" />
          </div>
          <h3 className="font-headline font-bold text-sm text-on-surface">
            {t("navProfile") || "Profile"}
          </h3>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {t("profileCardDesc") || "Photos, credentials & history"}
          </p>
        </Link>

        <Link
          href="/feedbacks"
          className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/40 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
          <h3 className="font-headline font-bold text-sm text-on-surface">
            {t("navFeedback") || "Feedback"}
          </h3>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {t("feedbackCardDesc") || "Share gym thoughts & suggestions"}
          </p>
        </Link>
      </div>

      {/* Recent Activity Log */}
      <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {t("recentAttendances") || "Recent Check-in Activity"}
          </h3>
          <Link
            href="/visits"
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
          >
            <span>{t("viewAll") || "View all"}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>

        {attendances.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-4 text-center">
            {t("noRecentActivity") || "No check-in history yet. Your completed workouts will appear here."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {attendances.slice(0, 3).map((item) => {
              const d = new Date(item.checkedInAt);
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/50 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span className="font-bold text-on-surface">
                      {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="font-mono">
                      {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {item.attendanceMethod === "QR_CODE" ? "QR Check-in" : "Manual Check-in"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
