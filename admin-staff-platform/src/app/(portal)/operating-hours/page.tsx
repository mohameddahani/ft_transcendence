"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Calendar,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Sun,
  Moon,
  ChevronRight,
  Info,
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
import WorkingHourModal from "@/components/operating-hours/WorkingHourModal";
import SpecialHourModal from "@/components/operating-hours/SpecialHourModal";
import DeleteConfirmModal from "@/components/operating-hours/DeleteConfirmModal";

export default function OperatingHoursPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

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
  const loadData = async () => {
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
        toast.error("Failed to load operating hours data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    const jsDay = now.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    const currentHourMin = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    const todayISO = now.toISOString().split("T")[0];

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
        reason: "Special Closure in effect today",
        badge: "Closed (Special Event)",
      };
    }

    const todayHour = workingHoursByDay.get(dayOfWeek);
    if (!todayHour) {
      return {
        isOpen: false,
        reason: "Schedule not configured for today",
        badge: "Schedule Unset",
      };
    }

    if (todayHour.isClosed) {
      return {
        isOpen: false,
        reason: "Facility regularly closed today",
        badge: "Closed Today",
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
        reason: `Open until ${todayHour.endTime}`,
        badge: "Open Now",
      };
    }

    if (todayHour.startTime && currentHourMin < todayHour.startTime) {
      return {
        isOpen: false,
        reason: `Opens at ${todayHour.startTime}`,
        badge: "Closed (Opens Later)",
      };
    }

    return {
      isOpen: false,
      reason: "Closed for the night",
      badge: "Closed",
    };
  }, [workingHoursByDay, specialHours]);

  // Filtered Special Hours
  const filteredSpecialHours = useMemo(() => {
    const todayISO = new Date().toISOString().split("T")[0];

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
    setIsWorkingHourModalOpen(true);
  };

  // Handle open edit working hour
  const handleOpenEditWorkingHour = (wh: WorkingHour) => {
    setEditingWorkingHour(wh);
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
        toast.error("Failed to delete record");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-container-max mx-auto pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
              {t("operatingHours")}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs ${
                liveStatus.isOpen
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-surface-container-high text-on-surface-variant border border-outline-variant"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  liveStatus.isOpen
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-on-surface-variant/50"
                }`}
              />
              {liveStatus.badge}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            {t("operatingHoursSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-variant transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>{t("refresh")}</span>
          </button>

          {/* Add Special Closure Button */}
          <button
            type="button"
            onClick={handleOpenAddSpecialHour}
            className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-amber-600 to-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>{t("addSpecialHour")}</span>
          </button>

          {/* Add Regular Day Button */}
          <button
            type="button"
            onClick={() => handleOpenAddWorkingHour()}
            disabled={configuredDayNumbers.length >= 7}
            className="flex items-center gap-2 px-4 py-2.5 primary-gradient text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>{t("addWorkingHour")}</span>
          </button>
        </div>
      </div>

      {/* KPI Command-Center Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Facility Live Status */}
        <div className="bg-surface-bright p-5 rounded-2xl border border-outline-variant/60 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Live Facility Status
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                liveStatus.isOpen
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {liveStatus.isOpen ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-headline text-on-surface flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  liveStatus.isOpen ? "bg-emerald-500" : "bg-error"
                }`}
              />
              {liveStatus.isOpen ? t("open") : t("closed")}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              {liveStatus.reason}
            </p>
          </div>
        </div>

        {/* Card 2: Active Open Days */}
        <div className="bg-surface-bright p-5 rounded-2xl border border-outline-variant/60 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t("openDays") || "Open Days"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-headline text-on-surface">
              {workingHours.filter((wh) => !wh.isClosed).length} / 7
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              {configuredDayNumbers.length} days configured in weekly schedule
            </p>
          </div>
        </div>

        {/* Card 3: Total Weekly Hours */}
        <div className="bg-surface-bright p-5 rounded-2xl border border-outline-variant/60 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t("weeklyOperatingHours") || "Weekly Hours"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-headline text-on-surface">
              {totalWeeklyOperatingHours.hours}h{" "}
              {totalWeeklyOperatingHours.mins > 0
                ? `${totalWeeklyOperatingHours.mins}m`
                : ""}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Across all open scheduled days
            </p>
          </div>
        </div>

        {/* Card 4: Special Closures Scheduled */}
        <div className="bg-surface-bright p-5 rounded-2xl border border-outline-variant/60 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t("specialClosuresCount") || "Special Closures"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-headline text-on-surface">
              {specialHours.length}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Holidays & maintenance scheduled
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/50 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("regular")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "regular"
              ? "bg-primary text-on-primary shadow-sm shadow-primary/20"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t("weeklyOperatingHours")}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === "regular"
                ? "bg-white/20 text-white"
                : "bg-surface-container-highest text-on-surface-variant"
            }`}
          >
            {configuredDayNumbers.length}/7
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("special")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "special"
              ? "bg-linear-to-r from-amber-600 to-rose-600 text-white shadow-sm shadow-amber-600/20"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>{t("specialHours")}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === "special"
                ? "bg-white/20 text-white"
                : "bg-surface-container-highest text-on-surface-variant"
            }`}
          >
            {specialHours.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Regular Weekly Schedule */}
      {activeTab === "regular" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>7-Day Standard Weekly Schedule</span>
            </h2>
            <span className="text-xs text-on-surface-variant">
              {configuredDayNumbers.length < 7
                ? `${7 - configuredDayNumbers.length} days pending configuration`
                : "All days configured"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {daysMap.map((dayItem) => {
              const wh = workingHoursByDay.get(dayItem.day);
              const isConfigured = !!wh;

              if (!isConfigured) {
                return (
                  <div
                    key={dayItem.day}
                    className="p-4 rounded-2xl border-2 border-dashed border-outline-variant/60 bg-surface-container-lowest/40 hover:bg-surface-container-lowest flex flex-col justify-between transition-all min-h-[200px]"
                  >
                    <div>
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {dayItem.name}
                      </span>
                      <div className="mt-3">
                        <span className="text-xs px-2 py-1 rounded-md bg-surface-container text-on-surface-variant">
                          Unset
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant/70 mt-3 leading-relaxed">
                        No hours set for this day.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddWorkingHour(dayItem.day)}
                      className="w-full mt-4 py-2 px-3 bg-surface-container hover:bg-primary hover:text-on-primary text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("configureDay")}</span>
                    </button>
                  </div>
                );
              }

              const isClosed = wh.isClosed;

              return (
                <div
                  key={dayItem.day}
                  className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between transition-all min-h-[200px] ${
                    isClosed
                      ? "bg-surface-container/50 border-outline-variant/60"
                      : "bg-surface-bright border-primary/30 ring-1 ring-primary/10"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                        {dayItem.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isClosed
                            ? "bg-error/10 text-error"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isClosed ? t("closed") : t("open")}
                      </span>
                    </div>

                    {isClosed ? (
                      <div className="mt-4 space-y-1">
                        <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center">
                          <Moon className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-on-surface mt-2">
                          Facility Closed
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          All day long
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-primary">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-extrabold font-headline">
                            {wh.startTime} – {wh.endTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant font-medium">
                          Gym is open for check-ins
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions for this day */}
                  <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleOpenEditWorkingHour(wh)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      title={t("edit")}
                    >
                      <Edit className="w-4 h-4" />
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
                              ? "Closed"
                              : `${wh.startTime} - ${wh.endTime}`
                          })`,
                        })
                      }
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                      title={t("delete")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Schedule Footer Note */}
          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex items-start gap-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <strong>Tip:</strong> Regular weekly hours apply cyclically. If a
              special holiday or temporary maintenance occurs, schedule a{" "}
              <strong>Special Closure</strong> in the second tab so members are
              automatically informed without losing your weekly presets.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: Special Hours & Closures */}
      {activeTab === "special" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant">
            {/* Search by date */}
            <div className="md:col-span-8 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                placeholder="Search closures by date (e.g. 2026-10)..."
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-on-surface-variant/60"
              />
            </div>

            {/* Filter */}
            <div className="md:col-span-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-on-surface-variant shrink-0" />
              <select
                value={closureFilter}
                onChange={(e) =>
                  setClosureFilter(e.target.value as "ALL" | "UPCOMING" | "PAST")
                }
                className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-amber-500/20 outline-none"
              >
                <option value="ALL">{t("allClosures")}</option>
                <option value="UPCOMING">{t("upcomingClosures")}</option>
                <option value="PAST">{t("pastClosures")}</option>
              </select>
            </div>
          </div>

          {/* Closures Cards / List */}
          {filteredSpecialHours.length === 0 ? (
            <div className="bg-surface-bright p-12 rounded-2xl border border-outline-variant/60 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CalendarDays className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface font-headline">
                {t("noSpecialHours")}
              </h3>
              <p className="text-xs text-on-surface-variant max-w-md">
                {t("clickAddSpecialHour")}
              </p>
              <button
                type="button"
                onClick={handleOpenAddSpecialHour}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-linear-to-r from-amber-600 to-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t("addSpecialHour")}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSpecialHours.map((sh) => {
                const isAllDay = !sh.startTime && !sh.endTime;
                const startDate = sh.startDate
                  ? sh.startDate.split("T")[0]
                  : "";
                const endDate = sh.endDate ? sh.endDate.split("T")[0] : startDate;
                const isMultiDay = startDate !== endDate;

                const todayISO = new Date().toISOString().split("T")[0];
                const isPast = endDate < todayISO;
                const isCurrent = todayISO >= startDate && todayISO <= endDate;

                return (
                  <div
                    key={sh.id}
                    className={`bg-surface-bright p-5 rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                      isCurrent
                        ? "border-amber-500/50 ring-2 ring-amber-500/20"
                        : "border-outline-variant/60 hover:border-outline-variant"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isAllDay
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {isAllDay ? "All-Day Closure" : "Partial Closure"}
                        </span>

                        {isCurrent ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                            Active Today
                          </span>
                        ) : isPast ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                            Past
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Upcoming
                          </span>
                        )}
                      </div>

                      {/* Date Range Display */}
                      <div className="mt-4 flex items-center gap-2 text-on-surface font-headline font-bold text-sm">
                        <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{startDate}</span>
                        {isMultiDay && (
                          <>
                            <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant" />
                            <span>{endDate}</span>
                          </>
                        )}
                      </div>

                      {/* Hours or Details */}
                      <div className="mt-2">
                        {isAllDay ? (
                          <p className="text-xs text-on-surface-variant">
                            Entire facility closed for all check-ins
                          </p>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              Closed: {sh.startTime} – {sh.endTime}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-outline-variant/40 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSpecialHour(sh)}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        title={t("edit")}
                      >
                        <Edit className="w-4 h-4" />
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
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                        title={t("delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
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
