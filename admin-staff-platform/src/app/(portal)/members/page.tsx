"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  Download,
  Filter,
  MoreVertical,
  Users,
  UserPlus,
  Loader2,
  RefreshCw,
  Eye,
  Edit,
  ShieldCheck,
  PauseCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  fetchMembers,
  activeMember,
  freezeMember,
  banMember,
} from "@/lib/api/members";
import { fetchMembershipPlans } from "@/lib/api/membership-plans";
import { BackendMember } from "@/types/member";
import { MembershipPlan } from "@/types/membership-plan";
import AddMemberModal from "@/components/members/AddMemberModal";
import EditMemberModal from "@/components/members/EditMemberModal";
import { useTranslation } from "react-i18next";

export default function MembershipsPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<BackendMember[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        fetchMembers(1, 100),
        fetchMembershipPlans(1, 100).catch(() => []),
      ]);
      setMembers(membersData);
      setPlans(plansData);
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

      // Status check
      const currentStatus = (member.accountStatus || member.status || "ACTIVE").toUpperCase();
      const matchesStatus = !selectedStatus || currentStatus === selectedStatus.toUpperCase();

      // Plan check
      const memberPlanId = member.memberships?.[0]?.membershipPlanId;
      const matchesPlan = !selectedPlanId || memberPlanId === selectedPlanId;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [members, searchTerm, selectedStatus, selectedPlanId]);

  // Paginated members
  const totalItems = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Statistics calculation
  const totalCount = members.length;
  const activeCount = members.filter(
    (m) => (m.accountStatus || m.status || "ACTIVE").toUpperCase() === "ACTIVE"
  ).length;
  const frozenCount = members.filter(
    (m) => (m.accountStatus || m.status || "").toUpperCase() === "FROZEN"
  ).length;
  const bannedCount = members.filter(
    (m) => (m.accountStatus || m.status || "").toUpperCase() === "BANNED"
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

  const handleFreeze = async (member: BackendMember) => {
    setMenuAnchor(null);
    try {
      await freezeMember(member.id);
      toast.info(`Member ${member.firstName} ${member.lastName} is now FROZEN.`);
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to freeze member");
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
      m.accountStatus || m.status || "ACTIVE",
      m.memberships?.[0]?.membershipPlan?.planName || "None",
      m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kinetic_members_${new Date().toISOString().split("T")[0]}.csv`);
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
            <option value="FROZEN">{t("frozen")}</option>
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

                  const status = (member.accountStatus || member.status || "ACTIVE").toUpperCase();

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
                              : status === "FROZEN"
                              ? "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant border-tertiary-fixed/50"
                              : "bg-error-container/30 text-error border-error-container/40"
                          }`}
                        >
                          {status}
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
        {filteredMembers.length > 0 && (
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-bright border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant">
              {t("showing")}{" "}
              <span className="font-bold text-on-surface">
                {Math.min((currentPage - 1) * pageSize + 1, totalItems)} -{" "}
                {Math.min(currentPage * pageSize, totalItems)}
              </span>{" "}
              {t("of")} <span className="font-bold text-on-surface">{totalItems}</span> {t("navMembers")}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-surface-container rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                        : "hover:bg-surface-container text-on-surface-variant"
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
                className="p-2 hover:bg-surface-container rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-on-surface rtl:rotate-180" />
              </button>
            </div>
          </div>
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
            {t("frozenPausedMembers")}
          </p>
          <p className="font-headline text-2xl md:text-3xl font-bold text-tertiary">
            {frozenCount}
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

          {(menuAnchor.member.accountStatus || menuAnchor.member.status || "").toUpperCase() !== "FROZEN" && (
            <button
              type="button"
              onClick={() => {
                const m = menuAnchor.member;
                setMenuAnchor(null);
                handleFreeze(m);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-tertiary hover:bg-tertiary-fixed/30 transition-colors cursor-pointer text-left rtl:text-right"
            >
              <PauseCircle className="w-4 h-4 text-tertiary" />
              <span>{t("freezeMember")}</span>
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
