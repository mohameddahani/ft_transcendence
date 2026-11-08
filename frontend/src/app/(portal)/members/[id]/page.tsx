"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Mail,
  Fingerprint,
  Edit,
  ShieldCheck,
  Ban,
  User,
  Calendar,
  Home,
  ArrowUpRight,
  Loader2,
  ArrowLeft,
  Phone,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  fetchMember,
  activeMember,
  banMember,
} from "@/lib/api/members";
import { BackendMember } from "@/types/member";
import EditMemberModal from "@/components/members/EditMemberModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MemberDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const id = params?.id as string;

  const [member, setMember] = useState<BackendMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadMemberData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await fetchMember(id);
      setMember(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load member profile details");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-toota-ink" />
        <p className="text-xs font-mono text-toota-muted">
          {t("loadingMemberProfile", "Loading member profile...")}
        </p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-20 text-center px-4 max-w-md mx-auto space-y-4">
        <div className="size-16 rounded-2xl bg-toota-inner border border-border/40 flex items-center justify-center mx-auto text-toota-muted">
          <User className="size-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-toota-ink">
            {t("noMatchingMembers", "Member Not Found")}
          </h2>
          <p className="text-xs text-toota-muted mt-1">
            {t("memberNotFoundDesc", "The requested member profile could not be located or may have been removed.")}
          </p>
        </div>
        <Link href="/members">
          <Button
            variant="outline"
            className="toota-pill h-10 px-5 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
          >
            <ArrowLeft className="size-3.5 me-1.5 rtl:rotate-180" />
            <span>{t("backToAllMembers", "Back to All Members")}</span>
          </Button>
        </Link>
      </div>
    );
  }

  const memberName =
    `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
    member.userName ||
    t("member", "Member");
  const memberInitials =
    ((member.firstName?.[0] || "") + (member.lastName?.[0] || "")).toUpperCase() ||
    (member.userName?.[0] ? member.userName[0].toUpperCase() : "M");
  const avatarUrl = member.profileImageUrl || member.photo || null;

  // Active membership details (prefer active membership if exists, else latest)
  const activeMembership =
    member.memberships?.find((m) => m.membershipStatus === "ACTIVE") ||
    member.memberships?.[0];
  const membershipStatus = activeMembership?.membershipStatus;
  const status = (
    member.accountStatus === "BANNED"
      ? "BANNED"
      : member.accountStatus === "PENDING"
      ? "PENDING"
      : membershipStatus || member.accountStatus || "ACTIVE"
  ).toUpperCase();

  const planName =
    activeMembership?.membershipPlan?.planName ||
    activeMembership?.membershipPlan?.name ||
    t("standardTier", "Standard Tier");

  let durationDays = activeMembership?.membershipPlanDuration?.durationDays;
  if (!durationDays && activeMembership?.startDate && activeMembership?.expiresAt) {
    const start = new Date(activeMembership.startDate).getTime();
    const end = new Date(activeMembership.expiresAt).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (diff > 0) durationDays = diff;
  }
  const durationLabel = durationDays
    ? `${durationDays} ${t("days", "days")}`
    : activeMembership?.membershipPlanDuration?.duration || t("standardDuration", "Standard Duration");

  const memberSince = member.createdAt
    ? new Date(member.createdAt).toLocaleDateString()
    : "—";

  const nextBilling = activeMembership?.expiresAt
    ? new Date(activeMembership.expiresAt).toLocaleDateString()
    : "—";

  // Calculate age from birthDate
  let birthDateFormatted = "—";
  let ageString = "";
  if (member.birthDate) {
    try {
      const birth = new Date(member.birthDate);
      if (!isNaN(birth.getTime())) {
        birthDateFormatted = birth.toLocaleDateString();
        const ageDifMs = Date.now() - birth.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        ageString = ` (${age} yrs)`;
      }
    } catch {
      // ignore
    }
  }

  // Status Handlers
  const handleMakeActive = async () => {
    setIsActionLoading(true);
    try {
      await activeMember(member.id);
      toast.success(t("makeActive", "Member activated successfully"));
      await loadMemberData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to activate member");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBan = async () => {
    setIsActionLoading(true);
    try {
      await banMember(member.id);
      toast.error(t("banMember", "Member has been banned"));
      await loadMemberData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to ban member");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  // Crisp Outlined Micro-Badge Helper
  const renderStatusBadge = (statusStr: string) => {
    const s = (statusStr || "").toUpperCase();
    if (s === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{t("active", "Active")}</span>
        </span>
      );
    }
    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{t("pending", "Pending")}</span>
        </span>
      );
    }
    if (s === "EXPIRED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{t("expired", "Expired")}</span>
        </span>
      );
    }
    if (s === "BANNED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
          <span>{t("banned", "Banned")}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
        <span>{statusStr ? statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase() : t("cancelled", "Cancelled")}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-mono text-toota-muted">
        <Link
          href="/members"
          className="hover:text-toota-ink transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" />
          <span>{t("navMembers", "Members")}</span>
        </Link>
        <span>/</span>
        <span className="text-toota-ink font-semibold">{memberName}</span>
      </nav>

      {/* Main Profile Header Card */}
      <Card className="toota-card border-none p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative size-20 sm:size-24 rounded-2xl overflow-hidden bg-toota-inner border border-border/40 text-toota-ink flex items-center justify-center font-bold font-mono text-2xl shrink-0 shadow-inner">
              {avatarUrl ? (
                <img
                  className="size-full object-cover"
                  alt={memberName}
                  src={avatarUrl}
                />
              ) : (
                <span>{memberInitials}</span>
              )}
            </div>

            {/* Core Member Details with Single Typographic Baseline */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {memberName}
                </h1>
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / ID: {member.id.slice(0, 8)}
                </span>
              </div>

              <div>
                {renderStatusBadge(status)}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-toota-muted pt-0.5">
                {member.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-toota-muted" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.phoneNumber && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="size-3.5 text-toota-muted" />
                    <span dir="ltr">{member.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 font-mono">
                  <Fingerprint className="size-3.5 text-toota-muted" />
                  <span>@{member.userName || "member"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
            >
              <Edit className="size-3.5 me-1.5" />
              <span>{t("editDetails", "Edit Profile")}</span>
            </Button>

            {status !== "ACTIVE" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleMakeActive}
                disabled={isActionLoading}
                className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <ShieldCheck className="size-3.5 me-1.5" />
                <span>{t("makeActive", "Activate Member")}</span>
              </Button>
            )}

            {status !== "BANNED" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBan}
                disabled={isActionLoading}
                className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer border border-rose-500/40 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400"
              >
                <Ban className="size-3.5 me-1.5" />
                <span>{t("banMember", "Ban Member")}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Bento Grid Layout for Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Info & Payments (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Personal Info */}
          <Card className="toota-card border-none p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between">
              {/* Baseline Metric Section Header */}
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {t("personalInformation", "Personal Information")}
                </h2>
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {t("identity", "identity")}
                </span>
              </div>

              {/* Crisp Outlined Micro-Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("verified", "Verified")}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl toota-inner border border-border/40 space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-toota-muted">
                  {t("fullName", "Full Name")}
                </p>
                <p className="text-sm font-semibold text-toota-ink">{memberName}</p>
              </div>

              <div className="p-3.5 rounded-xl toota-inner border border-border/40 space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-toota-muted">
                  {t("birthDate", "Birth Date")}
                </p>
                <p className="text-sm font-semibold text-toota-ink">
                  {birthDateFormatted}
                  <span className="text-toota-muted font-normal">{ageString}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl toota-inner border border-border/40 space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-toota-muted">
                  {t("phone", "Phone Number")}
                </p>
                <p className="text-sm font-semibold font-mono text-toota-ink">
                  {member.phoneNumber || "—"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl toota-inner border border-border/40 space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-toota-muted">
                  {t("emergencyContact", "Emergency Contact")}
                </p>
                <p className="text-sm font-semibold font-mono text-toota-ink">
                  {member.emergencyContact || "—"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl toota-inner border border-border/40 space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-toota-muted">
                  {t("gender", "Gender")}
                </p>
                <p className="text-sm font-semibold text-toota-ink">
                  {member.gender === "MALE"
                    ? t("male", "Male")
                    : member.gender === "FEMALE"
                    ? t("female", "Female")
                    : member.gender || "—"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl toota-inner border border-border/40 space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-toota-muted">
                  {t("username", "Username")}
                </p>
                <p className="text-sm font-semibold font-mono text-toota-ink">
                  @{member.userName || "—"}
                </p>
              </div>

              <div className="md:col-span-2 p-3.5 rounded-xl toota-inner border border-border/40 space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-toota-muted">
                  {t("residentialAddress", "Residential Address")}
                </p>
                <p className="text-sm font-semibold text-toota-ink flex items-center gap-2">
                  <Home className="size-4 text-toota-muted shrink-0" />
                  <span>{member.address || "—"}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Section: Payment History */}
          <Card className="toota-card border-none p-6 sm:p-7 space-y-6 overflow-hidden">
            {/* Baseline Metric Section Header */}
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("paymentHistory", "Payment History")}
              </h2>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {member.payments?.length || 0} {t("invoicesRecorded", "invoices recorded")}
              </span>
            </div>

            {!member.payments || member.payments.length === 0 ? (
              <div className="py-10 text-center text-xs text-toota-muted font-mono">
                {t("noPaymentsFound", "No payment records found")}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 sm:-mx-7">
                <table className="w-full text-left rtl:text-right">
                  <thead>
                    <tr className="border-b border-border/40 bg-toota-inner/40">
                      <th className="px-6 py-3 text-[11px] font-mono font-semibold text-toota-muted uppercase tracking-wider">
                        {t("paymentDate", "Payment Date")}
                      </th>
                      <th className="px-6 py-3 text-[11px] font-mono font-semibold text-toota-muted uppercase tracking-wider">
                        {t("transactionId", "Transaction ID")}
                      </th>
                      <th className="px-6 py-3 text-[11px] font-mono font-semibold text-toota-muted uppercase tracking-wider">
                        {t("amount", "Amount")}
                      </th>
                      <th className="px-6 py-3 text-[11px] font-mono font-semibold text-toota-muted uppercase tracking-wider">
                        {t("status", "Status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {member.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-toota-inner/40 transition-colors"
                      >
                        <td className="px-6 py-3.5 text-xs text-toota-ink font-medium">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString()
                            : payment.createdAt
                            ? new Date(payment.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-6 py-3.5 text-xs font-mono text-toota-muted">
                          #{payment.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-3.5 text-xs font-bold font-mono text-toota-ink">
                          ${Number(payment.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5">
                          {/* Crisp Outlined Micro-Badge */}
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{payment.paymentStatus ? payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1).toLowerCase() : t("paid", "Paid")}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Membership & Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Membership Overview Card */}
          <Card className="toota-card border-none p-6 sm:p-7 space-y-5">
            {/* Baseline Metric Section Header */}
            <div className="flex items-baseline gap-2">
              <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("membershipPlan", "Membership Plan")}
              </h3>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {membershipStatus ? (membershipStatus.charAt(0).toUpperCase() + membershipStatus.slice(1).toLowerCase()) : (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase())}
              </span>
            </div>

            <div className="space-y-4">
              <div className="toota-inner border border-border/40 rounded-xl p-4 space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-toota-muted">
                  {t("planName", "Current Tier")}
                </p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-toota-ink">
                  {planName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="toota-inner border border-border/40 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-toota-muted">
                    {t("nextExpiry", "Next Expiry")}
                  </p>
                  <p className="text-xs font-bold font-mono text-toota-ink">{nextBilling}</p>
                </div>
                <div className="toota-inner border border-border/40 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-toota-muted">
                    {t("memberSince", "Member Since")}
                  </p>
                  <p className="text-xs font-bold font-mono text-toota-ink">{memberSince}</p>
                </div>
              </div>

              <div className="toota-inner border border-border/40 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-toota-muted">
                  {t("planDuration", "Duration & Cycle")}
                </p>
                <p className="text-xs font-bold font-mono text-toota-ink">{durationLabel}</p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                className="toota-pill w-full h-10 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
              >
                <span>{t("updatePlanDetails", "Update Member Profile")}</span>
                <ArrowUpRight className="size-3.5 ms-1.5 rtl:rotate-[-90deg]" />
              </Button>
            </div>
          </Card>

          {/* Quick Stats & Security Bento */}
          <Card className="toota-card border-none p-6 space-y-4">
            {/* Baseline Metric Section Header */}
            <div className="flex items-baseline gap-2">
              <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("accountStatusSecurity", "Account Status")}
              </h3>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {t("security", "security")}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 toota-inner border border-border/40 rounded-xl">
                <span className="text-xs font-medium text-toota-ink">
                  {t("status", "Status")}
                </span>
                {renderStatusBadge(status)}
              </div>

              <div className="flex items-center justify-between p-3.5 toota-inner border border-border/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-toota-muted" />
                  <span className="text-xs font-medium text-toota-ink">
                    {t("registeredOn", "Registered On")}
                  </span>
                </div>
                <span className="text-xs font-bold font-mono text-toota-ink">
                  {member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Navigation */}
          <Card className="toota-card border-none p-4">
            <Link href="/members" className="w-full">
              <Button
                type="button"
                variant="outline"
                className="toota-pill w-full h-10 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
              >
                <ArrowLeft className="size-3.5 me-1.5 rtl:rotate-180" />
                <span>{t("backToAllMembers", "Back to All Members")}</span>
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <EditMemberModal
        member={member}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={loadMemberData}
      />
    </div>
  );
}
