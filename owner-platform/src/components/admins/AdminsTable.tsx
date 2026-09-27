"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Loader2,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { AdminUser, UserAccountStatus } from "@/types/admin";
import { cn } from "@/lib/utils";

export default function AdminsTable() {
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch gym owners from API
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{
        users: AdminUser[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>("/api/admins", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          verified: verifiedFilter !== "ALL" ? verifiedFilter : undefined,
        },
      });

      if (response.data && Array.isArray(response.data.users)) {
        setAdmins(response.data.users);
        setTotalAdmins(response.data.total ?? response.data.users.length);
        setTotalPages(
          response.data.totalPages ||
            Math.max(1, Math.ceil((response.data.total ?? response.data.users.length) / itemsPerPage))
        );
      } else if (Array.isArray(response.data)) {
        setAdmins(response.data);
        setTotalAdmins(response.data.length);
        setTotalPages(Math.max(1, Math.ceil(response.data.length / itemsPerPage)));
      } else {
        setAdmins([]);
        setTotalAdmins(0);
        setTotalPages(1);
      }
    } catch (err: unknown) {
      console.error("Failed to load gym owners:", err);
      setError("Unable to load gym owners. Please check your backend connection.");
      toast.error("Failed to load gym owners from backend");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, verifiedFilter]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Handle status update (active, pending, ban)
  const handleUpdateStatus = async (
    e: React.MouseEvent,
    userId: string,
    action: "active" | "pending" | "ban",
    userName: string
  ) => {
    e.stopPropagation();

    if (action === "ban") {
      const confirmBan = window.confirm(
        `Are you sure you want to suspend/ban ${userName}'s account?`
      );
      if (!confirmBan) return;
    }

    setUpdatingUserId(`${userId}-${action}`);
    try {
      await api.patch(`/api/admins/${action}/${userId}`);

      const newStatus: UserAccountStatus =
        action === "active" ? "ACTIVE" : action === "pending" ? "PENDING" : "BANNED";

      setAdmins((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, accountStatus: newStatus } : u))
      );

      toast.success(`Account for ${userName} is now ${newStatus}`);
    } catch (err: unknown) {
      console.error(`Failed to set user to ${action}:`, err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        `Failed to set user account to ${action}.`;
      toast.error(msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRowClick = (adminId: string) => {
    router.push(`/admins/${adminId}`);
  };

  const handleAddAdmin = () => {
    toast.info("Create Gym Owner form dialog opening...");
  };

  return (
    <div className="relative">
      {/* Header & Action Bar */}
      <div className="flex flex-col gap-layout-margin mb-layout-margin">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Gym Owners</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Manage and monitor all gymnasium owner accounts across the platform.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAdmins}
            disabled={loading}
            className="flex items-center gap-element-gap px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded-md text-on-surface hover:border-primary transition-colors text-body-sm cursor-pointer disabled:opacity-50"
            title="Refresh gym owners list"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between bg-surface-container p-unit border border-outline-variant rounded-lg gap-2">
          <div className="flex items-center flex-1 min-w-[260px] max-w-xl px-container-padding gap-element-gap">
            <Search className="size-5 text-on-surface-variant shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search gym owners by name, email, company, or phone..."
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-body-md w-full placeholder:text-on-surface-variant/50 text-on-surface"
            />
          </div>

          <div className="flex items-center gap-3 px-container-padding border-t sm:border-t-0 sm:border-l border-outline-variant pt-2 sm:pt-0">
            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <span className="text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">
                STATUS
              </span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-surface-container-high border border-outline-variant text-body-sm py-1 px-2 rounded focus:border-primary outline-none text-on-surface cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BANNED">Banned</option>
              </select>
            </div>

            {/* Filter by Verified */}
            <div className="flex items-center gap-2 border-l border-outline-variant pl-3">
              <span className="text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">
                VERIFIED
              </span>
              <select
                value={verifiedFilter}
                onChange={(e) => {
                  setVerifiedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-surface-container-high border border-outline-variant text-body-sm py-1 px-2 rounded focus:border-primary outline-none text-on-surface cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="VERIFIED">Verified</option>
                <option value="UNVERIFIED">Unverified</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="overflow-x-auto border border-outline-variant rounded-lg bg-surface shadow-sm">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="bg-surface-container-high text-label-caps text-on-surface-variant border-b border-outline-variant">
              <th className="px-container-padding py-3 font-bold uppercase tracking-wider">
                NAME
              </th>
              <th className="px-container-padding py-3 font-bold uppercase tracking-wider">
                EMAIL
              </th>
              <th className="px-container-padding py-3 font-bold uppercase tracking-wider">
                COMPANY NAME
              </th>
              <th className="px-container-padding py-3 font-bold text-center uppercase tracking-wider">
                ACCOUNT VERIFIED
              </th>
              <th className="px-container-padding py-3 font-bold uppercase tracking-wider">
                STATUS & ACTIONS
              </th>
              <th className="px-container-padding py-3 font-bold uppercase tracking-wider">
                PHONE NUMBER
              </th>
              <th className="px-container-padding py-3 font-bold text-right uppercase tracking-wider">
                DETAILS
              </th>
            </tr>
          </thead>
          <tbody className="text-body-sm divide-y divide-outline-variant/30">
            {loading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-container-padding h-row-height-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-surface-container-high rounded w-28" />
                        <div className="h-2.5 bg-surface-container-high rounded w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="px-container-padding h-row-height-md">
                    <div className="h-3 bg-surface-container-high rounded w-36" />
                  </td>
                  <td className="px-container-padding h-row-height-md">
                    <div className="h-3 bg-surface-container-high rounded w-24" />
                  </td>
                  <td className="px-container-padding h-row-height-md text-center">
                    <div className="h-5 bg-surface-container-high rounded-full w-20 mx-auto" />
                  </td>
                  <td className="px-container-padding h-row-height-md">
                    <div className="h-5 bg-surface-container-high rounded w-32" />
                  </td>
                  <td className="px-container-padding h-row-height-md">
                    <div className="h-3 bg-surface-container-high rounded w-28" />
                  </td>
                  <td className="px-container-padding h-row-height-md text-right">
                    <div className="h-6 bg-surface-container-high rounded w-6 ml-auto" />
                  </td>
                </tr>
              ))
            ) : error ? (
              // Error state
              <tr>
                <td colSpan={7} className="px-container-padding py-12 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                    <XCircle className="size-8 text-error" />
                    <p className="font-body-md text-on-surface">{error}</p>
                    <button
                      type="button"
                      onClick={fetchAdmins}
                      className="px-4 py-1.5 bg-primary text-on-primary rounded text-body-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                </td>
              </tr>
            ) : admins.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={7} className="px-container-padding py-12 text-center text-on-surface-variant">
                  <div className="max-w-md mx-auto flex flex-col items-center gap-2">
                    <ShieldCheck className="size-8 text-on-surface-variant/40" />
                    <p className="font-body-md text-on-surface">No gym owners found</p>
                    <p className="text-body-sm text-on-surface-variant">
                      No gymnasium owner accounts match your current filter or search criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Live Data Rows
              admins.map((admin) => {
                const displayName =
                  `${admin.firstName || ""} ${admin.lastName || ""}`.trim() ||
                  admin.userName ||
                  "Owner";
                const initials =
                  (
                    (admin.firstName?.[0] || "") + (admin.lastName?.[0] || "")
                  ).toUpperCase() || (admin.userName?.[0] || "O").toUpperCase();

                const isCurrentUpdating = updatingUserId?.startsWith(admin.id);

                return (
                  <tr
                    key={admin.id}
                    onClick={() => handleRowClick(admin.id)}
                    className="data-grid-row hover:bg-surface-container-highest transition-colors cursor-pointer group"
                    title={`Click to view details for ${displayName}`}
                  >
                    {/* NAME */}
                    <td className="px-container-padding h-row-height-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container font-bold text-xs flex items-center justify-center shrink-0 border border-outline-variant/60">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-primary group-hover:underline">
                            {displayName}
                          </span>
                          {admin.userName && (
                            <span className="text-[11px] text-on-surface-variant font-mono-data">
                              @{admin.userName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td className="px-container-padding h-row-height-md text-on-surface-variant font-mono-data">
                      <div className="flex items-center gap-1.5">
                        <Mail className="size-3.5 text-on-surface-variant/60 shrink-0" />
                        <span>{admin.email}</span>
                      </div>
                    </td>

                    {/* COMPANY NAME */}
                    <td className="px-container-padding h-row-height-md text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-on-surface-variant/60 shrink-0" />
                        <span className="font-medium">{admin.companyName || "—"}</span>
                      </div>
                    </td>

                    {/* ACCOUNT VERIFIED */}
                    <td className="px-container-padding h-row-height-md text-center">
                      {renderVerifiedBadge(admin.isAccountVerified)}
                    </td>

                    {/* STATUS & ACTIONS */}
                    <td
                      className="px-container-padding h-row-height-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        {renderStatusBadge(admin.accountStatus)}

                        <div className="flex items-center gap-1 border-l border-outline-variant/40 pl-2">
                          {/* Activate Button: visible when not active */}
                          {admin.accountStatus !== "ACTIVE" && (
                            <button
                              type="button"
                              disabled={isCurrentUpdating}
                              onClick={(e) => handleUpdateStatus(e, admin.id, "active", displayName)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Set status to ACTIVE"
                            >
                              {updatingUserId === `${admin.id}-active` ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-3" />
                              )}
                              <span>Active</span>
                            </button>
                          )}

                          {/* Pending Button: visible when active */}
                          {admin.accountStatus === "ACTIVE" && (
                            <button
                              type="button"
                              disabled={isCurrentUpdating}
                              onClick={(e) => handleUpdateStatus(e, admin.id, "pending", displayName)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Set status to PENDING"
                            >
                              {updatingUserId === `${admin.id}-pending` ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Clock className="size-3" />
                              )}
                              <span>Pending</span>
                            </button>
                          )}

                          {/* Ban Button: visible when active */}
                          {admin.accountStatus === "ACTIVE" && (
                            <button
                              type="button"
                              disabled={isCurrentUpdating}
                              onClick={(e) => handleUpdateStatus(e, admin.id, "ban", displayName)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Set status to BANNED"
                            >
                              {updatingUserId === `${admin.id}-ban` ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Ban className="size-3" />
                              )}
                              <span>Ban</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* PHONE NUMBER */}
                    <td className="px-container-padding h-row-height-md font-mono-data text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-on-surface-variant/60 shrink-0" />
                        <span>{admin.phoneNumber || "—"}</span>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-container-padding h-row-height-md text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(admin.id);
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant group-hover:text-primary transition-colors cursor-pointer border border-transparent hover:border-outline-variant"
                        aria-label={`View details for ${displayName}`}
                        title="View gym owner details"
                      >
                        <ChevronRight className="size-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {!loading && totalAdmins > 0 && (
        <div className="mt-layout-margin flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-body-sm text-on-surface-variant font-mono-data">
              Showing {totalAdmins === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
              {Math.min(totalAdmins, currentPage * itemsPerPage)} of {totalAdmins} gym owners
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
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 px-3 bg-surface-container-high border border-outline-variant text-on-surface-variant text-body-sm rounded hover:text-primary transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center text-body-sm rounded cursor-pointer transition-colors font-mono-data",
                    currentPage === pageNum
                      ? "bg-primary text-on-primary font-bold"
                      : "hover:bg-surface-container-high text-on-surface"
                  )}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 px-3 bg-surface-container-high border border-outline-variant text-on-surface-variant text-body-sm rounded hover:text-primary transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (Add Gym Owner) */}
      <button
        type="button"
        onClick={handleAddAdmin}
        aria-label="Create New Gym Owner"
        className="fixed bottom-layout-margin right-layout-margin w-12 h-12 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 cursor-pointer border-none"
      >
        <UserPlus className="size-5" />
      </button>
    </div>
  );
}

function renderStatusBadge(status?: UserAccountStatus) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          ACTIVE
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          PENDING
        </span>
      );
    case "INACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-full text-[10px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          INACTIVE
        </span>
      );
    case "BANNED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          BANNED
        </span>
      );
    default:
      return null;
  }
}

function renderVerifiedBadge(isVerified: boolean) {
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold tracking-wider">
        <CheckCircle2 className="size-3 text-emerald-400" />
        VERIFIED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold tracking-wider">
      <XCircle className="size-3 text-amber-400" />
      UNVERIFIED
    </span>
  );
}
