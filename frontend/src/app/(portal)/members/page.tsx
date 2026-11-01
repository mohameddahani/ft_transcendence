"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Ban,
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
      const [membersData, initialPage, plansData] = await Promise.all([
        fetchMembers(1, 1000),
        fetchMembers(1, pageSize),
        fetchMembershipPlans(1, 100).catch(() => []),
      ]);
      setMembers(membersData);
      setPagedMembers(initialPage);
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

      // Status check (check first membership's status or accountStatus)
      const membershipStatus = member.memberships?.[0]?.membershipStatus;
      const effectiveStatus = (
        member.accountStatus === "BANNED"
          ? "BANNED"
          : member.accountStatus === "PENDING"
          ? "PENDING"
          : membershipStatus || member.accountStatus || "ACTIVE"
      ).toUpperCase();
      const matchesStatus = !selectedStatus || effectiveStatus === selectedStatus.toUpperCase();

      // Plan check
      const memberPlanId = member.memberships?.[0]?.membershipPlanId;
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
  const activeCount = members.filter(
    (m) => m.memberships?.[0]?.membershipStatus === "ACTIVE"
  ).length;
  const pendingCount = members.filter(
    (m) => (m.accountStatus || "").toUpperCase() === "PENDING"
  ).length;
  const bannedCount = members.filter(
    (m) => (m.accountStatus || "").toUpperCase() === "BANNED"
  ).length;

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

    const rows = filteredMembers.map((m) => [
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
        : m.memberships?.[0]?.membershipStatus || m.accountStatus || "ACTIVE",
      m.memberships?.[0]?.membershipPlan?.planName ||
        plans.find((p) => p.id === m.memberships?.[0]?.membershipPlanId)?.planName ||
        "None",
      m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "",
    ]);

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

  return (
    <div className="space-y-6 max-w-container-max mx-auto pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
            {t("membersTitle")}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t("membersSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadData}
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
            <span>{t("export")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 primary-gradient text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t("addNewMember")}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-on-surface-variant/60"
            placeholder={t("searchMembersPlaceholder")}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Plan Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedPlanId}
            onChange={(e) => {
              setSelectedPlanId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none"
          >
            <option value="">All Plan Types</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.planName}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-2">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none"
          >
            <option value="">{t("allStatuses")}</option>
            <option value="ACTIVE">{t("active")}</option>
            <option value="PENDING">{t("pending")}</option>
            <option value="EXPIRED">{t("expired")}</option>
            <option value="CANCELLED">{t("cancelled")}</option>
            <option value="BANNED">{t("banned")}</option>
          </select>
        </div>

        {/* Clear / Reset Filters */}
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedPlanId("");
              setSelectedStatus("");
              setCurrentPage(1);
            }}
            className="w-full py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            {t("clearFilters")}
          </button>
        </div>
      </div>

      {/* Memberships Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading...</p>
          </div>
        ) : paginatedMembers.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
              <Users className="w-7 h-7" />
            </div>
            <h4 className="font-headline font-bold text-lg text-on-surface">
              {members.length === 0 ? t("noMembersYet") : t("noMatchingMembers")}
            </h4>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 leading-relaxed">
              {members.length === 0
                ? t("clickAddMember")
                : t("adjustFilter")}
            </p>
            {members.length === 0 && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 primary-gradient text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                {t("addFirstMember")}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("member")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("planName")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("duration")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("status")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("startDate")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("expiryDate")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right rtl:text-left">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {paginatedMembers.map((member) => {
                  const memberName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.userName || "Member";
                  const memberInitials = ((member.firstName?.[0] || "") + (member.lastName?.[0] || "")).toUpperCase() || "M";
                  const avatarUrl = member.profileImageUrl || member.photo;
                  const hasPhoto = avatarUrl && !avatarUrl.includes("default-");

                  // Active membership details
                  const activeMembership = member.memberships?.[0];
                  const planName =
                    activeMembership?.membershipPlan?.planName ||
                    activeMembership?.membershipPlan?.name ||
                    plans.find((p) => p.id === activeMembership?.membershipPlanId)?.planName ||
                    "Standard";

                  const durationDays = activeMembership?.membershipPlanDuration?.durationDays;
                  const durationLabel = durationDays
                    ? `${durationDays} Days`
                    : activeMembership?.membershipPlanDuration?.duration || "Monthly";

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
                    <tr
                      key={member.id}
                      className="hover:bg-primary-container/[0.03] transition-colors group"
                    >
                      {/* Member profile */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/members/${member.id}`}
                          className="flex items-center gap-3.5 hover:opacity-90"
                        >
                          {hasPhoto ? (
                            <img
                              className="w-10 h-10 rounded-full object-cover border-2 border-primary-container/40 shadow-xs"
                              alt={memberName}
                              src={avatarUrl!}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full primary-gradient text-white flex items-center justify-center font-bold text-xs select-none shadow-xs">
                              {memberInitials}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                              <span>{memberName}</span>
                            </p>
                            <p className="text-xs text-on-surface-variant font-medium">
                              {member.email}
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Plan Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          <span className="text-xs font-semibold text-on-surface">
                            {planName}
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                        {durationLabel}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border tracking-wider ${
                            status === "ACTIVE"
                              ? "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30"
                              : status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : status === "EXPIRED"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : status === "CANCELLED"
                              ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                              : "bg-error-container/30 text-error border-error-container/40"
                          }`}
                        >
                          {status === "ACTIVE"
                            ? t("active")
                            : status === "PENDING"
                            ? t("pending")
                            : status === "EXPIRED"
                            ? t("expired")
                            : status === "CANCELLED"
                            ? t("cancelled")
                            : t("banned")}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                        {startDate}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-6 py-4 text-xs font-semibold text-on-surface">
                        {expiryDate}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, member)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            isMenuOpen
                              ? "bg-primary/10 text-primary"
                              : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
                          }`}
                          title="Member options"
                        >
                          <MoreVertical className="w-4 h-4" />
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
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            {t("totalActiveMembers")}
          </p>
          <p className="font-headline text-2xl md:text-3xl font-bold text-primary">
            {activeCount}
          </p>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            {t("pendingMembers")}
          </p>
          <p className="font-headline text-2xl md:text-3xl font-bold text-amber-500">
            {pendingCount}
          </p>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            {t("bannedInactiveMembers")}
          </p>
          <p className="font-headline text-2xl md:text-3xl font-bold text-error">
            {bannedCount}
          </p>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            {t("totalAllMembers")}
          </p>
          <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            {totalCount}
          </p>
        </div>
      </div>

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

      {/* Portal Action Menu (Never clipped by table borders or overflow containers) */}
      {mounted && menuAnchor && createPortal(
        <div
          data-portal-menu
          style={{
            position: "fixed",
            top: menuAnchor.top,
            right: menuAnchor.right,
            zIndex: 99999,
          }}
          className="w-48 bg-surface-container-lowest border border-outline-variant/80 rounded-xl shadow-2xl py-1 text-left animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          <Link
            href={`/members/${menuAnchor.member.id}`}
            onClick={() => setMenuAnchor(null)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <Eye className="w-4 h-4 text-primary" />
            <span>{t("viewProfile")}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              const m = menuAnchor.member;
              setMenuAnchor(null);
              handleOpenEdit(m);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left rtl:text-right"
          >
            <Edit className="w-4 h-4 text-on-surface-variant" />
            <span>{t("editDetails")}</span>
          </button>

          <div className="h-[1px] bg-outline-variant/40 my-1" />

          {(menuAnchor.member.accountStatus || menuAnchor.member.status || "ACTIVE").toUpperCase() !== "ACTIVE" && (
            <button
              type="button"
              onClick={() => {
                const m = menuAnchor.member;
                setMenuAnchor(null);
                handleMakeActive(m);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-secondary hover:bg-secondary-container/20 transition-colors cursor-pointer text-left rtl:text-right"
            >
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span>{t("makeActive")}</span>
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
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-error hover:bg-error-container/20 transition-colors cursor-pointer text-left rtl:text-right"
            >
              <Ban className="w-4 h-4 text-error" />
              <span>{t("banMember")}</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
