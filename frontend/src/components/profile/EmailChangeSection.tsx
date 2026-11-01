"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  requestEmailChangeSchema,
  RequestEmailChangeFormValues,
} from "@/schemas/profile";
import {
  requestEmailChangeAdmin,
  requestEmailChangeStaff,
  requestEmailChangeMember,
} from "@/lib/api/profile";

interface EmailChangeSectionProps {
  role: "admin" | "staff" | "member";
  currentEmail: string;
}

export default function EmailChangeSection({
  role,
  currentEmail,
}: EmailChangeSectionProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequestEmailChangeFormValues>({
    resolver: zodResolver(requestEmailChangeSchema),
    defaultValues: {
      email: "",
      currentPassword: "",
    },
  });

  const onSubmit = async (data: RequestEmailChangeFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      let res: { message: string };
      if (role === "admin") {
        res = await requestEmailChangeAdmin(data);
      } else if (role === "staff") {
        res = await requestEmailChangeStaff(data);
      } else {
        res = await requestEmailChangeMember(data);
      }

      const msg =
        res.message ||
        t(
          "emailVerificationDispatched",
          "A verification email has been sent to your new email address."
        );
      setBackendMessage(msg);
      setPendingEmail(data.email.trim());
      toast.success(msg);
      reset();
    } catch (err: unknown) {
      let msg = t(
        "requestEmailChangeFailed",
        "Failed to request email change. Please check your credentials and try again."
      );
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

  const handleReset = () => {
    setBackendMessage(null);
    setPendingEmail("");
    setApiError(null);
    reset();
  };

  return (
    <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-base text-on-surface">
              {t("changeEmailTitle", "Change Email Address")}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {t(
                "changeEmailSubtitle",
                "A confirmation email will be sent to your new email address to complete the update."
              )}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high border border-outline-variant/60 text-on-surface-variant w-fit">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>{t("securityProtected", "Requires Re-authentication")}</span>
        </div>
      </div>

      {/* Current Email Badge */}
      <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-on-surface-variant font-medium">
            {t("currentActiveEmail", "Current Active Email")}:
          </span>
          <span className="font-bold text-on-surface font-mono">
            {currentEmail || "—"}
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
          {t("active", "Active")}
        </span>
      </div>

      {/* Success Notification State */}
      {backendMessage ? (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("verificationSentBadge", "Verification Link Sent")}</span>
              </div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                {backendMessage}
              </p>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                {t(
                  "pendingEmailInstruction",
                  "We dispatched a verification email to {{email}}. Open the email and click the confirmation button to activate your new email address. Your current email remains active until confirmed.",
                  { email: pendingEmail }
                )}
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-xl border border-emerald-500/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("sendAnotherEmailChange", "Change to a Different Email")}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Form State */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* API Error Alert */}
          {apiError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-medium">{apiError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Email Input */}
            <div className="space-y-1.5">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                htmlFor="email"
              >
                {t("newEmailAddress", "New Email Address")} <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. new.email@gymflow.com"
                  autoComplete="email"
                  {...register("email")}
                  className={`w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-surface-container-low border ${
                    errors.email
                      ? "border-error focus:ring-error"
                      : "border-outline-variant focus:ring-primary-container"
                  } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all placeholder:text-outline`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-error font-medium mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Current Password Input */}
            <div className="space-y-1.5">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                htmlFor="currentPassword"
              >
                {t("currentPassword", "Current Password")} <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("currentPassword")}
                  className={`w-full pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-2.5 bg-surface-container-low border ${
                    errors.currentPassword
                      ? "border-error focus:ring-error"
                      : "border-outline-variant focus:ring-primary-container"
                  } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all placeholder:text-outline`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-error font-medium mt-1">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-on-surface-variant">
              {t(
                "emailChangeNotice",
                "You will receive a confirmation link with an action button to verify your new email address."
              )}
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 primary-gradient text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("sendingRequest", "Sending...")}</span>
                </>
              ) : (
                <>
                  <span>{t("requestEmailChangeBtn", "Send Verification Email")}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

