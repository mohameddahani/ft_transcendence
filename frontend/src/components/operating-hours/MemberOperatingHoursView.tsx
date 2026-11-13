"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  Calendar,
  CalendarDays,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Sun,
  Moon,
  Info,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { WorkingHour, SpecialHour } from "@/types/working-hours";
import {
  fetchMemberWorkingHours,
  fetchMemberSpecialHours,
} from "@/lib/api/member-portal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MemberOperatingHoursView() {
  const { t } = useTranslation();
  const { companyName } = useCurrentUser();

  // Data State
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab: 'regular' | 'special'
  const [activeTab, setActiveTab] = useState<"regular" | "special">("regular");

  // Helper to format daily operating duration
  const calculateDuration = (startTime?: string | null, endTime?: string | null): string | null => {
    if (!startTime || !endTime) return null;
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return null;
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) return `${hours} hrs`;
    return `${hours}h ${minutes}m`;
  };

  // Filters for Special Hours
  const [closureFilter, setClosureFilter] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");
  const [searchDate, setSearchDate] = useState("");

  // Load Member Operating Hours and Special Hours
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [whData, shData] = await Promise.all([
        fetchMemberWorkingHours(1, 50).catch(() => []),
        fetchMemberSpecialHours(1, 50).catch(() => []),
      ]);
      setWorkingHours(whData);
      setSpecialHours(shData);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("failedToLoadHours"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Days list (1: Monday to 7: Sunday)
  const daysMap = useMemo(() => {
    return [
      { day: 1, name: t("monday"), short: t("monday").slice(0, 3) },
      { day: 2, name: t("tuesday"), short: t("tuesday").slice(0, 3) },
      { day: 3, name: t("wednesday"), short: t("wednesday").slice(0, 3) },
      { day: 4, name: t("thursday"), short: t("thursday").slice(0, 3) },
      { day: 5, name: t("friday"), short: t("friday").slice(0, 3) },
      { day: 6, name: t("saturday"), short: t("saturday").slice(0, 3) },
      { day: 7, name: t("sunday"), short: t("sunday").slice(0, 3) },
    ];
  }, [t]);

  // Current local Day of Week (1: Monday ... 7: Sunday)
  const todayDayOfWeek = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
  }, []);

  // Map working hour by dayOfWeek
  const workingHoursByDay = useMemo(() => {
    const map = new Map<number, WorkingHour>();
    workingHours.forEach((wh) => map.set(wh.dayOfWeek, wh));
    return map;
  }, [workingHours]);

  // Total weekly operating hours calculation
  const totalWeeklyOperatingHours = useMemo(() => {
    let totalMins = 0;
    workingHours.forEach((wh) => {
      if (!wh.isClosed && wh.startTime && wh.endTime) {
        const [sh, sm] = wh.startTime.split(":").map(Number);
        const [eh, em] = wh.endTime.split(":").map(Number);
        if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
          const diff = eh * 60 + em - (sh * 60 + sm);
          if (diff > 0) totalMins += diff;
        }
      }
    });
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return { hours, mins, totalMins };
  }, [workingHours]);

  // Live status (Is the gym open right now?)
  const liveStatus = useMemo(() => {
    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayISO = `${year}-${month}-${day}`;

    // Check if there is an active special closure today
    const activeSpecial = specialHours.find((sh) => {
      const start = sh.startDate ? sh.startDate.split("T")[0] : "";
      const end = sh.endDate ? sh.endDate.split("T")[0] : start;
      if (todayISO >= start && todayISO <= end) {
        if (!sh.startTime && !sh.endTime) {
          return true; // Full day closure
        }
        if (sh.startTime && sh.endTime) {
          return currentHourMin >= sh.startTime && currentHourMin <= sh.endTime;
        }
      }
      return false;
    });

    if (activeSpecial) {
      return {
        isOpen: false,
        reason: t("specialClosureInEffect"),
        badge: t("closedSpecialEvent"),
      };
    }

    const todayHour = workingHoursByDay.get(todayDayOfWeek);
    if (!todayHour) {
      return {
        isOpen: false,
        reason: t("scheduleNotConfiguredToday"),
        badge: t("scheduleUnsetBadge"),
      };
    }

    if (todayHour.isClosed) {
      return {
        isOpen: false,
        reason: t("facilityRegularlyClosed"),
        badge: t("closedTodayBadge"),
      };
    }

    if (
      todayHour.startTime &&
      todayHour.endTime &&
      currentHourMin >= todayHour.startTime &&
      currentHourMin <= todayHour.endTime
    ) {
      return {
        isOpen: true,
        reason: t("openUntilTime", { time: todayHour.endTime }),
        badge: t("openNow"),
      };
    }

    if (todayHour.startTime && currentHourMin < todayHour.startTime) {
      return {
        isOpen: false,
        reason: t("opensAtTime", { time: todayHour.startTime }),
        badge: t("closedOpensLater"),
      };
    }

    return {
      isOpen: false,
      reason: t("facilityClosed"),
      badge: t("closed"),
    };
  }, [workingHoursByDay, specialHours, todayDayOfWeek, t]);

  // Filtered Special Hours
  const filteredSpecialHours = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayISO = `${year}-${month}-${day}`;

    return specialHours
      .filter((sh) => {
        const start = sh.startDate ? sh.startDate.split("T")[0] : "";
        const end = sh.endDate ? sh.endDate.split("T")[0] : start;

        // Search Date filter
        if (searchDate) {
          if (!start.includes(searchDate) && !end.includes(searchDate)) {
            return false;
          }
        }

        // Status filter
        if (closureFilter === "UPCOMING") {
          return end >= todayISO;
        }
        if (closureFilter === "PAST") {
          return end < todayISO;
        }
        return true;
      })
      .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  }, [specialHours, closureFilter, searchDate]);

  const openDaysCount = useMemo(
    () => workingHours.filter((wh) => !wh.isClosed).length,
    [workingHours]
  );

  const upcomingSpecialCount = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayISO = `${year}-${month}-${day}`;
    return specialHours.filter((sh) => {
      const end = sh.endDate ? sh.endDate.split("T")[0] : sh.startDate?.split("T")[0] || "";
      return end >= todayISO;
    }).length;
  }, [specialHours]);

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-16">
      {/* Top Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("operatingHoursTitle")}
              </h1>
              {companyName && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {companyName}
                </span>
              )}
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {t("memberSchedule")}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t("operatingHoursMemberSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 ${
                liveStatus.isOpen
                  ? "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs"
                  : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  liveStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span>{liveStatus.badge}</span>
            </span>

            {/* Refresh Button */}
            <Button
              type="button"
              variant="outline"
              onClick={loadData}
              disabled={isLoading}
              className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
            >
              <RefreshCw
                className={`size-3.5 me-2 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>{t("refresh")}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Bento KPI Command Center */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Facility Live Status */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("liveFacilityStatus")}
            </span>
            <div
              className={`size-10 rounded-full flex items-center justify-center ${
                liveStatus.isOpen
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-toota-inner text-toota-muted"
              }`}
            >
              {liveStatus.isOpen ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold tracking-tight text-toota-ink flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full shrink-0 ${
                    liveStatus.isOpen ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                {liveStatus.isOpen ? t("open") : t("closed")}
              </span>
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                {t("liveStatus")}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2 truncate">
              {liveStatus.reason}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  liveStatus.isOpen ? "bg-emerald-500" : "bg-rose-500"
                }`}
                style={{ width: "100%" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Active Open Days */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("openDays")}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <Calendar className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-6 animate-spin text-toota-ink" />
              ) : (
                <span className="text-3xl font-semibold tracking-tight text-toota-ink">
                  {openDaysCount} / 7
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{Math.round((openDaysCount / 7) * 100)}%</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("openDaysPerWeek")}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-ink transition-all"
                style={{ width: `${Math.round((openDaysCount / 7) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Weekly Operating Hours */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("weeklyOperatingHours")}
            </span>
            <div className="size-10 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Clock className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-6 animate-spin text-cyan-600" />
              ) : (
                <span className="text-3xl font-semibold tracking-tight text-toota-ink">
                  {totalWeeklyOperatingHours.hours}h{" "}
                  {totalWeeklyOperatingHours.mins > 0
                    ? `${totalWeeklyOperatingHours.mins}m`
                    : ""}
                </span>
              )}
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                {t("weeklyTotal")}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("acrossAllOpenDays")}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all"
                style={{
                  width: `${Math.min(100, Math.round((totalWeeklyOperatingHours.totalMins / (7 * 16 * 60)) * 100))}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Upcoming Special Closures */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("specialClosuresCount")}
            </span>
            <div className="size-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CalendarDays className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-6 animate-spin text-amber-500" />
              ) : (
                <span className="text-3xl font-semibold tracking-tight text-toota-ink">
                  {upcomingSpecialCount}
                </span>
              )}
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                {t("upcoming")}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("holidaysMaintenanceScheduled")}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{
                  width: `${Math.min(100, upcomingSpecialCount * 25)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segmented Control Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("regular")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "regular"
              ? "bg-toota-ink text-white shadow-xs"
              : "bg-toota-inner text-toota-muted hover:text-toota-ink"
          }`}
        >
          <Clock className="size-3.5" />
          <span>{t("weeklySchedule")}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeTab === "regular"
                ? "bg-white/20 text-white"
                : "bg-background text-toota-muted"
            }`}
          >
            7 {t("daysShort")}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("special")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "special"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-toota-inner text-toota-muted hover:text-toota-ink"
          }`}
        >
          <CalendarDays className="size-3.5" />
          <span>{t("specialHours")}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeTab === "special"
                ? "bg-white/20 text-white"
                : "bg-background text-toota-muted"
            }`}
          >
            {specialHours.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Regular Weekly Schedule */}
      {activeTab === "regular" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("sevenDayStandardSchedule")}
              </h2>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {openDaysCount} {t("openDaysActive")}
              </span>
            </div>
            <span className="text-xs text-toota-muted">
              {t("operatingHoursCycleNote")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {daysMap.map((dayItem) => {
                const wh = workingHoursByDay.get(dayItem.day);
                const isConfigured = !!wh;
                const isToday = dayItem.day === todayDayOfWeek;

                if (!isConfigured) {
                  return (
                    <div
                      key={dayItem.day}
                      className={`p-5 rounded-2xl border border-dashed border-border/80 bg-toota-inner/20 flex flex-col justify-between transition-all min-h-[220px] ${
                        isToday ? "ring-2 ring-zinc-400 dark:ring-zinc-600" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-toota-ink">
                            {dayItem.name}
                          </span>
                          {isToday && (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-background text-toota-ink shadow-2xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                              <span>{t("today")}</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-4">
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                            <span>{t("unset")}</span>
                          </span>
                        </div>

                        <p className="text-xs text-toota-muted mt-3 leading-relaxed">
                          {t("noHoursSetForDay")}
                        </p>
                      </div>

                      <div className="mt-5 py-2 px-3 bg-toota-inner/60 rounded-xl text-xs text-toota-muted font-medium text-center">
                        {t("facilityRest")}
                      </div>
                    </div>
                  );
                }

                const isClosed = wh.isClosed;
                const duration = calculateDuration(wh.startTime, wh.endTime);

                return (
                  <div
                    key={dayItem.day}
                    className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition-all min-h-[220px] ${
                      isClosed
                        ? "bg-toota-inner/35 border-border/70"
                        : "bg-card border-border/80 hover:border-emerald-500/40 hover:shadow-sm"
                    } ${isToday ? "ring-2 ring-emerald-500/40" : ""}`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-toota-ink">
                          {dayItem.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isToday && (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>{t("today")}</span>
                            </span>
                          )}
                          {isClosed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-rose-200 dark:ring-rose-800 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>{t("closed")}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>{t("open")}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      {isClosed ? (
                        <div className="mt-4 p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
                          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <Moon className="size-4 shrink-0" />
                            <span className="text-xs font-bold text-toota-ink">
                              {t("facilityClosed")}
                            </span>
                          </div>
                          <p className="text-[11px] text-toota-muted pl-6">
                            {t("allDayLong")}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/15 space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                              <Clock className="size-4 shrink-0" />
                              <span className="text-sm font-extrabold font-mono tracking-tight">
                                {wh.startTime} – {wh.endTime}
                              </span>
                            </div>
                            {duration && (
                              <span className="text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-300/80 font-mono">
                                {duration}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            <span>{t("gymOpenForCheckins")}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Access Note */}
                    <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-toota-muted font-medium">
                      {isClosed ? t("noCheckinAllowed", "Rest day") : t("staffedHours", "Standard check-in")}
                    </div>
                  </div>
                );
              })}
            </div>

          {/* Schedule Advisory Note */}
          <Card className="toota-card border-none bg-toota-inner/50 p-4">
            <div className="flex items-start gap-3">
              <Info className="size-4 text-toota-ink shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-toota-ink">
                  {t("memberCheckinAdvisoryTitle")}
                </p>
                <p className="text-xs text-toota-muted leading-relaxed">
                  {t("memberCheckinAdvisoryDesc")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Special Hours & Closures */}
      {activeTab === "special" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="toota-card border-none p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search by date */}
              <div className="md:col-span-8 relative">
                <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("searchClosuresPlaceholder")}
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-toota-inner border border-border/50 rounded-xl text-xs font-medium text-toota-ink placeholder:text-toota-muted focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>

              {/* Filter */}
              <div className="md:col-span-4 flex items-center gap-2">
                <Filter className="size-4 text-toota-muted shrink-0" />
                <select
                  value={closureFilter}
                  onChange={(e) =>
                    setClosureFilter(e.target.value as "ALL" | "UPCOMING" | "PAST")
                  }
                  className="w-full px-3 py-2 bg-toota-inner border border-border/50 rounded-xl text-xs font-medium text-toota-ink focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="ALL">{t("allClosures")}</option>
                  <option value="UPCOMING">{t("upcomingClosures")}</option>
                  <option value="PAST">{t("pastClosures")}</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Closures Cards / List */}
          {filteredSpecialHours.length === 0 ? (
            <Card className="toota-card border-none p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="size-7" />
              </div>
              <h3 className="text-base font-semibold text-toota-ink">
                {t("standardScheduleInEffect")}
              </h3>
              <p className="text-xs text-toota-muted max-w-md leading-relaxed">
                {t("noSpecialHoursMember")}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSpecialHours.map((sh) => {
                const isAllDay = !sh.startTime && !sh.endTime;
                const startDate = sh.startDate
                  ? sh.startDate.split("T")[0]
                  : "";
                const endDate = sh.endDate ? sh.endDate.split("T")[0] : startDate;
                const isMultiDay = startDate !== endDate;

                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, "0");
                const day = String(now.getDate()).padStart(2, "0");
                const todayISO = `${year}-${month}-${day}`;

                const isPast = endDate < todayISO;
                const isCurrent = todayISO >= startDate && todayISO <= endDate;

                return (
                  <Card
                    key={sh.id}
                    className={`toota-card border-none p-5 flex flex-col justify-between transition-all ${
                      isCurrent
                        ? "ring-2 ring-amber-500/50 shadow-md"
                        : ""
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        {isAllDay ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{t("allDayClosure")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>{t("partialClosureBadge")}</span>
                          </span>
                        )}

                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span>{t("activeToday")}</span>
                          </span>
                        ) : isPast ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{t("past")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{t("upcoming")}</span>
                          </span>
                        )}
                      </div>

                      {/* Date Range Display */}
                      <div className="mt-4 flex items-center gap-2 text-toota-ink font-semibold text-sm">
                        <Calendar className="size-4 text-amber-600 shrink-0" />
                        <span>{startDate}</span>
                        {isMultiDay && (
                          <>
                            <ArrowRight className="size-3.5 text-toota-muted" />
                            <span>{endDate}</span>
                          </>
                        )}
                      </div>

                      {/* Hours or Details */}
                      <div className="mt-2.5">
                        {isAllDay ? (
                          <p className="text-xs text-toota-muted">
                            {t("entireFacilityClosed")}
                          </p>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold font-mono">
                            <Clock className="size-3.5 shrink-0" />
                            <span>
                              {t("closedTimeRange", {
                                start: sh.startTime,
                                end: sh.endTime,
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border/40 text-[11px] text-toota-muted font-medium">
                      {isCurrent
                        ? t("specialHoursInEffectNow")
                        : isPast
                        ? t("eventConcluded")
                        : t("holidayScheduledNotice")}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
