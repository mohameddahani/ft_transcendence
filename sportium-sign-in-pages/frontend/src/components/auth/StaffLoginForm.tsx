"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { User, UserCheck, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

import { staffLoginSchema, StaffLoginFormValues } from "@/schemas/auth";
import { loginStaff } from "@/lib/api/auth";
import AuthShell, { PortalBadge } from "@/components/auth/AuthShell";
import { FrontDeskIllustration } from "@/components/auth/illustrations";
import {
  eyeButton,
  fieldError,
  fieldIcon,
  fieldLabel,
  forgotLink,
  inputBase,
  inputRing,
  muted,
  submitArrow,
  submitButton,
} from "@/components/auth/authStyles";

export default function StaffLoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffLoginFormValues>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: {
      userName: "",
      password: "",
    },
  });

  const onSubmit = async (data: StaffLoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await loginStaff({
        userName: data.userName.trim(),
        password: data.password.trim(),
      });

      const userObject = response.user || (response as unknown as { staff?: unknown }).staff;

      if (userObject) {
        try {
          localStorage.setItem("gym_user", JSON.stringify(userObject));
        } catch {
          // ignore localStorage error if in private mode
        }
      }

      const greetingName =
        (userObject as { firstName?: string })?.firstName ||
        (userObject as { userName?: string })?.userName ||
        "Staff";

      toast.success(`Welcome back, ${greetingName}!`);

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
      panelTitle={t("staffPanelTitle", "Keep the front desk moving.")}
      illustration={<FrontDeskIllustration />}
      portals={[
        { href: "/login", label: t("switchToAdminPortal", "Admin Portal Sign In") },
        { href: "/member/login", label: t("switchToMemberPortal", "Member Portal Sign In") },
      ]}
    >
      {/* Form Header */}
      <PortalBadge icon={<UserCheck className="size-3.5" aria-hidden="true" />} label={t("staffPortal", "Staff Portal")} />
      <h1 className="mt-5 font-headline text-3xl font-semibold tracking-[-0.03em]">{t("staffSignIn", "Staff Sign In")}</h1>
      <p className={`mt-2 text-sm leading-6 ${muted}`}>
        {t("staffLoginSubtitle", "Enter your staff credentials assigned by your gym administrator.")}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
        {/* Username Field */}
        <div className="space-y-1.5">
          <label className={fieldLabel} htmlFor="userName">
            {t("username", "Username")}
          </label>
          <div className="group relative">
            <User className={`size-[18px] ${fieldIcon}`} aria-hidden="true" />
            <input
              id="userName"
              type="text"
              autoComplete="username"
              placeholder="e.g. reception.club"
              aria-invalid={errors.userName ? true : undefined}
              {...register("userName")}
              className={`${inputBase} ${inputRing(!!errors.userName)}`}
            />
          </div>
          {errors.userName && <p className={fieldError}>{errors.userName.message}</p>}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={fieldLabel} htmlFor="password">
              {t("password", "Password")}
            </label>
            <Link href="/staff/forgot-password" className={forgotLink}>
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
              <span>{t("signInStaffPortal", "Sign In as Staff")}</span>
              <span className={submitArrow}>
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </span>
            </>
          )}
        </button>
      </form>

      {/* Footnote: staff accounts come from the club */}
      <p className={`mt-6 text-center text-sm ${muted}`}>
        {t("staffNoAccount", "No account yet? Ask your club's administrator.")}
      </p>
    </AuthShell>
  );
}
