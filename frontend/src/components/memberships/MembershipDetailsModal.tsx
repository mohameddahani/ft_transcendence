import React from "react";
import { X, Zap, Clock, Mail, Phone } from "lucide-react";
import { Membership } from "@/types/membership";
import { MembershipStatusBadge, formatDurationString } from "./MembershipFields";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface MembershipDetailsModalProps {
  membership: Membership | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MembershipDetailsModal({
  membership,
  isOpen,
  onClose,
}: MembershipDetailsModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !membership) return null;

  const member = membership.member;
  const fullName =
    `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
    member?.userName ||
    "Member";
  const initials =
    ((member?.firstName?.[0] || "") + (member?.lastName?.[0] || "")).toUpperCase() ||
    member?.userName?.slice(0, 2).toUpperCase() ||
    "M";

  const rawPhoto = member?.profileImageUrl;
  const isPlaceholder =
    !rawPhoto ||
    rawPhoto === "default-image.jpg" ||
    rawPhoto === "default-member-image.jpg";
  const photo = !isPlaceholder ? rawPhoto : null;

  const startDateFormatted = membership.startDate
    ? new Date(membership.startDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const expiresAtFormatted = membership.expiresAt
    ? new Date(membership.expiresAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg toota-card border border-border/40 p-6 sm:p-7 shadow-2xl rounded-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh] bg-card text-toota-ink space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/40 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("membershipDetails", "Membership Details")}
              </h2>
              {membership.id && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / ID: {membership.id.slice(0, 8)}
                </span>
              )}
            </div>
            <div>
              <MembershipStatusBadge status={membership.membershipStatus} />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {/* Member Card (if present) */}
          {member && (
            <div className="p-4 rounded-xl bg-toota-inner border border-border/40 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 ring-1 ring-border/40 shrink-0">
                  {photo && <AvatarImage src={photo} alt={fullName} />}
                  <AvatarFallback className="bg-background text-toota-ink font-semibold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-toota-ink truncate">
                    {fullName}
                  </h3>
                  {member.userName && (
                    <p className="text-xs font-mono text-toota-muted truncate">
                      @{member.userName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/30 text-xs">
                {member.email && (
                  <div className="flex items-center gap-2 text-toota-muted truncate">
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.phoneNumber && (
                  <div className="flex items-center gap-2 text-toota-muted truncate">
                    <Phone className="size-3.5 shrink-0" />
                    <span className="truncate">{member.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Plan Details */}
          <div className="p-4 rounded-xl bg-toota-inner border border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
                {t("plan", "Plan")}
              </span>
              <span className="text-xs font-bold text-toota-ink">
                {membership.membershipPlan?.planName || "—"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30 text-xs">
              <div>
                <span className="text-toota-muted block text-[11px]">
                  {t("weeklyVisitLimit", "Weekly Limit")}
                </span>
                <span className="font-semibold text-toota-ink flex items-center gap-1 mt-0.5">
                  <Zap className="size-3.5 text-toota-muted" />
                  {membership.membershipPlan?.weeklyVisitLimit !== undefined
                    ? `${membership.membershipPlan.weeklyVisitLimit} / week`
                    : "—"}
                </span>
              </div>

              <div>
                <span className="text-toota-muted block text-[11px]">
                  {t("duration", "Duration")}
                </span>
                <span className="font-semibold text-toota-ink flex items-center gap-1 mt-0.5">
                  <Clock className="size-3.5 text-toota-muted" />
                  {formatDurationString(membership.membershipPlanDuration)}
                </span>
              </div>
            </div>

            {membership.membershipPlan?.description && (
              <p className="text-xs text-toota-muted pt-2 border-t border-border/30">
                {membership.membershipPlan.description}
              </p>
            )}
          </div>

          {/* Timeline Box */}
          <div className="p-4 rounded-xl bg-toota-inner border border-border/40 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted block">
              {t("timeline", "Timeline")}
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-toota-muted block text-[11px]">
                  {t("startDate", "Start Date")}
                </span>
                <span className="font-mono font-medium text-toota-ink block mt-0.5">
                  {startDateFormatted}
                </span>
              </div>

              <div>
                <span className="text-toota-muted block text-[11px]">
                  {t("expiresAt", "Expiration Date")}
                </span>
                <span className="font-mono font-medium text-toota-ink block mt-0.5">
                  {expiresAtFormatted}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border/40 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="toota-pill w-full h-10 text-xs font-semibold cursor-pointer border-border/60 hover:bg-toota-inner text-toota-ink"
          >
            {t("close", "Close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
