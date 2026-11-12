"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  UserCheck,
  IdCard,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { verifyEmailChange } from "@/lib/api/auth";
import SimpleAuthShell from "@/components/auth/SimpleAuthShell";
import { PortalBadge } from "@/components/auth/AuthShell";
import {
  muted,
  submitButton,
  submitArrow,
  forgotLink,
} from "@/components/auth/authStyles";

export type EmailChangeRole = "admin" | "staff" | "member" | "auto";

interface EmailChangeViewProps {
  role?: EmailChangeRole;
}

function EmailChangeContent({ role: propRole }: EmailChangeViewProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { token, isReady } = useAuthToken();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resolve role from props or query param or localStorage
  const role: "admin" | "staff" | "member" = useMemo(() => {
    if (propRole && propRole !== "auto") return propRole;
    const queryRole = searchParams.get("role")?.toLowerCase();
    if (queryRole === "staff") return "staff";
    if (queryRole === "member") return "member";
    if (queryRole === "admin") return "admin";

    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("gym_user") : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        const rawRole = (parsed?.role || parsed?.userType || "").toUpperCase();
        if (rawRole === "STAFF") return "staff";
        if (rawRole === "MEMBER") return "member";
      }
    } catch {
      // ignore
    }
    return "admin";
  }, [propRole, searchParams]);

  const roleMeta = useMemo(() => {
    switch (role) {
      case "staff":
        return {
          badgeLabel: t("staffEmailChange", "Staff Email Change"),
          badgeIcon: <UserCheck className="size-3.5" />,
          signInHref: "/staff/login",
          title: t("confirmStaffEmailTitle", "Confirm Staff Email"),
        };
      case "member":
        return {
          badgeLabel: t("memberEmailChange", "Member Email Change"),
          badgeIcon: <IdCard className="size-3.5" />,
          signInHref: "/member/login",
          title: t("confirmMemberEmailTitle", "Confirm Member Email"),
        };
      case "admin":
      default:
        return {
          badgeLabel: t("adminEmailChange", "Admin Email Change"),
          badgeIcon: <ShieldCheck className="size-3.5" />,
          signInHref: "/login",
          title: t("confirmNewEmailTitle", "Confirm New Email"),
        };
    }
  }, [role, t]);

  const handleConfirmEmailChange = async () => {
    if (!token) {
      toast.error(t("missingToken", "Email change token is missing or invalid."));
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const response = await verifyEmailChange(token);
      toast.success(response.message || t("emailChangedSuccess", "Email changed successfully!"));
      setIsSuccess(true);
    } catch (err: unknown) {
      let msg = t(
        "emailChangeFailed",
        "Failed to verify new email address. The token may be expired or invalid."
      );
      if (err instanceof AxiosError && err.response?.data) {
        const errorData = err.response.data as { message?: string | string[]; error?: string };
        msg = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || errorData.error || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SimpleAuthShell>
      <div className="space-y-6">
        {/* Portal / Role Badge */}
        <div>
          <PortalBadge icon={roleMeta.badgeIcon} label={roleMeta.badgeLabel} />
        </div>

        {/* Header */}
        <div className="space-y-1.5">
          <h1 className="font-headline text-2xl font-bold tracking-tight text-[var(--toota-ink)] sm:text-3xl">
            {roleMeta.title}
          </h1>
          <p className={`text-sm leading-relaxed ${muted}`}>
            {isSuccess
              ? t(
                  "emailChangeSuccessSubtitle",
                  "Your new email address has been activated across all your account operations."
                )
              : t(
                  "confirmNewEmailDesc",
                  "You received this link at your new email address. Click the button below to confirm and activate this email."
                )}
          </p>
        </div>

        {/* Dynamic State: Success vs. Pending */}
        {isSuccess ? (
          /* SUCCESS STATE: Simple sentence without animations or celebrations */
          <div className="space-y-5 pt-2">
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-300">
              {t(
                "emailChangedSuccessSentence",
                "Your new email address has been verified and updated successfully."
              )}
            </div>

            <Link href={roleMeta.signInHref} className={submitButton}>
              <span>{t("proceedToLogin", "Proceed to Sign In")}</span>
              <span className={submitArrow}>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </span>
            </Link>

            <div className="flex items-center justify-center gap-3 pt-2 text-xs">
              <Link href="/login" className={forgotLink}>
                {t("adminLogin", "Admin Sign In")}
              </Link>
              <span className="text-[#8a9098]">•</span>
              <Link href="/staff/login" className={forgotLink}>
                {t("staffLogin", "Staff Sign In")}
              </Link>
              <span className="text-[#8a9098]">•</span>
              <Link href="/member/login" className={forgotLink}>
                {t("memberLogin", "Member Sign In")}
              </Link>
            </div>
          </div>
        ) : (
          /* PENDING / ACTION STATE */
          <div className="space-y-5 pt-2">
            {/* Missing token warning */}
            {isReady && !token && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 p-4 text-xs text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-300">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-semibold">{t("noTokenTitle", "Missing verification token")}</p>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    {t(
                      "noTokenDesc",
                      "Please make sure you clicked the full link sent to your new email."
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message if API fails */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-red-500/10 p-4 text-xs text-red-700 ring-1 ring-red-500/20 dark:text-red-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p className="font-medium">{errorMessage}</p>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={handleConfirmEmailChange}
              disabled={isVerifying || (isReady && !token)}
              className={submitButton}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("confirmingEmail", "Confirming New Email...")}</span>
                </span>
              ) : (
                <>
                  <span>{t("confirmEmailChangeBtn", "Confirm & Update Email")}</span>
                  <span className={submitArrow}>
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </span>
                </>
              )}
            </button>

            {/* Back to sign in */}
            <div className="pt-2 text-center">
              <Link href={roleMeta.signInHref} className={forgotLink}>
                {t("returnToSignIn", "Return to Sign In")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </SimpleAuthShell>
  );
}

export default function EmailChangeView(props: EmailChangeViewProps) {
  return (
    <Suspense
      fallback={
        <SimpleAuthShell>
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-toota-primary" />
          </div>
        </SimpleAuthShell>
      }
    >
      <EmailChangeContent {...props} />
    </Suspense>
  );
}
