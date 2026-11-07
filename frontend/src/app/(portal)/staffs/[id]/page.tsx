"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  Mail,
  Edit,
  ShieldCheck,
  Clock,
  Ban,
  User,
  ArrowLeft,
  Loader2,
  Building,
  UserCheck,
  Phone,
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

export default function StaffDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const id = params?.id as string;

  const [staff, setStaff] = useState<BackendStaff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadStaffData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await fetchStaff(id);
      setStaff(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("loadStaffFailed") || "Failed to load staff profile details");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadStaffData();
  }, [loadStaffData]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-toota-ink" />
        <p className="text-xs text-toota-muted">
          {t("loadingStaff") || "Loading staff profile..."}
        </p>
      </div>
    );
  }

  if (!staff) {
    return (
      <Card className="toota-card border-none py-20 text-center px-4 max-w-md mx-auto my-12">
        <div className="size-16 rounded-2xl bg-toota-inner flex items-center justify-center mx-auto mb-4 text-toota-muted">
          <User className="size-8" />
        </div>
        <h2 className="text-lg font-semibold text-toota-ink">
          {t("noMatchingStaff") || "Staff member not found"}
        </h2>
        <p className="text-xs text-toota-muted mt-1 mb-6">
          {t("adjustFilter") || "This staff account may have been removed or does not exist."}
        </p>
        <Link href="/staffs">
          <Button className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer">
            <ArrowLeft className="size-4 me-2 rtl:rotate-180" />
            <span>{t("backToAllStaffs") || "Back to All Staff"}</span>
          </Button>
        </Link>
      </Card>
    );
  }

  const staffName =
    `${staff.firstName || ""} ${staff.lastName || ""}`.trim() ||
    staff.userName ||
    t("staffMember") ||
    "Staff Member";

  const staffInitials =
    ((staff.firstName?.[0] || "") + (staff.lastName?.[0] || "")).toUpperCase() ||
    (staff.userName ? staff.userName.slice(0, 2).toUpperCase() : "S");
  const isPlaceholder =
    !staff.profileImageUrl ||
    staff.profileImageUrl === "default-image.jpg" ||
    staff.profileImageUrl === "default-member-image.jpg";
  const avatarUrl = !isPlaceholder ? staff.profileImageUrl : null;

  const facility = staff.companyName || staff.admin?.companyName;

  const adminAvatarUrl =
    staff.admin?.profileImageUrl &&
    staff.admin.profileImageUrl !== "default-image.jpg" &&
    staff.admin.profileImageUrl !== "default-member-image.jpg"
      ? staff.admin.profileImageUrl
      : null;

  const adminInitials =
    ((staff.admin?.firstName?.[0] || "") + (staff.admin?.lastName?.[0] || "")).toUpperCase() ||
    staff.admin?.userName?.slice(0, 2).toUpperCase() ||
    "A";

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
        ageString = ` (${age} yrs)`;
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
      toast.success(t("activateStaff") || "Staff account activated successfully");
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
      toast.info(t("setToPending") || "Staff account marked as pending");
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
      toast.error(t("banStaff") || "Staff account has been banned");
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

  const renderStaffStatusBadge = (statusStr: string) => {
    const s = (statusStr || "").toUpperCase();
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
        <span>{statusStr ? statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase() : ""}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Overview & Profile Header Card */}
      <Card className="toota-card border-none">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-toota-muted font-medium mb-4">
          <Link
            href="/staffs"
            className="hover:text-toota-ink transition-colors"
          >
            {t("navStaffs") || "Staff"}
          </Link>
          <ChevronRight className="size-3.5 rtl:rotate-180" />
          <span className="text-toota-ink font-medium">{staffName}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="size-20 md:size-24 ring-2 ring-border/40 shrink-0">
              {avatarUrl && (
                <AvatarImage src={avatarUrl} alt={staffName} />
              )}
              <AvatarFallback className="bg-toota-inner text-toota-ink font-bold text-xl md:text-2xl">
                {staffInitials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                  {staffName}
                </h1>
                {staff.role && (
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                    / {staff.role.charAt(0).toUpperCase() + staff.role.slice(1).toLowerCase()}
                  </span>
                )}
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / ID: {staff.id.slice(0, 8)}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {renderStaffStatusBadge(status)}
                {facility && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-toota-muted">
                    <Building className="size-3.5" />
                    <span>{facility}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-toota-muted pt-0.5 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  <span>{staff.email}</span>
                </span>
                {staff.phoneNumber && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="size-3.5" />
                    <span>{staff.phoneNumber}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
            >
              <Edit className="size-3.5 me-2" />
              <span>{t("editProfile") || "Edit Profile"}</span>
            </Button>

            {status !== "ACTIVE" && (
              <Button
                type="button"
                disabled={isActionLoading}
                onClick={handleMakeActive}
                className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer"
              >
                <ShieldCheck className="size-3.5 me-2" />
                <span>{t("activateStaff") || "Activate"}</span>
              </Button>
            )}

            {status !== "PENDING" && (
              <Button
                type="button"
                variant="outline"
                disabled={isActionLoading}
                onClick={handleMakePending}
                className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-amber-600 dark:text-amber-400 cursor-pointer"
              >
                <Clock className="size-3.5 me-2" />
                <span>{t("setToPending") || "Pending"}</span>
              </Button>
            )}

            {status !== "BANNED" && (
              <Button
                type="button"
                variant="outline"
                disabled={isActionLoading}
                onClick={handleBan}
                className="toota-pill h-10 px-4 text-xs font-semibold border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
              >
                <Ban className="size-3.5 me-2" />
                <span>{t("banStaff") || "Ban Staff"}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Bento Grid Layout for Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Info & Privileges (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Personal Information */}
          <Card className="toota-card border-none">
            <CardHeader className="p-6 pb-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <User className="size-4 text-toota-ink" />
                <span>{t("personalInformation") || "Personal Information"}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted block">
                    {t("fullName") || "Full Name"}
                  </span>
                  <p className="font-medium text-toota-ink mt-1 text-sm">
                    {staffName}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted block">
                    {t("birthDate") || "Birth Date"}
                  </span>
                  <p className="font-medium text-toota-ink mt-1">
                    {birthDateFormatted} {ageString}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted block">
                    {t("phone") || "Phone"}
                  </span>
                  <p className="font-mono font-medium text-toota-ink mt-1">
                    {staff.phoneNumber || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted block">
                    {t("emailAddress") || "Email Address"}
                  </span>
                  <p className="font-medium text-toota-ink mt-1">
                    {staff.email}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted block">
                    {t("gender") || "Gender"}
                  </span>
                  <p className="font-medium text-toota-ink mt-1">
                    {staff.gender === "MALE"
                      ? t("male") || "Male"
                      : staff.gender === "FEMALE"
                      ? t("female") || "Female"
                      : staff.gender || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted block">
                    {t("username") || "Username"}
                  </span>
                  <p className="font-mono font-medium text-toota-ink mt-1">
                    @{staff.userName || "—"}
                  </p>
                </div>

                {facility && (
                  <div className="sm:col-span-2 pt-3 border-t border-border/40">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-toota-muted block">
                      {t("companyName") || "Facility"}
                    </span>
                    <p className="font-medium text-toota-ink mt-1 flex items-center gap-1.5">
                      <Building className="size-3.5 text-toota-muted" />
                      <span>{facility}</span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section: Operational Privileges */}
          <Card className="toota-card border-none">
            <CardHeader className="p-6 pb-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="size-4 text-toota-ink" />
                <span>{t("operationalRoles") || "Operational Privileges"}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-toota-inner rounded-xl border border-border/40 space-y-1">
                  <p className="text-xs font-semibold text-toota-ink">
                    {t("memberManagement") || "Member Directory"}
                  </p>
                  <p className="text-[11px] text-toota-muted">
                    {t("memberManagementDesc") || "Lookup, onboard, and assist gym members."}
                  </p>
                </div>

                <div className="p-3.5 bg-toota-inner rounded-xl border border-border/40 space-y-1">
                  <p className="text-xs font-semibold text-toota-ink">
                    {t("facilityCheckin") || "Terminal Check-In"}
                  </p>
                  <p className="text-[11px] text-toota-muted">
                    {t("facilityCheckinDesc") || "Validate member QR passes & log arrivals."}
                  </p>
                </div>

                <div className="p-3.5 bg-toota-inner rounded-xl border border-border/40 space-y-1">
                  <p className="text-xs font-semibold text-toota-ink">
                    {t("subscriptionRoster") || "Plan Inspection"}
                  </p>
                  <p className="text-[11px] text-toota-muted">
                    {t("subscriptionRosterDesc") || "Inspect membership plan validity & expiry."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status & Supervisor (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Account Status Card */}
          <Card className="toota-card border-none">
            <CardHeader className="p-6 pb-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserCheck className="size-4 text-toota-ink" />
                <span>{t("staffAccountStatus") || "Account Status"}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="p-4 bg-toota-inner rounded-xl border border-border/40 flex items-center justify-between">
                <span className="text-xs font-medium text-toota-ink">
                  {t("status") || "Status"}
                </span>
                {renderStaffStatusBadge(status)}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-toota-muted">
                  <span>{t("roleText") || "Assigned Role"}</span>
                  <span className="font-medium text-toota-ink">
                    {staff.role || "STAFF"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-toota-muted">
                  <span>{t("joinedDate") || "Joined Date"}</span>
                  <span className="font-medium text-toota-ink">
                    {staff.createdAt
                      ? new Date(staff.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-toota-muted">
                  <span>{t("lastUpdated") || "Last Updated"}</span>
                  <span className="font-medium text-toota-ink">
                    {staff.updatedAt
                      ? new Date(staff.updatedAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supervisor Card (if admin info exists) */}
          {staff.admin && (
            <Card className="toota-card border-none">
              <CardHeader className="p-6 pb-3 border-b border-border/40">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
                  {t("gymAdministrator") || "Supervising Admin"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 ring-1 ring-border/40 shrink-0">
                    {adminAvatarUrl && (
                      <AvatarImage
                        src={adminAvatarUrl}
                        alt={`${staff.admin.firstName || ""} ${staff.admin.lastName || ""}`.trim() || "Admin"}
                      />
                    )}
                    <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                      {adminInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-toota-ink truncate">
                      {staff.admin.firstName} {staff.admin.lastName}
                    </p>
                    <p className="text-xs text-toota-muted truncate">
                      {staff.admin.userName
                        ? `@${staff.admin.userName}`
                        : staff.admin.email || staff.admin.role || "Admin"}
                    </p>
                    {staff.admin.companyName && (
                      <p className="text-[11px] text-toota-muted truncate mt-0.5">
                        {staff.admin.companyName}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Navigation Card */}
          <Card className="toota-card border-none p-4">
            <Link href="/staffs" className="w-full">
              <Button
                variant="outline"
                className="toota-pill h-10 w-full text-xs font-semibold justify-center border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
              >
                <ArrowLeft className="size-4 me-2 rtl:rotate-180" />
                <span>{t("backToAllStaffs") || "Back to Staff Roster"}</span>
              </Button>
            </Link>
          </Card>
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
