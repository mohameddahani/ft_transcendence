"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  fetchAdminProfile,
  updateAdminProfile,
  uploadAdminProfileImage,
  deleteAdminProfileImage,
} from "@/lib/api/profile";
import { AdminProfile, Gender, UpdateProfileInput } from "@/types/profile";
import {
  updateProfileSchema,
  UpdateProfileFormValues,
} from "@/schemas/profile";

export default function SettingsPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
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
    formState: { errors, isDirty },
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

  // Load Admin Profile from backend
  const loadProfile = async () => {
    setIsLoading(true);
    try {
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

      syncLocalStorage(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load admin profile from backend");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const syncLocalStorage = (data: AdminProfile) => {
    try {
      const stored = localStorage.getItem("kinetic_user");
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
      localStorage.setItem("kinetic_user", JSON.stringify(updated));
    } catch {
      // ignore localStorage sync error
    }
  };

  // Revert form to current saved backend profile
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

  // Submit profile edits validated by Zod
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
      toast.success("Profile information updated successfully!");
      // Reload profile so the top banner and local cache update cleanly
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

  // Handle Photo File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (file.size > 1024 * 1024) {
      toast.error("Image file size must be less than 1MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files (JPEG, PNG, WebP) are supported");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await uploadAdminProfileImage(file);
      toast.success("Profile picture updated successfully!");
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

  // Handle Photo Deletion
  const handleDeletePhoto = async () => {
    setIsDeletingPhoto(true);
    try {
      await deleteAdminProfileImage();
      toast.success("Profile picture removed successfully!");
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

  // Check if current photo is custom (can be removed)
  const hasCustomPhoto =
    Boolean(profile?.profileImagePublicId) ||
    Boolean(
      profile?.profileImageUrl &&
        !profile.profileImageUrl.includes("default-image.jpg") &&
        !profile.profileImageUrl.includes("default-member-image.jpg")
    );

  // Stable display values derived SOLELY from saved profile (never changes while typing in inputs)
  const savedFullName = profile
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.userName
    : "Administrator";

  const savedCompany = profile?.companyName || "";

  const savedInitials = profile
    ? (profile.firstName?.[0] || "") + (profile.lastName?.[0] || "") ||
      (profile.userName?.[0] || "A").toUpperCase()
    : "A";

  if (isLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-body-md text-on-surface-variant font-medium">
          Loading administrator profile...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            Account & Profile Settings
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Manage your admin credentials, personal info, gym facility details, and avatar.
          </p>
        </div>

        <button
          type="button"
          onClick={loadProfile}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant text-on-surface text-sm font-semibold transition-colors cursor-pointer w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Avatar & Stable Identity Banner */}
      <div className="p-6 sm:p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar Preview */}
          <div className="relative group">
            {profile?.profileImageUrl &&
            profile.profileImageUrl !== "default-image.jpg" &&
            profile.profileImageUrl !== "default-member-image.jpg" ? (
              <img
                src={profile.profileImageUrl}
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

          {/* Details & Actions (Solely reflects saved backend profile) */}
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
                  Verified
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
                <span>Change Photo</span>
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
                  <span>Remove</span>
                </button>
              )}

              <span className="text-[11px] text-on-surface-variant/80">
                Max 1MB (PNG, JPG, WebP)
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
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                First Name <span className="text-error">*</span>
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
                Last Name <span className="text-error">*</span>
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
                Gender <span className="text-error">*</span>
              </label>
              <select
                {...register("gender")}
                className={`w-full px-3.5 py-2.5 bg-surface-container-low border ${
                  errors.gender
                    ? "border-error focus:ring-error"
                    : "border-outline-variant focus:ring-primary-container"
                } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all cursor-pointer`}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
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
                Birth Date <span className="text-error">*</span>
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
              Contact & Gym Organization Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                Email Address <span className="text-error">*</span>
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
                Phone Number (International) <span className="text-error">*</span>
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
                  Must include country code (e.g. +14155552671 or +212607080904)
                </p>
              )}
            </div>

            {/* Company / Gym Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                Company / Gym Facility Name <span className="text-error">*</span>
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

        {/* Section: Security & Password Update (Well-potted CSS and Clean Layout) */}
        <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-tertiary" />
              <h3 className="font-headline font-bold text-base text-on-surface">
                Security & Password
              </h3>
            </div>
            <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full w-fit">
              Optional • Leave blank to keep current password
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="w-full">
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                New Password
              </label>

              {/* Password Input with balanced padding and centered toggle */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Leave blank to keep current password"
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

            {/* Interactive requirement tracker when user types in password */}
            {watchPassword.length > 0 && (
              <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/60 space-y-2 animate-in fade-in-0 duration-200">
                <p className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Password Requirements:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    className={`flex items-center gap-1.5 ${
                      passChecks.length ? "text-emerald-500 font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {passChecks.length ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-on-surface-variant/50" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passChecks.upper ? "text-emerald-500 font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {passChecks.upper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-on-surface-variant/50" />}
                    <span>One uppercase letter</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passChecks.lower ? "text-emerald-500 font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {passChecks.lower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-on-surface-variant/50" />}
                    <span>One lowercase letter</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passChecks.number ? "text-emerald-500 font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {passChecks.number ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-on-surface-variant/50" />}
                    <span>One number</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 sm:col-span-2 ${
                      passChecks.special ? "text-emerald-500 font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {passChecks.special ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-on-surface-variant/50" />}
                    <span>One special symbol (!@#$%^&*...)</span>
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
            Cancel / Revert
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
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
