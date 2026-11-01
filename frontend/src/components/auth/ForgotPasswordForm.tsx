"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Mail,
  User,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Loader2,
  MailCheck,
  AlertCircle,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  forgotPasswordAdminSchema,
  forgotPasswordUsernameSchema,
  ForgotPasswordAdminFormValues,
  ForgotPasswordUsernameFormValues,
} from "@/schemas/auth";
import {
  forgotPasswordAdmin,
  forgotPasswordStaff,
  forgotPasswordMember,
} from "@/lib/api/auth";
import AuthLayoutShell from "@/components/auth/AuthLayoutShell";

export type ForgotPasswordRole = "admin" | "staff" | "member";

interface ForgotPasswordFormProps {
  role: ForgotPasswordRole;
}

export default function ForgotPasswordForm({ role }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendResponse, setBackendResponse] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Configuration per role
  const config = (() => {
    switch (role) {
      case "admin":
        return {
          portalBadge: t("adminPortal", "Administrator Portal"),
          PortalIcon: ShieldCheck,
          title: t("forgotAdminPasswordTitle", "Reset Administrator Password"),
          subtitle: t(
            "forgotAdminPasswordSubtitle",
            "Enter the email address associated with your administrator account."
          ),
          heroTitle: t("adminRecoveryHeroTitle", "Account Recovery & Security."),
          heroSubtitle: t(
            "adminRecoveryHeroSubtitle",
            "Enter your administrator email to receive a secure password reset link and restore dashboard access."
          ),
          fieldLabel: t("adminEmailLabel", "Administrator Email"),
          fieldPlaceholder: "admin@gymflow.com",
          FieldIcon: Mail,
          loginPath: "/login",
          loginLabel: t("returnToAdminSignIn", "Return to Admin Sign In"),
          isEmail: true,
        };
      case "staff":
        return {
          portalBadge: t("staffPortal", "Staff Portal"),
          PortalIcon: UserCheck,
          title: t("forgotStaffPasswordTitle", "Reset Staff Password"),
          subtitle: t(
            "forgotStaffPasswordSubtitle",
            "Enter your staff username to receive a password reset link at your registered email."
          ),
          heroTitle: t("staffRecoveryHeroTitle", "Staff Credential Assistance."),
          heroSubtitle: t(
            "staffRecoveryHeroSubtitle",
            "Enter your staff username and we'll dispatch password reset instructions to your verified staff email."
          ),
          fieldLabel: t("staffUsernameLabel", "Staff Username"),
          fieldPlaceholder: "e.g. mohamed-dahani",
          FieldIcon: User,
          loginPath: "/staff/login",
          loginLabel: t("returnToStaffSignIn", "Return to Staff Sign In"),
          isEmail: false,
        };
      case "member":
        return {
          portalBadge: t("memberPortal", "Member Portal"),
          PortalIcon: User,
          title: t("forgotMemberPasswordTitle", "Reset Member Password"),
          subtitle: t(
            "forgotMemberPasswordSubtitle",
            "Enter your member username to receive a password reset link at your registered email."
          ),
          heroTitle: t("memberRecoveryHeroTitle", "Recover Your Gym Member Pass."),
          heroSubtitle: t(
            "memberRecoveryHeroSubtitle",
            "Enter your unique member username to receive a password reset link at your personal email address."
          ),
          fieldLabel: t("memberUsernameLabel", "Member Username"),
          fieldPlaceholder: "e.g. mohamed-dahani-x14s",
          FieldIcon: User,
          loginPath: "/member/login",
          loginLabel: t("returnToMemberSignIn", "Return to Member Sign In"),
          isEmail: false,
        };
    }
  })();

  const PortalIcon = config.PortalIcon;
  const FieldIcon = config.FieldIcon;

  // Form setup
  const resolver = zodResolver(
    config.isEmail ? forgotPasswordAdminSchema : forgotPasswordUsernameSchema
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordAdminFormValues | ForgotPasswordUsernameFormValues>({
    resolver,
    defaultValues: config.isEmail ? { email: "" } : { userName: "" },
  });

  const onSubmit = async (
    data: ForgotPasswordAdminFormValues | ForgotPasswordUsernameFormValues
  ) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      let res: { message: string };
      if (role === "admin") {
        const payload = data as ForgotPasswordAdminFormValues;
        res = await forgotPasswordAdmin(payload.email.trim());
      } else if (role === "staff") {
        const payload = data as ForgotPasswordUsernameFormValues;
        res = await forgotPasswordStaff(payload.userName.trim());
      } else {
        const payload = data as ForgotPasswordUsernameFormValues;
        res = await forgotPasswordMember(payload.userName.trim());
      }

      const message =
        res.message ||
        t("resetEmailSentDefault", "Please check your email and set your password.");
      setBackendResponse(message);
      toast.success(message);
    } catch (err: unknown) {
      let msg = t(
        "forgotPasswordFailed",
        "Failed to request password reset. Please check your information and try again."
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

  const handleRetry = () => {
    setBackendResponse(null);
    setApiError(null);
    reset();
  };

  return (
    <AuthLayoutShell
      heroTitle={config.heroTitle}
      heroSubtitle={config.heroSubtitle}
    >
      <div className="w-full space-y-6">
        {/* Portal Identifier Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <PortalIcon className="w-3.5 h-3.5" />
          <span>{config.portalBadge}</span>
        </div>

        {/* Dynamic Card: Success vs Form */}
        {backendResponse ? (
          /* ========================================================= */
          /* SUCCESS STATE: Display Backend Response & Email Directions*/
          /* ========================================================= */
          <div className="p-6 sm:p-8 bg-surface-bright rounded-3xl border border-emerald-500/30 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            {/* Animated Pulsing Icon */}
            <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-full h-full rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <MailCheck className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("requestDispatched", "Reset Email Dispatched")}</span>
              </div>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                {t("checkYourEmailTitle", "Check Your Inbox")}
              </h2>
            </div>

            {/* Exact Backend Response Message */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium text-sm leading-relaxed">
              <p>{backendResponse}</p>
            </div>

            <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
              {t(
                "checkEmailInstructions",
                "We have dispatched an email containing a secure link to reset your password. Please check your inbox (and spam folder) and click the link to proceed."
              )}
            </p>

            <div className="space-y-2.5 pt-2">
              <Link
                href={config.loginPath}
                className="w-full btn-gradient py-3.5 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer block"
              >
                <span>{config.loginLabel}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>

              <button
                type="button"
                onClick={handleRetry}
                className="w-full py-2.5 px-4 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {config.isEmail
                    ? t("tryAnotherEmail", "Try Another Email")
                    : t("tryAnotherUsername", "Try Another Username")}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* FORM STATE: Single input (email or username)              */
          /* ========================================================= */
          <div className="p-6 sm:p-8 bg-surface-bright rounded-3xl border border-outline-variant/60 shadow-xl space-y-6">
            <div>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface mb-1">
                {config.title}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                {config.subtitle}
              </p>
            </div>

            {/* Error Message if API fails */}
            {apiError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-medium">{apiError}</p>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit as (data: unknown) => Promise<void>)}
              className="space-y-4"
              noValidate
            >
              {config.isEmail ? (
                /* Admin: Email Input */
                <div className="space-y-1.5">
                  <label
                    className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    htmlFor="email"
                  >
                    {config.fieldLabel}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                      <FieldIcon className="w-5 h-5" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      placeholder={config.fieldPlaceholder}
                      autoComplete="email"
                      {...register("email" as "email")}
                      className={`w-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 py-3 bg-surface-container-lowest border ${
                        (errors as Record<string, { message?: string }>).email
                          ? "border-error focus:ring-error"
                          : "border-outline-variant"
                      } rounded-xl form-input-focus transition-all outline-none text-sm text-on-surface placeholder:text-outline`}
                    />
                  </div>
                  {(errors as Record<string, { message?: string }>).email && (
                    <p className="text-xs text-error font-medium mt-1">
                      {(errors as Record<string, { message?: string }>).email?.message}
                    </p>
                  )}
                </div>
              ) : (
                /* Staff & Member: Username Input */
                <div className="space-y-1.5">
                  <label
                    className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    htmlFor="userName"
                  >
                    {config.fieldLabel}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                      <FieldIcon className="w-5 h-5" />
                    </span>
                    <input
                      id="userName"
                      type="text"
                      placeholder={config.fieldPlaceholder}
                      autoComplete="username"
                      {...register("userName" as "userName")}
                      className={`w-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 py-3 bg-surface-container-lowest border ${
                        (errors as Record<string, { message?: string }>).userName
                          ? "border-error focus:ring-error"
                          : "border-outline-variant"
                      } rounded-xl form-input-focus transition-all outline-none text-sm text-on-surface placeholder:text-outline`}
                    />
                  </div>
                  {(errors as Record<string, { message?: string }>).userName && (
                    <p className="text-xs text-error font-medium mt-1">
                      {(errors as Record<string, { message?: string }>).userName?.message}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-gradient py-3.5 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pt-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t("sendingResetLink", "Sending Reset Link...")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("sendResetLinkBtn", "Send Reset Link")}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>

            {/* Back to sign in */}
            <div className="pt-2 text-center">
              <Link
                href={config.loginPath}
                className="text-xs text-primary font-semibold hover:underline transition-all"
              >
                {config.loginLabel}
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayoutShell>
  );
}

