"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  PartyPopper,
  X,
  ShieldCheck,
} from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { verifyEmailChange } from "@/lib/api/auth";
import AuthLayoutShell from "@/components/auth/AuthLayoutShell";

export default function EmailChangeView() {
  const { t } = useTranslation();
  const { token, isReady } = useAuthToken();
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      // Requirement: "must see a popup that says something to congrats him"
      setShowCongratsModal(true);
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
    <AuthLayoutShell
      heroTitle={t("emailChangeHeroTitle", "Secure Your New Email.")}
      heroSubtitle={t(
        "emailChangeHeroSubtitle",
        "Confirm your email update across the GymFlow ecosystem. Your security and credentials remain fully protected."
      )}
    >
      <div className="w-full space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t("emailVerification", "Email Change Verification")}</span>
        </div>

        {/* Verification Card */}
        <div className="p-6 sm:p-8 bg-surface-bright rounded-3xl border border-outline-variant/60 shadow-xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
            <Mail className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
              {t("confirmNewEmailTitle", "Confirm New Email")}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {t(
                "confirmNewEmailDesc",
                "You received this link at your new email address. Click the button below to confirm and activate this email for your GymFlow account."
              )}
            </p>
          </div>

          {/* Token warning if missing */}
          {isReady && !token && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t("noTokenTitle", "Missing verification token")}</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {t(
                    "noTokenDesc",
                    "Please make sure you clicked the full link sent to your new email (#token=...)."
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
            onClick={handleConfirmEmailChange}
            disabled={isVerifying || (isReady && !token)}
            className="w-full btn-gradient py-3.5 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t("confirmingEmail", "Confirming New Email...")}</span>
              </>
            ) : (
              <>
                <span>{t("confirmEmailChangeBtn", "Confirm & Update Email")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>

          {/* Back links */}
          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs text-primary font-semibold hover:underline transition-all"
            >
              {t("returnToSignIn", "Return to Sign In")}
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONGRATULATIONS POPUP MODAL                               */}
      {/* ========================================================= */}
      {showCongratsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-surface-bright rounded-3xl shadow-2xl border-2 border-emerald-500/40 p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200 text-center space-y-5">
            <button
              type="button"
              onClick={() => setShowCongratsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pulsing Success Badge with Sparkles */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <PartyPopper className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("congratulationsBadge", "Verification Successful!")}</span>
              </div>
              <h3 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                {t("congratsTitle", "Congratulations!")}
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {t(
                  "congratsEmailChangeMessage",
                  "Your new email address has been successfully verified and updated. All future account notifications and security alerts will now be sent to your new email."
                )}
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <Link
                href="/profile"
                className="w-full btn-gradient py-3.5 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer block"
              >
                <span>{t("goToProfile", "View Updated Profile")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>

              <div className="flex items-center justify-center gap-4 text-xs pt-1">
                <Link
                  href="/login"
                  className="text-primary font-semibold hover:underline"
                >
                  {t("adminLogin", "Admin Sign In")}
                </Link>
                <span className="text-outline-variant">•</span>
                <Link
                  href="/member/login"
                  className="text-primary font-semibold hover:underline"
                >
                  {t("memberLogin", "Member Sign In")}
                </Link>
                <span className="text-outline-variant">•</span>
                <Link
                  href="/staff/login"
                  className="text-primary font-semibold hover:underline"
                >
                  {t("staffLogin", "Staff Sign In")}
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setShowCongratsModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                {t("closePopup", "Dismiss")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayoutShell>
  );
}

