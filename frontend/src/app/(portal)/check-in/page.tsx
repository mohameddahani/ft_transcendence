"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ScanLine,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Users,
  Eye,
  Calendar,
  Loader2,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { TodayVisit, VisitStatus } from "@/types/visit";
import {
  fetchTodayVisits,
  fetchVisitById,
  checkInManual,
  checkInWithQr,
} from "@/lib/api/visits";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import QrScannerModal from "@/components/check-in/QrScannerModal";
import VisitDetailsModal from "@/components/check-in/VisitDetailsModal";
import SuccessCelebrationModal from "@/components/check-in/SuccessCelebrationModal";
import Pagination from "@/components/ui/Pagination";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function CheckInPage() {
  const { t } = useTranslation();
  const { companyName } = useCurrentUser();

  // State
  const [allVisits, setAllVisits] = useState<TodayVisit[]>([]);
  const [pagedVisits, setPagedVisits] = useState<TodayVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "READY" | "CHECKED_IN">("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Active Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<TodayVisit | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [celebrationVisit, setCelebrationVisit] = useState<TodayVisit | null>(null);
  const [celebrationMethod, setCelebrationMethod] = useState<"QR" | "MANUAL">("QR");

  // Action loading states
  const [isCheckingInMap, setIsCheckingInMap] = useState<Record<string, boolean>>({});
  const [isScanningProcessing, setIsScanningProcessing] = useState(false);

  // Load visits
  const loadVisits = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fullList, initialPage] = await Promise.all([
        fetchTodayVisits(1, 500),
        fetchTodayVisits(1, pageSize),
      ]);
      setAllVisits(fullList);
      setPagedVisits(initialPage);
      setCurrentPage(1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("loadVisitsFailed") || "Failed to load today's visits roster.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, t]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  // Handle page changes with explicit API calls
  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    if (!searchTerm && statusFilter === "ALL") {
      setIsPageLoading(true);
      try {
        const pageData = await fetchTodayVisits(newPage, pageSize);
        setPagedVisits(pageData);
      } catch {
        // fail gracefully
      } finally {
        setIsPageLoading(false);
      }
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = allVisits.length;
    const ready = allVisits.filter((v) => v.visitStatus === "READY").length;
    const checkedIn = allVisits.filter((v) => v.visitStatus === "CHECKED_IN").length;
    return { total, ready, checkedIn };
  }, [allVisits]);

  // Filtered visits
  const isFiltering = Boolean(searchTerm || statusFilter !== "ALL");
  const filteredVisits = useMemo(() => {
    return allVisits.filter((v) => {
      const member = v.member;
      const fullName = `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
      const email = (member.email || "").toLowerCase();
      const phone = (member.phoneNumber || "").toLowerCase();
      const plan = (v.membership?.plan?.planName || "").toLowerCase();

      // Search match
      if (
        searchTerm &&
        !fullName.includes(searchTerm.toLowerCase()) &&
        !email.includes(searchTerm.toLowerCase()) &&
        !phone.includes(searchTerm.toLowerCase()) &&
        !plan.includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Status match
      if (statusFilter !== "ALL" && v.visitStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [allVisits, searchTerm, statusFilter]);

  const totalItems = isFiltering ? filteredVisits.length : allVisits.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const displayedVisits = useMemo(() => {
    if (isFiltering) {
      const start = (currentPage - 1) * pageSize;
      return filteredVisits.slice(start, start + pageSize);
    }
    return pagedVisits;
  }, [isFiltering, filteredVisits, pagedVisits, currentPage, pageSize]);

  // Manual Check-In action
  const handleManualCheckIn = async (memberId: string) => {
    setIsCheckingInMap((prev) => ({ ...prev, [memberId]: true }));
    try {
      await checkInManual(memberId);
      toast.success(t("checkInSuccess") || "Member checked in successfully!");

      // Find the visit for celebration
      const found = allVisits.find((v) => v.member.id === memberId);
      if (found) {
        const updated = { ...found, visitStatus: "CHECKED_IN" as const };
        setCelebrationVisit(updated);
        setCelebrationMethod("MANUAL");
      }

      // Reload roster
      await loadVisits();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("checkInFailed") || "Check-in validation failed.");
      }
    } finally {
      setIsCheckingInMap((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  // QR Code Check-In action
  const handleQrScanSuccess = async (rawToken: string) => {
    setIsScanningProcessing(true);
    try {
      await checkInWithQr(rawToken);
      toast.success(t("qrCheckInSuccess") || "QR Pass verified & checked in!");

      // Close scanner modal
      setIsScannerOpen(false);

      // Re-load to find the newly checked in member
      const freshVisits = await fetchTodayVisits(1, 500);
      setAllVisits(freshVisits);
      const currentPageData = await fetchTodayVisits(currentPage, pageSize);
      setPagedVisits(currentPageData);

      // Find recently updated visit for celebration
      const newlyCheckedIn = freshVisits.find((v) => v.visitStatus === "CHECKED_IN");
      if (newlyCheckedIn) {
        setCelebrationVisit(newlyCheckedIn);
        setCelebrationMethod("QR");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("qrInvalid") || "Invalid QR code or membership condition not met.");
      }
    } finally {
      setIsScanningProcessing(false);
    }
  };

  // Open single visit details
  const handleInspectVisit = async (visit: TodayVisit) => {
    try {
      const single = await fetchVisitById(visit.id).catch(() => visit);
      setSelectedVisit(single);
    } catch {
      setSelectedVisit(visit);
    } finally {
      setIsDetailsOpen(true);
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "M";
  };

  const renderVisitStatusBadge = (status: VisitStatus | string) => {
    const s = (status || "").toUpperCase();
    if (s === "CHECKED_IN") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{t("checkedIn") || "Checked In"}</span>
        </span>
      );
    }

    if (s === "READY") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{t("awaitingCheckIn") || "Awaiting Verification"}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
        <span>{t("cancelled") || "Cancelled"}</span>
      </span>
    );
  };

  const currentDateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Top Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("navCheckIn") || "Front Desk & Check-in"}
              </h1>
              {companyName && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {companyName}
                </span>
              )}
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {allVisits.length} {t("total") || "total"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {currentDateFormatted} • {t("checkInSubtitle") || "Verify member arrivals, scan QR passes, and monitor today's attendance roster."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={loadVisits}
              disabled={isLoading}
              className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
            >
              <RefreshCw
                className={`size-3.5 me-2 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>{t("refresh") || "Refresh"}</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer"
            >
              <ScanLine className="size-4 me-1.5" />
              <span>{t("scanQrCheckIn") || "Scan QR Code"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Live Operational Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Total Visits Scheduled */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalExpectedToday") || "Total Expected Today"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <Calendar className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-ink" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {stats.total}
                </span>
              )}
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                {t("liveTerminal") || "Live"}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("allReservationsToday") || "All reservations scheduled for today"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-ink transition-all"
                style={{ width: "100%" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Pending / Ready for Check-in */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("expectedWaiting") || "Awaiting Verification"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-amber-500">
              <Clock className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-amber-500" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {stats.ready}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>
                  {stats.total > 0 ? `${Math.round((stats.ready / stats.total) * 100)}%` : "0%"}
                </span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {stats.ready} {t("pendingEntry") || "members awaiting check-in"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{
                  width: `${stats.total > 0 ? Math.min(100, Math.round((stats.ready / stats.total) * 100)) : 0}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Already Checked In */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("completedCheckIns") || "Completed Check-ins"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-green">
              <CheckCircle2 className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-green" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {stats.checkedIn}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  {stats.total > 0 ? `${Math.round((stats.checkedIn / stats.total) * 100)}%` : "0%"}
                </span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {stats.checkedIn} {t("activeOnFloor") || "admitted & active on gym floor"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-green transition-all"
                style={{
                  width: `${stats.total > 0 ? Math.min(100, Math.round((stats.checkedIn / stats.total) * 100)) : 0}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar Card */}
      <Card className="toota-card border-none p-4 sm:p-5">
        {/* Search & Select Controls */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full min-w-[240px]">
            <Search className="size-4 text-toota-muted absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder={`${t("searchCheckInPlaceholder") || "Search members by name, email, phone, or plan..."}`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-full bg-toota-inner border-border/40 ps-10 pe-4 text-xs text-toota-ink placeholder:text-toota-muted focus-visible:ring-1 focus-visible:ring-[#a3e635] focus-visible:border-[#a3e635] transition-all"
            />
          </div>

          {/* Status Select Dropdown */}
          <div className="w-full md:w-52 shrink-0">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val as "ALL" | "READY" | "CHECKED_IN");
                setCurrentPage(1);
              }}
              aria-label={t("status") || "Status"}
              options={[
                {
                  value: "ALL",
                  label:
                    t("allVisitsCount", { count: allVisits.length }) ||
                    `All Visits (${allVisits.length})`,
                },
                {
                  value: "READY",
                  label:
                    t("awaitingCheckInCount", { count: stats.ready }) ||
                    `Awaiting Check-in (${stats.ready})`,
                },
                {
                  value: "CHECKED_IN",
                  label:
                    t("checkedInCount", { count: stats.checkedIn }) ||
                    `Admitted (${stats.checkedIn})`,
                },
              ]}
            />
          </div>

          {/* Clear Filters Button */}
          <Button
            type="button"
            variant="outline"
            disabled={!isFiltering}
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
              setCurrentPage(1);
            }}
            className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 w-full md:w-auto"
          >
            <X className="size-3.5 me-1.5" />
            <span>{t("clearFilters") || "Clear Filters"}</span>
          </Button>
        </div>
      </Card>

      {/* Attendance Roster Table Card */}
      <Card className="toota-card border-none p-0 overflow-hidden">
        <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-border/40 flex-wrap gap-3">
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("navCheckIn") || "Attendance Roster"}
            </CardTitle>
            <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
              / {totalItems} {isFiltering ? (t("filtered") || "filtered") : (t("total") || "total")}
            </span>
          </div>

          {isPageLoading && (
            <div className="flex items-center gap-2 text-xs text-toota-muted">
              <Loader2 className="size-3.5 animate-spin" />
              <span>{t("loading") || "Updating..."}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Global Loading State */}
          {isLoading && (
            <div className="py-20 text-center text-toota-muted flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-toota-ink" />
              <p className="text-xs">{t("loadingTodayVisits") || "Loading today's attendance roster..."}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && displayedVisits.length === 0 && (
            <div className="py-20 text-center px-4">
              <div className="size-14 rounded-full bg-toota-inner flex items-center justify-center mx-auto mb-3 text-toota-muted">
                <Users className="size-7" />
              </div>
              <h4 className="font-medium text-base text-toota-ink">
                {t("noVisitsFound") || "No visits found"}
              </h4>
              <p className="text-xs text-toota-muted max-w-sm mx-auto mt-1 leading-relaxed">
                {searchTerm
                  ? t("noMatchingSearchVisits") || "No members match your search criteria."
                  : t("noVisitsScheduledToday") || "No members are currently scheduled for check-in today."}
              </p>
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && displayedVisits.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent text-[11px] font-semibold text-toota-muted uppercase tracking-wider bg-black/[0.02] dark:bg-white/[0.02]">
                  <TableHead className="px-6 py-3.5">
                    {t("member") || "Member"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("membershipPlan") || "Membership Plan"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("arrivalWindow") || "Arrival Window"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("status") || "Status"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5 text-right rtl:text-left">
                    {t("action") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40 text-xs">
                {displayedVisits.map((visit) => {
                  const member = visit.member;
                  const fullName =
                    `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                    t("member") ||
                    "Member";
                  const initials = getInitials(member.firstName, member.lastName);

                  const candidatePhoto =
                    member.photo ||
                    member.profileImage ||
                    (member as { profileImageUrl?: string | null }).profileImageUrl;
                  const isDefaultImage =
                    !candidatePhoto ||
                    candidatePhoto === "default-image.jpg" ||
                    candidatePhoto === "default-member-image.jpg";
                  const photo = isDefaultImage ? null : candidatePhoto;

                  const isReady = visit.visitStatus === "READY";
                  const isCheckedIn = visit.visitStatus === "CHECKED_IN";

                  const scheduledTime = visit.visitDateAndTime
                    ? new Date(visit.visitDateAndTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--";

                  const isSubmitting = isCheckingInMap[member.id] || false;

                  return (
                    <TableRow
                      key={visit.id}
                      className="border-border/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Member Identity */}
                      <TableCell className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 ring-1 ring-border/40 shrink-0">
                            {photo && (
                              <AvatarImage
                                src={photo}
                                alt={fullName}
                              />
                            )}
                            <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p
                              onClick={() => handleInspectVisit(visit)}
                              className="font-medium text-toota-ink hover:underline transition-colors cursor-pointer truncate"
                            >
                              {fullName}
                            </p>
                            <p className="text-[11px] text-toota-muted truncate">
                              {member.phoneNumber || member.email || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Membership Plan */}
                      <TableCell className="px-6 py-3.5">
                        <div className="font-medium text-toota-ink">
                          {visit.membership?.plan?.planName || t("standardPlan") || "Standard Plan"}
                        </div>
                        <div className="text-[11px] text-toota-muted">
                          {visit.membership?.status || t("activePlanText") || "Active"}
                        </div>
                      </TableCell>

                      {/* Scheduled Arrival Time */}
                      <TableCell className="px-6 py-3.5">
                        <div className="inline-flex items-center gap-1.5 font-medium text-toota-ink">
                          <Clock className="size-3.5 text-toota-muted" />
                          <span>{scheduledTime}</span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-6 py-3.5">
                        {renderVisitStatusBadge(visit.visitStatus)}
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell className="px-6 py-3.5 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-2">
                          {/* Inspect Details Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInspectVisit(visit)}
                            className="toota-pill h-8 px-3 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
                            title={t("viewDetails") || "View Visit Details"}
                          >
                            <Eye className="size-3.5 me-1.5" />
                            <span>{t("details") || "Details"}</span>
                          </Button>

                          {/* 1-Click Check In Button */}
                          {isReady && (
                            <Button
                              type="button"
                              size="sm"
                              disabled={isSubmitting}
                              onClick={() => handleManualCheckIn(member.id)}
                              className="toota-pill h-8 px-3.5 text-xs font-semibold cursor-pointer"
                            >
                              {isSubmitting ? (
                                <Loader2 className="size-3.5 animate-spin me-1.5" />
                              ) : (
                                <CheckCircle2 className="size-3.5 me-1.5" />
                              )}
                              <span>
                                {isSubmitting
                                  ? t("checkingAction") || "Checking In..."
                                  : t("checkInAction") || "Check In"}
                              </span>
                            </Button>
                          )}

                          {isCheckedIn && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3.5" />
                              <span>{t("admitted") || "Admitted"}</span>
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            isLoading={isPageLoading}
            itemLabel={t("visits") || "visits"}
          />
        )}
      </Card>

      {/* QR Scanner Camera Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
        isProcessing={isScanningProcessing}
      />

      {/* Visit Details Dossier Modal */}
      <VisitDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        visit={selectedVisit}
        onConfirmCheckIn={handleManualCheckIn}
        isCheckingIn={
          selectedVisit ? isCheckingInMap[selectedVisit.member.id] || false : false
        }
      />

      {/* Instant Success Celebration Modal */}
      <SuccessCelebrationModal
        isOpen={Boolean(celebrationVisit)}
        onClose={() => setCelebrationVisit(null)}
        visit={celebrationVisit}
        method={celebrationMethod}
      />
    </div>
  );
}
