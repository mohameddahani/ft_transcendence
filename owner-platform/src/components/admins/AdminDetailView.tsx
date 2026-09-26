"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  User,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  CreditCard,
  Clock,
  FileText,
  BadgeCheck,
  Ban,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { AdminUser, UserAccountStatus } from "@/types/admin";
import { cn } from "@/lib/utils";

interface AdminDetailViewProps {
  admin: AdminUser;
}

export default function AdminDetailView({ admin }: AdminDetailViewProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<UserAccountStatus>(admin.accountStatus);
  const [updatingAction, setUpdatingAction] = useState<"active" | "pending" | "ban" | null>(null);

  const fullName = `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || admin.userName || "Owner";
  const initials = (
    (admin.firstName?.[0] || "") + (admin.lastName?.[0] || "")
  ).toUpperCase() || (admin.userName?.[0] || "O").toUpperCase();

  const handleCopyId = () => {
    if (admin.id) {
      navigator.clipboard.writeText(admin.id);
      setCopiedId(true);
      toast.success("User ID copied to clipboard");
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleUpdateStatus = async (action: "active" | "pending" | "ban") => {
    if (action === "ban") {
      const confirmBan = window.confirm(
        `Are you sure you want to suspend/ban ${fullName}'s account?`
      );
      if (!confirmBan) return;
    }

    setUpdatingAction(action);
    try {
      await api.patch(`/api/admins/${action}/${admin.id}`);

      const newStatus: UserAccountStatus =
        action === "active" ? "ACTIVE" : action === "pending" ? "PENDING" : "BANNED";

      setCurrentStatus(newStatus);
      toast.success(`Account status updated to ${newStatus}`);
    } catch (err: unknown) {
      console.error(`Failed to update status to ${action}:`, err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        `Failed to set account status to ${action}.`;
      toast.error(msg);
    } finally {
      setUpdatingAction(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-layout-margin pb-12">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admins"
          className="inline-flex items-center gap-2 text-body-sm font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Gym Owners</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded-md text-on-surface hover:border-primary transition-colors text-body-sm cursor-pointer"
            title="Copy unique User ID"
          >
            {copiedId ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5 text-on-surface-variant" />
            )}
            <span className="font-mono-data text-xs">{copiedId ? "Copied" : "Copy ID"}</span>
          </button>
        </div>
      </div>

      {/* Hero Profile Banner Card */}
      <div className="bg-surface border border-outline-variant rounded-xl p-layout-margin shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-layout-margin relative z-10">
          <div className="flex items-start sm:items-center gap-layout-margin">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-secondary-container text-on-secondary-container font-headline-md font-bold flex items-center justify-center border-2 border-outline-variant/60 shadow-inner shrink-0">
              {initials}
            </div>

            {/* Profile Identity */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                  {fullName}
                </h1>
                {renderStatusBadge(currentStatus)}
                {renderVerifiedBadge(admin.isAccountVerified)}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
                {admin.userName && (
                  <span className="font-mono-data text-primary">@{admin.userName}</span>
                )}
                {admin.companyName && (
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3.5" />
                    {admin.companyName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Shield className="size-3.5 text-on-surface-variant" />
                  Role: <span className="font-semibold text-on-surface">{admin.role}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Status Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/40 w-full sm:w-auto">
            {currentStatus !== "ACTIVE" && (
              <button
                type="button"
                disabled={updatingAction !== null}
                onClick={() => handleUpdateStatus("active")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                title="Activate this user account"
              >
                {updatingAction === "active" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                <span>Activate Account</span>
              </button>
            )}

            {currentStatus === "ACTIVE" && (
              <>
                <button
                  type="button"
                  disabled={updatingAction !== null}
                  onClick={() => handleUpdateStatus("pending")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-bold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  title="Move account to pending verification"
                >
                  {updatingAction === "pending" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Clock className="size-4" />
                  )}
                  <span>Set Pending</span>
                </button>

                <button
                  type="button"
                  disabled={updatingAction !== null}
                  onClick={() => handleUpdateStatus("ban")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-bold bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  title="Suspend / Ban this user account"
                >
                  {updatingAction === "ban" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Ban className="size-4" />
                  )}
                  <span>Ban Account</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-layout-margin">
        {/* Card 1: Personal Information */}
        <div className="bg-surface border border-outline-variant rounded-xl p-layout-margin shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/50 pb-3">
            <User className="size-5 text-primary" />
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Personal Information
            </h2>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                First Name
              </dt>
              <dd className="mt-1 text-on-surface font-medium capitalize">
                {admin.firstName || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Last Name
              </dt>
              <dd className="mt-1 text-on-surface font-medium capitalize">
                {admin.lastName || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Username
              </dt>
              <dd className="mt-1 font-mono-data text-on-surface">
                {admin.userName ? `@${admin.userName}` : "—"}
              </dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Gender
              </dt>
              <dd className="mt-1 text-on-surface font-medium">
                {admin.gender || "—"}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Date of Birth
              </dt>
              <dd className="mt-1 text-on-surface font-medium flex items-center gap-1.5">
                <Calendar className="size-3.5 text-on-surface-variant/60" />
                {formatDate(admin.birthDate)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Card 2: Contact & Gymnasium Info */}
        <div className="bg-surface border border-outline-variant rounded-xl p-layout-margin shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/50 pb-3">
            <Building2 className="size-5 text-primary" />
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Contact & Gymnasium
            </h2>
          </div>

          <dl className="grid grid-cols-1 gap-4 text-body-sm">
            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Gymnasium / Company Name
              </dt>
              <dd className="mt-1 text-on-surface font-semibold text-base flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                {admin.companyName || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Email Address
              </dt>
              <dd className="mt-1 font-mono-data text-on-surface flex items-center gap-2">
                <Mail className="size-4 text-on-surface-variant/60" />
                <a
                  href={`mailto:${admin.email}`}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {admin.email}
                </a>
              </dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Phone Number
              </dt>
              <dd className="mt-1 font-mono-data text-on-surface flex items-center gap-2">
                <Phone className="size-4 text-on-surface-variant/60" />
                <a
                  href={`tel:${admin.phoneNumber}`}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {admin.phoneNumber || "—"}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        {/* Card 3: Account & System Security */}
        <div className="bg-surface border border-outline-variant rounded-xl p-layout-margin shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/50 pb-3">
            <ShieldCheck className="size-5 text-primary" />
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Account & Security
            </h2>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
            <div className="sm:col-span-2">
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                User ID
              </dt>
              <dd className="mt-1 font-mono-data text-xs text-on-surface-variant bg-surface-container p-2 rounded border border-outline-variant flex items-center justify-between">
                <span>{admin.id}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-on-surface-variant hover:text-primary cursor-pointer p-1"
                  title="Copy ID"
                >
                  {copiedId ? (
                    <Check className="size-3 text-emerald-400" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                System Role
              </dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold font-mono-data border border-primary/20">
                  {admin.role}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Account Status
              </dt>
              <dd className="mt-1 flex items-center gap-2">
                {renderStatusBadge(currentStatus)}
              </dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Account Verified
              </dt>
              <dd className="mt-1">{renderVerifiedBadge(admin.isAccountVerified)}</dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Terms Accepted
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 font-medium text-on-surface">
                {admin.termsAccepted ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                    <BadgeCheck className="size-3.5" />
                    Yes (Accepted)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
                    <XCircle className="size-3.5" />
                    No (Pending)
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Created At
              </dt>
              <dd className="mt-1 font-mono-data text-xs text-on-surface flex items-center gap-1.5">
                <Clock className="size-3 text-on-surface-variant/60" />
                {formatDateTime(admin.createdAt)}
              </dd>
            </div>

            <div>
              <dt className="text-label-caps text-on-surface-variant uppercase font-bold text-[11px]">
                Last Updated
              </dt>
              <dd className="mt-1 font-mono-data text-xs text-on-surface flex items-center gap-1.5">
                <Clock className="size-3 text-on-surface-variant/60" />
                {formatDateTime(admin.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Card 4: SaaS Subscription */}
        <div className="bg-surface border border-outline-variant rounded-xl p-layout-margin shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/50 pb-3">
            <CreditCard className="size-5 text-primary" />
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              SaaS Subscription
            </h2>
          </div>

          {admin.subscription && admin.subscription.length > 0 ? (
            <div className="space-y-3">
              {admin.subscription.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  className="bg-surface-container p-3 rounded-lg border border-outline-variant space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-on-surface text-body-md">
                      {sub.plan?.name || "Standard Plan"}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {sub.status || "ACTIVE"}
                    </span>
                  </div>
                  {sub.plan?.price !== undefined && (
                    <p className="text-xs font-mono-data text-on-surface-variant">
                      Price: ${sub.plan.price} / duration: {sub.plan.duration || "N/A"} days
                    </p>
                  )}
                  {sub.startDate && (
                    <p className="text-xs font-mono-data text-on-surface-variant">
                      Valid: {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container p-6 rounded-lg border border-dashed border-outline-variant text-center space-y-2">
              <FileText className="size-8 text-on-surface-variant/40 mx-auto" />
              <p className="text-body-md font-medium text-on-surface">
                No active platform subscription
              </p>
              <p className="text-xs text-on-surface-variant">
                This gymnasium owner does not currently have any active platform subscriptions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderStatusBadge(status?: UserAccountStatus) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          ACTIVE
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          PENDING
        </span>
      );
    case "INACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-full text-[11px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          INACTIVE
        </span>
      );
    case "BANNED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[11px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          BANNED
        </span>
      );
    default:
      return null;
  }
}

function renderVerifiedBadge(isVerified?: boolean) {
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-bold tracking-wider">
        <CheckCircle2 className="size-3 text-emerald-400" />
        VERIFIED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-bold tracking-wider">
      <XCircle className="size-3 text-amber-400" />
      UNVERIFIED
    </span>
  );
}
