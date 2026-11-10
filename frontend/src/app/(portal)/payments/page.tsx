"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { animate, useMotionValue } from "framer-motion";
import {
  Wallet,
  Clock,
  AlertTriangle,
  Search,
  Calendar,
  Download,
  RefreshCw,
  X,
  Receipt,
  User,
  Loader2,
  CheckCircle2,
  Eye,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { fetchPayments } from "@/lib/api/payments";
import { BackendPayment } from "@/types/payment";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTranslation } from "react-i18next";
import Pagination from "@/components/ui/Pagination";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";

function getEffectivePaymentStatus(p: BackendPayment): string {
  if (p.paymentStatus) return p.paymentStatus.toUpperCase();
  if (p.paidAt) return "PAID";
  if (p.dueDate && new Date(p.dueDate).getTime() < Date.now()) return "OVERDUE";
  return "PENDING";
}

/**
 * Animated counter that smoothly increments from 0 to the target number
 * using framer-motion's animate and useMotionValue.
 */
function AnimatedRevenue({ value }: { value: number }) {
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState("0.00");

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(
          latest.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      },
    });
    return () => controls.stop();
  }, [value, count]);

  return <span>{displayValue} MAD</span>;
}

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { companyName } = useCurrentUser();
  const [payments, setPayments] = useState<BackendPayment[]>([]);
  const [pagedPayments, setPagedPayments] = useState<BackendPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected payment for side-panel detail view
  const [selectedPayment, setSelectedPayment] = useState<BackendPayment | null>(null);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const [fullList, initialPage] = await Promise.all([
        fetchPayments(1, 1000),
        fetchPayments(1, pageSize),
      ]);
      setPayments(fullList);
      setPagedPayments(initialPage);
      setCurrentPage(1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load payments from server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Handle page changes with explicit API calls
  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    if (!searchTerm) {
      setIsPageLoading(true);
      try {
        const pageData = await fetchPayments(newPage, pageSize);
        setPagedPayments(pageData);
      } catch {
        // fail gracefully
      } finally {
        setIsPageLoading(false);
      }
    }
  };

  // Close side panel with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPayment(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered Payments
  const isFiltering = Boolean(searchTerm);
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const member = payment.member;
      const memberName = `${member?.firstName || ""} ${member?.lastName || ""}`.toLowerCase();
      const email = (member?.email || "").toLowerCase();
      const invoiceId = payment.id.toLowerCase();
      const query = searchTerm.toLowerCase();

      return (
        memberName.includes(query) ||
        email.includes(query) ||
        invoiceId.includes(query)
      );
    });
  }, [payments, searchTerm]);

  // Pagination
  const totalItems = isFiltering ? filteredPayments.length : payments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedPayments = useMemo(() => {
    if (isFiltering) {
      const start = (currentPage - 1) * pageSize;
      return filteredPayments.slice(start, start + pageSize);
    }
    return pagedPayments;
  }, [isFiltering, filteredPayments, pagedPayments, currentPage, pageSize]);

  // Statistics Calculation
  const totalCollected = useMemo(() => {
    return payments
      .filter((p) => getEffectivePaymentStatus(p) === "PAID")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const outstandingTotal = useMemo(() => {
    return payments
      .filter((p) => {
        const s = getEffectivePaymentStatus(p);
        return s === "PENDING" || s === "UNPAID" || s === "PARTIAL";
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const pendingCount = useMemo(() => {
    return payments.filter((p) => {
      const s = getEffectivePaymentStatus(p);
      return s === "PENDING" || s === "UNPAID" || s === "PARTIAL";
    }).length;
  }, [payments]);

  const overdueCount = useMemo(() => {
    return payments.filter((p) => {
      const s = getEffectivePaymentStatus(p);
      return s === "OVERDUE" || s === "FAILED";
    }).length;
  }, [payments]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast.info("No payment records available to export.");
      return;
    }

    const headers = [
      "Invoice ID",
      "Member Name",
      "Member Email",
      "Amount (MAD)",
      "Status",
      "Paid Date",
      "Created At",
    ];

    const rows = filteredPayments.map((p) => [
      `#INV-${p.id.slice(0, 8)}`,
      `"${(p.member?.firstName || "") + " " + (p.member?.lastName || "")}"`,
      p.member?.email || "",
      Number(p.amount || 0).toFixed(2),
      getEffectivePaymentStatus(p),
      p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—",
      new Date(p.createdAt).toLocaleDateString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `payments_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Payments ledger exported to CSV successfully!");
  };

  // Download single invoice text receipt
  const handleDownloadInvoice = (payment: BackendPayment) => {
    const member = payment.member;
    const gymTitle = (companyName || "GymFlow").toUpperCase();
    const invoiceText = `
========================================
       ${gymTitle} INVOICE
========================================
Invoice Number : #INV-${payment.id.slice(0, 8)}
Date Issued    : ${new Date(payment.createdAt).toLocaleDateString()}
Payment Status : ${getEffectivePaymentStatus(payment)}
Amount Due     : ${Number(payment.amount).toFixed(2)} MAD
Paid At        : ${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : "Pending"}
Due Date       : ${payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "N/A"}

----------------------------------------
MEMBER INFORMATION
----------------------------------------
Name           : ${member?.firstName || ""} ${member?.lastName || ""}
Email          : ${member?.email || "—"}
Phone          : ${member?.phoneNumber || "—"}
Address        : ${member?.address || "—"}

----------------------------------------
Thank you for training with ${companyName || "us"}!
========================================
    `;

    const blob = new Blob([invoiceText.trim()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_INV_${payment.id.slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded!");
  };

  const getStatusLabel = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "PAID") return t("paid") || "Paid";
    if (s === "PENDING") return t("pending") || "Pending";
    if (s === "UNPAID") return t("unpaid") || "Unpaid";
    if (s === "PARTIAL") return t("partial") || "Partial";
    if (s === "OVERDUE") return t("overdue") || "Overdue";
    if (s === "FAILED") return t("failed") || "Failed";
    if (s === "CANCELLED") return t("cancelled") || "Cancelled";
    if (s === "ACTIVE") return t("active") || "Active";
    if (s === "EXPIRED") return t("expired") || "Expired";
    return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "";
  };

  const renderPaymentStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    const label = getStatusLabel(status);

    if (s === "PAID" || s === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    if (s === "PENDING" || s === "UNPAID" || s === "PARTIAL") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    if (s === "OVERDUE" || s === "FAILED" || s === "EXPIRED") {
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

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "M";
  };

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Top Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("navPayments") || "Payments"}
              </h1>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {totalItems} {t("total") || "total"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t("paymentsSubtitle") ||
                "Manage gym finances, transaction logs, and billing invoices."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={loadPayments}
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
              <span>{t("export") || "Export"} CSV</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 3 Existing Stat Cards (Redesigned in Toota Dashboard Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Revenue (Collected) with Framer Motion Animated Counter */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalRevenue") || "Total Revenue"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-green">
              <Wallet className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-green" />
              ) : (
                <div className="text-4xl font-semibold tracking-tight text-toota-ink">
                  <AnimatedRevenue value={totalCollected} />
                </div>
              )}
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                {t("liveFromApi") || "Live"}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2 flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-toota-green" />
              <span>{t("successfulTransactions") || "Successful transactions"}</span>
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-green transition-all"
                style={{ width: "100%" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pending / Outstanding Total */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("pendingPayments") || "Pending Payments"}
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
                  {outstandingTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} MAD
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>
                  {pendingCount} {t("pending") || "Pending"}
                </span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {pendingCount} {t("pending") || "pending invoices"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{
                  width: `${
                    totalCollected + outstandingTotal > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (outstandingTotal / (totalCollected + outstandingTotal)) * 100
                          )
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Overdue / Failed Payments */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("failedPayments") || "Failed / Overdue"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-red">
              <AlertTriangle className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-red" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {overdueCount}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 ${
                  overdueCount > 0
                    ? "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    overdueCount > 0 ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
                <span>
                  {overdueCount > 0
                    ? t("requiresAttention") || "Action needed"
                    : t("allSettled") || "Settled"}
                </span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {overdueCount > 0
                ? t("requiresAttention") || "Requires immediate attention"
                : t("allSettled") || "All accounts settled"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  overdueCount > 0 ? "bg-toota-red" : "bg-toota-muted"
                }`}
                style={{
                  width: `${
                    payments.length > 0
                      ? Math.min(100, Math.round((overdueCount / payments.length) * 100))
                      : 0
                  }%`,
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
              placeholder={`${t("search") || "Search"}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-full bg-toota-inner border-border/40 ps-10 pe-4 text-xs text-toota-ink placeholder:text-toota-muted focus-visible:ring-1 focus-visible:ring-[#a3e635] focus-visible:border-[#a3e635] transition-all"
            />
          </div>

          {/* Clear Filters Button */}
          <Button
            type="button"
            variant="outline"
            disabled={!isFiltering}
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 w-full md:w-auto"
          >
            <X className="size-3.5 me-1.5" />
            <span>{t("clearFilters") || "Clear Filters"}</span>
          </Button>
        </div>
      </Card>

      {/* Payments Ledger Table Card */}
      <Card className="toota-card border-none p-0 overflow-hidden">
        <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-border/40 flex-wrap gap-3">
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("navPayments") || "Payments Ledger"}
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
              <p className="text-xs">Loading payments...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && paginatedPayments.length === 0 && (
            <div className="py-20 text-center px-4">
              <div className="size-14 rounded-full bg-toota-inner flex items-center justify-center mx-auto mb-3 text-toota-muted">
                <Receipt className="size-7" />
              </div>
              <h4 className="font-medium text-base text-toota-ink">
                {t("noPaymentsRecorded") || "No payment records found"}
              </h4>
              <p className="text-xs text-toota-muted max-w-sm mx-auto mt-1 leading-relaxed">
                {t("adjustFilter") || "Try adjusting your search query or status filter."}
              </p>
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && paginatedPayments.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent text-[11px] font-semibold text-toota-muted uppercase tracking-wider bg-black/[0.02] dark:bg-white/[0.02]">
                  <TableHead className="px-6 py-3.5">
                    {t("member") || "Member"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("amount") || "Amount"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("paymentDate") || "Payment Date"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("status") || "Status"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5 text-right rtl:text-left">
                    {t("actions") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40 text-xs">
                {paginatedPayments.map((payment) => {
                  const member = payment.member;
                  const memberName =
                    `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
                    member?.userName ||
                    t("member") ||
                    "Member";
                  const memberInitials =
                    getInitials(member?.firstName, member?.lastName) ||
                    (member?.userName?.[0] ? member.userName[0].toUpperCase() : "M");
                  const avatarUrl = member?.profileImageUrl || member?.photo || null;
                  const hasPhoto = Boolean(avatarUrl);

                  const status = getEffectivePaymentStatus(payment);
                  const paidDateStr = payment.paidAt
                    ? new Date(payment.paidAt).toLocaleDateString()
                    : "—";

                  return (
                    <TableRow
                      key={payment.id}
                      onClick={() => setSelectedPayment(payment)}
                      className="border-border/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* Member Info */}
                      <TableCell className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 ring-1 ring-border/40 shrink-0">
                            {hasPhoto && (
                              <AvatarImage
                                src={avatarUrl!}
                                alt={memberName}
                              />
                            )}
                            <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                              {memberInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-toota-ink group-hover:underline truncate">
                              {memberName}
                            </p>
                            <p className="text-[11px] font-mono text-toota-muted truncate">
                              #INV-{payment.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="px-6 py-3.5 font-semibold text-toota-ink text-sm">
                        {Number(payment.amount).toFixed(2)} MAD
                      </TableCell>

                      {/* Paid Date */}
                      <TableCell className="px-6 py-3.5 text-toota-muted">
                        {paidDateStr}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-6 py-3.5">
                        {renderPaymentStatusBadge(status)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-6 py-3.5 text-right rtl:text-left">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(payment);
                          }}
                          className="toota-pill h-8 px-3 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
                        >
                          <Eye className="size-3.5 me-1.5" />
                          <span>{t("details") || "Details"}</span>
                        </Button>
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
            itemLabel={t("payments") || "payments"}
          />
        )}
      </Card>

      {/* Slide-out Payment Detail Side Panel */}
      {selectedPayment && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedPayment(null)}
          />

          {/* Drawer Canvas */}
          <div className="fixed top-0 right-0 rtl:right-auto rtl:left-0 h-screen w-full sm:w-[440px] bg-card/95 backdrop-blur-xl border-s border-border/50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right rtl:slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border/40 flex justify-between items-center bg-toota-inner/40">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-toota-ink" />
                <h3 className="font-medium text-base text-toota-ink">
                  {t("details") || "Payment Details"}
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPayment(null)}
                className="size-8 rounded-full text-toota-muted hover:text-toota-ink hover:bg-toota-inner cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Member Summary */}
              <section className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <Avatar className="size-14 ring-1 ring-border/40 shrink-0">
                    {selectedPayment.member?.profileImageUrl ? (
                      <AvatarImage
                        src={selectedPayment.member.profileImageUrl}
                        alt={selectedPayment.member.firstName || ""}
                      />
                    ) : null}
                    <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-sm">
                      {getInitials(
                        selectedPayment.member?.firstName,
                        selectedPayment.member?.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <h4 className="font-medium text-base text-toota-ink truncate">
                      {selectedPayment.member?.firstName}{" "}
                      {selectedPayment.member?.lastName}
                    </h4>
                    <p className="text-xs text-toota-muted truncate">
                      {selectedPayment.member?.email}
                    </p>
                    <p className="text-[11px] text-toota-muted font-mono mt-0.5">
                      @{selectedPayment.member?.userName || "member"}
                    </p>
                  </div>
                </div>

                {/* Amount & Invoice Info Box */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-toota-inner rounded-2xl border border-border/40">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted block">
                      {t("transactionId") || "Invoice"}
                    </span>
                    <p className="font-mono text-xs font-semibold text-toota-ink mt-0.5">
                      #INV-{selectedPayment.id.slice(0, 8)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted block">
                      {t("amount") || "Amount"}
                    </span>
                    <p className="text-lg font-semibold text-toota-green mt-0.5">
                      {Number(selectedPayment.amount).toFixed(2)} MAD
                    </p>
                  </div>
                </div>
              </section>

              {/* Status Section */}
              <section className="space-y-2">
                <span className="text-[11px] font-semibold text-toota-muted uppercase tracking-wider block">
                  {t("status") || "Status"}
                </span>
                <div className="p-3.5 bg-toota-inner rounded-2xl border border-border/40 flex items-center justify-between">
                  <span className="text-xs font-medium text-toota-ink">
                    {t("status") || "Payment Status"}
                  </span>
                  {renderPaymentStatusBadge(
                    getEffectivePaymentStatus(selectedPayment)
                  )}
                </div>
              </section>

              {/* Plan & Duration Details */}
              {selectedPayment.member?.memberships?.[0] && (
                <section className="space-y-2">
                  <span className="text-[11px] font-semibold text-toota-muted uppercase tracking-wider block">
                    {t("planName") || "Plan Details"}
                  </span>
                  <div className="p-4 bg-toota-inner rounded-2xl border border-border/40 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-toota-muted">{t("planName") || "Plan"}</span>
                      <span className="font-medium text-toota-ink">
                        {selectedPayment.member.memberships[0].membershipPlan?.planName ||
                          t("standardPlan") ||
                          "Standard"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-toota-muted">{t("status") || "Status"}</span>
                      {renderPaymentStatusBadge(
                        selectedPayment.member.memberships[0].membershipStatus || "ACTIVE"
                      )}
                    </div>
                    {selectedPayment.member.memberships[0].expiresAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-toota-muted">
                          {t("nextExpiry") || "Next Expiry"}
                        </span>
                        <span className="font-medium text-toota-ink">
                          {new Date(
                            selectedPayment.member.memberships[0].expiresAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Payment Timeline */}
              <section className="space-y-3">
                <span className="text-[11px] font-semibold text-toota-muted uppercase tracking-wider block">
                  {t("paymentHistory") || "Timeline"}
                </span>
                <div className="space-y-4 relative ps-6 border-s border-border/50 ms-2">
                  {/* Generated */}
                  <div className="relative">
                    <div className="absolute -start-[31px] top-0 size-5 rounded-full bg-toota-inner border border-border/50 flex items-center justify-center text-toota-ink shadow-xs">
                      <Receipt className="size-3" />
                    </div>
                    <div className="text-xs font-semibold text-toota-ink">
                      {t("invoicesRecorded") || "Invoice Generated"}
                    </div>
                    <div className="text-[11px] text-toota-muted">
                      {new Date(selectedPayment.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Due Date */}
                  {selectedPayment.dueDate && (
                    <div className="relative">
                      <div className="absolute -start-[31px] top-0 size-5 rounded-full bg-toota-inner border border-border/50 flex items-center justify-center text-toota-muted">
                        <Calendar className="size-3" />
                      </div>
                      <div className="text-xs font-semibold text-toota-ink">
                        {t("expiryDate") || "Due Date"}
                      </div>
                      <div className="text-[11px] text-toota-muted">
                        {new Date(selectedPayment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* Settlement */}
                  <div className="relative">
                    <div
                      className={`absolute -start-[31px] top-0 size-5 rounded-full flex items-center justify-center text-white shadow-xs ${
                        (selectedPayment.paymentStatus || "").toUpperCase() === "PAID"
                          ? "bg-toota-green text-white"
                          : (selectedPayment.paymentStatus || "").toUpperCase() === "OVERDUE"
                          ? "bg-toota-red text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      <CheckCircle2 className="size-3" />
                    </div>
                    <div className="text-xs font-semibold text-toota-ink">
                      {(selectedPayment.paymentStatus || "").toUpperCase() === "PAID"
                        ? t("successfulTransactions") || "Payment Settled"
                        : (selectedPayment.paymentStatus || "").toUpperCase() === "OVERDUE"
                        ? t("failedPayments") || "Payment Overdue"
                        : t("pendingPayments") || "Awaiting Settlement"}
                    </div>
                    <div className="text-[11px] text-toota-muted">
                      {selectedPayment.paidAt
                        ? new Date(selectedPayment.paidAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-border/40 bg-toota-inner/40 flex flex-col gap-2.5">
              <Button
                type="button"
                onClick={() => handleDownloadInvoice(selectedPayment)}
                className="toota-pill h-11 w-full text-xs font-semibold justify-center cursor-pointer"
              >
                <Download className="size-4 me-2" />
                <span>{t("export") || "Export"} ({t("details") || "Invoice"})</span>
              </Button>

              <Link
                href={`/members/${selectedPayment.member?.id}`}
                className="w-full"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="toota-pill h-11 w-full text-xs font-semibold justify-center border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
                >
                  <User className="size-4 me-2" />
                  <span>{t("viewProfile") || "View Member Profile"}</span>
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
