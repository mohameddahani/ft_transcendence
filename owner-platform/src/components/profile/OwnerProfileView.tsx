"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Camera,
  Trash2,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { OwnerProfile } from "@/types/owner-profile";
import {
  updateProfileSchema,
  UpdateProfileFormValues,
} from "@/schemas/owner-profile.schema";

export default function OwnerProfileView() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [deletingImage, setDeletingImage] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "MALE",
      birthDate: "",
      email: "",
      phoneNumber: "",
      companyName: "",
      password: "",
    },
  });

  // Fetch Owner Profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/users/owners/me");
      const data: OwnerProfile = res.data;
      setProfile(data);

      // Populate form
      reset({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        gender: data.gender || "MALE",
        birthDate: data.birthDate ? data.birthDate.split("T")[0] : "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        companyName: data.companyName || "",
        password: "",
      });
    } catch (err) {
      console.error("Failed to load owner profile:", err);
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (1MB)
    if (file.size > 1024 * 1024) {
      toast.error("Image file size must be less than 1MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, WEBP)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      await api.post("/api/users/owners/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Profile image updated successfully!");
      await fetchProfile();
      window.dispatchEvent(new Event("owner-profile-updated"));
    } catch (err: unknown) {
      console.error("Failed to upload image:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to upload profile image";
      toast.error(errorMsg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Image Deletion
  const handleConfirmDeleteImage = async () => {
    try {
      setDeletingImage(true);
      await api.delete("/api/users/owners/profile-image");

      toast.success("Profile image removed");
      setShowDeleteModal(false);
      await fetchProfile();
      window.dispatchEvent(new Event("owner-profile-updated"));
    } catch (err: unknown) {
      console.error("Failed to delete image:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to remove profile image";
      toast.error(errorMsg);
    } finally {
      setDeletingImage(false);
    }
  };

  // Handle Profile Update Submission
  const onSubmit = async (data: UpdateProfileFormValues) => {
    try {
      const payload: Record<string, unknown> = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gender: data.gender,
        birthDate: data.birthDate,
        email: data.email.trim(),
        phoneNumber: data.phoneNumber.replace(/\s+/g, ""),
        companyName: data.companyName.trim(),
      };

      if (data.password && data.password.trim().length > 0) {
        payload.password = data.password.trim();
      }

      await api.patch("/api/users/owners/edit-profile", payload);

      toast.success("Profile updated successfully!");
      await fetchProfile();
      window.dispatchEvent(new Event("owner-profile-updated"));
      setChangePasswordOpen(false);
    } catch (err: unknown) {
      console.error("Failed to update profile:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update profile";
      toast.error(errorMsg);
    }
  };

  const hasCustomAvatar =
    Boolean(profile?.profileImageUrl) &&
    !profile?.profileImageUrl.includes("default-image");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-body-md text-on-surface-variant">Loading profile information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-layout-margin max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
          Owner Profile
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-unit">
          Manage your personal credentials, contact details, and platform identity.
        </p>
      </div>

      {/* Hero / Avatar Card */}
      <div className="bg-surface-container border border-outline-variant rounded-xl p-layout-margin flex flex-col md:flex-row items-center md:items-start justify-between gap-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Avatar Container with Upload Overlay */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-secondary-container border-2 border-outline-variant flex items-center justify-center overflow-hidden shadow-md">
              {hasCustomAvatar ? (
                <img
                  src={profile?.profileImageUrl}
                  alt={`${profile?.firstName} ${profile?.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="size-12 text-on-secondary-container" />
              )}
            </div>

            {/* Quick Upload Hover Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
              title="Upload new profile photo"
            >
              {uploadingImage ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <Camera className="size-5" />
                  <span className="text-[10px] font-medium mt-0.5">Change</span>
                </>
              )}
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />

          {/* Owner Identity Summary */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[11px] font-label-caps font-bold">
                <ShieldCheck className="size-3" />
                PLATFORM OWNER
              </span>
            </div>

            <p className="font-mono-data text-body-sm text-primary">@{profile?.userName}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-on-surface-variant pt-1">
              <span className="flex items-center gap-1">
                <Building2 className="size-3.5" />
                {profile?.companyName}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" />
                {profile?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Avatar Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-on-surface px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {uploadingImage ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <Camera className="size-3.5 text-primary" />
            )}
            <span>{uploadingImage ? "Uploading..." : "Upload Photo"}</span>
          </button>

          {hasCustomAvatar && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deletingImage}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Remove custom profile picture"
            >
              <Trash2 className="size-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Edit Profile Form & Account Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-layout-margin items-start">
        {/* Left Column (2 spans): Edit Profile Form */}
        <div className="lg:col-span-2 bg-surface-container border border-outline-variant rounded-xl p-layout-margin shadow-sm">
          <div className="border-b border-outline-variant pb-3 mb-layout-margin">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Personal Information
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Update your basic contact details and identity information.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                  First Name
                </label>
                <input
                  {...register("firstName")}
                  type="text"
                  placeholder="Mohamed"
                  className="w-full bg-surface-container-high border border-outline-variant rounded px-3 py-2 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.firstName && (
                  <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                  Last Name
                </label>
                <input
                  {...register("lastName")}
                  type="text"
                  placeholder="Dahani"
                  className="w-full bg-surface-container-high border border-outline-variant rounded px-3 py-2 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.lastName && (
                  <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="mohamed@gmail.com"
                    className="w-full bg-surface-container-high border border-outline-variant rounded pl-9 pr-3 py-2 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50" />
                  <input
                    {...register("phoneNumber")}
                    type="tel"
                    placeholder="+212607080904"
                    className="w-full bg-surface-container-high border border-outline-variant rounded pl-9 pr-3 py-2 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-red-400 text-xs mt-1">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            {/* Company Name & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                  Company / Organization
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50" />
                  <input
                    {...register("companyName")}
                    type="text"
                    placeholder="City Club"
                    className="w-full bg-surface-container-high border border-outline-variant rounded pl-9 pr-3 py-2 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {errors.companyName && (
                  <p className="text-red-400 text-xs mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                  Gender
                </label>
                <select
                  {...register("gender")}
                  className="w-full bg-surface-container-high border border-outline-variant rounded px-3 py-2 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                {errors.gender && (
                  <p className="text-red-400 text-xs mt-1">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Birth Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50 pointer-events-none" />
                  <input
                    {...register("birthDate")}
                    type="date"
                    className="w-full bg-surface-container-high border border-outline-variant rounded pl-9 pr-3 py-2 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  />
                </div>
                {errors.birthDate && (
                  <p className="text-red-400 text-xs mt-1">{errors.birthDate.message}</p>
                )}
              </div>
            </div>

            {/* Optional Password Change Section */}
            <div className="pt-2 border-t border-outline-variant/60">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-headline-sm text-sm font-semibold text-on-surface">
                    Change Password
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    Leave blank if you do not wish to update your password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen((prev) => !prev)}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {changePasswordOpen ? "Hide" : "Update Password"}
                </button>
              </div>

              {changePasswordOpen && (
                <div className="space-y-1 pt-2 animate-in fade-in duration-200">
                  <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50" />
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new strong password (min 8 chars)"
                      className="w-full bg-surface-container-high border border-outline-variant rounded pl-9 pr-10 py-2 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                  )}
                  <p className="text-[11px] text-on-surface-variant pt-0.5">
                    Must be 8–64 characters and contain uppercase, lowercase, numbers, and symbols.
                  </p>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-outline-variant flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => fetchProfile()}
                disabled={isSubmitting || !isDirty}
                className="px-4 py-2 rounded-lg font-body-md text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
              >
                <RotateCcw className="size-4" />
                <span>Discard</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-on-primary px-layout-margin py-2 rounded-lg font-headline-sm text-headline-sm hover:brightness-110 active:opacity-80 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (1 span): System Identity & Account Security */}
        <div className="space-y-layout-margin">
          {/* System Identity Card */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-layout-margin shadow-sm space-y-4">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold border-b border-outline-variant pb-2">
              System Identity
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider block">
                  Username
                </span>
                <span className="font-mono-data text-on-surface font-semibold">
                  @{profile?.userName}
                </span>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Unique system handle used for audit trails.
                </p>
              </div>

              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider block">
                  System Role
                </span>
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold mt-1">
                  <ShieldCheck className="size-3.5" />
                  {profile?.role}
                </span>
              </div>

              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider block">
                  Account Status
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold mt-1">
                  <CheckCircle2 className="size-3.5" />
                  {profile?.accountStatus}
                </span>
              </div>

              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider block">
                  Verification
                </span>
                <span className="text-on-surface font-medium block mt-1">
                  {profile?.isAccountVerified ? "Email & Identity Verified" : "Pending Verification"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-surface-container-high border border-outline-variant/60 rounded-xl p-4 text-xs text-on-surface-variant space-y-1.5">
            <div className="flex items-center gap-1.5 text-on-surface font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              <span>Super Administrator Access</span>
            </div>
            <p>
              As Platform Owner, your account possesses complete authority over Gym Owners, SaaS
              Plans, and Subscriptions. Keep your credentials secure.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Avatar Confirmation Dialog */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-background/80 backdrop-blur-sm p-layout-margin"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingImage) setShowDeleteModal(false);
          }}
        >
          <div className="bg-surface-container-high border border-outline-variant w-full max-w-md shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-container-padding border-b border-outline-variant flex items-center gap-2 bg-surface-container-highest">
              <AlertTriangle className="size-5 text-red-400" />
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Remove Profile Picture
              </h3>
            </div>
            <div className="p-layout-margin space-y-3">
              <p className="font-body-md text-on-surface">
                Are you sure you want to remove your profile picture?
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Your profile will reset to the default platform avatar. You can upload a new photo
                anytime.
              </p>
            </div>
            <div className="p-container-padding bg-surface-container-highest border-t border-outline-variant flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingImage}
                className="px-3 py-1.5 rounded font-body-md text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
              >
                Keep Image
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteImage}
                disabled={deletingImage}
                className="bg-error text-on-error px-4 py-1.5 rounded font-headline-sm text-headline-sm hover:brightness-110 active:opacity-80 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deletingImage && <Loader2 className="size-4 animate-spin" />}
                <span>{deletingImage ? "Removing..." : "Confirm Removal"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

