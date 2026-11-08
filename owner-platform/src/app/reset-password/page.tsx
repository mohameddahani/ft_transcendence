"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { resetPasswordSchema, ResetPasswordFormValues } from "@/schemas/auth.schema";
import { useAuthToken } from "@/hooks/useAuthToken";
import { resetPassword } from "@/lib/api/auth";
import { ThemeToggle } from "@/components/theme/ThemeProvider";

export default function ResetPasswordPage() {
  const { token, isReady } = useAuthToken();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const passwordValue = useWatch({ control, name: "password" }) || "";

  // Password requirements checks
  const checks = {
    length: passwordValue.length >= 8,
    upper: /[A-Z]/.test(passwordValue),
    lower: /[a-z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
    special: /[^A-Za-z0-9]/.test(passwordValue),
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast.error("Reset token is missing or invalid.");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await resetPassword(token, data.password);
      toast.success(response.message || "Password updated successfully!");
      setIsSuccess(true);
    } catch (err: unknown) {
      let msg = "Failed to reset password. The link may have expired or is invalid.";
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
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
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
        <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant p-6 sm:p-layout-margin rounded-2xl shadow-xl dark:shadow-2xl transition-colors duration-200">
          <header className="mb-6 text-center">
            <h1 className="font-headline-md text-headline-md sm:text-[20px] font-bold text-primary dark:text-primary-fixed mb-1.5 transition-colors">
              Super Admin Portal
            </h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-semibold transition-colors">
              Set New Password
            </p>
          </header>

          {isSuccess ? (
            /* ========================================================= */
            /* SUCCESS STATE                                             */
            /* ========================================================= */
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div className="relative mx-auto size-16 sm:size-20">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative size-full rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="size-8 sm:size-10" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="size-3.5" />
                  <span>Password Reset Confirmed</span>
                </div>
                <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface">
                  Password Updated!
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Your platform owner credentials have been updated securely. You can now sign in with your new password.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full bg-primary hover:bg-primary-hover active:opacity-90 text-on-primary py-3 px-4 rounded-xl font-label-caps text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In with New Password</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* FORM STATE                                                */
            /* ========================================================= */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
                Create a strong password to secure your platform owner administrative account.
              </p>

              {/* Missing Token Warning */}
              {isReady && !token && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Missing reset token</p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Please make sure you followed the complete link (#token=...) from your email.
                    </p>
                  </div>
                </div>
              )}

              {/* API Error */}
              {apiError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{apiError}</p>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl pl-9 pr-10 py-2.5 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50" />
                  <input
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl pl-9 pr-10 py-2.5 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Password Requirement Badges */}
              <div className="bg-surface-container-high/60 border border-outline-variant/60 rounded-xl p-3 space-y-1.5 text-[11px]">
                <p className="font-semibold text-on-surface-variant">Password must include:</p>
                <div className="grid grid-cols-2 gap-1 text-on-surface-variant">
                  <div className={`flex items-center gap-1.5 ${checks.length ? "text-emerald-500 font-medium" : ""}`}>
                    <span className={`size-1.5 rounded-full ${checks.length ? "bg-emerald-500" : "bg-outline-variant"}`} />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.upper ? "text-emerald-500 font-medium" : ""}`}>
                    <span className={`size-1.5 rounded-full ${checks.upper ? "bg-emerald-500" : "bg-outline-variant"}`} />
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.lower ? "text-emerald-500 font-medium" : ""}`}>
                    <span className={`size-1.5 rounded-full ${checks.lower ? "bg-emerald-500" : "bg-outline-variant"}`} />
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.number ? "text-emerald-500 font-medium" : ""}`}>
                    <span className={`size-1.5 rounded-full ${checks.number ? "bg-emerald-500" : "bg-outline-variant"}`} />
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 col-span-2 ${checks.special ? "text-emerald-500 font-medium" : ""}`}>
                    <span className={`size-1.5 rounded-full ${checks.special ? "bg-emerald-500" : "bg-outline-variant"}`} />
                    <span>Special character (symbol)</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (isReady && !token)}
                className="w-full bg-primary hover:bg-primary-hover active:opacity-90 text-on-primary py-3 px-4 rounded-xl font-label-caps text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <footer className="pt-2 text-center">
                <Link
                  href="/login"
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors no-underline font-medium"
                >
                  Return to Log In
                </Link>
              </footer>
            </form>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-on-surface-variant opacity-60 select-none transition-colors">
          <span className="material-symbols-outlined !text-[16px]">verified_user</span>
          <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] font-medium">
            Encrypted Session Protocol V2.4
          </span>
        </div>
      </div>
    </main>
  );
}
