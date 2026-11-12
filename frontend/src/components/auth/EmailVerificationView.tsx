"use client";

import React, { useState, useMemo } from "react";
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
import { verifyEmail } from "@/lib/api/auth";
import SimpleAuthShell from "@/components/auth/SimpleAuthShell";
import { PortalBadge } from "@/components/auth/AuthShell";
import {
  muted,
  submitButton,
  submitArrow,
  forgotLink,
} from "@/components/auth/authStyles";

export type EmailVerificationRole = "admin" | "staff" | "member";

interface EmailVerificationViewProps {
  role?: EmailVerificationRole;
}

export default function EmailVerificationView({ role: propRole }: EmailVerificationViewProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { token, isReady } = useAuthToken();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resolve role from props or query param (fallback to admin)
  const role: EmailVerificationRole = useMemo(() => {
    if (propRole) return propRole;
    const queryRole = searchParams.get("role")?.toLowerCase();
    if (queryRole === "staff") return "staff";
    if (queryRole === "member") return "member";
    return "admin";
  }, [propRole, searchParams]);

  const roleMeta = useMemo(() => {
    switch (role) {
      case "staff":
        return {
          badgeLabel: t("staffPortal", "Staff Portal"),
          badgeIcon: <UserCheck className="size-3.5" />,
          signInHref: "/staff/login",
          title: t("verifyStaffEmailTitle", "Verify Staff Email"),
        };
      case "member":
        return {
          badgeLabel: t("memberPortal", "Member Portal"),
          badgeIcon: <IdCard className="size-3.5" />,
          signInHref: "/member/login",
          title: t("verifyMemberEmailTitle", "Verify Member Email"),
        };
      case "admin":
      default:
        return {
          badgeLabel: t("adminPortal", "Admin Portal"),
          badgeIcon: <ShieldCheck className="size-3.5" />,
          signInHref: "/login",
          title: t("verifyEmailTitle", "Verify Your Email"),
        };
    }
  }, [role, t]);

  const handleVerify = async () => {
    if (!token) {
      toast.error(t("missingToken", "Verification token is missing or invalid."));
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const response = await verifyEmail(token);
      setIsSuccess(true);
      toast.success(response.message || t("emailVerifiedSuccess", "Email verified successfully!"));
    } catch (err: unknown) {
      let msg = t("verificationFailed", "Verification failed. The token may be expired or invalid.");
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
                  "emailVerifiedSuccessSubtitle",
                  "Your email address has been verified. You may now continue to your portal."
                )
              : t(
                  "verifyEmailDesc",
                  "Click the button below to confirm your email address and activate your account."
                )}
          </p>
        </div>

        {/* Dynamic State: Success vs. Pending */}
        {isSuccess ? (
          /* SUCCESS STATE: Simple sentence without animations or celebrations */
          <div className="space-y-5 pt-2">
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-300">
              {t(
                "emailVerifiedSuccessSentence",
                "Your email address has been verified successfully. You can now sign in to your account."
              )}
            </div>

            <Link href={roleMeta.signInHref} className={submitButton}>
              <span>{t("proceedToLogin", "Proceed to Sign In")}</span>
              <span className={submitArrow}>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </span>
            </Link>
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
                      "Please ensure you clicked the full link sent to your inbox."
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
              onClick={handleVerify}
              disabled={isVerifying || (isReady && !token)}
              className={submitButton}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("verifyingEmail", "Verifying...")}</span>
                </span>
              ) : (
                <>
                  <span>{t("confirmVerificationBtn", "Verify Email Address")}</span>
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
