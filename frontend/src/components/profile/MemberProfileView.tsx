"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Clock,
  MapPin,
  AlertCircle,
  HeartHandshake,
  Layers,
  Award,
  Building,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  fetchMemberProfile,
  uploadMemberProfileImage,
  deleteMemberProfileImage,
  fetchMyActiveMembership,
  fetchAllMyMemberships,
} from "@/lib/api/member-portal";
import {
  MemberProfile,
  MemberMembership,
  formatMembershipDuration,
} from "@/types/member-portal";
import EmailChangeSection from "@/components/profile/EmailChangeSection";


export default function MemberProfileView() {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [activeMembership, setActiveMembership] = useState<MemberMembership | null>(null);
  const [allMemberships, setAllMemberships] = useState<MemberMembership[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile photo to localStorage for TopBar
  const syncLocalStorage = (updatedProfile: MemberProfile) => {
    try {
      const stored = localStorage.getItem("gym_user") || localStorage.getItem("kinetic_user");
      const current = stored ? JSON.parse(stored) : {};
      const updated = {
        ...current,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        email: updatedProfile.email,
        phoneNumber: updatedProfile.phoneNumber,
        companyName:
          updatedProfile.companyName ||
          updatedProfile.admin?.companyName ||
          current.companyName ||
          "",
        role: "Member",
        photo:
          updatedProfile.profileImageUrl &&
          updatedProfile.profileImageUrl !== "default-image.jpg" &&
          updatedProfile.profileImageUrl !== "default-member-image.jpg"
            ? updatedProfile.profileImageUrl
            : null,
      };
      localStorage.setItem("gym_user", JSON.stringify(updated));
      localStorage.removeItem("kinetic_user");
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignore
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileData, activeData, allData] = await Promise.all([
        fetchMemberProfile().catch(() => null),
        fetchMyActiveMembership().catch(() => null),
        fetchAllMyMemberships(1, 50).catch(() => []),
      ]);

      if (profileData) {
        setProfile(profileData);
        syncLocalStorage(profileData);
      }
      setActiveMembership(activeData);
      setAllMemberships(allData);
    } catch {
      toast.error(t("failedToLoadProfile") || "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Upload Photo Handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("imageTypeInvalid") || "Please upload a valid image file (PNG, JPG)");
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error(t("imageSizeExceeded") || "Profile image must be less than 1MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await uploadMemberProfileImage(file);
      toast.success(t("photoUploadedSuccessfully") || "Profile photo updated successfully!");
      await loadData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to upload photo";
      toast.error(msg || "Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Delete Photo Handler
  const handleDeletePhoto = async () => {
    if (!profile?.profileImageUrl || profile.profileImageUrl === "default-member-image.jpg") {
      toast.info(t("noCustomPhoto") || "No custom profile photo to remove");
      return;
    }

    setIsDeletingPhoto(true);
    try {
      await deleteMemberProfileImage();
      toast.success(t("photoDeletedSuccessfully") || "Profile photo removed successfully!");
      await loadData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to remove photo";
      toast.error(msg || "Failed to remove photo");
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const hasCustomPhoto =
    profile?.profileImageUrl &&
    profile.profileImageUrl !== "default-image.jpg" &&
    profile.profileImageUrl !== "default-member-image.jpg";

  const initials =
    ((profile?.firstName?.[0] || "") + (profile?.lastName?.[0] || "")).toUpperCase() || "M";

  // Calculate days remaining
  const calculateDaysRemaining = (expiresAtStr: string) => {
    const expires = new Date(expiresAtStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-semibold text-on-surface-variant">
          {t("loadingProfile") || "Loading member profile..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Header Banner / Identity Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Camera Actions */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-primary/20 bg-surface-container flex items-center justify-center shadow-md">
              {hasCustomPhoto ? (
                <img
                  src={profile?.profileImageUrl}
                  alt={profile?.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center text-3xl font-extrabold font-headline">
                  {initials}
                </div>
              )}
            </div>

            {/* Photo Action Overlay */}
            <div className="absolute -bottom-2 -right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto || isDeletingPhoto}
                title={t("changePhoto") || "Change photo"}
                className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>

              {hasCustomPhoto && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  disabled={isUploadingPhoto || isDeletingPhoto}
                  title={t("removePhoto") || "Remove photo"}
                  className="w-8 h-8 rounded-xl bg-surface-container-high text-error hover:bg-error/10 border border-outline-variant flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeletingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Member Details */}
          <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-headline text-on-surface">
                {profile?.firstName} {profile?.lastName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3" />
                {t("roleGymMember") || "Gym Member"}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  profile?.accountStatus === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {profile?.accountStatus || "ACTIVE"}
              </span>
              {(profile?.companyName || profile?.admin?.companyName) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  <Building className="w-3 h-3" />
                  {profile?.companyName || profile?.admin?.companyName}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-on-surface-variant flex items-center justify-center sm:justify-start gap-1 font-mono">
              @{profile?.userName}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-on-surface-variant pt-2">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                {profile?.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                {profile?.phoneNumber}
              </span>
              {profile?.birthDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {new Date(profile.birthDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Refresh Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/60 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{t("refresh") || "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{t("activeMembership") || "Active Membership"}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t("membershipHistory") || "All Memberships"} ({allMemberships.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview & Active Membership */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Membership Spotlight Card (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low border border-primary/20 shadow-sm p-6 sm:p-8 relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                  <CreditCard className="w-3.5 h-3.5" />
                  {t("currentTier") || "Current Tier Plan"}
                </div>
                {activeMembership && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                      activeMembership.membershipStatus === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {activeMembership.membershipStatus}
                  </span>
                )}
              </div>

              {activeMembership ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-headline text-on-surface">
                      {activeMembership.membershipPlan.planName}
                    </h2>
                    {activeMembership.membershipPlan.description && (
                      <p className="text-xs sm:text-sm text-on-surface-variant mt-1 line-clamp-2">
                        {activeMembership.membershipPlan.description}
                      </p>
                    )}
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
                      <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                        {t("weeklyLimit") || "Weekly Visits"}
                      </p>
                      <p className="text-lg font-bold font-headline text-on-surface mt-0.5">
                        {activeMembership.membershipPlan.weeklyVisitLimit} {t("sessions") || "sessions"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
                      <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                        {t("planDuration") || "Duration"}
                      </p>
                      <p className="text-lg font-bold font-headline text-on-surface mt-0.5">
                        {formatMembershipDuration(activeMembership.membershipPlanDuration)}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 col-span-2 sm:col-span-1">
                      <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                        {t("daysRemaining") || "Days Left"}
                      </p>
                      <p className="text-lg font-bold font-headline text-primary mt-0.5">
                        {calculateDaysRemaining(activeMembership.expiresAt)} {t("days") || "days"}
                      </p>
                    </div>
                  </div>

                  {/* Validity Bar */}
                  <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {t("started") || "Started"}: {new Date(activeMembership.startDate).toLocaleDateString()}
                      </span>
                      <span>
                        {t("expires") || "Expires"}: {new Date(activeMembership.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-headline font-bold text-base text-on-surface">
                    {t("noActiveMembership") || "No Active Membership"}
                  </h3>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                    {t("noActiveMembershipHint") ||
                      "You currently do not have an active gym membership. Please contact the front desk or gym administrator to activate your plan."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Member Personal & Emergency Info (1 Col) */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm p-6 space-y-4">
              <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                {t("personalInfo") || "Personal Information"}
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                    {t("gender") || "Gender"}
                  </span>
                  <p className="font-semibold text-on-surface mt-0.5">
                    {profile?.gender || "Not specified"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                    {t("residentialAddress") || "Residential Address"}
                  </span>
                  <p className="font-semibold text-on-surface mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{profile?.address || "No address on file"}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                    {t("emergencyContact") || "Emergency Contact"}
                  </span>
                  <p className="font-semibold text-on-surface mt-0.5 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{profile?.emergencyContact || "No emergency contact"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Email Change Section for Member */}
            <div className="lg:col-span-3">
              <EmailChangeSection
                role="member"
                currentEmail={profile?.email || ""}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Membership History */}
      {activeTab === "history" && (
        <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between">
            <h3 className="font-headline font-bold text-base text-on-surface">
              {t("allMemberships") || "All Memberships"}
            </h3>
            <span className="text-xs text-on-surface-variant">
              {allMemberships.length} {t("records") || "records"}
            </span>
          </div>

          {allMemberships.length === 0 ? (
            <div className="py-12 text-center text-xs text-on-surface-variant">
              {t("noMembershipsFound") || "No membership records found."}
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/40">
              {allMemberships.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-low/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline font-bold text-sm text-on-surface">
                        {item.membershipPlan.planName}
                      </h4>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          item.membershipStatus === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-surface-container-high text-on-surface-variant border border-outline-variant/60"
                        }`}
                      >
                        {item.membershipStatus}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {t("duration") || "Duration"}: {formatMembershipDuration(item.membershipPlanDuration)} • {t("limit") || "Limit"}: {item.membershipPlan.weeklyVisitLimit} {t("visitsPerWeek") || "visits/week"}
                    </p>
                  </div>

                  <div className="text-xs text-on-surface-variant sm:text-right rtl:sm:text-left space-y-0.5 shrink-0">
                    <p>
                      <span className="font-semibold text-on-surface">{t("valid") || "Valid"}:</span>{" "}
                      {new Date(item.startDate).toLocaleDateString()} → {new Date(item.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
