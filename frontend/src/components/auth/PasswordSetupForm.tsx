"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  UserCheck,
  IdCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { setPasswordSchema, SetPasswordFormValues } from "@/schemas/auth";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  resetPassword,
  setPasswordMember,
  resetPasswordMember,
  setPasswordStaff,
  resetPasswordStaff,
} from "@/lib/api/auth";
import AuthShell, { PortalBadge } from "@/components/auth/AuthShell";
import {
  ManagementIllustration,
  FrontDeskIllustration,
  MemberIllustration,
} from "@/components/auth/illustrations";
import {
  eyeButton,
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
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";

export type PasswordSetupMode =
  | "admin-reset"
  | "member-set"
  | "member-reset"
  | "staff-set"
  | "staff-reset";

interface PasswordSetupFormProps {
  mode: PasswordSetupMode;
}

export default function PasswordSetupForm({ mode }: PasswordSetupFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { token, isReady } = useAuthToken();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const passwordValue = watch("password") || "";
  const confirmPasswordValue = watch("confirmPassword") || "";

  // Configuration per mode matching the app's portal styling
  const config = (() => {
    switch (mode) {
      case "admin-reset":
        return {
          panelTitle: t("loginPanelTitle", "Run your club with clarity."),
          illustration: <ManagementIllustration />,
          portals: [
            { href: "/member/login", label: t("switchToMemberPortal", "Member Portal Sign In") },
            { href: "/staff/login", label: t("switchToStaffPortal", "Staff Portal Sign In") },
          ],
          portalBadge: t("adminPortal", "Administrator Portal"),
          PortalIcon: ShieldCheck,
          title: t("resetAdminPasswordTitle", "Reset Your Password"),
          subtitle: t(
            "resetAdminPasswordSubtitle",
            "Create a new strong password to regain access to your administrative workspace."
          ),
          buttonText: t("resetPasswordBtn", "Update Password"),
          successTitle: t("passwordResetSuccessTitle", "Password Updated!"),
          successSubtitle: t(
            "passwordResetSuccessSubtitle",
            "Your administrator password has been reset successfully. Please sign in with your new credentials."
          ),
          loginPath: "/login",
          loginLabel: t("signInAdminPortal", "Sign In to Admin Portal"),
          apiCall: (tok: string, pwd: string) => resetPassword(tok, pwd),
        };
      case "member-set":
        return {
          panelTitle: t("memberPanelTitle", "Your club, in your pocket."),
          illustration: <MemberIllustration />,
          portals: [
            { href: "/login", label: t("switchToAdminPortal", "Admin Portal Sign In") },
            { href: "/staff/login", label: t("switchToStaffPortal", "Staff Portal Sign In") },
          ],
          portalBadge: t("memberPortal", "Member Portal"),
          PortalIcon: IdCard,
          title: t("setMemberPasswordTitle", "Set Your Password"),
          subtitle: t(
            "setMemberPasswordSubtitle",
            "Welcome to Sportium! Establish your personal password to unlock attendance, QR passes, and your workouts."
          ),
          buttonText: t("setMemberPasswordBtn", "Set Password & Activate"),
          successTitle: t("memberPasswordSetTitle", "Account Activated!"),
          successSubtitle: t(
            "memberPasswordSetSubtitle",
            "Your password has been set. You can now sign in to the Member Portal."
          ),
          loginPath: "/member/login",
          loginLabel: t("signInMemberPortal", "Sign In to Member Portal"),
          apiCall: (tok: string, pwd: string) => setPasswordMember(tok, pwd),
        };
      case "member-reset":
        return {
          panelTitle: t("memberPanelTitle", "Your club, in your pocket."),
          illustration: <MemberIllustration />,
          portals: [
            { href: "/login", label: t("switchToAdminPortal", "Admin Portal Sign In") },
            { href: "/staff/login", label: t("switchToStaffPortal", "Staff Portal Sign In") },
          ],
          portalBadge: t("memberPortal", "Member Portal"),
          PortalIcon: IdCard,
          title: t("resetMemberPasswordTitle", "Reset Member Password"),
          subtitle: t(
            "resetMemberPasswordSubtitle",
            "Enter and confirm your new password to restore access to your member profile."
          ),
          buttonText: t("resetMemberPasswordBtn", "Update Member Password"),
          successTitle: t("memberPasswordResetTitle", "Password Reset Complete!"),
          successSubtitle: t(
            "memberPasswordResetSubtitle",
            "Your member password has been changed. Use your new password to sign in."
          ),
          loginPath: "/member/login",
          loginLabel: t("signInMemberPortal", "Sign In to Member Portal"),
          apiCall: (tok: string, pwd: string) => resetPasswordMember(tok, pwd),
        };
      case "staff-set":
        return {
          panelTitle: t("staffPanelTitle", "Keep the front desk moving."),
          illustration: <FrontDeskIllustration />,
          portals: [
            { href: "/login", label: t("switchToAdminPortal", "Admin Portal Sign In") },
            { href: "/member/login", label: t("switchToMemberPortal", "Member Portal Sign In") },
          ],
          portalBadge: t("staffPortal", "Staff Portal"),
          PortalIcon: UserCheck,
          title: t("setStaffPasswordTitle", "Set Staff Password"),
          subtitle: t(
            "setStaffPasswordSubtitle",
            "Welcome to the Sportium operational staff team! Set your access credentials to proceed."
          ),
          buttonText: t("setStaffPasswordBtn", "Establish Staff Password"),
          successTitle: t("staffPasswordSetTitle", "Staff Account Ready!"),
          successSubtitle: t(
            "staffPasswordSetSubtitle",
            "Your staff password has been saved. Sign in to your staff desk account."
          ),
          loginPath: "/staff/login",
          loginLabel: t("signInStaffPortal", "Sign In to Staff Portal"),
          apiCall: (tok: string, pwd: string) => setPasswordStaff(tok, pwd),
        };
      case "staff-reset":
        return {
          panelTitle: t("staffPanelTitle", "Keep the front desk moving."),
          illustration: <FrontDeskIllustration />,
          portals: [
            { href: "/login", label: t("switchToAdminPortal", "Admin Portal Sign In") },
            { href: "/member/login", label: t("switchToMemberPortal", "Member Portal Sign In") },
          ],
          portalBadge: t("staffPortal", "Staff Portal"),
          PortalIcon: UserCheck,
          title: t("resetStaffPasswordTitle", "Reset Staff Password"),
          subtitle: t(
            "resetStaffPasswordSubtitle",
            "Update your staff password to restore terminal access and front desk tools."
          ),
          buttonText: t("resetStaffPasswordBtn", "Update Staff Password"),
          successTitle: t("staffPasswordResetTitle", "Staff Password Updated!"),
          successSubtitle: t(
            "staffPasswordResetSubtitle",
            "Your staff credentials have been updated. Sign in to resume your desk shift."
          ),
          loginPath: "/staff/login",
          loginLabel: t("signInStaffPortal", "Sign In to Staff Portal"),
          apiCall: (tok: string, pwd: string) => resetPasswordStaff(tok, pwd),
        };
    }
  })();

  const PortalIcon = config.PortalIcon;

  const onSubmit = async (data: SetPasswordFormValues) => {
    if (!token) {
      toast.error(t("missingToken", "Authentication token is missing. Please check your link."));
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await config.apiCall(token, data.password.trim());
      setIsSuccess(true);
      toast.success(res.message || t("operationSuccessful", "Password configured successfully!"));

      // Route to login after 2.5 seconds
      setTimeout(() => {
        router.push(config.loginPath);
      }, 2500);
    } catch (err: unknown) {
      let message = t("passwordActionFailed", "Operation failed. The token may be invalid or expired.");
      if (err instanceof AxiosError && err.response?.data) {
        const errorData = err.response.data as { message?: string | string[]; error?: string };
        message = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || errorData.error || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setApiError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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
      {isSuccess ? (
        <div className="mt-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="rounded-2xl bg-[var(--toota-pill)] p-5 ring-1 ring-black/5 dark:ring-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
                <CheckCircle2 className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--toota-ink)]">
                  {config.successTitle}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#65a30d] dark:text-[#a3e635]">
                  <Sparkles className="size-3" aria-hidden="true" />
                  {t("securityConfirmed", "Credentials Saved")}
                </span>
              </div>
            </div>
            <p className={`text-xs leading-5 ${muted}`}>
              {config.successSubtitle}
            </p>
          </div>

          <Link href={config.loginPath} className={submitButton}>
            <span>{config.loginLabel}</span>
            <span className={submitArrow}>
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
          {/* Missing Token Warning */}
          {isReady && !token && (
            <div className="rounded-2xl bg-amber-500/10 p-4 text-xs font-medium text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20 flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">{t("noTokenTitle", "Missing or invalid token")}</p>
                <p className="opacity-90 mt-0.5">
                  {t(
                    "noTokenCheckUrl",
                    "Ensure the URL includes #token=... from the email you received."
                  )}
                </p>
              </div>
            </div>
          )}

          {/* API Error Alert */}
          {apiError && (
            <div className="rounded-2xl bg-red-500/10 p-4 text-xs font-medium text-red-600 dark:text-red-400 ring-1 ring-red-500/20 flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-snug">{apiError}</p>
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className={fieldLabel} htmlFor="password">
              {t("newPassword", "New Password")}
            </label>
            <div className="group relative">
              <Lock className={`size-[18px] ${fieldIcon}`} aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={errors.password ? true : undefined}
                {...register("password")}
                className={`${inputBase} pr-12 rtl:pl-12 ${inputRing(!!errors.password)}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={eyeButton}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            </div>
            {errors.password && <p className={fieldError}>{errors.password.message}</p>}
          </div>

          {/* Password Strength Meter */}
          <PasswordStrengthMeter
            password={passwordValue}
            confirmPassword={confirmPasswordValue}
          />

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label className={fieldLabel} htmlFor="confirmPassword">
              {t("confirmPassword", "Confirm Password")}
            </label>
            <div className="group relative">
              <Lock className={`size-[18px] ${fieldIcon}`} aria-hidden="true" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={errors.confirmPassword ? true : undefined}
                {...register("confirmPassword")}
                className={`${inputBase} pr-12 rtl:pl-12 ${inputRing(!!errors.confirmPassword)}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={eyeButton}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className={fieldError}>{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || (isReady && !token)}
            className={submitButton}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>{t("savingPassword", "Saving Password...")}</span>
              </>
            ) : (
              <>
                <span>{config.buttonText}</span>
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
        {t("alreadyHaveAccount", "Already have your credentials?")}{" "}
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
