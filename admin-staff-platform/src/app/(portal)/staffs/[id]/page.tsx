"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  Mail,
  Fingerprint,
  Edit,
  ShieldCheck,
  Clock,
  Ban,
  User,
  Calendar,
  Phone,
  ArrowLeft,
  Loader2,
  Building,
  UserCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  fetchStaff,
  activeStaff,
  pendingStaff,
  banStaff,
} from "@/lib/api/staffs";
import { BackendStaff } from "@/types/staff";
import EditStaffModal from "@/components/staffs/EditStaffModal";

export default function StaffDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [staff, setStaff] = useState<BackendStaff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadStaffData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await fetchStaff(id);
      setStaff(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load staff profile details");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-on-surface-variant">
          {t("savingChanges")}
        </p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="py-20 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-headline text-xl font-bold text-on-surface">
          {t("noMatchingStaff")}
        </h2>
        <p className="text-xs text-on-surface-variant mt-1 mb-6">
          {t("adjustFilter")}
        </p>
        <Link
          href="/staffs"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t("backToAllStaffs")}</span>
        </Link>
      </div>
    );
  }

  const staffName =
    `${staff.firstName || ""} ${staff.lastName || ""}`.trim() ||
    staff.userName ||
    t("staffMember");
  const staffInitials =
    ((staff.firstName?.[0] || "") + (staff.lastName?.[0] || "")).toUpperCase() ||
    "S";
  const avatarUrl = staff.profileImageUrl;
  const hasPhoto = avatarUrl && !avatarUrl.includes("default-");

  const status = (staff.accountStatus || "ACTIVE").toUpperCase();

  // Calculate age from birthDate
  let birthDateFormatted = "—";
  let ageString = "";
  if (staff.birthDate) {
    try {
      const birth = new Date(staff.birthDate);
      if (!isNaN(birth.getTime())) {
        birthDateFormatted = birth.toLocaleDateString();
        const ageDifMs = Date.now() - birth.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        ageString = ` (${age})`;
      }
    } catch {
      // ignore date parse error
    }
  }

  // Status Handlers
  const handleMakeActive = async () => {
    setIsActionLoading(true);
    try {
      await activeStaff(staff.id);
      toast.success(t("activateStaff"));
      await loadStaffData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to activate staff account");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMakePending = async () => {
    setIsActionLoading(true);
    try {
      await pendingStaff(staff.id);
      toast.info(t("setToPending"));
      await loadStaffData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to update status to pending");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBan = async () => {
    setIsActionLoading(true);
    try {
      await banStaff(staff.id);
      toast.error(t("banStaff"));
      await loadStaffData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to ban staff account");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
        <Link
          href="/staffs"
          className="font-bold hover:text-primary uppercase tracking-wider transition-colors"
        >
          {t("navStaffs")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <span className="uppercase font-bold text-on-surface">{t("staffDetail")}</span>
      </nav>

      {/* Profile Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-outline-variant/40">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-surface-container flex items-center justify-center">
              {hasPhoto ? (
                <img
                  className="w-full h-full object-cover"
                  alt={staffName}
                  src={avatarUrl!}
                />
              ) : (
                <div className="w-full h-full primary-gradient text-white flex items-center justify-center font-bold text-3xl select-none">
                  {staffInitials}
                </div>
              )}
            </div>
            <div
              className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border-2 border-white ${
                status === "ACTIVE"
                  ? "bg-secondary text-white"
                  : status === "PENDING"
                  ? "bg-tertiary text-white"
                  : "bg-error text-white"
              }`}
            >
              {status === "ACTIVE" ? t("active") : status === "PENDING" ? t("pending") : t("banned")}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
                {staffName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                <UserCheck className="w-3 h-3" />
                <span>{staff.role || "STAFF"}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-on-surface-variant text-xs md:text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-primary" />
                <span>{staff.email}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <Fingerprint className="w-4 h-4 text-on-surface-variant" />
                <span>{t("id")}: {staff.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2.5 border border-outline-variant font-bold text-xs rounded-xl text-on-surface hover:bg-surface-container transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Edit className="w-4 h-4 text-on-surface-variant" />
            <span>{t("editProfile")}</span>
          </button>

          {status !== "ACTIVE" && (
            <button
              type="button"
              onClick={handleMakeActive}
              disabled={isActionLoading}
              className="px-4 py-2.5 bg-secondary text-white font-bold text-xs rounded-xl hover:opacity-90 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t("activateStaff")}</span>
            </button>
          )}

          {status !== "PENDING" && (
            <button
              type="button"
              onClick={handleMakePending}
              disabled={isActionLoading}
              className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-4 h-4 text-tertiary" />
              <span>{t("setToPending")}</span>
            </button>
          )}

          {status !== "BANNED" && (
            <button
              type="button"
              onClick={handleBan}
              disabled={isActionLoading}
              className="px-4 py-2.5 bg-error-container/20 text-error border border-error-container font-bold text-xs rounded-xl hover:bg-error-container/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              <span>{t("banStaff")}</span>
            </button>
          )}
        </div>
      </section>

      {/* Bento Grid Layout for Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Info & Access (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Personal Info */}
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span>{t("personalInformation")}</span>
              </h2>
              <span className="text-[11px] font-bold text-secondary uppercase tracking-widest bg-secondary-container/20 px-3 py-1 rounded-full border border-secondary-container/30">
                {t("verified")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("details")}
                </p>
                <p className="text-sm font-bold text-on-surface">{staffName}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("birthDate")}
                </p>
                <p className="text-sm font-bold text-on-surface">
                  {birthDateFormatted}
                  <span className="text-on-surface-variant font-normal">{ageString}</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("phone")}
                </p>
                <p className="text-sm font-bold text-on-surface font-mono">
                  {staff.phoneNumber || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("emailAddress")}
                </p>
                <p className="text-sm font-bold text-on-surface">
                  {staff.email}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("gender")}
                </p>
                <p className="text-sm font-bold text-on-surface">
                  {staff.gender === "MALE"
                    ? t("male")
                    : staff.gender === "FEMALE"
                    ? t("female")
                    : staff.gender || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("username")}
                </p>
                <p className="text-sm font-bold font-mono text-on-surface">
                  @{staff.userName || "—"}
                </p>
              </div>

              {staff.companyName && (
                <div className="md:col-span-2 space-y-1 pt-2 border-t border-outline-variant/40">
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("companyName")}
                  </p>
                  <p className="text-sm font-medium text-on-surface flex items-center gap-2">
                    <Building className="w-4 h-4 text-on-surface-variant shrink-0" />
                    <span>{staff.companyName}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Operational Privileges */}
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>{t("operationalRoles")}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1">
                <p className="text-xs font-bold text-on-surface">{t("memberManagement")}</p>
                <p className="text-[11px] text-on-surface-variant">
                  {t("memberManagementDesc")}
                </p>
              </div>

              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1">
                <p className="text-xs font-bold text-on-surface">{t("facilityCheckin")}</p>
                <p className="text-[11px] text-on-surface-variant">
                  {t("facilityCheckinDesc")}
                </p>
              </div>

              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1">
                <p className="text-xs font-bold text-on-surface">{t("subscriptionRoster")}</p>
                <p className="text-[11px] text-on-surface-variant">
                  {t("subscriptionRosterDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Supervisor (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status & Record Card */}
          <div className="primary-gradient text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-headline font-bold text-lg text-white">
                  {t("staffAccountStatus")}
                </h3>
              </div>

              <div>
                <p className="text-[11px] font-bold opacity-75 uppercase tracking-wider mb-1">
                  {t("status")}
                </p>
                <p className="font-headline text-3xl font-bold leading-tight">
                  {status === "ACTIVE" ? t("active") : status === "PENDING" ? t("pending") : t("banned")}
                </p>
              </div>

              <div className="pt-2 border-t border-white/20 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-75">{t("joinedDate")}:</span>
                  <span className="font-semibold">
                    {staff.createdAt
                      ? new Date(staff.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Ambient blur */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Supervisor Card (if admin info exists) */}
          {staff.admin && (
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-3">
              <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                {t("gymAdministrator")}
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                  {((staff.admin.firstName?.[0] || "") + (staff.admin.lastName?.[0] || "")).toUpperCase() || "A"}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {staff.admin.firstName} {staff.admin.lastName}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {staff.admin.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Navigation */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-3">
            <Link
              href="/staffs"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t("backToAllStaffs")}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditStaffModal
        staff={staff}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={loadStaffData}
      />
    </div>
  );
}
