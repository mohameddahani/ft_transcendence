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
  PauseCircle,
  Ban,
  User,
  Calendar,
  Phone,
  AlertTriangle,
  Home,
  Receipt,
  Award,
  ArrowUpRight,
  Loader2,
  Clock,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  fetchMember,
  activeMember,
  freezeMember,
  banMember,
} from "@/lib/api/members";
import { BackendMember } from "@/types/member";
import EditMemberModal from "@/components/members/EditMemberModal";

export default function MemberDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [member, setMember] = useState<BackendMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadMemberData = async () => {
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
  };

  useEffect(() => {
    loadMemberData();
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

  if (!member) {
    return (
      <div className="py-20 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-headline text-xl font-bold text-on-surface">
          {t("noMatchingMembers")}
        </h2>
        <p className="text-xs text-on-surface-variant mt-1 mb-6">
          {t("adjustFilter")}
        </p>
        <Link
          href="/members"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t("backToAllMembers")}</span>
        </Link>
      </div>
    );
  }

  const memberName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.userName || t("member");
  const memberInitials = ((member.firstName?.[0] || "") + (member.lastName?.[0] || "")).toUpperCase() || "M";
  const avatarUrl = member.profileImageUrl || member.photo;
  const hasPhoto = avatarUrl && !avatarUrl.includes("default-");

  const status = (member.accountStatus || member.status || "ACTIVE").toUpperCase();

  // Active membership details
  const activeMembership = member.memberships?.[0];
  const planName =
    activeMembership?.membershipPlan?.planName ||
    activeMembership?.membershipPlan?.name ||
    "Standard Tier";

  const durationDays = activeMembership?.membershipPlanDuration?.durationDays;
  const durationLabel = durationDays
    ? `${durationDays} ${t("days")}`
    : activeMembership?.membershipPlanDuration?.duration || "Standard Duration";

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
        ageString = ` (${age})`;
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
      toast.success(t("makeActive"));
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

  const handleFreeze = async () => {
    setIsActionLoading(true);
    try {
      await freezeMember(member.id);
      toast.info(t("freezeMember"));
      await loadMemberData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to freeze member");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBan = async () => {
    setIsActionLoading(true);
    try {
      await banMember(member.id);
      toast.error(t("banMember"));
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
        <Link
          href="/members"
          className="font-bold hover:text-primary uppercase tracking-wider transition-colors"
        >
          {t("navMembers")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <span className="uppercase font-bold text-on-surface">{t("memberDetail")}</span>
      </nav>

      {/* Profile Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-outline-variant/40">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-surface-container flex items-center justify-center">
              {hasPhoto ? (
                <img
                  className="w-full h-full object-cover"
                  alt={memberName}
                  src={avatarUrl!}
                />
              ) : (
                <div className="w-full h-full primary-gradient text-white flex items-center justify-center font-bold text-3xl select-none">
                  {memberInitials}
                </div>
              )}
            </div>
            <div
              className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border-2 border-white ${
                status === "ACTIVE"
                  ? "bg-secondary text-white"
                  : status === "FROZEN"
                  ? "bg-tertiary text-white"
                  : "bg-error text-white"
              }`}
            >
              {status === "ACTIVE" ? t("active") : status === "FROZEN" ? t("frozen") : t("banned")}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-headline text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              {memberName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-on-surface-variant text-xs md:text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-primary" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <Fingerprint className="w-4 h-4 text-on-surface-variant" />
                <span>{t("id")}: {member.id.slice(0, 8)}</span>
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
            <span>{t("editDetails")}</span>
          </button>

          {status !== "ACTIVE" && (
            <button
              type="button"
              onClick={handleMakeActive}
              disabled={isActionLoading}
              className="px-4 py-2.5 bg-secondary text-white font-bold text-xs rounded-xl hover:opacity-90 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t("makeActive")}</span>
            </button>
          )}

          {status !== "FROZEN" && (
            <button
              type="button"
              onClick={handleFreeze}
              disabled={isActionLoading}
              className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <PauseCircle className="w-4 h-4 text-tertiary" />
              <span>{t("freezeMember")}</span>
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
              <span>{t("banMember")}</span>
            </button>
          )}
        </div>
      </section>

      {/* Bento Grid Layout for Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Info & Payments (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Personal Info (Bento Card) */}
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
                <p className="text-sm font-bold text-on-surface">{memberName}</p>
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
                  {member.phoneNumber || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("emergencyContact")}
                </p>
                <p className="text-sm font-bold text-on-surface font-mono">
                  {member.emergencyContact || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("gender")}
                </p>
                <p className="text-sm font-bold text-on-surface">
                  {member.gender === "MALE"
                    ? t("male")
                    : member.gender === "FEMALE"
                    ? t("female")
                    : member.gender || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("username")}
                </p>
                <p className="text-sm font-bold font-mono text-on-surface">
                  @{member.userName || "—"}
                </p>
              </div>

              <div className="md:col-span-2 space-y-1 pt-2 border-t border-outline-variant/40">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {t("residentialAddress")}
                </p>
                <p className="text-sm font-medium text-on-surface flex items-center gap-2">
                  <Home className="w-4 h-4 text-on-surface-variant shrink-0" />
                  <span>{member.address || "—"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section: Payment History (Compact Table) */}
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <span>{t("paymentHistory")}</span>
              </h2>
              <span className="text-xs text-on-surface-variant font-medium">
                {member.payments?.length || 0} {t("invoicesRecorded")}
              </span>
            </div>

            {!member.payments || member.payments.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                {t("noPaymentsFound")}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 md:-mx-8">
                <table className="w-full text-left rtl:text-right">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-6 py-3 text-[11px] font-bold text-on-surface-variant uppercase">
                        {t("paymentDate")}
                      </th>
                      <th className="px-6 py-3 text-[11px] font-bold text-on-surface-variant uppercase">
                        {t("transactionId")}
                      </th>
                      <th className="px-6 py-3 text-[11px] font-bold text-on-surface-variant uppercase">
                        {t("amount")}
                      </th>
                      <th className="px-6 py-3 text-[11px] font-bold text-on-surface-variant uppercase">
                        {t("status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {member.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-surface-container-low/50 transition-colors"
                      >
                        <td className="px-6 py-3 text-xs text-on-surface font-medium">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString()
                            : payment.createdAt
                            ? new Date(payment.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-6 py-3 text-xs font-mono text-on-surface-variant">
                          #{payment.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-3 text-xs font-bold text-on-surface">
                          ${Number(payment.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary uppercase">
                            {payment.paymentStatus || t("paid")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Membership & Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Membership Overview Bento Card */}
          <div className="primary-gradient text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-36 h-36 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8 rtl:-translate-x-8">
              <Award className="w-full h-full text-white" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-headline font-bold text-lg text-white">
                  {t("chooseTier")}
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-bold opacity-75 uppercase tracking-wider mb-1">
                    {t("planName")}
                  </p>
                  <p className="font-headline text-2xl md:text-3xl font-bold leading-tight">
                    {planName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/20">
                  <div>
                    <p className="text-[11px] font-bold opacity-75 uppercase tracking-wider mb-1">
                      {t("nextExpiry")}
                    </p>
                    <p className="text-sm font-semibold">{nextBilling}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold opacity-75 uppercase tracking-wider mb-1">
                      {t("memberSince")}
                    </p>
                    <p className="text-sm font-semibold">{memberSince}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/20">
                  <p className="text-[11px] font-bold opacity-75 uppercase tracking-wider mb-1">
                    {t("planDuration")}
                  </p>
                  <p className="text-sm font-semibold">{durationLabel}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <span>{t("updatePlanDetails")}</span>
                  <ArrowUpRight className="w-4 h-4 rtl:rotate-[-90deg]" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Bento */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {t("accountStatusSecurity")}
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-on-surface">
                    {t("status")}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    status === "ACTIVE"
                      ? "bg-secondary-container/20 text-on-secondary-container"
                      : status === "FROZEN"
                      ? "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant"
                      : "bg-error-container/30 text-error"
                  }`}
                >
                  {status === "ACTIVE" ? t("active") : status === "FROZEN" ? t("frozen") : t("banned")}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-on-surface">
                    {t("registeredOn")}
                  </span>
                </div>
                <span className="text-xs font-bold text-on-surface">
                  {member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-3">
            <Link
              href="/members"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t("backToAllMembers")}</span>
            </Link>
          </div>
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
