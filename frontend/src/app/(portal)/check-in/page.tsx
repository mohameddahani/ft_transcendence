"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ScanLine,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Users,
  AlertCircle,
  Eye,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  Building,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { TodayVisit } from "@/types/visit";
import {
  fetchTodayVisits,
  fetchVisitById,
  checkInManual,
  checkInWithQr,
} from "@/lib/api/visits";
import QrScannerModal from "@/components/check-in/QrScannerModal";
import VisitDetailsModal from "@/components/check-in/VisitDetailsModal";
import SuccessCelebrationModal from "@/components/check-in/SuccessCelebrationModal";

export default function CheckInPage() {
  const { t } = useTranslation();

  // State
  const [visits, setVisits] = useState<TodayVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "READY" | "CHECKED_IN">("ALL");

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
      const data = await fetchTodayVisits(1, 100);
      setVisits(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load today's visits roster.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  // Statistics
  const stats = useMemo(() => {
    const total = visits.length;
    const ready = visits.filter((v) => v.visitStatus === "READY").length;
    const checkedIn = visits.filter((v) => v.visitStatus === "CHECKED_IN").length;
    return { total, ready, checkedIn };
  }, [visits]);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
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
  }, [visits, searchTerm, statusFilter]);

  // Manual Check-In action
  const handleManualCheckIn = async (memberId: string) => {
    setIsCheckingInMap((prev) => ({ ...prev, [memberId]: true }));
    try {
      await checkInManual(memberId);
      toast.success(t("checkInSuccess") || "Member checked in successfully!");

      // Find the visit for celebration
      const found = visits.find((v) => v.member.id === memberId);
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
        toast.error("Check-in validation failed.");
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
      const freshVisits = await fetchTodayVisits(1, 100);
      setVisits(freshVisits);

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
        toast.error("Invalid QR code or membership condition not met.");
      }
    } finally {
      setIsScanningProcessing(false);
    }
  };

  // Open single visit details
  const handleInspectVisit = async (visit: TodayVisit) => {
    try {
      // Fetch fresh details by ID
      const single = await fetchVisitById(visit.id).catch(() => visit);
      setSelectedVisit(single);
    } catch {
      setSelectedVisit(visit);
    } finally {
      setIsDetailsOpen(true);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 max-w-container-max mx-auto pb-16">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl primary-gradient text-white flex items-center justify-center shadow-md shadow-primary/20">
            <ScanLine className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {t("navCheckIn") || "Front Desk & Check-in"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                Live Terminal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {currentDateFormatted} • {t("checkInSubtitle") || "Verify member arrivals, scan QR passes, and monitor today's attendance roster."}
            </p>
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadVisits}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-variant transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t("refresh") || "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 primary-gradient text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>{t("scanQrCheckIn") || "Scan QR Code"}</span>
          </button>
        </div>
      </div>

      {/* Live Operational Metrics Quad */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Visits Scheduled */}
        <div className="p-4 rounded-2xl bg-surface-bright border border-outline-variant/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {t("totalExpectedToday") || "Total Expected Today"}
            </span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-headline text-on-surface">
            {stats.total}
            <span className="text-xs font-normal text-on-surface-variant ml-1.5">
              Members Booked
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            All reservations recorded for today
          </p>
        </div>

        {/* Metric 2: Pending / Ready for Check-in */}
        <div className="p-4 rounded-2xl bg-surface-bright border border-outline-variant/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {t("expectedWaiting") || "Awaiting Verification"}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-headline text-amber-600 dark:text-amber-400">
            {stats.ready}
            <span className="text-xs font-normal text-on-surface-variant ml-1.5">
              Pending Entry
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Ready for 1-click or QR approval</span>
          </p>
        </div>

        {/* Metric 3: Already Checked In */}
        <div className="p-4 rounded-2xl bg-surface-bright border border-outline-variant/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {t("completedCheckIns") || "Completed Check-ins"}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-headline text-emerald-600 dark:text-emerald-400">
            {stats.checkedIn}
            <span className="text-xs font-normal text-on-surface-variant ml-1.5">
              Verified Entries
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active on gym floor</span>
          </p>
        </div>
      </div>

      {/* Roster & Search Section */}
      <div className="space-y-4">
        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant">
          {/* Search Input */}
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Search by member name, phone, email, or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-on-surface-variant/60"
            />
          </div>

          {/* Status Tabs / Filter */}
          <div className="md:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-on-surface-variant shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | "READY" | "CHECKED_IN")
              }
              className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none cursor-pointer"
            >
              <option value="ALL">All Visits ({visits.length})</option>
              <option value="READY">Awaiting Check-in ({stats.ready})</option>
              <option value="CHECKED_IN">Checked In ({stats.checkedIn})</option>
            </select>
          </div>
        </div>

        {/* Live Roster Table */}
        <div className="bg-surface-bright rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/50 bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Member</th>
                  <th className="py-3.5 px-4">Membership Plan</th>
                  <th className="py-3.5 px-4">Arrival Window</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                        <p className="font-semibold text-on-surface">Loading today&apos;s visits...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 opacity-40" />
                        <p className="font-semibold text-on-surface">No visits found</p>
                        <p className="text-[11px] max-w-sm text-on-surface-variant/80">
                          {searchTerm
                            ? "No scheduled member visits match your current search query."
                            : "There are no member visits scheduled for today yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map((visit) => {
                    const member = visit.member;
                    const fullName =
                      `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                      "Member";
                    const initials =
                      `${(member.firstName || "")[0] || ""}${(member.lastName || "")[0] || ""}`.toUpperCase() ||
                      "M";

                    const candidatePhoto = member.photo || member.profileImage;
                    const isDefaultImage =
                      !candidatePhoto ||
                      candidatePhoto === "default-image.jpg" ||
                      candidatePhoto === "default-member-image.jpg";
                    const photo = isDefaultImage ? null : candidatePhoto;

                    const isReady = visit.visitStatus === "READY";
                    const isCheckedIn = visit.visitStatus === "CHECKED_IN";
                    const isCancelled = visit.visitStatus === "CANCELLED";

                    const scheduledTime = visit.visitDateAndTime
                      ? new Date(visit.visitDateAndTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--";

                    const isSubmitting = isCheckingInMap[member.id] || false;

                    return (
                      <tr
                        key={visit.id}
                        className="hover:bg-surface-container/40 transition-colors"
                      >
                        {/* Member Identity */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 border border-outline-variant/40">
                              {photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={photo}
                                  alt={fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{initials}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div
                                onClick={() => handleInspectVisit(visit)}
                                className="font-bold text-on-surface hover:text-primary transition-colors cursor-pointer truncate"
                              >
                                {fullName}
                              </div>
                              <div className="text-[11px] text-on-surface-variant truncate">
                                {member.phoneNumber || member.email || "No contact"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Membership Plan */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-on-surface">
                            {visit.membership?.plan?.planName || "Standard Membership"}
                          </div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            {visit.membership?.status || "Active Plan"}
                          </div>
                        </td>

                        {/* Scheduled Arrival Time */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 font-bold text-on-surface">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>{scheduledTime}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              isReady
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : isCheckedIn
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isReady
                                  ? "bg-amber-500 animate-pulse"
                                  : isCheckedIn
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {visit.visitStatus === "READY"
                              ? "Awaiting Check-in"
                              : visit.visitStatus === "CHECKED_IN"
                              ? "Checked In"
                              : "Cancelled"}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Inspect Details Button */}
                            <button
                              type="button"
                              onClick={() => handleInspectVisit(visit)}
                              className="p-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                              title={t("viewDetails") || "View Visit Details"}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* 1-Click Check In Button */}
                            {isReady && (
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleManualCheckIn(member.id)}
                                className="px-3 py-1.5 rounded-lg primary-gradient text-white text-xs font-bold shadow-xs hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isSubmitting ? "Checking..." : "Check In"}</span>
                              </button>
                            )}

                            {isCheckedIn && (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Admitted</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
        isOpen={!!celebrationVisit}
        onClose={() => setCelebrationVisit(null)}
        visit={celebrationVisit}
        method={celebrationMethod}
      />
    </div>
  );
}
