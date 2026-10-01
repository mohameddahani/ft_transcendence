"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Send,
  Eye,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { fetchPayments } from "@/lib/api/payments";
import { BackendPayment } from "@/types/payment";

export default function PaymentsPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<BackendPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected payment for side-panel detail view
  const [selectedPayment, setSelectedPayment] = useState<BackendPayment | null>(null);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPayments(1, 100);
      setPayments(data);
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
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const member = payment.member;
      const memberName = `${member?.firstName || ""} ${member?.lastName || ""}`.toLowerCase();
      const email = (member?.email || "").toLowerCase();
      const invoiceId = payment.id.toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        memberName.includes(query) ||
        email.includes(query) ||
        invoiceId.includes(query);

      const status = (payment.paymentStatus || "PAID").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  // Pagination
  const totalItems = filteredPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Statistics Calculation
  const totalCollected = useMemo(() => {
    return payments
      .filter((p) => (p.paymentStatus || "").toUpperCase() === "PAID")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const outstandingTotal = useMemo(() => {
    return payments
      .filter((p) => {
        const s = (p.paymentStatus || "").toUpperCase();
        return s === "PENDING" || s === "UNPAID" || s === "PARTIAL";
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const pendingCount = useMemo(() => {
    return payments.filter((p) => {
      const s = (p.paymentStatus || "").toUpperCase();
      return s === "PENDING" || s === "UNPAID" || s === "PARTIAL";
    }).length;
  }, [payments]);

  const overdueCount = useMemo(() => {
    return payments.filter(
      (p) => (p.paymentStatus || "").toUpperCase() === "OVERDUE"
    ).length;
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
      "Amount ($)",
      "Status",
      "Due Date",
      "Paid Date",
      "Created At",
    ];

    const rows = filteredPayments.map((p) => [
      `#INV-${p.id.slice(0, 8)}`,
      `"${(p.member?.firstName || "") + " " + (p.member?.lastName || "")}"`,
      p.member?.email || "",
      Number(p.amount || 0).toFixed(2),
      p.paymentStatus || "PAID",
      p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "—",
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
      `kinetic_payments_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Payments ledger exported to CSV successfully!");
  };

  // Download single invoice text receipt
  const handleDownloadInvoice = (payment: BackendPayment) => {
    const member = payment.member;
    const invoiceText = `
========================================
       KINETIC ENTERPRISE INVOICE
========================================
Invoice Number : #INV-${payment.id.slice(0, 8)}
Date Issued    : ${new Date(payment.createdAt).toLocaleDateString()}
Payment Status : ${(payment.paymentStatus || "PAID").toUpperCase()}
Amount Due     : $${Number(payment.amount).toFixed(2)}
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
Thank you for training with Kinetic Enterprise!
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

  return (
    <div className="space-y-8 max-w-container-max mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
            {t("navPayments")}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t("paymentsSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadPayments}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-variant transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t("refresh")}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-variant transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-on-surface-variant" />
            <span>{t("export")} CSV</span>
          </button>
        </div>
      </div>

      {/* Stats Grid (3 Bento Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Collected */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              {t("totalRevenue")}
            </span>
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="font-headline text-3xl font-bold text-on-surface">
            ${totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-secondary text-xs font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>{t("successfulTransactions")}</span>
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              {t("pendingPayments")}
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="font-headline text-3xl font-bold text-on-surface">
            ${outstandingTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-on-surface-variant text-xs">
            <span>{pendingCount} {t("pending")}</span>
          </div>
        </div>

        {/* Overdue Count */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm border-l-4 border-l-error hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-error">
              {t("failedPayments")}
            </span>
            <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="font-headline text-3xl font-bold text-error">
            {overdueCount}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-error text-xs font-semibold">
            <span>{overdueCount > 0 ? "Requires attention" : "All settled"}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-on-surface-variant/60"
            placeholder={`${t("search")}...`}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
        >
          <option value="ALL">{t("allStatuses")}</option>
          <option value="PAID">{t("paid")}</option>
          <option value="PENDING">{t("pending")}</option>
          <option value="PARTIAL">Partial</option>
          <option value="OVERDUE">Overdue</option>
        </select>

        {/* Clear Filter */}
        <button
          type="button"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("ALL");
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          {t("clearFilters")}
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">{t("savingChanges")}</p>
          </div>
        ) : paginatedPayments.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
              <Receipt className="w-7 h-7" />
            </div>
            <h4 className="font-headline font-bold text-lg text-on-surface">
              {t("noPaymentsRecorded")}
            </h4>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 leading-relaxed">
              {t("adjustFilter")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("member")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("amount")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("expiryDate")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("paymentDate")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("status")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right rtl:text-left">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {paginatedPayments.map((payment) => {
                  const member = payment.member;
                  const memberName = `${member?.firstName || ""} ${member?.lastName || ""}`.trim() || member?.userName || t("member");
                  const memberInitials = ((member?.firstName?.[0] || "") + (member?.lastName?.[0] || "")).toUpperCase() || "M";
                  const avatarUrl = member?.profileImageUrl || member?.photo;
                  const hasPhoto = avatarUrl && !avatarUrl.includes("default-");

                  const status = (payment.paymentStatus || "PAID").toUpperCase();
                  const isOverdue = status === "OVERDUE";

                  const dueDateStr = payment.dueDate
                    ? new Date(payment.dueDate).toLocaleDateString()
                    : "—";

                  const paidDateStr = payment.paidAt
                    ? new Date(payment.paidAt).toLocaleDateString()
                    : "—";

                  return (
                    <tr
                      key={payment.id}
                      onClick={() => setSelectedPayment(payment)}
                      className={`hover:bg-primary-container/[0.03] transition-colors cursor-pointer group ${
                        isOverdue ? "border-l-4 rtl:border-l-0 rtl:border-r-4 border-l-error rtl:border-r-error bg-error/[0.02]" : ""
                      }`}
                    >
                      {/* Member */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          {hasPhoto ? (
                            <img
                              className="w-10 h-10 rounded-full object-cover border border-outline-variant/60 shadow-xs"
                              alt={memberName}
                              src={avatarUrl!}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full primary-gradient text-white flex items-center justify-center font-bold text-xs select-none shadow-xs">
                              {memberInitials}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                              {memberName}
                            </div>
                            <div className="text-[11px] font-mono text-on-surface-variant">
                              #INV-{payment.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-headline text-sm font-bold text-on-surface">
                        ${Number(payment.amount).toFixed(2)}
                      </td>

                      {/* Due Date */}
                      <td
                        className={`px-6 py-4 text-xs font-semibold ${
                          isOverdue ? "text-error" : "text-on-surface-variant"
                        }`}
                      >
                        {dueDateStr}
                      </td>

                      {/* Paid Date */}
                      <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                        {paidDateStr}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border tracking-wider ${
                            status === "PAID"
                              ? "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30"
                              : status === "OVERDUE"
                              ? "bg-error-container/30 text-error border-error-container/40"
                              : status === "PARTIAL"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-surface-variant text-on-surface-variant border-outline-variant/40"
                          }`}
                        >
                          {status === "PAID" ? t("paid") : status === "PENDING" ? t("pending") : status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(payment);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-outline-variant/60 hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 ml-auto rtl:ml-0 rtl:mr-auto transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          <span>{t("details")}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredPayments.length > 0 && (
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-bright border-t border-outline-variant">
            <span className="text-xs text-on-surface-variant">
              {t("showing")}{" "}
              <span className="font-bold text-on-surface">
                {Math.min((currentPage - 1) * pageSize + 1, totalItems)} -{" "}
                {Math.min(currentPage * pageSize, totalItems)}
              </span>{" "}
              {t("of")} <span className="font-bold text-on-surface">{totalItems}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-on-surface rtl:rotate-180" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-primary text-white shadow-xs"
                        : "border border-outline-variant hover:bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-on-surface rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel (Payment Detail Slide-out Drawer) */}
      {selectedPayment && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedPayment(null)}
          />

          {/* Drawer Canvas */}
          <div className="fixed top-0 right-0 rtl:right-auto rtl:left-0 h-screen w-full sm:w-[440px] bg-surface-container-lowest border-l rtl:border-l-0 rtl:border-r border-outline-variant shadow-2xl z-50 flex flex-col animate-in slide-in-from-right rtl:slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/70">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="font-headline text-lg font-bold text-on-surface">
                  {t("details")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Member Summary */}
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedPayment.member?.profileImageUrl &&
                  !selectedPayment.member.profileImageUrl.includes("default-") ? (
                    <img
                      className="w-16 h-16 rounded-2xl object-cover border border-outline-variant shadow-sm"
                      alt={selectedPayment.member.firstName}
                      src={selectedPayment.member.profileImageUrl}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl primary-gradient text-white flex items-center justify-center font-bold text-xl select-none shadow-sm">
                      {((selectedPayment.member?.firstName?.[0] || "") +
                        (selectedPayment.member?.lastName?.[0] || "")).toUpperCase() || "M"}
                    </div>
                  )}
                  <div>
                    <h4 className="font-headline text-lg font-bold text-on-surface leading-tight">
                      {selectedPayment.member?.firstName}{" "}
                      {selectedPayment.member?.lastName}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {selectedPayment.member?.email}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-1 font-mono">
                      @{selectedPayment.member?.userName || "member"}
                    </p>
                  </div>
                </div>

                {/* Amount & Invoice Info Cards */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/60">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      {t("transactionId")}
                    </span>
                    <p className="font-mono text-xs font-bold text-on-surface mt-0.5">
                      #INV-{selectedPayment.id.slice(0, 8)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      {t("amount")}
                    </span>
                    <p className="font-headline text-base font-bold text-primary mt-0.5">
                      ${Number(selectedPayment.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </section>

              {/* Status Section */}
              <section className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  {t("status")}
                </label>
                <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/60 flex items-center justify-between">
                  <span className="text-xs font-medium text-on-surface">{t("status")}</span>
                  <span
                    className={`px-3 py-1 text-[11px] font-bold uppercase rounded-full border ${
                      (selectedPayment.paymentStatus || "").toUpperCase() === "PAID"
                        ? "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30"
                        : (selectedPayment.paymentStatus || "").toUpperCase() === "OVERDUE"
                        ? "bg-error-container/30 text-error border-error-container/40"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    {(selectedPayment.paymentStatus || "").toUpperCase() === "PAID" ? t("paid") : (selectedPayment.paymentStatus || "").toUpperCase() === "PENDING" ? t("pending") : selectedPayment.paymentStatus || t("paid")}
                  </span>
                </div>
              </section>

              {/* Plan & Duration Details */}
              {selectedPayment.member?.memberships?.[0] && (
                <section className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                    {t("planName")}
                  </label>
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">{t("planName")}</span>
                      <span className="font-bold text-on-surface">
                        {selectedPayment.member.memberships[0].membershipPlan?.planName ||
                          "Standard Plan"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">{t("status")}</span>
                      <span className="font-bold uppercase text-secondary">
                        {selectedPayment.member.memberships[0].membershipStatus || t("active")}
                      </span>
                    </div>
                    {selectedPayment.member.memberships[0].expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">{t("nextExpiry")}</span>
                        <span className="font-medium text-on-surface">
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
                <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("paymentHistory")}
                </h5>
                <div className="space-y-4 relative pl-6 rtl:pl-0 rtl:pr-6 border-l-2 rtl:border-l-0 rtl:border-r-2 border-outline-variant ml-2 rtl:ml-0 rtl:mr-2">
                  {/* Generated */}
                  <div className="relative">
                    <div className="absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shadow-xs">
                      <Receipt className="w-3 h-3" />
                    </div>
                    <div className="text-xs font-bold text-on-surface">
                      {t("invoicesRecorded")}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      {new Date(selectedPayment.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Due Date */}
                  {selectedPayment.dueDate && (
                    <div className="relative">
                      <div className="absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-0 w-5 h-5 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant">
                        <Calendar className="w-3 h-3" />
                      </div>
                      <div className="text-xs font-bold text-on-surface">
                        {t("expiryDate")}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {new Date(selectedPayment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* Settlement */}
                  <div className="relative">
                    <div
                      className={`absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-0 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-xs ${
                        (selectedPayment.paymentStatus || "").toUpperCase() === "PAID"
                          ? "bg-secondary"
                          : (selectedPayment.paymentStatus || "").toUpperCase() === "OVERDUE"
                          ? "bg-error"
                          : "bg-amber-500"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <div className="text-xs font-bold text-on-surface">
                      {(selectedPayment.paymentStatus || "").toUpperCase() === "PAID"
                        ? t("successfulTransactions")
                        : (selectedPayment.paymentStatus || "").toUpperCase() === "OVERDUE"
                        ? t("failedPayments")
                        : t("pendingPayments")}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      {selectedPayment.paidAt
                        ? new Date(selectedPayment.paidAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-outline-variant bg-surface-container-low/70 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleDownloadInvoice(selectedPayment)}
                className="w-full primary-gradient text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-primary/20 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>{t("export")} ({t("details")})</span>
              </button>

              <Link
                href={`/members/${selectedPayment.member?.id}`}
                className="w-full bg-surface-container-lowest hover:bg-surface-container border border-outline-variant text-on-surface py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
              >
                <User className="w-4 h-4 text-primary" />
                <span>{t("viewProfile")}</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
