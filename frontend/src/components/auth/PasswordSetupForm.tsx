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
  User,
  UserCheck,
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
import AuthLayoutShell from "@/components/auth/AuthLayoutShell";
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

  // Configuration per mode
  const config = (() => {
    switch (mode) {
      case "admin-reset":
        return {
          portalBadge: t("adminPortal", "Administrator Portal"),
          portalIcon: ShieldCheck,
          badgeColor: "bg-primary/10 text-primary border-primary/20",
          title: t("resetAdminPasswordTitle", "Reset Your Password"),
          subtitle: t(
            "resetAdminPasswordSubtitle",
            "Create a new strong password to regain access to your administrative workspace."
          ),
          heroTitle: t("adminResetHeroTitle", "Restore Administrator Access."),
          heroSubtitle: t(
            "adminResetHeroSubtitle",
            "Secure credentials ensure your gym network, staff assignments, and financial ledgers stay protected."
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
          portalBadge: t("memberPortal", "Member Portal"),
          portalIcon: User,
          badgeColor: "bg-primary/10 text-primary border-primary/20",
          title: t("setMemberPasswordTitle", "Set Your Password"),
          subtitle: t(
            "setMemberPasswordSubtitle",
            "Welcome to GymFlow! Establish your personal password to unlock attendance, QR passes, and your workouts."
          ),
          heroTitle: t("memberSetHeroTitle", "Welcome to Your Gym Journey."),
          heroSubtitle: t(
            "memberSetHeroSubtitle",
            "Track your workouts, reserve gym slots, and unlock your digital membership pass."
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
          portalBadge: t("memberPortal", "Member Portal"),
          portalIcon: User,
          badgeColor: "bg-primary/10 text-primary border-primary/20",
          title: t("resetMemberPasswordTitle", "Reset Member Password"),
          subtitle: t(
            "resetMemberPasswordSubtitle",
            "Enter and confirm your new password to restore access to your member profile."
          ),
          heroTitle: t("memberResetHeroTitle", "Get Back in the Flow."),
          heroSubtitle: t(
            "memberResetHeroSubtitle",
            "Regain access to your gym schedule, subscription details, and training achievements."
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
          portalBadge: t("staffPortal", "Staff Portal"),
          portalIcon: UserCheck,
          badgeColor: "bg-primary/10 text-primary border-primary/20",
          title: t("setStaffPasswordTitle", "Set Staff Password"),
          subtitle: t(
            "setStaffPasswordSubtitle",
            "Welcome to the GymFlow operational staff team! Set your access credentials to proceed."
          ),
          heroTitle: t("staffSetHeroTitle", "Empowering Front Desk & Floor Operations."),
          heroSubtitle: t(
            "staffSetHeroSubtitle",
            "Verify arrivals, manage member check-ins, and streamline day-to-day gym workflows."
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
          portalBadge: t("staffPortal", "Staff Portal"),
          portalIcon: UserCheck,
          badgeColor: "bg-primary/10 text-primary border-primary/20",
          title: t("resetStaffPasswordTitle", "Reset Staff Password"),
          subtitle: t(
            "resetStaffPasswordSubtitle",
            "Update your staff password to restore terminal access and front desk tools."
          ),
          heroTitle: t("staffResetHeroTitle", "Restore Front Desk Terminal Access."),
          heroSubtitle: t(
            "staffResetHeroSubtitle",
            "Ensure operational continuity with high-security staff credentials."
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

  const PortalIcon = config.portalIcon;

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

      // Automatically route after 2 seconds or let user click button
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
    <AuthLayoutShell
      heroTitle={config.heroTitle}
      heroSubtitle={config.heroSubtitle}
    >
      <div className="w-full space-y-6">
        {/* Portal Identifier Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.badgeColor}`}
        >
          <PortalIcon className="w-3.5 h-3.5" />
          <span>{config.portalBadge}</span>
        </div>

        {/* Dynamic Card */}
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
                <span>{t("successBadge", "Security Confirmed")}</span>
              </div>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                {config.successTitle}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
                {config.successSubtitle}
              </p>
            </div>

            <Link
              href={config.loginPath}
              className="w-full btn-gradient py-3.5 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer block"
            >
              <span>{config.loginLabel}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          /* FORM STATE */
          <div className="p-6 sm:p-8 bg-surface-bright rounded-3xl border border-outline-variant/60 shadow-xl space-y-5">
            {/* Header */}
            <div>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface mb-1">
                {config.title}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                {config.subtitle}
              </p>
            </div>

            {/* Token Warning Banner if token missing */}
            {isReady && !token && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t("noTokenTitle", "Missing or invalid token")}</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {t(
                      "noTokenCheckUrl",
                      "Ensure the URL includes #token=... from the email you received."
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* API Error Message */}
            {apiError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-medium">{apiError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="password"
                >
                  {t("newPassword", "New Password")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register("password")}
                    className={`w-full pl-11 pr-11 rtl:pl-11 rtl:pr-11 py-3 bg-surface-container-lowest border ${
                      errors.password
                        ? "border-error focus:ring-error"
                        : "border-outline-variant"
                    } rounded-xl form-input-focus transition-all outline-none text-sm text-on-surface placeholder:text-outline`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error font-medium mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="confirmPassword"
                >
                  {t("confirmPassword", "Confirm Password")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    className={`w-full pl-11 pr-11 rtl:pl-11 rtl:pr-11 py-3 bg-surface-container-lowest border ${
                      errors.confirmPassword
                        ? "border-error focus:ring-error"
                        : "border-outline-variant"
                    } rounded-xl form-input-focus transition-all outline-none text-sm text-on-surface placeholder:text-outline`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-error font-medium mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password Requirements Checklist & Strength Meter */}
              <PasswordStrengthMeter
                password={passwordValue}
                confirmPassword={confirmPasswordValue}
                showConfirmCheck={true}
              />

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isSubmitting || (isReady && !token)}
                className="w-full btn-gradient py-3.5 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pt-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t("submitting", "Saving...")}</span>
                  </>
                ) : (
                  <>
                    <span>{config.buttonText}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>

            {/* Back Link */}
            <div className="pt-2 text-center">
              <Link
                href={config.loginPath}
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

