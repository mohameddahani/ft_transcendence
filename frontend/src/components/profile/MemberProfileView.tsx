"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  Trash2,
  RefreshCw,
  Loader2,
  CreditCard,
  Clock,
  MapPin,
  AlertCircle,
  HeartHandshake,
  Layers,
  Award,
  Building,
  UserCheck,
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
      const isPlaceholder =
        !updatedProfile.profileImageUrl ||
        updatedProfile.profileImageUrl === "default-image.jpg" ||
        updatedProfile.profileImageUrl === "default-member-image.jpg";
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
        photo: !isPlaceholder ? updatedProfile.profileImageUrl : null,
      };
      localStorage.setItem("gym_user", JSON.stringify(updated));
      localStorage.removeItem("kinetic_user");
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignore
    }
  };

  const loadData = useCallback(async () => {
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
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    if (!profile?.profileImageUrl || profile.profileImageUrl === "default-member-image.jpg" || profile.profileImageUrl === "default-image.jpg") {
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

  const rawPhoto = profile?.profileImageUrl;
  const isPlaceholder =
    !rawPhoto ||
    rawPhoto === "default-image.jpg" ||
    rawPhoto === "default-member-image.jpg";
  const photoUrl = !isPlaceholder ? rawPhoto : null;

  const fullName =
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
    profile?.userName ||
    "Gym Member";

  const initials =
    ((profile?.firstName?.[0] || "") + (profile?.lastName?.[0] || "")).toUpperCase() ||
    profile?.userName?.slice(0, 2).toUpperCase() ||
    "M";

  const facility = profile?.companyName || profile?.admin?.companyName || "";

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
        <Loader2 className="size-8 text-toota-ink animate-spin" />
        <p className="text-xs text-toota-muted">
          {t("loadingProfile") || "Loading member profile..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Top Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("memberProfileTitle") || "Member Profile & Membership"}
              </h1>
              {facility && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {facility}
                </span>
              )}
              {profile?.userName && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / @{profile.userName}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
              {t(
                "memberProfileSubtitle",
                "View your personal credentials, active membership plan, and facility assignment."
              )}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer self-start md:self-auto"
          >
            <RefreshCw
              className={`size-3.5 me-2 ${isLoading ? "animate-spin text-toota-ink" : ""}`}
            />
            <span>{t("refresh") || "Refresh"}</span>
          </Button>
        </div>
      </Card>

      {/* Member Identity & Avatar Card */}
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

          {/* Member Details */}
          <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {fullName}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400">
                <UserCheck className="size-3 text-zinc-500 shrink-0" />
                <span>{t("roleGymMember") || "Gym Member"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{profile?.accountStatus || "Active"}</span>
              </span>
            </div>

            {profile?.userName && (
              <p className="text-xs text-toota-muted font-mono">
                @{profile.userName}
              </p>
            )}

            {facility && (
              <p className="text-xs text-toota-ink font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <Building className="size-3.5 text-toota-muted" />
                <span>{facility}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-toota-muted pt-1">
              {profile?.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5 text-toota-muted" />
                  <span>{profile.email}</span>
                </span>
              )}
              {profile?.phoneNumber && (
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Phone className="size-3.5 text-toota-muted" />
                  <span>{profile.phoneNumber}</span>
                </span>
              )}
              {profile?.birthDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-toota-muted" />
                  <span>{new Date(profile.birthDate).toLocaleDateString()}</span>
                </span>
              )}
            </div>

            {/* Photo Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
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
                <span>{t("changePhoto") || "Change Photo"}</span>
              </Button>

              {photoUrl && (
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
                  <span>{t("removePhoto") || "Remove"}</span>
                </Button>
              )}

              <span className="text-[11px] font-mono text-toota-muted">
                {t("maxPhotoSize", "Max 1MB (PNG, JPG, WebP)")}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <Button
          type="button"
          variant={activeTab === "overview" ? "default" : "outline"}
          onClick={() => setActiveTab("overview")}
          className={`toota-pill h-9 px-4 text-xs font-semibold cursor-pointer ${
            activeTab === "overview"
              ? ""
              : "border-border/40 hover:bg-toota-inner text-toota-ink"
          }`}
        >
          <Award className="size-3.5 me-1.5" />
          <span>{t("activeMembership") || "Active Membership"}</span>
        </Button>

        <Button
          type="button"
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
          className={`toota-pill h-9 px-4 text-xs font-semibold cursor-pointer ${
            activeTab === "history"
              ? ""
              : "border-border/40 hover:bg-toota-inner text-toota-ink"
          }`}
        >
          <Layers className="size-3.5 me-1.5" />
          <span>
            {t("membershipHistory") || "All Memberships"} ({allMemberships.length})
          </span>
        </Button>
      </div>

      {/* Tab 1: Overview & Active Membership */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Membership Spotlight Card (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="toota-card border-none">
              <CardHeader className="p-6 pb-4 border-b border-border/40">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-baseline gap-2">
                    <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <CreditCard className="size-4 text-toota-ink" />
                      <span>{t("currentTier") || "Current Tier Plan"}</span>
                    </CardTitle>
                    {activeMembership && (
                      <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                        / {activeMembership.membershipPlan.planName}
                      </span>
                    )}
                  </div>

                  {activeMembership && (
                    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{activeMembership.membershipStatus}</span>
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {activeMembership ? (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {activeMembership.membershipPlan.planName}
                      </h2>
                      {activeMembership.membershipPlan.description && (
                        <p className="text-xs text-toota-muted mt-1 line-clamp-2">
                          {activeMembership.membershipPlan.description}
                        </p>
                      )}
                    </div>

                    {/* Highlights Bento Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-toota-inner border border-border/40">
                        <p className="text-[10px] font-semibold text-toota-muted uppercase tracking-wider">
                          {t("weeklyLimit") || "Weekly Visits"}
                        </p>
                        <p className="text-base font-semibold text-toota-ink mt-0.5 font-mono">
                          {activeMembership.membershipPlan.weeklyVisitLimit} {t("sessions") || "sessions"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-toota-inner border border-border/40">
                        <p className="text-[10px] font-semibold text-toota-muted uppercase tracking-wider">
                          {t("planDuration") || "Duration"}
                        </p>
                        <p className="text-base font-semibold text-toota-ink mt-0.5">
                          {formatMembershipDuration(activeMembership.membershipPlanDuration)}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-toota-inner border border-border/40">
                        <p className="text-[10px] font-semibold text-toota-muted uppercase tracking-wider">
                          {t("daysRemaining") || "Days Left"}
                        </p>
                        <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                          {calculateDaysRemaining(activeMembership.expiresAt)} {t("days") || "days"}
                        </p>
                      </div>
                    </div>

                    {/* Validity Bar */}
                    <div className="p-4 rounded-xl bg-toota-inner border border-border/40">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-toota-muted">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-toota-ink" />
                          <span>
                            {t("started") || "Started"}: {new Date(activeMembership.startDate).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="font-mono">
                          {t("expires") || "Expires"}: {new Date(activeMembership.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <div className="size-12 rounded-2xl bg-toota-inner text-amber-500 flex items-center justify-center mx-auto">
                      <AlertCircle className="size-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-toota-ink">
                      {t("noActiveMembership") || "No Active Membership"}
                    </h3>
                    <p className="text-xs text-toota-muted max-w-sm mx-auto">
                      {t("noActiveMembershipHint") ||
                        "You currently do not have an active gym membership. Please contact the front desk or gym administrator to activate your plan."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Change Section for Member */}
            <EmailChangeSection
              role="member"
              currentEmail={profile?.email || ""}
            />
          </div>

          {/* Member Personal & Emergency Info (1 Col) */}
          <div className="space-y-6">
            <Card className="toota-card border-none">
              <CardHeader className="p-6 pb-3 border-b border-border/40">
                <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <User className="size-4 text-toota-ink" />
                  <span>{t("personalInfo") || "Personal Information"}</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-toota-inner border border-border/40">
                    <span className="text-[10px] uppercase font-semibold text-toota-muted block">
                      {t("gender") || "Gender"}
                    </span>
                    <p className="font-medium text-toota-ink mt-0.5 capitalize">
                      {profile?.gender?.toLowerCase() || "Not specified"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-toota-inner border border-border/40">
                    <span className="text-[10px] uppercase font-semibold text-toota-muted block">
                      {t("residentialAddress") || "Residential Address"}
                    </span>
                    <p className="font-medium text-toota-ink mt-0.5 flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-toota-muted shrink-0" />
                      <span className="truncate">{profile?.address || "No address on file"}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-toota-inner border border-border/40">
                    <span className="text-[10px] uppercase font-semibold text-toota-muted block">
                      {t("emergencyContact") || "Emergency Contact"}
                    </span>
                    <p className="font-medium text-toota-ink mt-0.5 flex items-center gap-1.5">
                      <HeartHandshake className="size-3.5 text-toota-muted shrink-0" />
                      <span>{profile?.emergencyContact || "No emergency contact"}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Membership History */}
      {activeTab === "history" && (
        <Card className="toota-card border-none overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-border/40 flex flex-row items-center justify-between">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("allMemberships") || "All Memberships"}
              </CardTitle>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {allMemberships.length} {t("records") || "records"}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {allMemberships.length === 0 ? (
              <div className="py-12 text-center text-xs text-toota-muted">
                {t("noMembershipsFound") || "No membership records found."}
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {allMemberships.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-toota-ink">
                          {item.membershipPlan.planName}
                        </h4>
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              item.membershipStatus === "ACTIVE"
                                ? "bg-emerald-500"
                                : "bg-zinc-400"
                            }`}
                          />
                          <span>{item.membershipStatus}</span>
                        </span>
                      </div>
                      <p className="text-xs text-toota-muted">
                        {t("duration") || "Duration"}: {formatMembershipDuration(item.membershipPlanDuration)} • {t("limit") || "Limit"}: {item.membershipPlan.weeklyVisitLimit} {t("visitsPerWeek") || "visits/week"}
                      </p>
                    </div>

                    <div className="text-xs text-toota-muted sm:text-right rtl:sm:text-left space-y-0.5 shrink-0 font-mono">
                      <p>
                        <span>{t("valid") || "Valid"}:</span>{" "}
                        {new Date(item.startDate).toLocaleDateString()} → {new Date(item.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
