"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  Download,
  MoreVertical,
  Users,
  UserCheck,
  UserPlus,
  Loader2,
  RefreshCw,
  Eye,
  Edit,
  ShieldCheck,
  Ban,
  Clock,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  fetchMembers,
  activeMember,
  banMember,
} from "@/lib/api/members";
import { fetchMembershipPlans } from "@/lib/api/membership-plans";
import { BackendMember } from "@/types/member";
import { MembershipPlan } from "@/types/membership-plan";
import AddMemberModal from "@/components/members/AddMemberModal";
import EditMemberModal from "@/components/members/EditMemberModal";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "react-i18next";
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

export default function MembershipsPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<BackendMember[]>([]);
  const [pagedMembers, setPagedMembers] = useState<BackendMember[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<BackendMember | null>(null);

  // Portal Action Menu anchor state
  const [mounted, setMounted] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    member: BackendMember;
    top: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersData, plansData] = await Promise.all([
        fetchMembers(1, 1000),
        fetchMembershipPlans(1, 100).catch(() => []),
      ]);
      setMembers(membersData);
      setPagedMembers(membersData.slice(0, pageSize));
      setPlans(plansData);
      setCurrentPage(1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load members from backend");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle page changes with explicit API calls
  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    if (!searchTerm && !selectedStatus && !selectedPlanId) {
      setIsPageLoading(true);
      try {
        const pageData = await fetchMembers(newPage, pageSize);
        setPagedMembers(pageData);
      } catch {
        // fail gracefully
      } finally {
        setIsPageLoading(false);
      }
    }
  };

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

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const fullName = `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
      const email = (member.email || "").toLowerCase();
      const username = (member.userName || "").toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        fullName.includes(query) ||
        email.includes(query) ||
        username.includes(query);

      // Status check (check active membership or first membership status or accountStatus)
      const currentMembership =
        member.memberships?.find((m) => m.membershipStatus === "ACTIVE") ||
        member.memberships?.[0];
      const membershipStatus = currentMembership?.membershipStatus;
      const effectiveStatus = (
        member.accountStatus === "BANNED"
          ? "BANNED"
          : member.accountStatus === "PENDING"
          ? "PENDING"
          : membershipStatus || member.accountStatus || "ACTIVE"
      ).toUpperCase();
      const matchesStatus = !selectedStatus || effectiveStatus === selectedStatus.toUpperCase();

      // Plan check
      const memberPlanId = currentMembership?.membershipPlanId;
      const matchesPlan = !selectedPlanId || memberPlanId === selectedPlanId;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [members, searchTerm, selectedStatus, selectedPlanId]);

  // Paginated members
  const isFiltering = Boolean(searchTerm || selectedStatus || selectedPlanId);
  const totalItems = isFiltering ? filteredMembers.length : members.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedMembers = useMemo(() => {
    if (isFiltering) {
      const start = (currentPage - 1) * pageSize;
      return filteredMembers.slice(start, start + pageSize);
    }
    return pagedMembers;
  }, [isFiltering, filteredMembers, pagedMembers, currentPage, pageSize]);

  // Statistics calculation based on backend structure
  const totalCount = members.length;
  const activeCount = members.filter((m) => {
    if (m.accountStatus === "BANNED" || m.accountStatus === "PENDING") return false;
    return (
      m.memberships?.some((sub) => sub.membershipStatus === "ACTIVE") ||
      (!m.memberships?.length && m.accountStatus === "ACTIVE")
    );
  }).length;
  const pendingCount = members.filter(
    (m) => (m.accountStatus || "").toUpperCase() === "PENDING"
  ).length;
  const bannedCount = members.filter(
    (m) => (m.accountStatus || "").toUpperCase() === "BANNED"
  ).length;

  const activePercent =
    totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
  const pendingPercent =
    totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  const bannedPercent =
    totalCount > 0 ? Math.round((bannedCount / totalCount) * 100) : 0;

  // Status Action Handlers
  const handleMakeActive = async (member: BackendMember) => {
    setMenuAnchor(null);
    try {
      await activeMember(member.id);
      toast.success(`Member ${member.firstName} ${member.lastName} is now ACTIVE!`);
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to activate member");
      }
    }
  };

  const handleBan = async (member: BackendMember) => {
    setMenuAnchor(null);
    try {
      await banMember(member.id);
      toast.error(`Member ${member.firstName} ${member.lastName} has been BANNED.`);
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to ban member");
      }
    }
  };

  const handleOpenEdit = (member: BackendMember) => {
    setMenuAnchor(null);
    setMemberToEdit(member);
    setIsEditModalOpen(true);
  };

  const handleToggleMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    member: BackendMember
  ) => {
    e.stopPropagation();
    if (menuAnchor?.member.id === member.id) {
      setMenuAnchor(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setMenuAnchor({
      member,
      top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      right: Math.max(16, window.innerWidth - rect.right),
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      toast.info("No members available to export.");
      return;
    }

    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Username",
      "Email",
      "Phone",
      "Address",
      "Status",
      "Plan",
      "Join Date",
    ];

    const rows = filteredMembers.map((m) => {
      const curMem =
        m.memberships?.find((sub) => sub.membershipStatus === "ACTIVE") ||
        m.memberships?.[0];
      const curPlan = plans.find((p) => p.id === curMem?.membershipPlanId);
      return [
        m.id,
        m.firstName || "",
        m.lastName || "",
        m.userName || "",
        m.email || "",
        m.phoneNumber || "",
        `"${(m.address || "").replace(/"/g, '""')}"`,
        m.accountStatus === "BANNED"
          ? "BANNED"
          : m.accountStatus === "PENDING"
          ? "PENDING"
          : curMem?.membershipStatus || m.accountStatus || "ACTIVE",
        curMem?.membershipPlan?.planName || curPlan?.planName || "None",
        m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `members_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Members exported successfully to CSV!");
  };

  const getStatusLabel = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "ACTIVE") return t("active") || "Active";
    if (s === "PENDING") return t("pending") || "Pending";
    if (s === "BANNED") return t("banned") || "Banned";
    if (s === "EXPIRED") return t("expired") || "Expired";
    if (s === "CANCELLED") return t("cancelled") || "Cancelled";
    if (s === "INACTIVE") return t("inactive") || "Inactive";
    return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "";
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    const label = getStatusLabel(status);

    if (s === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
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

    if (s === "BANNED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
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

  const getInitials = (
    firstName?: string | null,
    lastName?: string | null,
    userName?: string | null
  ) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    if (first || last) {
      return (first + last).toUpperCase();
    }
    if (userName?.[0]) {
      return userName[0].toUpperCase();
    }
    return "M";
  };

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Overview & Action Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("membersTitle") || "Memberships"}
              </h1>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {totalCount} {t("total") || "total"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t("membersSubtitle") ||
                "Manage and monitor active subscriber tiers across the facility."}
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
              <span>{t("export") || "Export"}</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer"
            >
              <UserPlus className="size-3.5 me-2" />
              <span>{t("addNewMember") || "Add New Member"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Real Live Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Members */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalAllMembers") || "Total Members"}
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
                {t("liveFromApi") || "Live"}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("registeredInGym") || "Registered gym members"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Active Subscriptions */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("totalActiveMembers") || "Total Active"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-green">
              <UserCheck className="size-5" />
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
              {t("active") || "Active"} {t("navMembers") || "members"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-toota-green transition-all"
                style={{ width: `${Math.min(100, Math.max(0, activePercent))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Pending Members */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("pendingMembers") || "Pending Members"}
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
              {t("pending") || "Awaiting activation"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-toota-inner mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, pendingPercent))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Banned / Inactive */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("bannedInactiveMembers") || "Banned / Inactive"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-red">
              <Ban className="size-5" />
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
              {t("banned") || "Suspended or restricted"}
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
              placeholder={t("searchMembersPlaceholder") || "Search by name, email, or username..."}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-full bg-toota-inner border-border/40 ps-10 pe-4 text-xs text-toota-ink placeholder:text-toota-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-border transition-all"
            />
          </div>

          {/* Plan Filter Dropdown */}
          <div className="w-full md:w-56 shrink-0">
            <select
              value={selectedPlanId}
              onChange={(e) => {
                setSelectedPlanId(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={t("planName") || "Plan"}
              className="w-full h-10 px-3.5 rounded-full bg-toota-inner border border-border/40 text-xs font-medium text-toota-ink focus:outline-hidden focus:ring-1 focus:ring-ring transition-all cursor-pointer"
            >
              <option value="">{t("allPlans", "All Plan Types")}</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.planName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full md:w-44 shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={t("status") || "Status"}
              className="w-full h-10 px-3.5 rounded-full bg-toota-inner border border-border/40 text-xs font-medium text-toota-ink focus:outline-hidden focus:ring-1 focus:ring-ring transition-all cursor-pointer"
            >
              <option value="">{t("allStatuses") || "All Statuses"}</option>
              <option value="ACTIVE">{t("active") || "Active"}</option>
              <option value="PENDING">{t("pending") || "Pending"}</option>
              <option value="EXPIRED">{t("expired") || "Expired"}</option>
              <option value="CANCELLED">{t("cancelled") || "Cancelled"}</option>
              <option value="BANNED">{t("banned") || "Banned"}</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <Button
            type="button"
            variant="outline"
            disabled={!isFiltering}
            onClick={() => {
              setSearchTerm("");
              setSelectedPlanId("");
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

      {/* Members Table Card */}
      <Card className="toota-card border-none p-0 overflow-hidden">
        <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-border/40 flex-wrap gap-3">
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("membersTitle") || "Members"}
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
              <p className="text-xs">Loading members...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && paginatedMembers.length === 0 && (
            <div className="py-20 text-center px-4">
              <div className="size-14 rounded-full bg-toota-inner flex items-center justify-center mx-auto mb-3 text-toota-muted">
                <Users className="size-7" />
              </div>
              <h4 className="font-medium text-base text-toota-ink">
                {members.length === 0
                  ? t("noMembersYet") || "No members registered yet"
                  : t("noMatchingMembers") || "No matching members found"}
              </h4>
              <p className="text-xs text-toota-muted max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                {members.length === 0
                  ? t("clickAddMember") || "Click 'Add New Member' to register your first gym subscriber."
                  : t("adjustFilter") || "Try adjusting your search query, plan filter, or status filter."}
              </p>
              {members.length === 0 && (
                <Button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer"
                >
                  <UserPlus className="size-3.5 me-1.5" />
                  <span>{t("addFirstMember") || "Add First Member"}</span>
                </Button>
              )}
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && paginatedMembers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent text-[11px] font-semibold text-toota-muted uppercase tracking-wider bg-black/[0.02] dark:bg-white/[0.02]">
                  <TableHead className="px-6 py-3.5">
                    {t("member") || "Member"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("planName") || "Plan"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("duration") || "Duration"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("status") || "Status"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("startDate") || "Start Date"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5">
                    {t("expiryDate") || "Expiry Date"}
                  </TableHead>
                  <TableHead className="px-6 py-3.5 text-right rtl:text-left">
                    {t("actions") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40 text-xs">
                {paginatedMembers.map((member) => {
                  const memberName =
                    `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                    member.userName ||
                    "Member";
                  const memberInitials = getInitials(
                    member.firstName,
                    member.lastName,
                    member.userName
                  );
                  const avatarUrl = member.profileImageUrl || member.photo || null;

                  // Active membership details (prefer active membership if exists, else latest)
                  const activeMembership =
                    member.memberships?.find((m) => m.membershipStatus === "ACTIVE") ||
                    member.memberships?.[0];
                  const matchedPlan = plans.find(
                    (p) => p.id === activeMembership?.membershipPlanId
                  );
                  const planName =
                    activeMembership?.membershipPlan?.planName ||
                    activeMembership?.membershipPlan?.name ||
                    matchedPlan?.planName ||
                    (activeMembership ? t("standardPlan") || "Standard" : "None");

                  // Duration calculation: from durationDays, matchedPlan duration, or calculated between start and expiry dates
                  const matchedDuration = matchedPlan?.membershipPlanDurations?.find(
                    (d) => d.id === activeMembership?.membershipPlanDurationId
                  );
                  let durationDays =
                    activeMembership?.membershipPlanDuration?.durationDays ||
                    matchedDuration?.durationDays;

                  if (!durationDays && activeMembership?.startDate && activeMembership?.expiresAt) {
                    const start = new Date(activeMembership.startDate).getTime();
                    const end = new Date(activeMembership.expiresAt).getTime();
                    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
                    if (diff > 0) durationDays = diff;
                  }

                  const durationLabel = durationDays
                    ? `${durationDays} Days`
                    : activeMembership?.membershipPlanDuration?.duration ||
                      "—";

                  const membershipStatus = activeMembership?.membershipStatus;
                  const status = (
                    member.accountStatus === "BANNED"
                      ? "BANNED"
                      : member.accountStatus === "PENDING"
                      ? "PENDING"
                      : membershipStatus || member.accountStatus || "ACTIVE"
                  ).toUpperCase();

                  const startDate = activeMembership?.startDate
                    ? new Date(activeMembership.startDate).toLocaleDateString()
                    : member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString()
                    : "—";

                  const expiryDate = activeMembership?.expiresAt
                    ? new Date(activeMembership.expiresAt).toLocaleDateString()
                    : "—";

                  const isMenuOpen = menuAnchor?.member.id === member.id;

                  return (
                    <TableRow
                      key={member.id}
                      className="border-border/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Member Info */}
                      <TableCell className="px-6 py-3.5">
                        <Link
                          href={`/members/${member.id}`}
                          className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
                        >
                          <Avatar className="size-9 ring-1 ring-border/40 shrink-0">
                            {avatarUrl ? (
                              <AvatarImage
                                src={avatarUrl}
                                alt={memberName}
                              />
                            ) : null}
                            <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                              {memberInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-toota-ink group-hover:underline truncate">
                              {memberName}
                            </p>
                            <p className="text-[11px] text-toota-muted truncate">
                              {member.email}
                            </p>
                          </div>
                        </Link>
                      </TableCell>

                      {/* Plan Name */}
                      <TableCell className="px-6 py-3.5 text-toota-ink font-medium">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-toota-green shrink-0" />
                          <span className="truncate">{planName}</span>
                        </div>
                      </TableCell>

                      {/* Duration */}
                      <TableCell className="px-6 py-3.5 text-toota-muted">
                        {durationLabel}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-6 py-3.5">
                        {renderStatusBadge(status)}
                      </TableCell>

                      {/* Start Date */}
                      <TableCell className="px-6 py-3.5 text-toota-muted">
                        {startDate}
                      </TableCell>

                      {/* Expiry Date */}
                      <TableCell className="px-6 py-3.5 text-toota-ink font-medium">
                        {expiryDate}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-6 py-3.5 text-right rtl:text-left">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleToggleMenu(e, member)}
                          className={`size-8 rounded-full transition-colors cursor-pointer ${
                            isMenuOpen
                              ? "bg-toota-inner text-toota-ink"
                              : "text-toota-muted hover:text-toota-ink hover:bg-toota-inner"
                          }`}
                          title="Member options"
                          aria-label="Member options"
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
            onPageChange={handlePageChange}
            isLoading={isPageLoading}
            itemLabel={t("navMembers") || "members"}
          />
        )}
      </Card>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
      />

      <EditMemberModal
        member={memberToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setMemberToEdit(null);
        }}
        onSuccess={loadData}
      />

      {/* Portal Action Menu (Clean Toota Popover Style, never clipped) */}
      {mounted && menuAnchor && createPortal(
        <div
          data-portal-menu
          style={{
            position: "fixed",
            top: menuAnchor.top,
            right: menuAnchor.right,
            zIndex: 99999,
          }}
          className="w-52 bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl p-1.5 text-left rtl:text-right animate-in fade-in zoom-in-95 duration-150"
        >
          <Link
            href={`/members/${menuAnchor.member.id}`}
            onClick={() => setMenuAnchor(null)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-toota-ink hover:bg-toota-inner rounded-xl transition-colors"
          >
            <Eye className="size-4 text-toota-muted" />
            <span>{t("viewProfile") || "View Profile"}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              const m = menuAnchor.member;
              setMenuAnchor(null);
              handleOpenEdit(m);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-toota-ink hover:bg-toota-inner rounded-xl transition-colors cursor-pointer text-left rtl:text-right"
          >
            <Edit className="size-4 text-toota-muted" />
            <span>{t("editDetails") || "Edit Details"}</span>
          </button>

          <div className="h-px bg-border/40 my-1" />

          {(menuAnchor.member.accountStatus || menuAnchor.member.status || "ACTIVE").toUpperCase() !== "ACTIVE" && (
            <button
              type="button"
              onClick={() => {
                const m = menuAnchor.member;
                setMenuAnchor(null);
                handleMakeActive(m);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-toota-green hover:bg-toota-green/10 rounded-xl transition-colors cursor-pointer text-left rtl:text-right"
            >
              <ShieldCheck className="size-4 text-toota-green" />
              <span>{t("makeActive") || "Make Active"}</span>
            </button>
          )}

          {(menuAnchor.member.accountStatus || menuAnchor.member.status || "").toUpperCase() !== "BANNED" && (
            <button
              type="button"
              onClick={() => {
                const m = menuAnchor.member;
                setMenuAnchor(null);
                handleBan(m);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-toota-red hover:bg-toota-red/10 rounded-xl transition-colors cursor-pointer text-left rtl:text-right"
            >
              <Ban className="size-4 text-toota-red" />
              <span>{t("banMember") || "Ban Member"}</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
