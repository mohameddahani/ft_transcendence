"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  MailCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { verifyEmail } from "@/lib/api/auth";
import AuthLayoutShell from "@/components/auth/AuthLayoutShell";

export default function EmailVerificationView() {
  const { t } = useTranslation();
  const { token, isReady } = useAuthToken();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <AuthLayoutShell
      heroTitle={t("verifyEmailHeroTitle", "Confirm Your GymFlow Account.")}
      heroSubtitle={t(
        "verifyEmailHeroSubtitle",
        "Verify your administrative email address to unlock full club access, telemetry, and automated operations."
      )}
    >
      <div className="w-full space-y-6">
        {/* Portal Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t("accountSecurity", "Account Verification")}</span>
        </div>

        {/* Dynamic Card depending on State */}
        {isSuccess ? (
          /* SUCCESS STATE */
          <div className="p-6 sm:p-8 bg-surface-bright rounded-3xl border border-emerald-500/30 shadow-xl space-y-5 text-center animate-in zoom-in-95 duration-200">
            <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-full h-full rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("verifiedBadge", "Email Confirmed")}</span>
              </div>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                {t("verifiedTitle", "Account Verified!")}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
                {t(
                  "verifiedSubtitle",
                  "Your email address has been successfully confirmed. You can now sign in to your administrator portal."
                )}
              </p>
            </div>

            <Link
              href="/login"
              className="w-full btn-gradient py-3.5 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer block"
            >
              <span>{t("proceedToLogin", "Proceed to Sign In")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          /* IDLE / PENDING / ERROR STATE */
          <div className="p-6 sm:p-8 bg-surface-bright rounded-3xl border border-outline-variant/60 shadow-xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
              <MailCheck className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                {t("verifyEmailTitle", "Verify Your Email")}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                {t(
                  "verifyEmailDesc",
                  "Thank you for registering with GymFlow! Click the button below to complete your registration and activate your administrator profile."
                )}
              </p>
            </div>

            {/* Token Warning if missing */}
            {isReady && !token && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t("noTokenTitle", "Missing verification token")}</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {t(
                      "noTokenDesc",
                      "Please ensure you clicked the full link sent to your inbox. The link should include #token=..."
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message if API fails */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-medium">{errorMessage}</p>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || (isReady && !token)}
              className="w-full btn-gradient py-3.5 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("verifyingEmail", "Verifying...")}</span>
                </>
              ) : (
                <>
                  <span>{t("confirmVerificationBtn", "Verify Email Address")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>

            {/* Back to sign in option */}
            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs text-primary font-semibold hover:underline transition-all"
              >
                {t("returnToSignIn", "Return to Sign In")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayoutShell>
  );
}

