"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { Mail, ShieldCheck, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

import { adminLoginSchema, AdminLoginFormValues } from "@/schemas/auth";
import { loginUser } from "@/lib/api/auth";
import AuthShell, { PortalBadge } from "@/components/auth/AuthShell";
import { ManagementIllustration } from "@/components/auth/illustrations";
import {
  eyeButton,
  fieldError,
  fieldIcon,
  fieldLabel,
  forgotLink,
  inputBase,
  inputRing,
  limeUnderline,
  muted,
  submitArrow,
  submitButton,
} from "@/components/auth/authStyles";

export default function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await loginUser({
        email: data.email.trim(),
        password: data.password.trim(),
      });

      if (response.user) {
        try {
          localStorage.setItem("gym_user", JSON.stringify(response.user));
        } catch {
          // ignore localStorage error if in private mode
        }
      }

      const userGreeting = response.user?.firstName
        ? `${response.user.firstName}!`
        : "Administrator!";

      toast.success(`Welcome back, ${userGreeting}`);

      // Short delay before redirect to ensure toast is visible
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data) {
        const errorData = err.response.data as {
          message?: string | string[];
          error?: string;
        };
        const message = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || errorData.error || "Login failed";
        toast.error(message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to connect to authentication server. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      panelTitle={t("loginPanelTitle", "Run your club with clarity.")}
      illustration={<ManagementIllustration />}
      portals={[
        { href: "/member/login", label: t("switchToMemberPortal", "Member Portal Sign In") },
        { href: "/staff/login", label: t("switchToStaffPortal", "Staff Portal Sign In") },
      ]}
    >
      {/* Form Header */}
      <PortalBadge icon={<ShieldCheck className="size-3.5" aria-hidden="true" />} label={t("adminPortal", "Administrator Portal")} />
      <h1 className="mt-5 font-headline text-3xl font-semibold tracking-[-0.03em]">{t("adminSignIn", "Admin Sign In")}</h1>
      <p className={`mt-2 text-sm leading-6 ${muted}`}>
        {t("adminLoginSubtitle", "Sign in to access your administrative workspace and gym management tools.")}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className={fieldLabel} htmlFor="email">
            {t("emailAddress", "Email Address")}
          </label>
          <div className="group relative">
            <Mail className={`size-[18px] ${fieldIcon}`} aria-hidden="true" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@yourclub.com"
              aria-invalid={errors.email ? true : undefined}
              {...register("email")}
              className={`${inputBase} ${inputRing(!!errors.email)}`}
            />
          </div>
          {errors.email && <p className={fieldError}>{errors.email.message}</p>}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={fieldLabel} htmlFor="password">
              {t("password", "Password")}
            </label>
            <Link href="/forgot-password" className={forgotLink}>
              {t("forgotPassword", "Forgot password?")}
            </Link>
          </div>
          <div className="group relative">
            <Lock className={`size-[18px] ${fieldIcon}`} aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
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

        {/* Submit Action: the platform's dark pill, with the lime arrow */}
        <button type="submit" disabled={isSubmitting} className={submitButton}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>{t("authenticating", "Authenticating...")}</span>
            </>
          ) : (
            <>
              <span>{t("signInAdminPortal", "Sign In as Administrator")}</span>
              <span className={submitArrow}>
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </span>
            </>
          )}
        </button>
      </form>

      {/* Footnote / Secondary Link */}
      <p className={`mt-6 text-center text-sm ${muted}`}>
        {t("gymOwner", "Gym administrator?")}{" "}
        <Link href="/register" className={`font-semibold text-[var(--toota-ink)] ${limeUnderline} transition-[text-decoration-thickness] hover:decoration-[3px]`}>
          {t("createAccount", "Create an account")}
        </Link>
      </p>
    </AuthShell>
  );
}
