"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  Download,
  MoreVertical,
  Users,
  UserPlus,
  Loader2,
  RefreshCw,
  Eye,
  Edit,
  ShieldCheck,
  Clock,
  Ban,
  UserCheck,
  X,
  UserX,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  fetchStaffs,
  activeStaff,
  pendingStaff,
  banStaff,
} from "@/lib/api/staffs";
import { BackendStaff } from "@/types/staff";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTranslation } from "react-i18next";
import AddStaffModal from "@/components/staffs/AddStaffModal";
import EditStaffModal from "@/components/staffs/EditStaffModal";
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

export default function StaffsPage() {
  const { t } = useTranslation();
  const { companyName } = useCurrentUser();
  const [staffs, setStaffs] = useState<BackendStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<BackendStaff | null>(null);

  // Portal Action Menu anchor state
  const [mounted, setMounted] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    staff: BackendStaff;
    top: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchStaffs(1, 100);
      setStaffs(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("loadStaffFailed") || "Failed to load staff roster from server");
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close portal action menu on outside click, window resize, scroll, or Escape key
  useEffect(() => {
    if (!menuAnchor) return;

    const handleScrollOrClick = (e: MouseEvent | Event) => {
      const target = e.target as HTMLElement | null;
      if (e.type === "click" && target?.closest?.("[data-portal-menu]")) {
        return;
      }
      setMenuAnchor(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuAnchor(null);
      }
    };

    window.addEventListener("click", handleScrollOrClick);
    window.addEventListener("scroll", handleScrollOrClick, true);
    window.addEventListener("resize", handleScrollOrClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", handleScrollOrClick);
      window.removeEventListener("scroll", handleScrollOrClick, true);
      window.removeEventListener("resize", handleScrollOrClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuAnchor]);

  // Statistics calculation
  const totalCount = staffs.length;
  const activeCount = staffs.filter(
    (s) => (s.accountStatus || "ACTIVE").toUpperCase() === "ACTIVE"
  ).length;
  const pendingCount = staffs.filter(
    (s) => (s.accountStatus || "").toUpperCase() === "PENDING"
  ).length;
  const bannedCount = staffs.filter(
    (s) => (s.accountStatus || "").toUpperCase() === "BANNED"
  ).length;

  const activePercent =
    totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
  const pendingPercent =
    totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  const bannedPercent =
    totalCount > 0 ? Math.round((bannedCount / totalCount) * 100) : 0;

  // Filtered staffs
  const isFiltering = Boolean(searchTerm || selectedStatus);
  const filteredStaffs = useMemo(() => {
    return staffs.filter((staff) => {
      const fullName = `${staff.firstName || ""} ${staff.lastName || ""}`.toLowerCase();
      const email = (staff.email || "").toLowerCase();
      const username = (staff.userName || "").toLowerCase();
      const phone = (staff.phoneNumber || "").toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        fullName.includes(query) ||
        email.includes(query) ||
        username.includes(query) ||
        phone.includes(query);

      const currentStatus = (staff.accountStatus || "ACTIVE").toUpperCase();
      const matchesStatus = !selectedStatus || currentStatus === selectedStatus.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [staffs, searchTerm, selectedStatus]);

  // Paginated staffs
  const totalItems = filteredStaffs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedStaffs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaffs.slice(start, start + pageSize);
  }, [filteredStaffs, currentPage, pageSize]);

  // Status Action Handlers
  const handleMakeActive = async (staff: BackendStaff) => {
    setMenuAnchor(null);
    try {
      await activeStaff(staff.id);
      toast.success(
        t("staffActivatedSuccess", {
          name: `${staff.firstName} ${staff.lastName}`,
          defaultValue: `Staff member "${staff.firstName} ${staff.lastName}" is now Active!`,
        })
      );
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("activateStaffFailed") || "Failed to activate staff member");
      }
    }
  };

  const handleMakePending = async (staff: BackendStaff) => {
    setMenuAnchor(null);
    try {
      await pendingStaff(staff.id);
      toast.info(
        t("staffPendingSuccess", {
          name: `${staff.firstName} ${staff.lastName}`,
          defaultValue: `Staff member "${staff.firstName} ${staff.lastName}" status changed to Pending.`,
        })
      );
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("pendingStaffFailed") || "Failed to set staff member to pending");
      }
    }
  };

  const handleBan = async (staff: BackendStaff) => {
    setMenuAnchor(null);
    try {
      await banStaff(staff.id);
      toast.error(
        t("staffBannedSuccess", {
          name: `${staff.firstName} ${staff.lastName}`,
          defaultValue: `Staff member "${staff.firstName} ${staff.lastName}" has been Banned.`,
        })
      );
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("banStaffFailed") || "Failed to ban staff member");
      }
    }
  };

  const handleOpenEdit = (staff: BackendStaff) => {
    setMenuAnchor(null);
    setStaffToEdit(staff);
    setIsEditModalOpen(true);
  };

  const handleToggleMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    staff: BackendStaff
  ) => {
    e.stopPropagation();
    if (menuAnchor?.staff.id === staff.id) {
      setMenuAnchor(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setMenuAnchor({
      staff,
      top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      right: Math.max(16, window.innerWidth - rect.right),
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredStaffs.length === 0) {
      toast.info(t("noStaffToExport") || "No staff records available to export.");
      return;
    }

    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Username",
      "Email",
      "Phone",
      "Gender",
      "Status",
      "Role",
      "Created At",
    ];

    const rows = filteredStaffs.map((s) => [
      s.id,
      s.firstName || "",
      s.lastName || "",
      s.userName || "",
      s.email || "",
      s.phoneNumber || "",
      s.gender || "",
      s.accountStatus || "ACTIVE",
      s.role || "STAFF",
      s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `staffs_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t("staffExportSuccess") || "Staff list exported successfully to CSV!");
  };

  const getInitials = (
    firstName?: string | null,
    lastName?: string | null,
    userName?: string | null
  ) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    if (first || last) return (first + last).toUpperCase();
    if (userName) return userName.slice(0, 2).toUpperCase();
    return "S";
  };

  const renderStaffStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{t("active") || "Active"}</span>
        </span>
      );
    }

    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{t("pending") || "Pending"}</span>
        </span>
      );
    }

    if (s === "BANNED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
          <span>{t("banned") || "Banned"}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
        <span>{status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : ""}</span>
      </span>
    );
  };

  const renderStaffRoleBadge = (role: string) => {
    const r = (role || "").toUpperCase();
    const isStaff = r === "STAFF";
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400">
        <UserCheck className="size-3 text-zinc-500 shrink-0" />
        <span>{isStaff ? (t("staff") || "Staff") : (t("admin") || "Admin")}</span>
      </span>
    );
  };

  const gymFacilityName =
    companyName ||
    staffs[0]?.companyName ||
    staffs[0]?.admin?.companyName ||
    "";

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Top Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("staffManagement") || "Staff Management"}
              </h1>
              {gymFacilityName && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {gymFacilityName}
                </span>
              )}
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {totalCount} {t("total") || "total"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t("staffSubtitle") ||
                "Manage gym staff, assign operational roles, and oversee staff roster."}
            </p>
          </div>

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
              <span>{t("export") || "Export"} CSV</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer"
            >
              <UserPlus className="size-4 me-1.5" />
              <span>{t("addNewStaff") || "Add New Staff"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Live Operational Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Staff */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalStaff") || "Total Staff"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <Users className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-ink" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {totalCount}
                </span>
              )}
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                {t("liveFromApi", "Live")}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("registeredStaff", "Registered facility staff")}
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Active Staff */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalActiveStaff", "Active Staff")}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-green">
              <ShieldCheck className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-green" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {activeCount}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{totalCount > 0 ? `${activePercent}%` : "—"}</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("activeStaffDesc", "On-duty and verified staff")}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-green transition-all"
                style={{ width: `${Math.min(100, Math.max(0, activePercent))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Pending Approval */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("pendingApproval", "Pending Staff")}
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
                  {pendingCount}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{totalCount > 0 ? `${pendingPercent}%` : "—"}</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("pendingStaffDesc", "Awaiting credentials review")}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, pendingPercent))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Banned Staff */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("bannedStaff", "Banned Staff")}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-red">
              <UserX className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-toota-red" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-toota-ink">
                  {bannedCount}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{totalCount > 0 ? `${bannedPercent}%` : "—"}</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("bannedStaffDesc", "Revoked facility access")}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-red transition-all"
                style={{ width: `${Math.min(100, Math.max(0, bannedPercent))}%` }}
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
              placeholder={`${t("searchStaffPlaceholder") || "Search staff by name, email, username, or phone..."}`}
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
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(String(val));
                setCurrentPage(1);
              }}
              aria-label={t("status") || "Status"}
              placeholder={t("allStatuses") || "All Statuses"}
              options={[
                { value: "", label: t("allStatuses") || "All Statuses" },
                { value: "ACTIVE", label: t("active") || "Active" },
                { value: "PENDING", label: t("pending") || "Pending" },
                { value: "BANNED", label: t("banned") || "Banned" },
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
              setSelectedStatus("");
              setCurrentPage(1);
            }}
            className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 w-full md:w-auto"
          >
            <X className="size-3.5 me-1.5" />
            <span>{t("clearFilters") || "Clear Filters"}</span>
          </Button>
        </div>
      </Card>

      {/* Staff Ledger Table Card */}
      <Card className="toota-card border-none p-0 overflow-hidden">
        <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-border/40 flex-wrap gap-3">
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("staffManagement") || "Staff Roster"}
            </CardTitle>
            <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
              / {totalItems} {isFiltering ? (t("filtered") || "filtered") : (t("total") || "total")}
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
          {/* Global Loading State */}
          {isLoading && (
            <div className="py-20 text-center text-toota-muted flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-toota-ink" />
              <p className="text-xs">{t("loadingStaff") || "Loading staff roster..."}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && paginatedStaffs.length === 0 && (
            <div className="py-20 text-center px-4">
              <div className="size-14 rounded-full bg-toota-inner flex items-center justify-center mx-auto mb-3 text-toota-muted">
                <Users className="size-7" />
              </div>
              <h4 className="font-medium text-base text-toota-ink">
                {staffs.length === 0
                  ? t("noStaffYet") || "No staff members recorded yet"
                  : t("noMatchingStaff") || "No staff matching your search filter"}
              </h4>
              <p className="text-xs text-toota-muted max-w-sm mx-auto mt-1 leading-relaxed">
                {staffs.length === 0
                  ? t("clickAddStaff") || "Click 'Add New Staff' to invite team members."
                  : t("adjustFilter") || "Try adjusting your search query or status filter."}
              </p>
              {staffs.length === 0 && (
                <Button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer mt-4"
                >
                  <UserPlus className="size-4 me-1.5" />
                  <span>{t("addFirstStaff") || "Add First Staff"}</span>
                </Button>
              )}
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && paginatedStaffs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent text-[11px] font-semibold text-toota-muted uppercase tracking-wider bg-black/[0.02] dark:bg-white/[0.02]">
                  <TableHead className="px-6 py-3.5">
                    {t("staffMember") || "Staff Member"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("roleText") || "Role"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("status") || "Status"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("phone") || "Phone"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("gender") || "Gender"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("joinedDate") || "Joined Date"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5 text-right rtl:text-left">
                    {t("actions") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40 text-xs">
                {paginatedStaffs.map((staff) => {
                  const staffName =
                    `${staff.firstName || ""} ${staff.lastName || ""}`.trim() ||
                    staff.userName ||
                    "Staff Member";
                  const staffInitials = getInitials(
                    staff.firstName,
                    staff.lastName,
                    staff.userName
                  );
                  const isPlaceholder =
                    !staff.profileImageUrl ||
                    staff.profileImageUrl === "default-image.jpg" ||
                    staff.profileImageUrl === "default-member-image.jpg";
                  const avatarUrl = !isPlaceholder ? staff.profileImageUrl : null;

                  const status = (staff.accountStatus || "ACTIVE").toUpperCase();
                  const joinDate = staff.createdAt
                    ? new Date(staff.createdAt).toLocaleDateString()
                    : "—";

                  const isMenuOpen = menuAnchor?.staff.id === staff.id;

                  return (
                    <TableRow
                      key={staff.id}
                      className="border-border/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Staff Member Info */}
                      <TableCell className="px-6 py-3.5">
                        <Link
                          href={`/staffs/${staff.id}`}
                          className="flex items-center gap-3 group-hover:opacity-90"
                        >
                          <Avatar className="size-9 ring-1 ring-border/40 shrink-0">
                            {avatarUrl && (
                              <AvatarImage
                                src={avatarUrl}
                                alt={staffName}
                              />
                            )}
                            <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                              {staffInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-toota-ink group-hover:underline truncate">
                              {staffName}
                            </p>
                            <p className="text-[11px] text-toota-muted truncate">
                              {staff.userName ? `@${staff.userName} · ` : ""}
                              {staff.email}
                            </p>
                          </div>
                        </Link>
                      </TableCell>

                      {/* Role */}
                      <TableCell className="px-6 py-3.5">
                        {renderStaffRoleBadge(staff.role)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-6 py-3.5">
                        {renderStaffStatusBadge(status)}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="px-6 py-3.5 font-mono text-toota-muted">
                        {staff.phoneNumber || "—"}
                      </TableCell>

                      {/* Gender */}
                      <TableCell className="px-6 py-3.5 text-toota-muted">
                        {staff.gender === "MALE"
                          ? t("male") || "Male"
                          : staff.gender === "FEMALE"
                          ? t("female") || "Female"
                          : staff.gender || "—"}
                      </TableCell>

                      {/* Join Date */}
                      <TableCell className="px-6 py-3.5 text-toota-muted">
                        {joinDate}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-6 py-3.5 text-right rtl:text-left">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleToggleMenu(e, staff)}
                          className={`size-8 rounded-lg transition-colors cursor-pointer ${
                            isMenuOpen
                              ? "bg-toota-inner text-toota-ink"
                              : "text-toota-muted hover:text-toota-ink hover:bg-toota-inner"
                          }`}
                          title={t("staffOptions") || "Staff options"}
                        >
                          <MoreVertical className="size-4" />
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
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            itemLabel={t("staff") || "staff"}
          />
        )}
      </Card>

      {/* Modals */}
      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
      />

      <EditStaffModal
        staff={staffToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setStaffToEdit(null);
        }}
        onSuccess={loadData}
      />

      {/* Portal Action Menu (Fixed position, high z-index to avoid table boundary clipping) */}
      {mounted && menuAnchor && createPortal(
        <div
          data-portal-menu
          style={{
            position: "fixed",
            top: menuAnchor.top,
            right: menuAnchor.right,
            zIndex: 99999,
          }}
          className="w-48 bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl py-1 text-left rtl:text-right animate-in fade-in zoom-in-95 duration-150"
        >
          <Link
            href={`/staffs/${menuAnchor.staff.id}`}
            onClick={() => setMenuAnchor(null)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-toota-ink hover:bg-toota-inner transition-colors"
          >
            <Eye className="size-3.5 text-toota-muted" />
            <span>{t("viewProfile") || "View Profile"}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              const s = menuAnchor.staff;
              setMenuAnchor(null);
              handleOpenEdit(s);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer text-left rtl:text-right"
          >
            <Edit className="size-3.5 text-toota-muted" />
            <span>{t("editDetails") || "Edit Details"}</span>
          </button>

          <div className="h-[1px] bg-border/40 my-1" />

          {(menuAnchor.staff.accountStatus || "ACTIVE").toUpperCase() !== "ACTIVE" && (
            <button
              type="button"
              onClick={() => {
                const s = menuAnchor.staff;
                setMenuAnchor(null);
                handleMakeActive(s);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left rtl:text-right"
            >
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>{t("activateStaff") || "Activate Staff"}</span>
            </button>
          )}

          {(menuAnchor.staff.accountStatus || "").toUpperCase() !== "PENDING" && (
            <button
              type="button"
              onClick={() => {
                const s = menuAnchor.staff;
                setMenuAnchor(null);
                handleMakePending(s);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer text-left rtl:text-right"
            >
              <Clock className="size-3.5 text-amber-500" />
              <span>{t("setToPending") || "Set to Pending"}</span>
            </button>
          )}

          {(menuAnchor.staff.accountStatus || "").toUpperCase() !== "BANNED" && (
            <button
              type="button"
              onClick={() => {
                const s = menuAnchor.staff;
                setMenuAnchor(null);
                handleBan(s);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left rtl:text-right"
            >
              <Ban className="size-3.5 text-rose-500" />
              <span>{t("banStaff") || "Ban Staff"}</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
