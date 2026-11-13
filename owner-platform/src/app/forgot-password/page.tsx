"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import {
  Mail,
  ArrowRight,
  Loader2,
  MailCheck,
  AlertCircle,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/schemas/auth.schema";
import { forgotPassword } from "@/lib/api/auth";
import { ThemeToggle } from "@/components/theme/ThemeProvider";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendResponse, setBackendResponse] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await forgotPassword(data.email.trim());
      const message =
        res.message || "Please check your email and set your new password.";
      setBackendResponse(message);
      toast.success(message);
    } catch (err: unknown) {
      let msg = "Failed to request password reset. Please check your information and try again.";
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

  const handleRetry = () => {
    setBackendResponse(null);
    setApiError(null);
    reset();
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

      <div className="w-full max-w-[420px]">
        <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant p-6 sm:p-layout-margin rounded-2xl shadow-xl dark:shadow-2xl transition-colors duration-200">
          <header className="mb-6 text-center">
            <h1 className="font-headline-md text-headline-md sm:text-[20px] font-bold text-primary dark:text-primary-fixed mb-1.5 transition-colors">
              Super Admin Portal
            </h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-semibold transition-colors">
              Platform Password Recovery
            </p>
          </header>

          {backendResponse ? (
            /* ========================================================= */
            /* SUCCESS STATE                                             */
            /* ========================================================= */
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div className="relative mx-auto size-16 sm:size-20">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative size-full rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <MailCheck className="size-8 sm:size-10" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <Sparkles className="size-3.5" />
                  <span>Reset Email Dispatched</span>
                </div>
                <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface">
                  Check Your Inbox
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {backendResponse}
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Link
                  href="/login"
                  className="w-full bg-primary hover:bg-primary-hover active:opacity-90 text-on-primary py-3 px-4 rounded-xl font-label-caps text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="size-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-full py-2.5 px-4 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Use another email address</span>
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* FORM STATE                                                */
            /* ========================================================= */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
                Enter your verified Platform Owner email address to receive password reset instructions.
              </p>

              {apiError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{apiError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
                  Owner Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50" />
                  <input
                    {...register("email")}
                    type="email"
                    autoComplete="email"
                    placeholder="owner@platform.com"
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl pl-9 pr-3 py-2.5 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-hover active:opacity-90 text-on-primary py-3 px-4 rounded-xl font-label-caps text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
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
