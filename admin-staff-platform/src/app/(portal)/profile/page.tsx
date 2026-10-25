"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Lock,
  Camera,
  Trash2,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Check,
  X,
  UserCheck,
  Info,
  QrCode,
  Users,
  MessageSquareQuote,
  ShieldAlert,
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
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
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
      password: "",
    },
  });

  const watchPassword = watch("password") || "";

  // Password requirement checks for visual helper
  const passChecks = {
    length: watchPassword.length >= 8,
    upper: /[A-Z]/.test(watchPassword),
    lower: /[a-z]/.test(watchPassword),
    number: /[0-9]/.test(watchPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(watchPassword),
  };

  const syncAdminLocalStorage = (data: AdminProfile) => {
    try {
      const stored = localStorage.getItem("gym_user") || localStorage.getItem("kinetic_user");
      const current = stored ? JSON.parse(stored) : {};
      const updated = {
        ...current,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        companyName: data.companyName,
        role: data.role,
        photo:
          data.profileImageUrl &&
          data.profileImageUrl !== "default-image.jpg" &&
          data.profileImageUrl !== "default-member-image.jpg"
            ? data.profileImageUrl
            : null,
      };
      localStorage.setItem("gym_user", JSON.stringify(updated));
      localStorage.removeItem("kinetic_user");
      window.dispatchEvent(new Event("storage"));
    } catch {
      // ignore localStorage sync error
    }
  };

  const syncStaffLocalStorage = (data: StaffProfile) => {
    try {
      const stored = localStorage.getItem("gym_user") || localStorage.getItem("kinetic_user");
      const current = stored ? JSON.parse(stored) : {};
      const updated = {
        ...current,
        firstName: data.firstName,
        lastName: data.lastName,
        userName: data.userName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        companyName: data.companyName,
        role: "Staff",
        photo:
          data.profileImageUrl &&
          data.profileImageUrl !== "default-image.jpg" &&
          data.profileImageUrl !== "default-member-image.jpg"
            ? data.profileImageUrl
            : null,
      };
      localStorage.setItem("gym_user", JSON.stringify(updated));
      localStorage.removeItem("kinetic_user");
      window.dispatchEvent(new Event("storage"));
    } catch {
      // ignore localStorage sync error
    }
  };

  // Load Profile from backend based on role
  const loadProfile = async () => {
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
          password: "",
        });

        syncAdminLocalStorage(data);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load profile from backend");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserRoleLoading) {
      loadProfile();
    }
  }, [isStaff, isUserRoleLoading]);

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
      password: "",
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

      if (values.password && values.password.trim().length > 0) {
        payload.password = values.password.trim();
      }

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
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-body-md text-on-surface-variant font-medium">
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
    const hasCustomPhoto =
      Boolean(staffProfile.profileImagePublicId) ||
      Boolean(
        staffProfile.profileImageUrl &&
          !staffProfile.profileImageUrl.includes("default-image.jpg") &&
          !staffProfile.profileImageUrl.includes("default-member-image.jpg")
      );

    const fullName =
      `${staffProfile.firstName || ""} ${staffProfile.lastName || ""}`.trim() ||
      staffProfile.userName;

    const initials =
      (staffProfile.firstName?.[0] || "") + (staffProfile.lastName?.[0] || "") ||
      (staffProfile.userName?.[0] || "S").toUpperCase();

    const isAccountActive =
      (staffProfile.accountStatus || "ACTIVE").toUpperCase() === "ACTIVE";

    return (
      <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in-50 duration-200">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
              {t("staffProfileTitle", "Staff Profile & Credentials")}
            </h1>
            <p className="text-body-md text-on-surface-variant">
              {t(
                "staffProfileSubtitle",
                "View your personal credentials, front desk permissions, and facility assignment."
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={loadProfile}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant text-on-surface text-sm font-semibold transition-colors cursor-pointer w-fit"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`}
            />
            <span>{t("refresh", "Refresh")}</span>
          </button>
        </div>

        {/* Staff Identity & Avatar Card */}
        <div className="p-6 sm:p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar Preview */}
            <div className="relative group">
              {hasCustomPhoto ? (
                <img
                  src={staffProfile.profileImageUrl}
                  alt={fullName}
                  className="w-28 h-28 rounded-2xl object-cover border-4 border-surface-container-low shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-primary/10 border-4 border-surface-container-low text-primary flex items-center justify-center font-black text-3xl shadow-md select-none">
                  {initials}
                </div>
              )}

              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Identity Details & Photo Actions */}
            <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="font-headline font-bold text-xl text-on-surface">
                  {fullName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  {staffProfile.role || "STAFF"}
                </span>
                {isAccountActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    {t("activeStaff", "Active Staff")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <ShieldAlert className="w-3 h-3" />
                    {staffProfile.accountStatus}
                  </span>
                )}
              </div>

              <p className="text-sm text-on-surface-variant font-mono">
                @{staffProfile.userName}
              </p>

              {staffProfile.companyName && (
                <p className="text-xs text-primary font-bold flex items-center justify-center sm:justify-start gap-1">
                  <Building className="w-3.5 h-3.5" />
                  {staffProfile.companyName}
                </p>
              )}

              {/* Photo Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto || isDeletingPhoto}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl primary-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>{t("changePhoto", "Change Photo")}</span>
                </button>

                {hasCustomPhoto && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={isUploadingPhoto || isDeletingPhoto}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-error hover:bg-error/10 border border-error/20 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isDeletingPhoto ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>{t("removePhoto", "Remove")}</span>
                  </button>
                )}

                <span className="text-[11px] text-on-surface-variant/80">
                  {t("maxPhotoSize", "Max 1MB (PNG, JPG, WebP)")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Read-Only Notice Badge */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3 text-xs text-on-surface-variant">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t(
              "staffInfoNotice",
              "Account details and operational assignments are managed by your Gym Administrator. Contact your facility manager to request profile updates."
            )}
          </p>
        </div>

        {/* Grid of Staff Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Personal Information */}
          <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-headline font-bold text-base text-on-surface">
                {t("personalInformation", "Personal Information")}
              </h3>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant text-xs font-medium">
                  {t("firstName", "First Name")}
                </span>
                <span className="font-semibold text-on-surface">
                  {staffProfile.firstName || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant text-xs font-medium">
                  {t("lastName", "Last Name")}
                </span>
                <span className="font-semibold text-on-surface">
                  {staffProfile.lastName || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant text-xs font-medium">
                  {t("username", "Username")}
                </span>
                <span className="font-mono text-xs font-semibold text-primary">
                  @{staffProfile.userName}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant text-xs font-medium">
                  {t("gender", "Gender")}
                </span>
                <span className="font-semibold text-on-surface capitalize">
                  {staffProfile.gender?.toLowerCase() || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-on-surface-variant text-xs font-medium">
                  {t("birthDate", "Birth Date")}
                </span>
                <span className="font-semibold text-on-surface flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-on-surface-variant" />
                  {formatBirthDate(staffProfile.birthDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Information */}
          <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant">
              <Mail className="w-5 h-5 text-secondary" />
              <h3 className="font-headline font-bold text-base text-on-surface">
                {t("contactInformation", "Contact Information")}
              </h3>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant text-xs font-medium">
                  {t("emailAddress", "Email Address")}
                </span>
                <span className="font-semibold text-on-surface text-xs truncate max-w-[200px]">
                  {staffProfile.email || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant text-xs font-medium">
                  {t("phoneNumber", "Phone Number")}
                </span>
                <span className="font-semibold text-on-surface flex items-center gap-1 text-xs font-mono">
                  <Phone className="w-3.5 h-3.5 text-on-surface-variant" />
                  {staffProfile.phoneNumber || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-on-surface-variant text-xs font-medium">
                  {t("accountStatus", "Account Status")}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {staffProfile.accountStatus || "ACTIVE"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Facility & Management Assignment */}
          <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant">
              <Building className="w-5 h-5 text-tertiary" />
              <h3 className="font-headline font-bold text-base text-on-surface">
                {t("facilityDetails", "Facility & Team Assignment")}
              </h3>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant text-xs font-medium">
                  {t("facility", "Facility")}
                </span>
                <span className="font-bold text-on-surface text-xs">
                  {staffProfile.companyName || staffProfile.admin?.companyName || companyName || "—"}
                </span>
              </div>

              {staffProfile.admin && (
                <>
                  <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                    <span className="text-on-surface-variant text-xs font-medium">
                      {t("assignedAdministrator", "Assigned Administrator")}
                    </span>
                    <span className="font-semibold text-on-surface text-xs">
                      {[staffProfile.admin.firstName, staffProfile.admin.lastName]
                        .filter(Boolean)
                        .join(" ") || "Administrator"}
                    </span>
                  </div>

                  {staffProfile.admin.email && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-on-surface-variant text-xs font-medium">
                        {t("adminEmail", "Admin Email")}
                      </span>
                      <span className="font-mono text-xs text-on-surface-variant">
                        {staffProfile.admin.email}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card 4: Role & Operational Access */}
          <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="font-headline font-bold text-base text-on-surface">
                {t("accountPermissions", "Role & Operational Permissions")}
              </h3>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs">
                <div className="flex items-center gap-2 font-medium text-on-surface">
                  <QrCode className="w-4 h-4 text-primary" />
                  <span>{t("qrCheckinAccess", "QR Code & Manual Check-In")}</span>
                </div>
                <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-wider">
                  {t("enabled", "Enabled")}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs">
                <div className="flex items-center gap-2 font-medium text-on-surface">
                  <Users className="w-4 h-4 text-secondary" />
                  <span>{t("memberDirectoryAccess", "Member Directory & Attendance")}</span>
                </div>
                <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-wider">
                  {t("enabled", "Enabled")}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs">
                <div className="flex items-center gap-2 font-medium text-on-surface">
                  <MessageSquareQuote className="w-4 h-4 text-tertiary" />
                  <span>{t("feedbackAccess", "Member Feedback & Reviews")}</span>
                </div>
                <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-wider">
                  {t("enabled", "Enabled")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: ADMINISTRATOR PROFILE VIEW & FORM
  // ==========================================
  const hasCustomPhoto =
    Boolean(profile?.profileImagePublicId) ||
    Boolean(
      profile?.profileImageUrl &&
        !profile.profileImageUrl.includes("default-image.jpg") &&
        !profile.profileImageUrl.includes("default-member-image.jpg")
    );

  const savedFullName = profile
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.userName
    : "Administrator";

  const savedCompany = profile?.companyName || "";

  const savedInitials = profile
    ? (profile.firstName?.[0] || "") + (profile.lastName?.[0] || "") ||
      (profile.userName?.[0] || "A").toUpperCase()
    : "A";

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            {t("settingsTitle", "Account & Facility Settings")}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {t(
              "settingsSubtitle",
              "Manage your profile details, operational preferences, and gym information."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={loadProfile}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant text-on-surface text-sm font-semibold transition-colors cursor-pointer w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          <span>{t("refresh", "Refresh")}</span>
        </button>
      </div>

      {/* Avatar & Stable Identity Banner */}
      <div className="p-6 sm:p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar Preview */}
          <div className="relative group">
            {hasCustomPhoto ? (
              <img
                src={profile?.profileImageUrl}
                alt={savedFullName}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-surface-container-low shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-primary/10 border-4 border-surface-container-low text-primary flex items-center justify-center font-black text-3xl shadow-md select-none">
                {savedInitials}
              </div>
            )}

            {isUploadingPhoto && (
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-headline font-bold text-xl text-on-surface">
                {savedFullName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {profile?.role || "ADMIN"}
              </span>
              {profile?.isAccountVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  {t("verified", "Verified")}
                </span>
              )}
            </div>

            <p className="text-sm text-on-surface-variant font-mono">
              @{profile?.userName}
            </p>

            {savedCompany && (
              <p className="text-xs text-primary font-bold flex items-center justify-center sm:justify-start gap-1">
                <Building className="w-3.5 h-3.5" />
                {savedCompany}
              </p>
            )}

            {/* Photo Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto || isDeletingPhoto}
                className="flex items-center gap-2 px-4 py-2 rounded-xl primary-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>{t("changePhoto", "Change Photo")}</span>
              </button>

              {hasCustomPhoto && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  disabled={isUploadingPhoto || isDeletingPhoto}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-error hover:bg-error/10 border border-error/20 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeletingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{t("removePhoto", "Remove")}</span>
                </button>
              )}

              <span className="text-[11px] text-on-surface-variant/80">
                {t("maxPhotoSize", "Max 1MB (PNG, JPG, WebP)")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form managed by React Hook Form & Zod */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section: Personal Information */}
        <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-headline font-bold text-base text-on-surface">
              {t("personalInformation", "Personal Information")}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                {t("firstName", "First Name")} <span className="text-error">*</span>
              </label>
              <input
                type="text"
                {...register("firstName")}
                placeholder="e.g. Alexander"
                className={`w-full px-3.5 py-2.5 bg-surface-container-low border ${
                  errors.firstName
                    ? "border-error focus:ring-error"
                    : "border-outline-variant focus:ring-primary-container"
                } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all`}
              />
              {errors.firstName && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.firstName.message}</span>
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                {t("lastName", "Last Name")} <span className="text-error">*</span>
              </label>
              <input
                type="text"
                {...register("lastName")}
                placeholder="e.g. Sterling"
                className={`w-full px-3.5 py-2.5 bg-surface-container-low border ${
                  errors.lastName
                    ? "border-error focus:ring-error"
                    : "border-outline-variant focus:ring-primary-container"
                } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all`}
              />
              {errors.lastName && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.lastName.message}</span>
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                {t("gender", "Gender")} <span className="text-error">*</span>
              </label>
              <select
                {...register("gender")}
                className={`w-full px-3.5 py-2.5 bg-surface-container-low border ${
                  errors.gender
                    ? "border-error focus:ring-error"
                    : "border-outline-variant focus:ring-primary-container"
                } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all cursor-pointer`}
              >
                <option value="MALE">{t("male", "Male")}</option>
                <option value="FEMALE">{t("female", "Female")}</option>
              </select>
              {errors.gender && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.gender.message}</span>
                </p>
              )}
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                {t("birthDate", "Birth Date")} <span className="text-error">*</span>
              </label>
              <input
                type="date"
                {...register("birthDate")}
                className={`w-full px-3.5 py-2.5 bg-surface-container-low border ${
                  errors.birthDate
                    ? "border-error focus:ring-error"
                    : "border-outline-variant focus:ring-primary-container"
                } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all cursor-pointer`}
              />
              {errors.birthDate && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.birthDate.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section: Contact & Gym Organization Details */}
        <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant">
            <Building className="w-5 h-5 text-secondary" />
            <h3 className="font-headline font-bold text-base text-on-surface">
              {t("contactGymDetails", "Contact & Gym Organization Details")}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                {t("emailAddress", "Email Address")} <span className="text-error">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="e.g. alex.sterling@enterprise-fit.com"
                  className={`w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-surface-container-low border ${
                    errors.email
                      ? "border-error focus:ring-error"
                      : "border-outline-variant focus:ring-primary-container"
                  } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                {t("phoneNumberInternational", "Phone Number (International)")} <span className="text-error">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  type="tel"
                  {...register("phoneNumber")}
                  placeholder="e.g. +14155552671"
                  className={`w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-surface-container-low border ${
                    errors.phoneNumber
                      ? "border-error focus:ring-error"
                      : "border-outline-variant focus:ring-primary-container"
                  } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all`}
                />
              </div>
              {errors.phoneNumber ? (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.phoneNumber.message}</span>
                </p>
              ) : (
                <p className="text-[11px] text-on-surface-variant/80 mt-1">
                  {t(
                    "phoneHelperText",
                    "Must include country code (e.g. +14155552671 or +212607080904)"
                  )}
                </p>
              )}
            </div>

            {/* Company / Gym Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                {t("companyGymName", "Company / Gym Facility Name")} <span className="text-error">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  type="text"
                  {...register("companyName")}
                  placeholder="e.g. Apex Performance Club"
                  className={`w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-surface-container-low border ${
                    errors.companyName
                      ? "border-error focus:ring-error"
                      : "border-outline-variant focus:ring-primary-container"
                  } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all`}
                />
              </div>
              {errors.companyName && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.companyName.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section: Security & Password Update */}
        <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-tertiary" />
              <h3 className="font-headline font-bold text-base text-on-surface">
                {t("securityPassword", "Security & Password")}
              </h3>
            </div>
            <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full w-fit">
              {t("leaveBlankOptional", "Optional • Leave blank to keep current password")}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="w-full">
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                {t("newPassword", "New Password")}
              </label>

              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder={t("leaveBlankPlaceholder", "Leave blank to keep current password")}
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-12 rtl:pl-12 rtl:pr-10 py-2.5 bg-surface-container-low border ${
                    errors.password
                      ? "border-error focus:ring-error"
                      : "border-outline-variant focus:ring-primary-container"
                  } rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 outline-none transition-all`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3.5 rtl:pr-0 rtl:pl-3.5 flex items-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Requirement Tracker */}
            {watchPassword.length > 0 && (
              <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/60 space-y-2 animate-in fade-in-0 duration-200">
                <p className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{t("passwordRequirements", "Password Requirements:")}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    className={`flex items-center gap-1.5 ${
                      passChecks.length ? "text-emerald-500 font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {passChecks.length ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-on-surface-variant/50" />}
                    <span>{t("reqLength", "At least 8 characters")}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passChecks.upper ? "text-emerald-500 font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {passChecks.upper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-on-surface-variant/50" />}
                    <span>{t("reqUpper", "One uppercase letter")}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passChecks.lower ? "text-emerald-500 font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {passChecks.lower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-on-surface-variant/50" />}
                    <span>{t("reqLower", "One lowercase letter")}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passChecks.number ? "text-emerald-500 font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {passChecks.number ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-on-surface-variant/50" />}
                    <span>{t("reqNumber", "One number")}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 sm:col-span-2 ${
                      passChecks.special ? "text-emerald-500 font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {passChecks.special ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-on-surface-variant/50" />}
                    <span>{t("reqSpecial", "One special symbol (!@#$%^&*...)")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors cursor-pointer"
          >
            {t("cancelRevert", "Cancel / Revert")}
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 primary-gradient text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? t("savingProfile", "Saving Profile...") : t("saveProfile", "Save Profile")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const { role, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (role === "Member") {
    return <MemberProfileView />;
  }

  return <AdminStaffProfileView />;
}
