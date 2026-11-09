"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Camera,
  Trash2,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Info,
  QrCode,
  Users,
  MessageSquareQuote,
  UserCheck,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  fetchAdminProfile,
  updateAdminProfile,
  uploadAdminProfileImage,
  deleteAdminProfileImage,
  fetchStaffProfile,
  uploadStaffProfileImage,
  deleteStaffProfileImage,
} from "@/lib/api/profile";
import { AdminProfile, StaffProfile, Gender, UpdateProfileInput } from "@/types/profile";
import {
  updateProfileSchema,
  UpdateProfileFormValues,
} from "@/schemas/profile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import MemberProfileView from "@/components/profile/MemberProfileView";
import EmailChangeSection from "@/components/profile/EmailChangeSection";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

const syncAdminLocalStorage = (data: AdminProfile) => {
  try {
    const stored = localStorage.getItem("gym_user");
    const current = stored ? JSON.parse(stored) : {};
    const isPlaceholder =
      !data.profileImageUrl ||
      data.profileImageUrl === "default-image.jpg" ||
      data.profileImageUrl === "default-member-image.jpg";
    const updated = {
      ...current,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      companyName: data.companyName,
      role: data.role,
      photo: !isPlaceholder ? data.profileImageUrl : null,
    };
    localStorage.setItem("gym_user", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore localStorage sync error
  }
};

const syncStaffLocalStorage = (data: StaffProfile) => {
  try {
    const stored = localStorage.getItem("gym_user");
    const current = stored ? JSON.parse(stored) : {};
    const isPlaceholder =
      !data.profileImageUrl ||
      data.profileImageUrl === "default-image.jpg" ||
      data.profileImageUrl === "default-member-image.jpg";
    const updated = {
      ...current,
      firstName: data.firstName,
      lastName: data.lastName,
      userName: data.userName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      companyName: data.companyName,
      role: "Staff",
      photo: !isPlaceholder ? data.profileImageUrl : null,
    };
    localStorage.setItem("gym_user", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore localStorage sync error
  }
};

function AdminStaffProfileView() {
  const { t } = useTranslation();
  const { role: currentRole, isLoading: isUserRoleLoading, companyName } = useCurrentUser();
  const isStaff = currentRole === "Staff";

  // Admin Profile State
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  // Staff Profile State
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "MALE",
      birthDate: "",
      companyName: "",
      email: "",
      phoneNumber: "",
    },
  });

  // Load Profile from backend based on role
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isStaff) {
        // Staff Profile Endpoint: GET /api/users/staffs/me
        const data = await fetchStaffProfile();
        setStaffProfile(data);
        syncStaffLocalStorage(data);
      } else {
        // Admin Profile Endpoint: GET /api/users/admins/me
        const data = await fetchAdminProfile();
        setProfile(data);

        let formattedDate = "";
        if (data.birthDate) {
          const d = new Date(data.birthDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split("T")[0];
          }
        }

        // Reset form with loaded server data
        reset({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          gender: (data.gender as Gender) || "MALE",
          birthDate: formattedDate,
          companyName: data.companyName || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
        });

        syncAdminLocalStorage(data);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("loadProfileFailed") || "Failed to load profile from backend");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isStaff, reset, t]);

  useEffect(() => {
    if (!isUserRoleLoading) {
      loadProfile();
    }
  }, [isUserRoleLoading, loadProfile]);

  // Revert form to current saved backend admin profile
  const handleReset = () => {
    if (!profile) return;
    let formattedDate = "";
    if (profile.birthDate) {
      const d = new Date(profile.birthDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split("T")[0];
      }
    }
    reset({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      gender: (profile.gender as Gender) || "MALE",
      birthDate: formattedDate,
      companyName: profile.companyName || "",
      email: profile.email || "",
      phoneNumber: profile.phoneNumber || "",
    });
  };

  // Submit admin profile edits validated by Zod
  const onSubmit = async (values: UpdateProfileFormValues) => {
    setIsSaving(true);
    try {
      const payload: UpdateProfileInput = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim(),
        companyName: values.companyName.trim(),
        gender: values.gender,
        birthDate: values.birthDate,
      };

      await updateAdminProfile(payload);
      toast.success(t("profileUpdatedSuccess", "Profile updated successfully!"));
      await loadProfile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        const msg = err.response.data.message;
        if (Array.isArray(msg)) {
          msg.forEach((m) => toast.error(m));
        } else {
          toast.error(msg);
        }
      } else {
        toast.error("Failed to update profile. Please verify your details.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Photo File Upload (Supports both Staff and Admin endpoints)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (file.size > 1024 * 1024) {
      toast.error(t("maxPhotoSize", "Image file size must be less than 1MB"));
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files (JPEG, PNG, WebP) are supported");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      if (isStaff) {
        // Staff Photo Upload: POST /api/users/staffs/profile-image
        await uploadStaffProfileImage(file);
      } else {
        // Admin Photo Upload: POST /api/users/admins/profile-image
        await uploadAdminProfileImage(file);
      }
      toast.success(t("photoUpdatedSuccess", "Profile picture updated successfully!"));
      await loadProfile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to upload profile picture");
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Photo Deletion (Supports both Staff and Admin endpoints)
  const handleDeletePhoto = async () => {
    setIsDeletingPhoto(true);
    try {
      if (isStaff) {
        // Staff Photo Delete: DELETE /api/users/staffs/profile-image
        await deleteStaffProfileImage();
      } else {
        // Admin Photo Delete: DELETE /api/users/admins/profile-image
        await deleteAdminProfileImage();
      }
      toast.success(t("photoRemovedSuccess", "Profile picture removed successfully!"));
      await loadProfile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to remove profile picture");
      }
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const formatBirthDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if ((isLoading && !profile && !staffProfile) || isUserRoleLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 text-toota-ink animate-spin" />
        <p className="text-xs text-toota-muted">
          {isStaff
            ? t("loadingStaffProfile", "Loading staff profile...")
            : t("loadingProfile", "Loading administrator profile...")}
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER: STAFF PROFILE VIEW
  // ==========================================
  if (isStaff && staffProfile) {
    const rawPhoto = staffProfile.profileImageUrl;
    const isPlaceholder =
      !rawPhoto ||
      rawPhoto === "default-image.jpg" ||
      rawPhoto === "default-member-image.jpg";
    const photoUrl = !isPlaceholder ? rawPhoto : null;
    const canDeletePhoto =
      Boolean(photoUrl) &&
      !photoUrl?.includes("avatars-default") &&
      !photoUrl?.includes("default-image");

    const fullName =
      `${staffProfile.firstName || ""} ${staffProfile.lastName || ""}`.trim() ||
      staffProfile.userName ||
      "Staff Member";

    const initials =
      ((staffProfile.firstName?.[0] || "") + (staffProfile.lastName?.[0] || "")).toUpperCase() ||
      staffProfile.userName?.slice(0, 2).toUpperCase() ||
      "S";

    const isAccountActive =
      (staffProfile.accountStatus || "ACTIVE").toUpperCase() === "ACTIVE";

    const facility =
      staffProfile.companyName ||
      staffProfile.admin?.companyName ||
      companyName ||
      "";

    return (
      <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
        {/* Top Header Card */}
        <Card className="toota-card border-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {t("staffProfileTitle", "Staff Profile & Credentials")}
                </h1>
                {facility && (
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                    / {facility}
                  </span>
                )}
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / @{staffProfile.userName}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
                {t(
                  "staffProfileSubtitle",
                  "View your personal credentials, front desk permissions, and facility assignment."
                )}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={loadProfile}
              disabled={isLoading}
              className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer self-start md:self-auto"
            >
              <RefreshCw
                className={`size-3.5 me-2 ${isLoading ? "animate-spin text-toota-ink" : ""}`}
              />
              <span>{t("refresh", "Refresh")}</span>
            </Button>
          </div>
        </Card>

        {/* Staff Identity & Avatar Card */}
        <Card className="toota-card border-none">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar Preview */}
            <div className="relative group shrink-0">
              <Avatar className="size-24 md:size-28 ring-2 ring-border/40 shrink-0">
                {photoUrl && (
                  <AvatarImage src={photoUrl} alt={fullName} />
                )}
                <AvatarFallback className="bg-toota-inner text-toota-ink font-bold text-2xl md:text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <Loader2 className="size-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Identity Details & Photo Actions */}
            <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {fullName}
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400">
                  <UserCheck className="size-3 text-zinc-500 shrink-0" />
                  <span>{staffProfile.role || "Staff"}</span>
                </span>
                {isAccountActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{t("activeStaff", "Active Staff")}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{staffProfile.accountStatus}</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-toota-muted font-mono">
                @{staffProfile.userName}
              </p>

              {facility && (
                <p className="text-xs text-toota-ink font-medium flex items-center justify-center sm:justify-start gap-1.5">
                  <Building className="size-3.5 text-toota-muted" />
                  <span>{facility}</span>
                </p>
              )}

              {/* Photo Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto || isDeletingPhoto}
                  className="toota-pill h-9 px-4 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="size-3.5 animate-spin me-1.5" />
                  ) : (
                    <Camera className="size-3.5 me-1.5" />
                  )}
                  <span>{t("changePhoto", "Change Photo")}</span>
                </Button>

                {canDeletePhoto && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeletePhoto}
                    disabled={isUploadingPhoto || isDeletingPhoto}
                    className="toota-pill h-9 px-3 text-xs font-semibold border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer disabled:opacity-50"
                  >
                    {isDeletingPhoto ? (
                      <Loader2 className="size-3.5 animate-spin me-1.5" />
                    ) : (
                      <Trash2 className="size-3.5 me-1.5" />
                    )}
                    <span>{t("removePhoto", "Remove")}</span>
                  </Button>
                )}

                <span className="text-[11px] font-mono text-toota-muted">
                  {t("maxPhotoSize", "Max 1MB (PNG, JPG, WebP)")}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Read-Only Notice */}
        <div className="p-4 bg-toota-inner border border-border/40 rounded-xl flex items-start gap-3 text-xs text-toota-muted">
          <Info className="size-4 text-toota-ink shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t(
              "staffInfoNotice",
              "Account details and operational assignments are managed by your Gym Administrator. Contact your facility manager to request profile updates."
            )}
          </p>
        </div>

        {/* Grid of Staff Information Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Personal Information */}
          <Card className="toota-card border-none">
            <CardHeader className="p-6 pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <User className="size-4 text-toota-ink" />
                <span>{t("personalInformation", "Personal Information")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-toota-muted font-medium">
                    {t("firstName", "First Name")}
                  </span>
                  <span className="font-semibold text-toota-ink">
                    {staffProfile.firstName || "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-toota-muted font-medium">
                    {t("lastName", "Last Name")}
                  </span>
                  <span className="font-semibold text-toota-ink">
                    {staffProfile.lastName || "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-toota-muted font-medium">
                    {t("username", "Username")}
                  </span>
                  <span className="font-mono text-xs font-semibold text-toota-ink">
                    @{staffProfile.userName}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-toota-muted font-medium">
                    {t("gender", "Gender")}
                  </span>
                  <span className="font-semibold text-toota-ink capitalize">
                    {staffProfile.gender?.toLowerCase() || "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-toota-muted font-medium">
                    {t("birthDate", "Birth Date")}
                  </span>
                  <span className="font-semibold text-toota-ink flex items-center gap-1.5 text-xs">
                    <Calendar className="size-3.5 text-toota-muted" />
                    {formatBirthDate(staffProfile.birthDate)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Contact Information */}
          <Card className="toota-card border-none">
            <CardHeader className="p-6 pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Mail className="size-4 text-toota-ink" />
                <span>{t("contactInformation", "Contact Information")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-toota-muted font-medium">
                    {t("emailAddress", "Email Address")}
                  </span>
                  <span className="font-semibold text-toota-ink text-xs truncate max-w-[200px]">
                    {staffProfile.email || "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-toota-muted font-medium">
                    {t("phoneNumber", "Phone Number")}
                  </span>
                  <span className="font-semibold text-toota-ink flex items-center gap-1 font-mono">
                    <Phone className="size-3.5 text-toota-muted" />
                    {staffProfile.phoneNumber || "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-toota-muted font-medium">
                    {t("accountStatus", "Account Status")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{staffProfile.accountStatus || "Active"}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Facility & Management Assignment */}
          <Card className="toota-card border-none">
            <CardHeader className="p-6 pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Building className="size-4 text-toota-ink" />
                <span>{t("facilityDetails", "Facility & Team Assignment")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-toota-muted font-medium">
                    {t("facility", "Facility")}
                  </span>
                  <span className="font-bold text-toota-ink text-xs">
                    {facility || "—"}
                  </span>
                </div>

                {staffProfile.admin && (
                  <>
                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                      <span className="text-toota-muted font-medium">
                        {t("assignedAdministrator", "Assigned Administrator")}
                      </span>
                      <span className="font-semibold text-toota-ink text-xs">
                        {[staffProfile.admin.firstName, staffProfile.admin.lastName]
                          .filter(Boolean)
                          .join(" ") || "Administrator"}
                      </span>
                    </div>

                    {staffProfile.admin.email && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-toota-muted font-medium">
                          {t("adminEmail", "Admin Email")}
                        </span>
                        <span className="font-mono text-xs text-toota-muted">
                          {staffProfile.admin.email}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Role & Operational Access */}
          <Card className="toota-card border-none">
            <CardHeader className="p-6 pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="size-4 text-toota-ink" />
                <span>{t("accountPermissions", "Role & Operational Permissions")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-toota-inner border border-border/40 text-xs">
                  <div className="flex items-center gap-2 font-medium text-toota-ink">
                    <QrCode className="size-4 text-toota-ink" />
                    <span>{t("qrCheckinAccess", "QR Code & Manual Check-In")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{t("enabled", "Enabled")}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-toota-inner border border-border/40 text-xs">
                  <div className="flex items-center gap-2 font-medium text-toota-ink">
                    <Users className="size-4 text-toota-ink" />
                    <span>{t("memberDirectoryAccess", "Member Directory & Attendance")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{t("enabled", "Enabled")}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-toota-inner border border-border/40 text-xs">
                  <div className="flex items-center gap-2 font-medium text-toota-ink">
                    <MessageSquareQuote className="size-4 text-toota-ink" />
                    <span>{t("feedbackAccess", "Member Feedback & Reviews")}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{t("enabled", "Enabled")}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Change Section for Staff */}
          <div className="md:col-span-2">
            <EmailChangeSection
              role="staff"
              currentEmail={staffProfile.email || ""}
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: ADMINISTRATOR PROFILE VIEW & FORM
  // ==========================================
  const rawPhoto = profile?.profileImageUrl;
  const isPlaceholder =
    !rawPhoto ||
    rawPhoto === "default-image.jpg" ||
    rawPhoto === "default-member-image.jpg";
  const photoUrl = !isPlaceholder ? rawPhoto : null;
  const canDeletePhoto =
    Boolean(photoUrl) &&
    !photoUrl?.includes("avatars-default") &&
    !photoUrl?.includes("default-image");

  const savedFullName = profile
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.userName
    : "Administrator";

  const savedCompany = profile?.companyName || companyName || "";

  const savedInitials = profile
    ? ((profile.firstName?.[0] || "") + (profile.lastName?.[0] || "")).toUpperCase() ||
      profile.userName?.slice(0, 2).toUpperCase() ||
      "A"
    : "A";

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Top Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("settingsTitle", "Account & Facility Settings")}
              </h1>
              {savedCompany && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {savedCompany}
                </span>
              )}
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {profile?.role || "ADMIN"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t(
                "settingsSubtitle",
                "Manage your profile details, operational preferences, and gym information."
              )}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={loadProfile}
            disabled={isLoading}
            className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`size-3.5 me-2 ${isLoading ? "animate-spin text-toota-ink" : ""}`} />
            <span>{t("refresh", "Refresh")}</span>
          </Button>
        </div>
      </Card>

      {/* Avatar & Stable Identity Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            <Avatar className="size-24 md:size-28 ring-2 ring-border/40 shrink-0">
              {photoUrl && (
                <AvatarImage src={photoUrl} alt={savedFullName} />
              )}
              <AvatarFallback className="bg-toota-inner text-toota-ink font-bold text-2xl md:text-3xl">
                {savedInitials}
              </AvatarFallback>
            </Avatar>

            {isUploadingPhoto && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <Loader2 className="size-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {savedFullName}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400">
                <ShieldCheck className="size-3 text-zinc-500 shrink-0" />
                <span>{profile?.role || "Admin"}</span>
              </span>
              {profile?.isAccountVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{t("verified", "Verified")}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-toota-muted font-mono">
              @{profile?.userName}
            </p>

            {savedCompany && (
              <p className="text-xs text-toota-ink font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <Building className="size-3.5 text-toota-muted" />
                <span>{savedCompany}</span>
              </p>
            )}

            {/* Photo Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto || isDeletingPhoto}
                className="toota-pill h-9 px-4 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="size-3.5 animate-spin me-1.5" />
                ) : (
                  <Camera className="size-3.5 me-1.5" />
                )}
                <span>{t("changePhoto", "Change Photo")}</span>
              </Button>

              {canDeletePhoto && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDeletePhoto}
                  disabled={isUploadingPhoto || isDeletingPhoto}
                  className="toota-pill h-9 px-3 text-xs font-semibold border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingPhoto ? (
                    <Loader2 className="size-3.5 animate-spin me-1.5" />
                  ) : (
                    <Trash2 className="size-3.5 me-1.5" />
                  )}
                  <span>{t("removePhoto", "Remove")}</span>
                </Button>
              )}

              <span className="text-[11px] font-mono text-toota-muted">
                {t("maxPhotoSize", "Max 1MB (PNG, JPG, WebP)")}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Settings Form managed by React Hook Form & Zod */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section: Personal Information */}
        <Card className="toota-card border-none">
          <CardHeader className="p-6 pb-4 border-b border-border/40">
            <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <User className="size-4 text-toota-ink" />
              <span>{t("personalInformation", "Personal Information")}</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-toota-ink">
                  {t("firstName", "First Name")} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  {...register("firstName")}
                  placeholder="e.g. Alexander"
                  className={`h-10 bg-toota-inner text-xs text-toota-ink rounded-xl ${
                    errors.firstName
                      ? "border-rose-500 focus-visible:ring-rose-500"
                      : "border-border/40 focus-visible:ring-zinc-400"
                  }`}
                />
                {errors.firstName && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{errors.firstName.message}</span>
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-toota-ink">
                  {t("lastName", "Last Name")} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  {...register("lastName")}
                  placeholder="e.g. Sterling"
                  className={`h-10 bg-toota-inner text-xs text-toota-ink rounded-xl ${
                    errors.lastName
                      ? "border-rose-500 focus-visible:ring-rose-500"
                      : "border-border/40 focus-visible:ring-zinc-400"
                  }`}
                />
                {errors.lastName && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{errors.lastName.message}</span>
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-toota-ink">
                  {t("gender", "Gender")} <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("gender")}
                  className={`w-full h-10 px-3 bg-toota-inner border ${
                    errors.gender
                      ? "border-rose-500 focus:ring-rose-500"
                      : "border-border/40 focus:ring-zinc-400"
                  } rounded-xl text-xs text-toota-ink focus:outline-hidden focus:ring-1 cursor-pointer`}
                >
                  <option value="MALE">{t("male", "Male")}</option>
                  <option value="FEMALE">{t("female", "Female")}</option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{errors.gender.message}</span>
                  </p>
                )}
              </div>

              {/* Birth Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-toota-ink">
                  {t("birthDate", "Birth Date")} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  {...register("birthDate")}
                  className={`h-10 bg-toota-inner text-xs text-toota-ink rounded-xl ${
                    errors.birthDate
                      ? "border-rose-500 focus-visible:ring-rose-500"
                      : "border-border/40 focus-visible:ring-zinc-400"
                  }`}
                />
                {errors.birthDate && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{errors.birthDate.message}</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Contact & Gym Organization Details */}
        <Card className="toota-card border-none">
          <CardHeader className="p-6 pb-4 border-b border-border/40">
            <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building className="size-4 text-toota-ink" />
              <span>{t("contactGymDetails", "Contact & Gym Organization Details")}</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-toota-ink">
                    {t("emailAddress", "Email Address")} <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-toota-muted">
                    {t("changeEmailViaSection", "Use Email Change below")}
                  </span>
                </div>
                <div className="relative">
                  <Mail className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
                  <Input
                    type="email"
                    {...register("email")}
                    readOnly
                    disabled
                    title={t("useEmailChangeSection", "Use the dedicated Email Change section below to update your email")}
                    className="pl-10 rtl:pl-3.5 rtl:pr-10 h-10 bg-toota-inner/60 border-border/40 text-xs text-toota-muted opacity-80 cursor-not-allowed rounded-xl"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-toota-ink">
                  {t("phoneNumberInternational", "Phone Number (International)")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
                  <Input
                    type="tel"
                    {...register("phoneNumber")}
                    placeholder="e.g. +14155552671"
                    className={`pl-10 rtl:pl-3.5 rtl:pr-10 h-10 bg-toota-inner text-xs text-toota-ink rounded-xl font-mono ${
                      errors.phoneNumber
                        ? "border-rose-500 focus-visible:ring-rose-500"
                        : "border-border/40 focus-visible:ring-zinc-400"
                    }`}
                  />
                </div>
                {errors.phoneNumber ? (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{errors.phoneNumber.message}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-toota-muted">
                    {t(
                      "phoneHelperText",
                      "Must include country code (e.g. +14155552671 or +212607080904)"
                    )}
                  </p>
                )}
              </div>

              {/* Company / Gym Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-medium text-toota-ink">
                  {t("companyGymName", "Company / Gym Facility Name")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
                  <Input
                    type="text"
                    {...register("companyName")}
                    placeholder="e.g. Apex Performance Club"
                    className={`pl-10 rtl:pl-3.5 rtl:pr-10 h-10 bg-toota-inner text-xs text-toota-ink rounded-xl ${
                      errors.companyName
                        ? "border-rose-500 focus-visible:ring-rose-500"
                        : "border-border/40 focus-visible:ring-zinc-400"
                    }`}
                  />
                </div>
                {errors.companyName && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{errors.companyName.message}</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
            className="toota-pill h-10 px-5 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
          >
            {t("cancelRevert", "Cancel / Revert")}
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="toota-pill h-10 px-6 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin me-2" />
            ) : (
              <Save className="size-3.5 me-2" />
            )}
            <span>{isSaving ? t("savingProfile", "Saving Profile...") : t("saveProfile", "Save Profile")}</span>
          </Button>
        </div>
      </form>

      {/* Section: Email Change for Administrator */}
      <EmailChangeSection
        role="admin"
        currentEmail={profile?.email || ""}
      />
    </div>
  );
}

export default function ProfilePage() {
  const { role, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 text-toota-ink animate-spin" />
      </div>
    );
  }

  if (role === "Member") {
    return <MemberProfileView />;
  }

  return <AdminStaffProfileView />;
}
