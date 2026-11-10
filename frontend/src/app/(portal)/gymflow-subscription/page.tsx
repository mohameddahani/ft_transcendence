"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Zap,
  Calendar,
  Clock,
  CreditCard,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Copy,
  Check,
  Sparkles,
  Search,
  Loader2,
  Headphones,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { GymflowSubscription } from "@/types/subscription";
import { fetchMySubscription, fetchAllSubscriptions } from "@/lib/api/subscriptions";
import { fetchMembers } from "@/lib/api/members";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export default function GymflowSubscriptionPage() {
  const { t } = useTranslation();
  const { companyName } = useCurrentUser();

  // Data state
  const [activeSubscription, setActiveSubscription] = useState<GymflowSubscription | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<GymflowSubscription[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  // Filters for ledger
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "CANCELLED">("ALL");

  // Upgrade / Support Modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currentSub, allSubs, allMembers] = await Promise.all([
        fetchMySubscription().catch(() => null),
        fetchAllSubscriptions(1, 100).catch(() => []),
        fetchMembers(1, 1000).catch(() => []),
      ]);

      // Resolve true member count from actual member records
      const actualCount = Array.isArray(allMembers) ? allMembers.length : 0;
      setMemberCount(actualCount);

      // Prioritize active subscription; fallback to first active in ledger, or latest ledger record
      const resolvedSub =
        currentSub ||
        allSubs.find((s) => s.subscriptionStatus === "ACTIVE") ||
        (allSubs.length > 0 ? allSubs[0] : null);

      setActiveSubscription(resolvedSub);
      setAllSubscriptions(allSubs);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load subscription data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Copy receipt / reference ID helper
  const handleCopyReceipt = (refId: string) => {
    navigator.clipboard.writeText(refId);
    setIsCopied(refId);
    toast.success(t("receiptCopied") || "Reference ID copied to clipboard!");
    setTimeout(() => setIsCopied(null), 2500);
  };

  // Cycle duration calculation (from planDuration or difference between dates)
  const cycleDays = useMemo(() => {
    if (!activeSubscription) return 30;
    if (activeSubscription.planDuration?.durationDays) {
      return activeSubscription.planDuration.durationDays;
    }
    if (activeSubscription.startedAt && activeSubscription.expiresAt) {
      const start = new Date(activeSubscription.startedAt).getTime();
      const end = new Date(activeSubscription.expiresAt).getTime();
      const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
      if (diff > 0) return diff;
    }
    return 30;
  }, [activeSubscription]);

  // Expiry & Countdown Calculation
  const expiryAnalysis = useMemo(() => {
    if (!activeSubscription?.expiresAt) return null;
    const now = new Date();
    const expiryDate = new Date(activeSubscription.expiresAt);
    const diffMs = expiryDate.getTime() - now.getTime();
    const rawDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const startDate = activeSubscription.startedAt
      ? new Date(activeSubscription.startedAt).toLocaleDateString()
      : "--";
    const formattedExpiry = expiryDate.toLocaleDateString();

    const isExpired =
      rawDaysLeft <= 0 || activeSubscription.subscriptionStatus === "EXPIRED";
    const isExpiringSoon = !isExpired && rawDaysLeft > 0 && rawDaysLeft <= 7;

    return {
      daysLeft: Math.max(0, rawDaysLeft),
      startDate,
      formattedExpiry,
      isExpiringSoon,
      isExpired,
    };
  }, [activeSubscription]);

  // Quota and capacity metrics
  const maxCapacity = activeSubscription?.plan?.maxMembers || 0;
  const capacityPercent =
    maxCapacity > 0 ? Math.min(100, Math.round((memberCount / maxCapacity) * 100)) : 0;
  const slotsLeft = Math.max(0, maxCapacity - memberCount);

  const subAmount = Number(
    activeSubscription?.amount ?? activeSubscription?.planDuration?.price ?? 0
  );
  const dailyRate = cycleDays > 0 ? (subAmount / cycleDays).toFixed(2) : "0.00";

  // License Status Badge Helper (Crisp Outlined Micro-Badge)
  const renderLicenseStatusBadge = () => {
    if (!activeSubscription) return null;
    const status = activeSubscription.subscriptionStatus;

    if (status === "ACTIVE" && !expiryAnalysis?.isExpired) {
      if (expiryAnalysis?.isExpiringSoon) {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>
              {t("expiringSoon") || `Expiring in ${expiryAnalysis.daysLeft} days`}
            </span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{t("activeLicense") || "Active"}</span>
        </span>
      );
    }

    if (status === "EXPIRED" || expiryAnalysis?.isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{t("licenseExpired") || "Expired"}</span>
        </span>
      );
    }

    const label = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "";
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
        <span>{label}</span>
      </span>
    );
  };

  const renderHistoryStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    const label =
      s === "ACTIVE"
        ? t("active") || "Active"
        : s === "EXPIRED"
        ? t("expired") || "Expired"
        : s === "CANCELLED"
        ? t("cancelled") || "Cancelled"
        : status
        ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        : "";

    if (s === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
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

    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
        <span>{label}</span>
      </span>
    );
  };

  // Filtered History Ledger
  const filteredHistory = useMemo(() => {
    return allSubscriptions.filter((sub) => {
      const planName = sub.plan?.planName || "";
      const amountStr = String(sub.amount || "");
      const startStr = sub.startedAt || "";
      const endStr = sub.expiresAt || "";

      // Search term
      if (
        searchTerm &&
        !planName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !amountStr.includes(searchTerm) &&
        !startStr.includes(searchTerm) &&
        !endStr.includes(searchTerm)
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && sub.subscriptionStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [allSubscriptions, searchTerm, statusFilter]);

  // Export history to CSV
  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      toast.info("No subscription records available to export.");
      return;
    }

    const headers = [
      "Plan Name",
      "Member Capacity",
      "Cycle Duration (Days)",
      "Amount Paid (MAD)",
      "Status",
      "Started At",
      "Expires At",
    ];

    const rows = filteredHistory.map((sub) => {
      let subDurationDays = sub.planDuration?.durationDays;
      if (!subDurationDays && sub.startedAt && sub.expiresAt) {
        const s = new Date(sub.startedAt).getTime();
        const e = new Date(sub.expiresAt).getTime();
        const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
        if (diff > 0) subDurationDays = diff;
      }
      return [
        `"${sub.plan?.planName || "Core Plan"}"`,
        sub.plan?.maxMembers || 0,
        subDurationDays || 30,
        `"${Number(sub.amount ?? sub.planDuration?.price ?? 0).toFixed(2)}"`,
        sub.subscriptionStatus,
        sub.startedAt ? new Date(sub.startedAt).toLocaleDateString() : "",
        sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : "",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `gymflow_subscriptions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Subscription ledger exported to CSV!");
  };

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Overview & Action Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("gymflowSubscriptionTitle") || "Platform Subscription"}
              </h1>
              {activeSubscription?.plan?.planName && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {activeSubscription.plan.planName} {t("planTier", "Tier")}
                </span>
              )}
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {allSubscriptions.length} {t("recordsCount", "records")}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t("gymflowSubscriptionSubtitle") ||
                "Manage your core GymFlow platform license, allocated capacity, and complete billing ledger."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
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
              <span>{t("refresh") || "Refresh"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportCSV}
              className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
            >
              <Download className="size-3.5 me-2" />
              <span>{t("export") || "Export"}</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsContactModalOpen(true)}
              className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer"
            >
              <Sparkles className="size-3.5 me-2" />
              <span>{t("contactSupport") || "Upgrade Plan"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* HERO SECTION: Current Active Platform License Showcase                    */}
      {/* ========================================================================= */}
      {activeSubscription ? (
        <Card className="toota-card border-none p-6 sm:p-7">
          <div className="space-y-6">
            {/* Top Bar of the Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-2xl bg-toota-inner text-toota-ink flex items-center justify-center font-bold shadow-xs">
                  <Zap className="size-6 text-toota-ink" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
                      {t("currentActivePlan") || "Platform License"}
                    </span>
                    {companyName && (
                      <span className="text-xs text-toota-muted font-normal">
                        • {companyName}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-toota-ink tracking-tight mt-0.5">
                    {activeSubscription.plan?.planName || "Core"} Tier
                  </h2>
                </div>
              </div>

              {/* Dynamic Status Pill */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {renderLicenseStatusBadge()}
              </div>
            </div>

            {/* Metrics Quad: 4 Real Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Capacity Limit */}
              <div className="p-4 rounded-2xl bg-toota-inner border border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-toota-muted">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    {t("memberCapacityQuota") || "Member Capacity"}
                  </span>
                  <Users className="size-4 text-toota-ink" />
                </div>
                <div className="text-2xl font-bold tracking-tight text-toota-ink">
                  {maxCapacity}
                  <span className="text-xs font-normal text-toota-muted ms-1.5">
                    {t("maxMembersQuota", "Max Members")}
                  </span>
                </div>
                {/* Visual meter bar */}
                <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-toota-ink h-full rounded-full transition-all"
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-toota-muted flex items-center justify-between">
                  <span>{t("registeredLabel", "Registered:")} <strong className="text-toota-ink font-semibold">{memberCount}</strong></span>
                  <span className="text-toota-ink font-semibold">
                    {slotsLeft} {t("slotsRemaining", "slots left")}
                  </span>
                </p>
              </div>

              {/* Metric 2: Plan Price & Cycle */}
              <div className="p-4 rounded-2xl bg-toota-inner border border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-toota-muted">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    {t("planPrice", "Plan Investment")}
                  </span>
                  <CreditCard className="size-4 text-toota-green" />
                </div>
                <div className="text-2xl font-bold tracking-tight text-toota-ink">
                  {subAmount.toFixed(2)} MAD
                  <span className="text-xs font-normal text-toota-muted ms-1.5">
                    / {cycleDays} {t("days", "days")}
                  </span>
                </div>
                <div className="text-[11px] text-toota-muted flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-toota-green" />
                  <span>
                    ≈ {dailyRate} MAD/{t("dayLicense", "day license")}
                  </span>
                </div>
              </div>

              {/* Metric 3: Active Window */}
              <div className="p-4 rounded-2xl bg-toota-inner border border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-toota-muted">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    {t("billingPeriod", "Billing Window")}
                  </span>
                  <Calendar className="size-4 text-toota-ink" />
                </div>
                <div className="text-sm font-semibold text-toota-ink">
                  {expiryAnalysis?.startDate} → {expiryAnalysis?.formattedExpiry}
                </div>
                <div className="text-[11px] text-toota-muted">
                  {t("durationCycle", "Duration: {{days}} Days Cycle", { days: cycleDays })}
                </div>
              </div>

              {/* Metric 4: Days Remaining / Renewal Countdown */}
              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  expiryAnalysis?.isExpired
                    ? "bg-toota-red/10 border-toota-red/30"
                    : expiryAnalysis?.isExpiringSoon
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-toota-inner border-border/40"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-toota-muted">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    {t("renewingIn") || "Renewal Timeline"}
                  </span>
                  <Clock
                    className={`size-4 ${
                      expiryAnalysis?.isExpired
                        ? "text-toota-red"
                        : expiryAnalysis?.isExpiringSoon
                        ? "text-amber-500"
                        : "text-toota-ink"
                    }`}
                  />
                </div>
                <div className="text-2xl font-bold tracking-tight text-toota-ink">
                  {expiryAnalysis?.daysLeft ?? 0}
                  <span className="text-xs font-normal text-toota-muted ms-1.5">
                    {t("durationDaysCount", "Days Remaining")}
                  </span>
                </div>
                <p className="text-[11px] text-toota-muted">
                  {expiryAnalysis?.isExpired
                    ? t("licenseExpiredAlert", "⚠️ License expired. Upgrade or renew to continue full access.")
                    : expiryAnalysis?.isExpiringSoon
                    ? t("renewalWindowApproaching", "⚠️ Renewal window approaching soon")
                    : t("licenseContinuityActive", "Automatic license continuity active")}
                </p>
              </div>
            </div>

            {/* Included Platform Capabilities Ribbon */}
            <div className="p-4 rounded-2xl bg-toota-inner/60 border border-border/40 space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-toota-muted flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-toota-ink" />
                {t("planFeaturesTitle", "Included Platform Capabilities")}
              </span>

              {activeSubscription.plan?.description ? (
                <p className="text-xs text-toota-ink font-normal leading-relaxed">
                  {activeSubscription.plan.description}
                </p>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-toota-ink">
                  <CheckCircle2 className="size-4 text-toota-green shrink-0" />
                  <span>{t("featureQrCheckins", "Uncapped Member QR Check-Ins")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-toota-ink">
                  <CheckCircle2 className="size-4 text-toota-green shrink-0" />
                  <span>{t("featureStaffRoles", "Staff Roles & Roster Controls")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-toota-ink">
                  <CheckCircle2 className="size-4 text-toota-green shrink-0" />
                  <span>{t("featureRevenueTracking", "Automated Revenue Tracking")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-toota-ink">
                  <CheckCircle2 className="size-4 text-toota-green shrink-0" />
                  <span>{t("featureDataIntegrity", "Full Data Integrity & Export")}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        /* Empty / No Active Subscription Hero Card */
        <Card className="toota-card border-none p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="size-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="size-8" />
          </div>
          <div className="max-w-md">
            <h2 className="text-xl font-semibold text-toota-ink">
              {t("noActiveLicense") || "No Active License Assigned"}
            </h2>
            <p className="text-xs sm:text-sm text-toota-muted mt-1.5 leading-relaxed">
              {t("noActiveLicenseDesc") ||
                "Your gym currently does not have an active GymFlow platform license. Contact your platform administrator to activate your plan."}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer"
          >
            <Sparkles className="size-3.5 me-2" />
            <span>{t("contactSupport") || "Request Plan Activation"}</span>
          </Button>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUBSCRIPTION HISTORY & BILLING LEDGER SECTION                             */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Filter Card */}
        <Card className="toota-card border-none p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="size-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
              <input
                type="text"
                placeholder={t("searchSubscriptions") || "Search ledger by plan tier, date, or amount..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 ps-10 pe-4 rounded-full bg-toota-inner border border-border/40 text-xs font-medium text-toota-ink placeholder:text-toota-muted outline-none focus:outline-none focus:ring-1 focus:ring-[#a3e635] focus:border-[#a3e635] transition-all"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="w-full sm:w-48 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "ALL" | "ACTIVE" | "EXPIRED" | "CANCELLED"
                  )
                }
                aria-label="Filter status"
                className="w-full h-10 px-3.5 rounded-full bg-toota-inner border border-border/40 text-xs font-medium text-toota-ink focus:outline-hidden focus:ring-1 focus:ring-ring transition-all cursor-pointer"
              >
                <option value="ALL">{t("allRecords") || "All Statuses"}</option>
                <option value="ACTIVE">{t("activeOnly") || "Active"}</option>
                <option value="EXPIRED">{t("expiredOnly") || "Expired"}</option>
                <option value="CANCELLED">{t("cancelledOnly") || "Cancelled"}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* History Table Card */}
        <Card className="toota-card border-none p-0 overflow-hidden">
          <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-border/40 flex-wrap gap-3">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("subscriptionHistory") || "Billing & Subscription History"}
              </CardTitle>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {filteredHistory.length} {t("allRecords") || "records"}
              </span>
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-toota-muted">
                <Loader2 className="size-3.5 animate-spin" />
                <span>{t("loading") || "Updating..."}</span>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {filteredHistory.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="size-14 rounded-full bg-toota-inner flex items-center justify-center mx-auto mb-3 text-toota-muted">
                  <CreditCard className="size-7" />
                </div>
                <h4 className="font-medium text-base text-toota-ink">
                  {allSubscriptions.length === 0
                    ? t("noSubscriptionsYet") || "No subscription records found"
                    : t("noMatchingRecords") || "No matching subscription records"}
                </h4>
                <p className="text-xs text-toota-muted max-w-sm mx-auto mt-1 leading-relaxed">
                  {allSubscriptions.length === 0
                    ? "When your facility activates or renews platform tiers, records will appear here automatically."
                    : "Try adjusting your search query or status filter to see other records."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent text-[11px] font-semibold text-toota-muted uppercase tracking-wider bg-black/[0.02] dark:bg-white/[0.02]">
                    <TableHead className="px-6 py-3.5">{t("planAndTier", "Plan & Tier")}</TableHead>
                    <TableHead className="px-6 py-3.5">{t("memberLimit", "Member Limit")}</TableHead>
                    <TableHead className="px-6 py-3.5">{t("billingPeriod", "Billing Window")}</TableHead>
                    <TableHead className="px-6 py-3.5">{t("amountBilled", "Amount Billed")}</TableHead>
                    <TableHead className="px-6 py-3.5">{t("status", "Status")}</TableHead>
                    <TableHead className="px-6 py-3.5 text-right rtl:text-left">{t("reference", "Reference")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40 text-xs">
                  {filteredHistory.map((sub, index) => {
                    const status = sub.subscriptionStatus;

                    const startDate = sub.startedAt
                      ? new Date(sub.startedAt).toLocaleDateString()
                      : "--";
                    const endDate = sub.expiresAt
                      ? new Date(sub.expiresAt).toLocaleDateString()
                      : "--";

                    let subDurationDays = sub.planDuration?.durationDays;
                    if (!subDurationDays && sub.startedAt && sub.expiresAt) {
                      const s = new Date(sub.startedAt).getTime();
                      const e = new Date(sub.expiresAt).getTime();
                      const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
                      if (diff > 0) subDurationDays = diff;
                    }

                    const refId = sub.id
                      ? `#SUB-${sub.id.slice(0, 8)}`
                      : `GF-SUB-${index + 101}`;

                    return (
                      <TableRow
                        key={sub.id || index}
                        className="border-border/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Plan & Tier */}
                        <TableCell className="px-6 py-3.5 font-medium text-toota-ink">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-toota-inner flex items-center justify-center text-toota-ink shrink-0">
                              <Zap className="size-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-toota-ink">
                                {sub.plan?.planName || "Core Plan"}
                              </div>
                              <div className="text-[11px] text-toota-muted">
                                {subDurationDays || 30} {t("daysCycle", "Days Cycle")}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Member Limit */}
                        <TableCell className="px-6 py-3.5 text-toota-ink font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="size-3.5 text-toota-muted" />
                            {sub.plan?.maxMembers || 0} {t("members", "Members")}
                          </span>
                        </TableCell>

                        {/* Billing Window */}
                        <TableCell className="px-6 py-3.5 text-toota-muted font-medium">
                          {startDate} <span className="text-toota-muted/60">→</span> {endDate}
                        </TableCell>

                        {/* Amount Billed */}
                        <TableCell className="px-6 py-3.5 font-bold text-toota-ink">
                          {Number(sub.amount ?? sub.planDuration?.price ?? 0).toFixed(2)} MAD
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-6 py-3.5">
                          {renderHistoryStatusBadge(status)}
                        </TableCell>

                        {/* Reference / Copy */}
                        <TableCell className="px-6 py-3.5 text-right rtl:text-left">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyReceipt(refId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-toota-inner hover:bg-toota-card text-[11px] font-mono text-toota-ink cursor-pointer border border-border/40"
                            title={t("copyReceiptId") || "Copy Reference ID"}
                          >
                            <span>{refId}</span>
                            {isCopied === refId ? (
                              <Check className="size-3 text-toota-green" />
                            ) : (
                              <Copy className="size-3 text-toota-muted" />
                            )}
                          </Button>
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

      {/* ========================================================================= */}
      {/* ENTERPRISE TRUST & CONTINUITY RIBBON                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Card className="toota-card border-none p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-toota-ink font-semibold text-xs uppercase tracking-wider">
            <CheckCircle2 className="size-4 text-toota-green" />
            <span>{t("continuousCachingTitle", "Continuous Local Caching")}</span>
          </div>
          <p className="text-xs text-toota-muted leading-relaxed">
            {t("continuousCachingDesc", "Member check-ins and attendance validation stay operational even during intermittent platform connectivity.")}
          </p>
        </Card>

        <Card className="toota-card border-none p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-toota-ink font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="size-4 text-toota-ink" />
            <span>{t("tenantIsolationTitle", "Strict Tenant Isolation")}</span>
          </div>
          <p className="text-xs text-toota-muted leading-relaxed">
            {t("tenantIsolationDesc", "Your gym member database, financial records, and staff credentials reside in dedicated isolated data partitions.")}
          </p>
        </Card>

        <Card className="toota-card border-none p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-toota-ink font-semibold text-xs uppercase tracking-wider">
            <Headphones className="size-4 text-toota-ink" />
            <span>{t("platformConciergeTitle", "Dedicated Platform Concierge")}</span>
          </div>
          <p className="text-xs text-toota-muted leading-relaxed">
            {t("platformConciergeDesc", "24/7 technical assistance for subscription scaling, API integrations, and facility hardware synchronization.")}
          </p>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* UPGRADE / PLATFORM CONCIERGE MODAL                                        */}
      {/* ========================================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsContactModalOpen(false)}
          />

          <Card className="toota-card border-none relative w-full max-w-lg shadow-2xl overflow-hidden p-6 sm:p-7 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-toota-inner text-toota-ink flex items-center justify-center shadow-xs">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-toota-ink">
                    {t("upgradeSubscriptionTitle", "Upgrade GymFlow Subscription")}
                  </h3>
                  <p className="text-xs text-toota-muted">
                    {t("upgradeSubscriptionSubtitle", "Expand member capacity or extend your facility license")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl bg-toota-inner border border-border/40 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-toota-ink">
                  {t("howLicensingWorksTitle", "How Licensing Works")}
                </h4>
                <p className="text-xs text-toota-muted leading-relaxed">
                  {t("howLicensingWorksDesc", "GymFlow subscriptions are provisioned directly by the Platform Administrator / GymFlow Owner. Upgrading unlocks higher member quotas, multiple simultaneous staff logins, and priority feature access.")}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-toota-inner border border-border/40">
                  <span className="font-semibold text-toota-ink">{t("currentCapacityLimit", "Current Capacity Limit:")}</span>
                  <span className="font-bold text-toota-ink">
                    {maxCapacity || 100} {t("members", "Members")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-toota-inner border border-border/40">
                  <span className="font-semibold text-toota-ink">{t("activeRegisteredMembers", "Active Registered Members:")}</span>
                  <span className="font-bold text-toota-green">
                    {memberCount} {t("members", "Members")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-toota-inner border border-border/40">
                  <span className="font-semibold text-toota-ink">{t("nextTierQuota", "Next Tier Quota:")}</span>
                  <span className="font-bold text-toota-green">
                    {maxCapacity ? `${maxCapacity * 2}+ ${t("members", "Members")}` : t("unlimitedMembersQuota", "500+ / Unlimited Members")}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-toota-inner border border-border/40 text-xs text-toota-ink leading-relaxed">
                <strong>{t("needQuotaExtension", "Need immediate quota extension?")}</strong>{" "}
                {t("reachOutSupport", "Reach out to your account executive or email")}{" "}
                <span className="font-mono font-semibold underline">support@gymflow.io</span>{" "}
                {t("withGymId", "with your Gym ID.")}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContactModalOpen(false)}
                className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
              >
                {t("close", "Close")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
