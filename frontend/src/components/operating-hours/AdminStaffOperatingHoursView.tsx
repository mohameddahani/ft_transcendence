"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  Calendar,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CalendarDays,
  Search,
  Filter,
  ArrowRight,
  Sun,
  Moon,
  Info,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { WorkingHour, SpecialHour } from "@/types/working-hours";
import {
  fetchWorkingHours,
  deleteWorkingHour,
  fetchSpecialHours,
  deleteSpecialHour,
} from "@/lib/api/working-hours";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import WorkingHourModal from "@/components/operating-hours/WorkingHourModal";
import SpecialHourModal from "@/components/operating-hours/SpecialHourModal";
import DeleteConfirmModal from "@/components/operating-hours/DeleteConfirmModal";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminStaffOperatingHoursView() {
  const { t } = useTranslation();
  const { companyName } = useCurrentUser();

  // Data State
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab: 'regular' | 'special'
  const [activeTab, setActiveTab] = useState<"regular" | "special">("regular");

  // Filters for Special Hours
  const [closureFilter, setClosureFilter] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");
  const [searchDate, setSearchDate] = useState("");

  // Modals state
  const [isWorkingHourModalOpen, setIsWorkingHourModalOpen] = useState(false);
  const [editingWorkingHour, setEditingWorkingHour] = useState<WorkingHour | null>(null);
  const [selectedDefaultDay, setSelectedDefaultDay] = useState<number | undefined>(undefined);

  const [isSpecialHourModalOpen, setIsSpecialHourModalOpen] = useState(false);
  const [editingSpecialHour, setEditingSpecialHour] = useState<SpecialHour | null>(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "workingHour" | "specialHour";
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: "workingHour",
    id: "",
    name: "",
  });

  // Load all operating hours and special hours
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [whData, shData] = await Promise.all([
        fetchWorkingHours(1, 50).catch(() => []),
        fetchSpecialHours(1, 50).catch(() => []),
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

  // Set of configured days
  const configuredDayNumbers = useMemo(() => {
    return workingHours.map((wh) => wh.dayOfWeek);
  }, [workingHours]);

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

  // Handle open add working hour
  const handleOpenAddWorkingHour = (defaultDay?: number) => {
    setEditingWorkingHour(null);
    setSelectedDefaultDay(defaultDay);
    setIsWorkingHourModalOpen(true);
  };

  // Handle open edit working hour
  const handleOpenEditWorkingHour = (wh: WorkingHour) => {
    setEditingWorkingHour(wh);
    setSelectedDefaultDay(undefined);
    setIsWorkingHourModalOpen(true);
  };

  // Handle open add special hour
  const handleOpenAddSpecialHour = () => {
    setEditingSpecialHour(null);
    setIsSpecialHourModalOpen(true);
  };

  // Handle open edit special hour
  const handleOpenEditSpecialHour = (sh: SpecialHour) => {
    setEditingSpecialHour(sh);
    setIsSpecialHourModalOpen(true);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      if (deleteModal.type === "workingHour") {
        await deleteWorkingHour(deleteModal.id);
        toast.success(t("operatingHourDeleted"));
      } else {
        await deleteSpecialHour(deleteModal.id);
        toast.success(t("specialHourDeleted"));
      }
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("failedToDeleteRecord"));
      }
    }
  };

  const openDaysCount = useMemo(
    () => workingHours.filter((wh) => !wh.isClosed).length,
    [workingHours]
  );

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
                / {workingHours.length} {t("daysConfigured")}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t("operatingHoursSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Live Status Micro-Badge */}
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

            {/* Add Special Closure Button */}
            <Button
              type="button"
              onClick={handleOpenAddSpecialHour}
              className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              <CalendarDays className="size-3.5 me-2" />
              <span>{t("addSpecialHour")}</span>
            </Button>

            {/* Add Working Hour Button */}
            <Button
              type="button"
              onClick={() => handleOpenAddWorkingHour()}
              disabled={configuredDayNumbers.length >= 7}
              className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer"
            >
              <Plus className="size-3.5 me-2" />
              <span>{t("addWorkingHour")}</span>
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
              {configuredDayNumbers.length < 7
                ? t("daysPendingConfig", { count: 7 - configuredDayNumbers.length })
                : t("allDaysConfigured")}
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

        {/* Card 4: Special Closures Scheduled */}
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
                  {specialHours.length}
                </span>
              )}
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                {t("scheduled")}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("holidaysMaintenanceScheduled")}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{
                  width: `${Math.min(100, specialHours.length * 20)}%`,
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
          <span>{t("weeklyOperatingHours")}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeTab === "regular"
                ? "bg-white/20 text-white"
                : "bg-background text-toota-muted"
            }`}
          >
            {configuredDayNumbers.length}/7
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
                / {configuredDayNumbers.length} of 7 configured
              </span>
            </div>
            <span className="text-xs text-toota-muted">
              {configuredDayNumbers.length < 7
                ? t("daysPendingConfig", { count: 7 - configuredDayNumbers.length })
                : t("allDaysConfigured")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {daysMap.map((dayItem) => {
              const wh = workingHoursByDay.get(dayItem.day);
              const isConfigured = !!wh;
              const isToday = dayItem.day === todayDayOfWeek;

              if (!isConfigured) {
                return (
                  <div
                    key={dayItem.day}
                    className={`p-4 rounded-2xl border border-dashed border-border/60 bg-toota-inner/30 flex flex-col justify-between transition-all min-h-[200px] ${
                      isToday ? "ring-1 ring-zinc-400 dark:ring-zinc-600" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-toota-ink">
                          {dayItem.name}
                        </span>
                        {isToday && (
                          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                            <span>{t("today")}</span>
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                          <span>{t("unset")}</span>
                        </span>
                      </div>
                      <p className="text-xs text-toota-muted/70 mt-3 leading-relaxed">
                        {t("noHoursSetForDay")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddWorkingHour(dayItem.day)}
                      className="w-full mt-4 py-2 px-3 bg-toota-inner hover:bg-toota-ink hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>{t("configureDay")}</span>
                    </button>
                  </div>
                );
              }

              const isClosed = wh.isClosed;

              return (
                <div
                  key={dayItem.day}
                  className={`p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between transition-all min-h-[200px] ${
                    isClosed
                      ? "bg-toota-inner/40 border-border/60"
                      : "bg-card border-border/80 hover:border-emerald-500/40"
                  } ${isToday ? "ring-2 ring-emerald-500/30" : ""}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-toota-ink">
                        {dayItem.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isToday && (
                          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{t("today")}</span>
                          </span>
                        )}
                        {isClosed ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{t("closed")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{t("open")}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {isClosed ? (
                      <div className="mt-4 space-y-1">
                        <div className="size-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                          <Moon className="size-4" />
                        </div>
                        <p className="text-xs font-bold text-toota-ink mt-2">
                          {t("facilityClosed")}
                        </p>
                        <p className="text-[11px] text-toota-muted">
                          {t("allDayLong")}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <Clock className="size-4 shrink-0" />
                          <span className="text-xs font-extrabold font-mono">
                            {wh.startTime} – {wh.endTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-toota-muted font-medium">
                          {t("gymOpenForCheckins")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions for this day */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleOpenEditWorkingHour(wh)}
                      className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
                      title={t("edit")}
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteModal({
                          isOpen: true,
                          type: "workingHour",
                          id: wh.id,
                          name: `${dayItem.name} (${
                            wh.isClosed
                              ? t("closed")
                              : `${wh.startTime} - ${wh.endTime}`
                          })`,
                        })
                      }
                      className="p-1.5 rounded-lg text-toota-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={t("delete")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Schedule Footer Note */}
          <Card className="toota-card border-none bg-toota-inner/50 p-4">
            <div className="flex items-start gap-3">
              <Info className="size-4 text-toota-ink shrink-0 mt-0.5" />
              <p className="text-xs text-toota-muted leading-relaxed">
                {t("operatingHoursTip")}
              </p>
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
                <CalendarDays className="size-7" />
              </div>
              <h3 className="text-base font-semibold text-toota-ink">
                {t("noSpecialHours")}
              </h3>
              <p className="text-xs text-toota-muted max-w-md">
                {t("clickAddSpecialHour")}
              </p>
              <Button
                type="button"
                onClick={handleOpenAddSpecialHour}
                className="toota-pill mt-2 h-10 px-5 text-xs font-semibold cursor-pointer bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                <Plus className="size-3.5 me-2" />
                <span>{t("addSpecialHour")}</span>
              </Button>
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
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
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

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSpecialHour(sh)}
                        className="p-1.5 rounded-lg text-toota-muted hover:text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        title={t("edit")}
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            type: "specialHour",
                            id: sh.id,
                            name: `Closure (${startDate} ${
                              isMultiDay ? `to ${endDate}` : ""
                            })`,
                          })
                        }
                        className="p-1.5 rounded-lg text-toota-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title={t("delete")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Working Hour Modal (Add/Edit) */}
      <WorkingHourModal
        isOpen={isWorkingHourModalOpen}
        onClose={() => setIsWorkingHourModalOpen(false)}
        onSuccess={loadData}
        initialData={editingWorkingHour}
        configuredDays={configuredDayNumbers}
        defaultDay={selectedDefaultDay}
      />

      {/* Special Hour Modal (Add/Edit) */}
      <SpecialHourModal
        isOpen={isSpecialHourModalOpen}
        onClose={() => setIsSpecialHourModalOpen(false)}
        onSuccess={loadData}
        initialData={editingSpecialHour}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={handleConfirmDelete}
        title={
          deleteModal.type === "workingHour"
            ? t("confirmDeleteHourTitle")
            : t("confirmDeleteSpecialTitle")
        }
        description={
          deleteModal.type === "workingHour"
            ? t("confirmDeleteHourDesc")
            : t("confirmDeleteSpecialDesc")
        }
        itemName={deleteModal.name}
      />
    </div>
  );
}
