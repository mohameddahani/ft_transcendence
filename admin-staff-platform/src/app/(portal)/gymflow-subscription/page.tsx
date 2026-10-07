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
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Filter,
  Search,
  Building,
  Info,
  Layers,
  HelpCircle,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { GymflowSubscription } from "@/types/subscription";
import { fetchMySubscription, fetchAllSubscriptions } from "@/lib/api/subscriptions";
import { fetchMembers } from "@/lib/api/members";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function GymflowSubscriptionPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
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
      const [currentSub, allSubs, members] = await Promise.all([
        fetchMySubscription().catch(() => null),
        fetchAllSubscriptions(1, 50).catch(() => []),
        fetchMembers(1, 1).then((res) => (Array.isArray(res) ? res.length : 0)).catch(() => 0),
      ]);

      setActiveSubscription(currentSub);
      setAllSubscriptions(allSubs);
      setMemberCount(members);
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

  // Expiry & Countdown Calculation
  const expiryAnalysis = useMemo(() => {
    if (!activeSubscription?.expiresAt) return null;
    const now = new Date();
    const expiryDate = new Date(activeSubscription.expiresAt);
    const diffMs = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const startDate = activeSubscription.startedAt
      ? new Date(activeSubscription.startedAt).toLocaleDateString()
      : "--";
    const formattedExpiry = expiryDate.toLocaleDateString();

    const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;
    const isExpired = daysLeft <= 0;

    return {
      daysLeft,
      startDate,
      formattedExpiry,
      isExpiringSoon,
      isExpired,
    };
  }, [activeSubscription]);

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
      "Amount Paid",
      "Status",
      "Started At",
      "Expires At",
    ];

    const rows = filteredHistory.map((sub) => [
      `"${sub.plan?.planName || "Standard"}"`,
      sub.plan?.maxMembers || 0,
      sub.planDuration?.durationDays || 30,
      `"${sub.amount || 0}"`,
      sub.subscriptionStatus,
      sub.startedAt ? sub.startedAt.split("T")[0] : "",
      sub.expiresAt ? sub.expiresAt.split("T")[0] : "",
    ]);

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
    <div className="space-y-8 max-w-container-max mx-auto pb-16">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl primary-gradient text-white flex items-center justify-center shadow-md shadow-primary/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                  {t("gymflowSubscriptionTitle") || "GymFlow Subscription"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                  Enterprise Core
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                {t("gymflowSubscriptionSubtitle") ||
                  "Manage your core GymFlow platform license, allocated capacity, and complete billing ledger."}
              </p>
            </div>
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-variant transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>{t("refresh")}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-variant transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>{t("export")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 primary-gradient text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t("contactSupport") || "Upgrade / Contact Platform"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HERO SECTION: Current Active Platform License Showcase                    */}
      {/* ========================================================================= */}
      {activeSubscription ? (
        <div className="relative rounded-3xl bg-surface-bright border border-outline-variant/60 shadow-xl overflow-hidden p-6 sm:p-8 transition-all">
          {/* Subtle Dynamic Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 space-y-6">
            {/* Top Bar of the Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-black shadow-inner border border-primary/20">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t("currentActivePlan") || "Active Platform License"}
                    </span>
                    {companyName && (
                      <span className="text-[11px] text-on-surface-variant/80 font-medium">
                        • {companyName}
                      </span>
                    )}
                  </div>
                  <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-0.5">
                    {activeSubscription.plan?.planName || "Enterprise"} Tier
                  </h2>
                </div>
              </div>

              {/* Status Pill with Pulsating Radar */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>{t("activeLicense") || "Active & In Good Standing"}</span>
                </div>
              </div>
            </div>

            {/* Metrics Quad: 4 High-Density Operational Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Capacity Limit */}
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    {t("memberCapacityQuota") || "Member Capacity"}
                  </span>
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold font-headline text-on-surface">
                  {activeSubscription.plan?.maxMembers || 0}
                  <span className="text-xs font-normal text-on-surface-variant ml-1.5">
                    Max Members
                  </span>
                </div>
                {/* Visual meter bar */}
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        activeSubscription.plan?.maxMembers
                          ? Math.round(
                              (memberCount / activeSubscription.plan.maxMembers) * 100
                            )
                          : 35
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant flex items-center justify-between">
                  <span>Registered: {memberCount}</span>
                  <span className="text-primary font-bold">
                    {Math.max(
                      0,
                      (activeSubscription.plan?.maxMembers || 0) - memberCount
                    )}{" "}
                    {t("slotsRemaining") || "slots left"}
                  </span>
                </p>
              </div>

              {/* Metric 2: Plan Price & Cycle */}
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    {t("planPrice") || "Plan Investment"}
                  </span>
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold font-headline text-on-surface">
                  ${Number(activeSubscription.amount || activeSubscription.planDuration?.price || 0).toFixed(2)}
                  <span className="text-xs font-normal text-on-surface-variant ml-1.5">
                    / {activeSubscription.planDuration?.durationDays || 30} days
                  </span>
                </div>
                <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>
                    ≈ $
                    {(
                      Number(activeSubscription.amount || activeSubscription.planDuration?.price || 0) /
                      (activeSubscription.planDuration?.durationDays || 30)
                    ).toFixed(2)}
                    /day platform license
                  </span>
                </div>
              </div>

              {/* Metric 3: Active Window */}
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    {t("billingPeriod") || "Billing Window"}
                  </span>
                  <Calendar className="w-4 h-4 text-cyan-500" />
                </div>
                <div className="text-sm font-bold text-on-surface">
                  {expiryAnalysis?.startDate} → {expiryAnalysis?.formattedExpiry}
                </div>
                <div className="text-[11px] text-on-surface-variant">
                  Duration: {activeSubscription.planDuration?.durationDays || 30} Days Total
                </div>
              </div>

              {/* Metric 4: Days Remaining / Renewal Countdown */}
              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  expiryAnalysis?.isExpiringSoon
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100"
                    : "bg-surface-container-lowest border border-outline-variant/40"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    {t("renewingIn") || "Renewal Timeline"}
                  </span>
                  <Clock
                    className={`w-4 h-4 ${
                      expiryAnalysis?.isExpiringSoon
                        ? "text-amber-500"
                        : "text-primary"
                    }`}
                  />
                </div>
                <div className="text-2xl font-bold font-headline text-on-surface">
                  {Math.max(0, expiryAnalysis?.daysLeft || 0)}
                  <span className="text-xs font-normal text-on-surface-variant ml-1.5">
                    {t("durationDaysCount") || "Days Remaining"}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  {expiryAnalysis?.isExpiringSoon
                    ? "⚠️ Renewal window approaching soon"
                    : "Automatic license continuity active"}
                </p>
              </div>
            </div>

            {/* Included Platform Capabilities Ribbon */}
            <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-outline-variant/40 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {t("planFeaturesTitle") || "Included Platform Capabilities"}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Uncapped Member QR Check-Ins</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Staff Roles & Roster Controls</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automated Revenue Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>99.9% Cloud Synchronization</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / No Active Subscription Hero Card */
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-bright border border-outline-variant/60 shadow-lg text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {t("noActiveLicense") || "No Active License Assigned"}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              {t("noActiveLicenseDesc") ||
                "Your gym currently does not have an active GymFlow platform license. Contact your platform administrator to activate your plan."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 primary-gradient text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t("contactSupport") || "Request Plan Activation"}</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBSCRIPTION HISTORY & BILLING LEDGER SECTION                             */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>{t("subscriptionHistory") || "Billing & Subscription History"}</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Historical ledger of all platform subscriptions associated with your facility.
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant/60 self-start sm:self-auto">
            {filteredHistory.length} {t("allRecords") || "Records"}
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant">
          {/* Search Input */}
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Search history by plan tier, date, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-on-surface-variant/60"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-on-surface-variant shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "ALL" | "ACTIVE" | "EXPIRED" | "CANCELLED"
                )
              }
              className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none cursor-pointer"
            >
              <option value="ALL">{t("allRecords") || "All Statuses"}</option>
              <option value="ACTIVE">{t("activeOnly") || "Active"}</option>
              <option value="EXPIRED">{t("expiredOnly") || "Expired"}</option>
              <option value="CANCELLED">{t("cancelledOnly") || "Cancelled"}</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-surface-bright rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/50 bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Plan & Tier</th>
                  <th className="py-3.5 px-4">Member Limit</th>
                  <th className="py-3.5 px-4">Billing Window</th>
                  <th className="py-3.5 px-4">Amount Billed</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CreditCard className="w-8 h-8 opacity-40" />
                        <p className="font-semibold text-on-surface">No subscription records found</p>
                        <p className="text-[11px] max-w-sm text-on-surface-variant/80">
                          When your gym renews or updates plans, every transaction will be logged in this ledger.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((sub, index) => {
                    const status = sub.subscriptionStatus;
                    const isActive = status === "ACTIVE";
                    const isExpired = status === "EXPIRED";
                    const isCancelled = status === "CANCELLED";

                    const startDate = sub.startedAt ? sub.startedAt.split("T")[0] : "--";
                    const endDate = sub.expiresAt ? sub.expiresAt.split("T")[0] : "--";
                    const refId = `GF-SUB-${startDate.replace(/-/g, "")}-${index + 101}`;

                    return (
                      <tr
                        key={index}
                        className="hover:bg-surface-container/40 transition-colors"
                      >
                        {/* Plan & Tier */}
                        <td className="py-4 px-4 sm:px-6 font-medium text-on-surface">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              <Zap className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-on-surface">
                                {sub.plan?.planName || "Core Plan"}
                              </div>
                              <div className="text-[11px] text-on-surface-variant">
                                {sub.planDuration?.durationDays || 30} Days Cycle
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Member Limit */}
                        <td className="py-4 px-4 text-on-surface font-semibold">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-on-surface-variant" />
                            {sub.plan?.maxMembers || 0} Members
                          </span>
                        </td>

                        {/* Billing Window */}
                        <td className="py-4 px-4 text-on-surface">
                          <div className="font-medium">
                            {startDate} <span className="text-on-surface-variant">→</span> {endDate}
                          </div>
                        </td>

                        {/* Amount Billed */}
                        <td className="py-4 px-4 font-bold text-on-surface">
                          ${Number(sub.amount || sub.planDuration?.price || 0).toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : isExpired
                                ? "bg-surface-container-high text-on-surface-variant border border-outline-variant/60"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive
                                  ? "bg-emerald-500"
                                  : isExpired
                                  ? "bg-on-surface-variant"
                                  : "bg-rose-500"
                              }`}
                            />
                            {status}
                          </span>
                        </td>

                        {/* Reference / Copy */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopyReceipt(refId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-[11px] font-mono text-on-surface transition-colors cursor-pointer"
                            title={t("copyReceiptId") || "Copy Reference ID"}
                          >
                            <span>{refId}</span>
                            {isCopied === refId ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-on-surface-variant" />
                            )}
                          </button>
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

      {/* ========================================================================= */}
      {/* ENTERPRISE TRUST & CONTINUITY RIBBON                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-surface-bright border border-outline-variant/50 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Continuous Local Caching</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Member check-ins and attendance validation stay operational even during intermittent platform connectivity.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-bright border border-outline-variant/50 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Strict Tenant Isolation</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your gym member database, financial records, and staff credentials reside in dedicated isolated data partitions.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-bright border border-outline-variant/50 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
            <HeadphonesIcon className="w-4 h-4 text-cyan-500" />
            <span>Dedicated Platform Concierge</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            24/7 technical assistance for subscription scaling, API integrations, and facility hardware synchronization.
          </p>
        </div>
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

          <div className="relative w-full max-w-lg bg-surface-bright rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/40 p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl primary-gradient text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">
                    Upgrade GymFlow Subscription
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Expand member capacity or extend your facility license
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                  How Licensing Works
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  GymFlow subscriptions are managed and provisioned directly by your Platform Administrator / GymFlow Owner. Upgrading unlocks higher member quotas, multiple simultaneous staff logins, and priority feature access.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                  <span className="font-bold text-on-surface">Current Capacity Limit:</span>
                  <span className="font-bold text-primary">
                    {activeSubscription?.plan?.maxMembers || 100} Members
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                  <span className="font-bold text-on-surface">Next Tier Quota:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    500+ / Unlimited Members
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary leading-relaxed">
                <strong>Need immediate quota extension?</strong> Reach out to your account executive or email{" "}
                <span className="font-mono font-semibold underline">support@gymflow.io</span> with your Gym ID.
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeadphonesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
