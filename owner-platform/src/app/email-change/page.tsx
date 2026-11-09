"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import {
  Mail,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  PartyPopper,
  X,
} from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { verifyEmailChange } from "@/lib/api/auth";
import { ThemeToggle } from "@/components/theme/ThemeProvider";

export default function EmailChangePage() {
  const { token, isReady } = useAuthToken();
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirmEmailChange = async () => {
    if (!token) {
      toast.error("Email change token is missing or invalid.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const response = await verifyEmailChange(token);
      toast.success(response.message || "Email changed successfully!");
      setShowCongratsModal(true);
    } catch (err: unknown) {
      let msg = "Failed to verify new email address. The token may be expired or invalid.";
      if (err instanceof AxiosError && err.response?.data) {
        const errorData = err.response.data as {
          message?: string | string[];
          error?: string;
        };
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
    <main className="relative flex items-center justify-center min-h-screen w-full bg-background px-4 py-8 transition-colors duration-200">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <ThemeToggle
          showLabel
          className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant rounded-full px-3 py-1.5 shadow-sm hover:bg-surface-container-high transition-all text-on-surface font-medium text-xs sm:text-sm"
        />
      </div>

      <div className="w-full max-w-[440px]">
        <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant p-6 sm:p-layout-margin rounded-2xl shadow-xl dark:shadow-2xl transition-colors duration-200 space-y-6">
          <header className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="size-3.5" />
              <span>Email Verification Protocol</span>
            </div>
            <h1 className="font-headline-md text-headline-md sm:text-[22px] font-bold text-on-surface">
              Confirm New Email
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto">
              Confirm your email address update for the Super Admin platform account.
            </p>
          </header>

          <div className="flex justify-center">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs">
              <Mail className="size-8" />
            </div>
          </div>

          {/* Missing Token Warning */}
          {isReady && !token && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Missing verification token</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Please ensure you opened the complete confirmation link sent to your new email (#token=...).
                </p>
              </div>
            </div>
          )}

          {/* Backend Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirmEmailChange}
            disabled={isVerifying || (isReady && !token)}
            className="w-full bg-primary hover:bg-primary-hover active:opacity-90 text-on-primary py-3 px-4 rounded-xl font-label-caps text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Confirming New Email...</span>
              </>
            ) : (
              <>
                <span>Confirm & Update Email</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <footer className="pt-2 text-center flex items-center justify-center gap-3 text-xs">
            <Link
              href="/profile"
              className="text-on-surface-variant hover:text-primary transition-colors font-medium"
            >
              Back to Profile
            </Link>
            <span className="text-outline-variant">•</span>
            <Link
              href="/login"
              className="text-on-surface-variant hover:text-primary transition-colors font-medium"
            >
              Sign In
            </Link>
          </footer>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-on-surface-variant opacity-60 select-none">
          <span className="material-symbols-outlined !text-[16px]">verified_user</span>
          <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] font-medium">
            Platform Protocol V2.4
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONGRATULATIONS SUCCESS MODAL                            */}
      {/* ========================================================= */}
      {showCongratsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-surface-container-high border border-outline-variant rounded-2xl shadow-2xl p-6 sm:p-8 z-10 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowCongratsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>

            {/* Pulsing Success Badge */}
            <div className="relative mx-auto size-20">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative size-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <PartyPopper className="size-10" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="size-3.5" />
                <span>Verification Successful</span>
              </div>
              <h2 className="font-headline-md text-headline-md sm:text-[22px] font-bold text-on-surface">
                Congratulations!
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Your platform owner email address has been successfully verified and updated.
                All future critical platform notifications and credentials recovery will now use this address.
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <Link
                href="/profile"
                className="w-full bg-primary hover:bg-primary-hover active:opacity-90 text-on-primary py-3 px-4 rounded-xl font-label-caps text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Updated Profile</span>
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/admins"
                className="w-full bg-surface-container hover:bg-surface-container-highest text-on-surface py-2.5 px-4 rounded-xl font-body-sm text-xs font-medium border border-outline-variant transition-colors flex items-center justify-center cursor-pointer"
              >
                Go to Platform Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
