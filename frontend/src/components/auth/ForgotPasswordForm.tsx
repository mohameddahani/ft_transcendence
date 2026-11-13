"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Mail,
  User,
  ShieldCheck,
  UserCheck,
  IdCard,
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
} from "@/schemas/auth";
import {
  forgotPasswordAdmin,
  forgotPasswordStaff,
  forgotPasswordMember,
} from "@/lib/api/auth";
import AuthShell, { PortalBadge } from "@/components/auth/AuthShell";
import {
  ManagementIllustration,
  FrontDeskIllustration,
  MemberIllustration,
} from "@/components/auth/illustrations";
import {
  fieldError,
  fieldIcon,
  fieldLabel,
  inputBase,
  inputRing,
  limeUnderline,
  muted,
  submitArrow,
  submitButton,
} from "@/components/auth/authStyles";

export type ForgotPasswordRole = "admin" | "staff" | "member";

interface ForgotPasswordFormProps {
  role: ForgotPasswordRole;
}

type ForgotPasswordFormFields = {
  email: string;
  userName: string;
};

export default function ForgotPasswordForm({ role }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendResponse, setBackendResponse] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Configuration per role, exactly matching each role's login styling and theme
  const config = (() => {
    switch (role) {
      case "admin":
        return {
          panelTitle: t("loginPanelTitle", "Run your club with clarity."),
          illustration: <ManagementIllustration />,
          portals: [
            { href: "/member/login", label: t("switchToMemberPortal", "Member Portal Sign In") },
            { href: "/staff/login", label: t("switchToStaffPortal", "Staff Portal Sign In") },
          ],
          portalBadge: t("adminPortal", "Administrator Portal"),
          PortalIcon: ShieldCheck,
          title: t("forgotAdminPasswordTitle", "Reset Administrator Password"),
          subtitle: t(
            "forgotAdminPasswordSubtitle",
            "Enter the email address associated with your administrator account."
          ),
          fieldLabel: t("emailAddress", "Email Address"),
          fieldPlaceholder: "owner@yourclub.com",
          FieldIcon: Mail,
          loginPath: "/login",
          loginLabel: t("returnToAdminSignIn", "Return to Admin Sign In"),
          isEmail: true,
        };
      case "staff":
        return {
          panelTitle: t("staffPanelTitle", "Keep the front desk moving."),
          illustration: <FrontDeskIllustration />,
          portals: [
            { href: "/login", label: t("switchToAdminPortal", "Admin Portal Sign In") },
            { href: "/member/login", label: t("switchToMemberPortal", "Member Portal Sign In") },
          ],
          portalBadge: t("staffPortal", "Staff Portal"),
          PortalIcon: UserCheck,
          title: t("forgotStaffPasswordTitle", "Reset Staff Password"),
          subtitle: t(
            "forgotStaffPasswordSubtitle",
            "Enter your staff username to receive a password reset link at your registered email."
          ),
          fieldLabel: t("username", "Username"),
          fieldPlaceholder: "e.g. reception.club",
          FieldIcon: User,
          loginPath: "/staff/login",
          loginLabel: t("returnToStaffSignIn", "Return to Staff Sign In"),
          isEmail: false,
        };
      case "member":
        return {
          panelTitle: t("memberPanelTitle", "Your club, in your pocket."),
          illustration: <MemberIllustration />,
          portals: [
            { href: "/login", label: t("switchToAdminPortal", "Admin Portal Sign In") },
            { href: "/staff/login", label: t("switchToStaffPortal", "Staff Portal Sign In") },
          ],
          portalBadge: t("memberPortal", "Member Portal"),
          PortalIcon: IdCard,
          title: t("forgotMemberPasswordTitle", "Reset Member Password"),
          subtitle: t(
            "forgotMemberPasswordSubtitle",
            "Enter your member username to receive a password reset link at your registered email."
          ),
          fieldLabel: t("memberUsername", "Member Username"),
          fieldPlaceholder: "e.g. younes.benali",
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
  } = useForm<ForgotPasswordFormFields>({
    resolver: resolver as unknown as Resolver<ForgotPasswordFormFields>,
    defaultValues: { email: "", userName: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormFields) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      let res: { message: string };
      if (role === "admin") {
        res = await forgotPasswordAdmin((data.email || "").trim());
      } else if (role === "staff") {
        res = await forgotPasswordStaff((data.userName || "").trim());
      } else {
        res = await forgotPasswordMember((data.userName || "").trim());
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
    <AuthShell
      panelTitle={config.panelTitle}
      illustration={config.illustration}
      portals={config.portals}
    >
      {/* Form Header */}
      <PortalBadge
        icon={<PortalIcon className="size-3.5" aria-hidden="true" />}
        label={config.portalBadge}
      />
      <h1 className="mt-5 font-headline text-3xl font-semibold tracking-[-0.03em]">
        {config.title}
      </h1>
      <p className={`mt-2 text-sm leading-6 ${muted}`}>{config.subtitle}</p>

      {/* Dynamic Content: Success State vs Form */}
      {backendResponse ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl bg-[var(--toota-pill)] p-5 ring-1 ring-black/5 dark:ring-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
                <MailCheck className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--toota-ink)]">
                  {t("checkYourEmailTitle", "Check Your Inbox")}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#65a30d] dark:text-[#a3e635]">
                  <Sparkles className="size-3" aria-hidden="true" />
                  {t("requestDispatched", "Reset Email Dispatched")}
                </span>
              </div>
            </div>
            <p className="rounded-xl bg-black/5 dark:bg-white/5 p-3 text-xs font-medium text-[var(--toota-ink)] leading-relaxed">
              {backendResponse}
            </p>
            <p className={`text-xs leading-5 ${muted}`}>
              {t(
                "checkEmailInstructions",
                "We have dispatched an email containing a secure link to reset your password. Please check your inbox (and spam folder) and click the link to proceed."
              )}
            </p>
          </div>

          <Link href={config.loginPath} className={submitButton}>
            <span>{config.loginLabel}</span>
            <span className={submitArrow}>
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </span>
          </Link>

          <button
            type="button"
            onClick={handleRetry}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-black/10 dark:border-white/10 text-xs font-semibold text-[var(--toota-ink)] transition-colors hover:bg-[var(--toota-pill)]"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>
              {config.isEmail
                ? t("tryAnotherEmail", "Try Another Email")
                : t("tryAnotherUsername", "Try Another Username")}
            </span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
          {apiError && (
            <div className="rounded-2xl bg-red-500/10 p-4 text-xs font-medium text-red-600 dark:text-red-400 ring-1 ring-red-500/20 flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-snug">{apiError}</p>
            </div>
          )}

          {config.isEmail ? (
            <div className="space-y-1.5">
              <label className={fieldLabel} htmlFor="email">
                {config.fieldLabel}
              </label>
              <div className="group relative">
                <FieldIcon className={`size-[18px] ${fieldIcon}`} aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={config.fieldPlaceholder}
                  aria-invalid={errors.email ? true : undefined}
                  {...register("email")}
                  className={`${inputBase} ${inputRing(!!errors.email)}`}
                />
              </div>
              {errors.email && <p className={fieldError}>{errors.email.message}</p>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className={fieldLabel} htmlFor="userName">
                {config.fieldLabel}
              </label>
              <div className="group relative">
                <FieldIcon className={`size-[18px] ${fieldIcon}`} aria-hidden="true" />
                <input
                  id="userName"
                  type="text"
                  autoComplete="username"
                  placeholder={config.fieldPlaceholder}
                  aria-invalid={errors.userName ? true : undefined}
                  {...register("userName")}
                  className={`${inputBase} ${inputRing(!!errors.userName)}`}
                />
              </div>
              {errors.userName && <p className={fieldError}>{errors.userName.message}</p>}
            </div>
          )}

          {/* Submit Action */}
          <button type="submit" disabled={isSubmitting} className={submitButton}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>{t("sendingResetLink", "Sending Reset Link...")}</span>
              </>
            ) : (
              <>
                <span>{t("sendResetLinkBtn", "Send Reset Link")}</span>
                <span className={submitArrow}>
                  <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                </span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Footnote / Secondary Link */}
      <p className={`mt-6 text-center text-sm ${muted}`}>
        {t("rememberPassword", "Remember your password?")}{" "}
        <Link
          href={config.loginPath}
          className={`font-semibold text-[var(--toota-ink)] ${limeUnderline} transition-[text-decoration-thickness] hover:decoration-[3px]`}
        >
          {config.loginLabel}
        </Link>
      </p>
    </AuthShell>
  );
}
