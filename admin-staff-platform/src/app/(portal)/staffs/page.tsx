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
  Clock,
  Ban,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  Phone,
  Mail,
  Calendar,
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
import AddStaffModal from "@/components/staffs/AddStaffModal";
import EditStaffModal from "@/components/staffs/EditStaffModal";
import { useTranslation } from "react-i18next";

export default function StaffsPage() {
  const { t } = useTranslation();
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchStaffs(1, 100);
      setStaffs(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load staff roster from server");
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

  // Filtered staffs
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

  // Status Action Handlers
  const handleMakeActive = async (staff: BackendStaff) => {
    setMenuAnchor(null);
    try {
      await activeStaff(staff.id);
      toast.success(`Staff member "${staff.firstName} ${staff.lastName}" is now ACTIVE!`);
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to activate staff member");
      }
    }
  };

  const handleMakePending = async (staff: BackendStaff) => {
    setMenuAnchor(null);
    try {
      await pendingStaff(staff.id);
      toast.info(`Staff member "${staff.firstName} ${staff.lastName}" status changed to PENDING.`);
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to set staff member to pending");
      }
    }
  };

  const handleBan = async (staff: BackendStaff) => {
    setMenuAnchor(null);
    try {
      await banStaff(staff.id);
      toast.error(`Staff member "${staff.firstName} ${staff.lastName}" has been BANNED.`);
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to ban staff member");
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
      toast.info("No staff records available to export.");
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
      `kinetic_staffs_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Staff list exported successfully to CSV!");
  };

  return (
    <div className="space-y-6 max-w-container-max mx-auto pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
            {t("staffManagement")}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t("staffSubtitle")}
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
            <span>{t("addNewStaff")}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant">
        {/* Search */}
        <div className="md:col-span-7 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-on-surface-variant/60"
            placeholder={t("searchStaffPlaceholder")}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3">
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
            <option value="BANNED">{t("banned")}</option>
          </select>
        </div>

        {/* Clear / Reset Filters */}
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedStatus("");
              setCurrentPage(1);
            }}
            className="w-full py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            {t("clearFilters")}
          </button>
        </div>
      </div>

      {/* Staff Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading...</p>
          </div>
        ) : paginatedStaffs.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
              <Users className="w-7 h-7" />
            </div>
            <h4 className="font-headline font-bold text-lg text-on-surface">
              {staffs.length === 0 ? t("noStaffYet") : t("noMatchingStaff")}
            </h4>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 leading-relaxed">
              {staffs.length === 0
                ? t("clickAddStaff")
                : t("adjustFilter")}
            </p>
            {staffs.length === 0 && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 primary-gradient text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                {t("addFirstStaff")}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("staffMember")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("roleText")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("status")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("phone")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("gender")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("joinedDate")}
                  </th>
                  <th className="px-6 py-4 font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right rtl:text-left">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {paginatedStaffs.map((staff) => {
                  const staffName =
                    `${staff.firstName || ""} ${staff.lastName || ""}`.trim() ||
                    staff.userName ||
                    "Staff Member";
                  const staffInitials =
                    ((staff.firstName?.[0] || "") + (staff.lastName?.[0] || "")).toUpperCase() ||
                    "S";
                  const avatarUrl = staff.profileImageUrl;
                  const hasPhoto = avatarUrl && !avatarUrl.includes("default-");

                  const status = (staff.accountStatus || "ACTIVE").toUpperCase();

                  const joinDate = staff.createdAt
                    ? new Date(staff.createdAt).toLocaleDateString()
                    : "—";

                  const isMenuOpen = menuAnchor?.staff.id === staff.id;

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-primary-container/[0.03] transition-colors group"
                    >
                      {/* Staff profile */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/staffs/${staff.id}`}
                          className="flex items-center gap-3.5 hover:opacity-90"
                        >
                          {hasPhoto ? (
                            <img
                              className="w-10 h-10 rounded-full object-cover border-2 border-primary-container/40 shadow-xs"
                              alt={staffName}
                              src={avatarUrl!}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full primary-gradient text-white flex items-center justify-center font-bold text-xs select-none shadow-xs">
                              {staffInitials}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                              <span>{staffName}</span>
                            </p>
                            <p className="text-xs text-on-surface-variant font-medium">
                              {staff.email}
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                          <UserCheck className="w-3 h-3" />
                          <span>{staff.role || "STAFF"}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border tracking-wider ${
                            status === "ACTIVE"
                              ? "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30"
                              : status === "PENDING"
                              ? "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant border-tertiary-fixed/50"
                              : "bg-error-container/30 text-error border-error-container/40"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-xs font-mono font-medium text-on-surface">
                        {staff.phoneNumber || "—"}
                      </td>

                      {/* Gender */}
                      <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                        {staff.gender === "MALE"
                          ? "Male"
                          : staff.gender === "FEMALE"
                          ? "Female"
                          : staff.gender || "—"}
                      </td>

                      {/* Join Date */}
                      <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                        {joinDate}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, staff)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            isMenuOpen
                              ? "bg-primary/10 text-primary"
                              : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
                          }`}
                          title="Staff options"
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
        {filteredStaffs.length > 0 && (
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-bright border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant">
              {t("showing")}{" "}
              <span className="font-bold text-on-surface">
                {Math.min((currentPage - 1) * pageSize + 1, totalItems)} -{" "}
                {Math.min(currentPage * pageSize, totalItems)}
              </span>{" "}
              {t("of")} <span className="font-bold text-on-surface">{totalItems}</span> {t("navStaffs")}
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

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            {t("totalActiveStaff")}
          </p>
          <p className="font-headline text-2xl md:text-3xl font-bold text-secondary">
            {activeCount}
          </p>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            {t("pendingApproval")}
          </p>
          <p className="font-headline text-2xl md:text-3xl font-bold text-tertiary">
            {pendingCount}
          </p>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            {t("bannedStaff")}
          </p>
          <p className="font-headline text-2xl md:text-3xl font-bold text-error">
            {bannedCount}
          </p>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            {t("totalStaff")}
          </p>
          <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            {totalCount}
          </p>
        </div>
      </div>

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
          className="w-48 bg-surface-container-lowest border border-outline-variant/80 rounded-xl shadow-2xl py-1 text-left animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          <Link
            href={`/staffs/${menuAnchor.staff.id}`}
            onClick={() => setMenuAnchor(null)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <Eye className="w-4 h-4 text-primary" />
            <span>{t("viewProfile")}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              const s = menuAnchor.staff;
              setMenuAnchor(null);
              handleOpenEdit(s);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left rtl:text-right"
          >
            <Edit className="w-4 h-4 text-on-surface-variant" />
            <span>{t("editDetails")}</span>
          </button>

          <div className="h-[1px] bg-outline-variant/40 my-1" />

          {(menuAnchor.staff.accountStatus || "ACTIVE").toUpperCase() !== "ACTIVE" && (
            <button
              type="button"
              onClick={() => {
                const s = menuAnchor.staff;
                setMenuAnchor(null);
                handleMakeActive(s);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-secondary hover:bg-secondary-container/20 transition-colors cursor-pointer text-left rtl:text-right"
            >
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span>{t("activateStaff")}</span>
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
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-tertiary hover:bg-tertiary-fixed/30 transition-colors cursor-pointer text-left rtl:text-right"
            >
              <Clock className="w-4 h-4 text-tertiary" />
              <span>{t("setToPending")}</span>
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
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-error hover:bg-error-container/20 transition-colors cursor-pointer text-left rtl:text-right"
            >
              <Ban className="w-4 h-4 text-error" />
              <span>{t("banStaff")}</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
