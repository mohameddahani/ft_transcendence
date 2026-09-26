"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Loader2,
  Calendar,
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Ban,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { Subscription, SubscriptionStatus } from "@/types/subscription";
import ActivateSubscriptionModal from "./ActivateSubscriptionModal";

export default function SubscriptionsTable() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState<boolean>(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("latest-start");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalSubscriptions, setTotalSubscriptions] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Cancellation Confirmation Dialog
  const [subToCancel, setSubToCancel] = useState<Subscription | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Fetch subscriptions from API
  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{
        subscriptions: Subscription[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>("/api/subscriptions", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          sortBy: sortBy || undefined,
        },
      });

      const list = res.data?.subscriptions || [];
      setSubscriptions(list);
      setTotalSubscriptions(res.data?.total ?? list.length);
      setTotalPages(
        res.data?.totalPages ||
          Math.max(1, Math.ceil((res.data?.total ?? list.length) / itemsPerPage))
      );
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
      toast.error("Failed to load platform subscriptions");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Handle Cancel Subscription
  const handleConfirmCancel = async () => {
    if (!subToCancel) return;
    try {
      setIsCancelling(true);
      await api.patch("/api/subscriptions", {
        adminId: subToCancel.userId,
      });

      toast.success(
        `Subscription for ${subToCancel.user?.companyName || subToCancel.user?.userName || "Admin"} has been cancelled.`
      );

      // Optimistically update status in state
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === subToCancel.id ? { ...s, subscriptionStatus: "CANCELLED" } : s
        )
      );
      setSubToCancel(null);
    } catch (err: unknown) {
      console.error("Failed to cancel subscription:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to cancel subscription";
      toast.error(errorMsg);
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      return d.toISOString().split("T")[0];
    } catch {
      return dateString;
    }
  };

  const isExpired = (expiresAt: string, status: SubscriptionStatus) => {
    if (status === "EXPIRED") return true;
    try {
      return new Date(expiresAt).getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-label-caps text-label-caps font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            ACTIVE
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-label-caps text-label-caps font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            PENDING
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 bg-error/10 text-error border border-error/20 px-2.5 py-0.5 rounded-full font-label-caps text-label-caps font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            EXPIRED
          </span>
        );
      case "CANCELLED":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-secondary-container/60 text-on-surface-variant border border-outline-variant px-2.5 py-0.5 rounded-full font-label-caps text-label-caps font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-outline" />
            CANCELLED
          </span>
        );
    }
  };

  return (
    <div className="space-y-layout-margin animate-in fade-in duration-200">
      {/* Page Header & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
            Platform Subscriptions
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-unit">
            Oversee and manage enterprise-level licenses and service levels.
          </p>
        </div>
        <button
          onClick={() => setIsActivateModalOpen(true)}
          className="bg-primary text-on-primary px-layout-margin py-unit h-row-height-md flex items-center gap-element-gap font-headline-sm text-headline-sm rounded hover:brightness-110 active:opacity-80 transition-all shadow-md cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span>Activate Subscription</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container border border-outline-variant p-container-padding flex flex-col md:flex-row gap-4 items-stretch md:items-center rounded-lg">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/60" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Company or Admin ID..."
            type="text"
            className="w-full bg-surface-container-high border border-outline-variant rounded-lg pl-9 pr-3 py-1.5 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-element-gap">
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider whitespace-nowrap">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface-container-high border border-outline-variant rounded px-container-padding py-1.5 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="flex items-center gap-element-gap">
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider whitespace-nowrap">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface-container-high border border-outline-variant rounded px-container-padding py-1.5 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="latest-start">Latest Start</option>
            <option value="renewal-date">Renewal Date</option>
            <option value="company-az">Company A-Z</option>
          </select>
        </div>
      </div>

      {/* Data Grid / Table */}
      <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-container-padding py-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Admin / Company
                </th>
                <th className="px-container-padding py-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-container-padding py-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-container-padding py-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-container-padding py-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Renewal Date
                </th>
                <th className="px-container-padding py-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="font-body-md text-body-md">Loading subscriptions...</span>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Building2 className="size-10 text-on-surface-variant/40" />
                      <div className="max-w-md">
                        <p className="font-headline-sm text-on-surface font-semibold">
                          No subscriptions found
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          {searchQuery || statusFilter !== "ALL"
                            ? "Try adjusting your search criteria or filter options."
                            : "Click 'Activate Subscription' above to provision your first gym license."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub, idx) => {
                  const expired = isExpired(sub.expiresAt, sub.subscriptionStatus);
                  const isEven = idx % 2 === 1;

                  return (
                    <tr
                      key={sub.id}
                      className={`h-row-height-md transition-colors hover:bg-surface-container-high ${
                        isEven ? "bg-[#1c1b1b]" : "bg-surface"
                      }`}
                    >
                      {/* Admin / Company */}
                      <td className="px-container-padding py-2">
                        <div className="flex flex-col">
                          <Link
                            href={`/admins/${sub.userId}`}
                            className="font-body-md font-bold text-on-surface hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            <span>{sub.user?.companyName || "Independent Club"}</span>
                            <ExternalLink className="size-3 opacity-40 hover:opacity-100" />
                          </Link>
                          <span className="font-mono-data text-body-sm text-on-surface-variant">
                            @{sub.user?.userName || sub.userId.slice(0, 8)}
                          </span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-container-padding py-2 font-body-md">
                        <div className="flex flex-col">
                          <span className="font-medium text-on-surface">
                            {sub.plan?.planName || "Custom Plan"}
                          </span>
                          {sub.planDuration && (
                            <span className="text-[11px] text-on-surface-variant font-mono-data">
                              {sub.planDuration.durationDays} Days · ${Number(sub.amount).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-container-padding py-2 text-center">
                        {getStatusBadge(sub.subscriptionStatus)}
                      </td>

                      {/* Start Date */}
                      <td className="px-container-padding py-2 font-mono-data text-on-surface-variant text-body-sm">
                        {formatDate(sub.startedAt)}
                      </td>

                      {/* Renewal Date */}
                      <td
                        className={`px-container-padding py-2 font-mono-data text-body-sm ${
                          expired ? "text-error font-semibold" : "text-on-surface"
                        }`}
                      >
                        {formatDate(sub.expiresAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-container-padding py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {sub.subscriptionStatus === "ACTIVE" && (
                            <button
                              onClick={() => setSubToCancel(sub)}
                              title="Cancel Subscription"
                              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Ban className="size-3" />
                              <span>Cancel</span>
                            </button>
                          )}
                          <Link
                            href={`/admins/${sub.userId}`}
                            title="View Owner Details"
                            className="text-xs text-on-surface-variant hover:text-primary bg-surface-container-high hover:bg-surface-variant border border-outline-variant px-2.5 py-1 rounded transition-colors"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-surface-container border-t border-outline-variant px-layout-margin py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="font-body-sm text-body-sm text-on-surface-variant font-mono-data">
              Showing{" "}
              {totalSubscriptions === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}{" "}
              to{" "}
              {Math.min(currentPage * itemsPerPage, totalSubscriptions)} of{" "}
              {totalSubscriptions} subscriptions
            </span>

            {/* Per-Page Limit Selector */}
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-surface-container-high border border-outline-variant text-on-surface text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value={2}>2</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-element-gap">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded font-mono-data text-body-sm transition-colors cursor-pointer ${
                    currentPage === page
                      ? "bg-primary text-on-primary font-bold"
                      : "hover:bg-surface-container-high text-on-surface"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Activate Subscription Modal */}
      <ActivateSubscriptionModal
        isOpen={isActivateModalOpen}
        onClose={() => setIsActivateModalOpen(false)}
        onSuccess={fetchSubscriptions}
      />

      {/* Cancel Confirmation Dialog */}
      {subToCancel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm p-layout-margin"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCancelling) setSubToCancel(null);
          }}
        >
          <div className="bg-surface-container-high border border-outline-variant w-full max-w-md shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-container-padding border-b border-outline-variant flex items-center gap-2 bg-surface-container-highest">
              <AlertTriangle className="size-5 text-red-400" />
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Cancel Subscription
              </h3>
            </div>
            <div className="p-layout-margin space-y-3">
              <p className="font-body-md text-on-surface">
                Are you sure you want to cancel the active subscription for:
              </p>
              <div className="bg-surface-container p-3 rounded border border-outline-variant">
                <p className="font-bold text-on-surface">
                  {subToCancel.user?.companyName || "Gym"}
                </p>
                <p className="text-sm font-mono-data text-on-surface-variant">
                  @{subToCancel.user?.userName || subToCancel.userId}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Plan: {subToCancel.plan?.planName}
                </p>
              </div>
              <p className="font-body-sm text-body-sm text-red-400">
                This will revoke subscription access immediately. This action cannot be undone.
              </p>
            </div>
            <div className="p-container-padding bg-surface-container-highest border-t border-outline-variant flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSubToCancel(null)}
                disabled={isCancelling}
                className="px-3 py-1.5 rounded font-body-md text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="bg-error text-on-error px-4 py-1.5 rounded font-headline-sm text-headline-sm hover:brightness-110 active:opacity-80 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCancelling && <Loader2 className="size-4 animate-spin" />}
                <span>{isCancelling ? "Cancelling..." : "Confirm Cancellation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

