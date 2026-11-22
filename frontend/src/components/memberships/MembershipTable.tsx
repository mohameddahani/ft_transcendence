import React from "react";
import { Membership } from "@/types/membership";
import { MembershipStatusBadge, formatDurationString } from "./MembershipFields";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, Inbox, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface MembershipTableProps {
  memberships: Membership[];
  isLoading: boolean;
  onSelectMembership: (membership: Membership) => void;
  isMemberRole?: boolean;
}

export default function MembershipTable({
  memberships,
  isLoading,
  onSelectMembership,
  isMemberRole = false,
}: MembershipTableProps) {
  const { t } = useTranslation();

  if (isLoading && memberships.length === 0) {
    return (
      <Card className="toota-card border-none p-16 text-center">
        <Loader2 className="size-8 animate-spin text-toota-ink mx-auto mb-3" />
        <p className="font-medium text-toota-ink text-sm">
          {t("loadingMemberships", "Loading memberships...")}
        </p>
      </Card>
    );
  }

  if (!isLoading && memberships.length === 0) {
    return (
      <Card className="toota-card border-none p-16 text-center space-y-3">
        <div className="size-14 rounded-2xl bg-toota-inner flex items-center justify-center mx-auto text-toota-muted">
          <Inbox className="size-7 opacity-50" />
        </div>
        <div>
          <p className="font-semibold text-toota-ink text-base">
            {t("noMembershipsFound", "No memberships found")}
          </p>
          <p className="text-xs text-toota-muted max-w-sm mx-auto mt-1">
            {t(
              "emptyMembershipsHint",
              "No membership records match the current filters or query."
            )}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-border/40 overflow-hidden bg-card shadow-xs">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-toota-inner/40 text-[11px] font-semibold text-toota-muted uppercase tracking-wider">
              {!isMemberRole && (
                <th className="py-3 px-4 text-start">{t("member", "Member")}</th>
              )}
              <th className="py-3 px-4 text-start">{t("plan", "Plan")}</th>
              <th className="py-3 px-4 text-start">{t("duration", "Duration")}</th>
              <th className="py-3 px-4 text-start">{t("startDate", "Start Date")}</th>
              <th className="py-3 px-4 text-start">{t("expiresAt", "Expiration Date")}</th>
              <th className="py-3 px-4 text-start">{t("status", "Status")}</th>
              <th className="py-3 px-4 text-end">{t("actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20 text-xs">
            {memberships.map((item, idx) => {
              const member = item.member;
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

              const startDateStr = item.startDate
                ? new Date(item.startDate).toLocaleDateString()
                : "—";
              const expiresAtStr = item.expiresAt
                ? new Date(item.expiresAt).toLocaleDateString()
                : "—";

              return (
                <tr
                  key={item.id || `membership-${idx}`}
                  className="hover:bg-toota-inner/50 transition-colors"
                >
                  {!isMemberRole && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 ring-1 ring-border/40 shrink-0">
                          {photo && <AvatarImage src={photo} alt={fullName} />}
                          <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-toota-ink truncate">
                            {fullName}
                          </p>
                          {member?.userName && (
                            <p className="text-[11px] font-mono text-toota-muted truncate">
                              @{member.userName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="py-3 px-4 font-semibold text-toota-ink">
                    {item.membershipPlan?.planName || "—"}
                  </td>
                  <td className="py-3 px-4 text-toota-muted">
                    {formatDurationString(item.membershipPlanDuration)}
                  </td>
                  <td className="py-3 px-4 font-mono text-toota-muted">
                    {startDateStr}
                  </td>
                  <td className="py-3 px-4 font-mono text-toota-muted">
                    {expiresAtStr}
                  </td>
                  <td className="py-3 px-4">
                    <MembershipStatusBadge status={item.membershipStatus} />
                  </td>
                  <td className="py-3 px-4 text-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectMembership(item)}
                      className="toota-pill h-8 px-3 text-xs font-semibold border-border/60 hover:bg-toota-inner text-toota-ink cursor-pointer"
                    >
                      <Eye className="size-3.5 me-1" />
                      <span>{t("details", "Details")}</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {memberships.map((item, idx) => {
          const member = item.member;
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

          const startDateStr = item.startDate
            ? new Date(item.startDate).toLocaleDateString()
            : "—";
          const expiresAtStr = item.expiresAt
            ? new Date(item.expiresAt).toLocaleDateString()
            : "—";

          return (
            <Card
              key={item.id || `membership-card-${idx}`}
              className="toota-card border-none p-4 space-y-3 bg-card text-toota-ink"
            >
              <div className="flex items-start justify-between gap-3">
                {!isMemberRole && member ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-9 ring-1 ring-border/40 shrink-0">
                      {photo && <AvatarImage src={photo} alt={fullName} />}
                      <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-toota-ink truncate">
                        {fullName}
                      </p>
                      {member.userName && (
                        <p className="text-[11px] font-mono text-toota-muted truncate">
                          @{member.userName}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-sm text-toota-ink">
                      {item.membershipPlan?.planName || "—"}
                    </p>
                  </div>
                )}
                <MembershipStatusBadge status={item.membershipStatus} />
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-toota-inner text-xs">
                <div>
                  <span className="text-[10px] text-toota-muted uppercase font-semibold block">
                    {t("plan", "Plan")}
                  </span>
                  <span className="font-medium text-toota-ink truncate block">
                    {item.membershipPlan?.planName || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-toota-muted uppercase font-semibold block">
                    {t("duration", "Duration")}
                  </span>
                  <span className="font-medium text-toota-ink truncate block">
                    {formatDurationString(item.membershipPlanDuration)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-toota-muted uppercase font-semibold block">
                    {t("startDate", "Start")}
                  </span>
                  <span className="font-mono text-toota-muted block">
                    {startDateStr}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-toota-muted uppercase font-semibold block">
                    {t("expiresAt", "Expires")}
                  </span>
                  <span className="font-mono text-toota-muted block">
                    {expiresAtStr}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectMembership(item)}
                  className="toota-pill h-8 px-3 text-xs font-semibold border-border/60 hover:bg-toota-inner text-toota-ink cursor-pointer"
                >
                  <Eye className="size-3.5 me-1" />
                  <span>{t("details", "Details")}</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

