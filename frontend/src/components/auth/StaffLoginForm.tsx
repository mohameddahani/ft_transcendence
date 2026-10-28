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
  Dumbbell,
  User,
  UserCheck,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

import { staffLoginSchema, StaffLoginFormValues } from "@/schemas/auth";
import { loginStaff } from "@/lib/api/auth";

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
          localStorage.removeItem("kinetic_user");
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
      }, 1000);
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
    <main className="flex h-screen w-screen overflow-hidden">
      {/* Left Side: Front Desk & Team Imagery (Desktop Only) */}
      <section className="hidden lg:flex lg:w-7/12 relative h-full bg-on-surface overflow-hidden select-none">
        <div
          className="absolute inset-0 z-0 opacity-80 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
          }}
        />

        {/* Overlay Gradient for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

        {/* Brand Identity on Imagery */}
        <div className="relative z-20 flex flex-col justify-between h-full p-12 lg:p-16 w-full text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-headline text-2xl font-bold tracking-tight text-white">
                {t("brandName", "GymFlow")}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/20 text-white uppercase tracking-widest">
                STAFF
              </span>
            </div>
          </div>

          <div className="max-w-xl">
            <h1 className="font-headline text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {t("staffHeroTitle", "Powering Your Front Desk & Floor Operations.")}
            </h1>
            <p className="text-base lg:text-lg text-white/80 leading-relaxed">
              {t(
                "staffHeroSubtitle",
                "Fast check-ins, instantaneous member validations, and high-tempo attendance tracking designed for team performance."
              )}
            </p>
          </div>

          <div className="flex items-center gap-4 text-white/60 text-xs font-bold uppercase tracking-widest">
            <span>{t("speed", "Speed")}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span>{t("service", "Service")}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span>{t("precision", "Precision")}</span>
          </div>
        </div>
      </section>

      {/* Right Side: Staff Login Form */}
      <section className="w-full lg:w-5/12 h-full flex flex-col justify-center items-center px-6 sm:px-10 lg:px-12 brand-mesh relative overflow-y-auto">
        <div className="w-full max-w-[440px] flex flex-col my-auto">
          {/* Mobile Branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8 self-start">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="font-headline text-2xl font-bold text-primary">
              {t("brandName", "GymFlow")}
            </span>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-3">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{t("staffPortal", "Staff Portal")}</span>
            </div>
            <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">
              {t("staffSignIn", "Staff Sign In")}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {t(
                "staffLoginSubtitle",
                "Enter your staff credentials assigned by your gym administrator."
              )}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Username Field */}
            <div className="space-y-1.5">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                htmlFor="userName"
              >
                {t("username", "Username")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="userName"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. mohamed-dahani"
                  {...register("userName")}
                  className={`w-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 py-3 bg-surface-container-lowest border ${
                    errors.userName
                      ? "border-error focus:ring-error"
                      : "border-outline-variant"
                  } rounded-xl form-input-focus transition-all outline-none text-sm text-on-surface placeholder:text-outline`}
                />
              </div>
              {errors.userName && (
                <p className="text-xs text-error font-medium mt-1">
                  {errors.userName.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                htmlFor="password"
              >
                {t("password", "Password")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-gradient py-3.5 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("authenticating", "Authenticating...")}</span>
                </>
              ) : (
                <>
                  <span>{t("signInStaffPortal", "Sign In as Staff")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Switcher to Admin and Member Portals */}
          <div className="mt-8 pt-6 border-t border-outline-variant/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-medium">
                {t("areYouAdmin", "Gym Administrator or Owner?")}
              </span>
              <Link
                href="/login"
                className="font-bold text-primary hover:underline flex items-center gap-1 transition-all"
              >
                <span>{t("switchToAdminPortal", "Admin Portal Sign In")}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-on-surface-variant font-medium">
                {t("areYouMember", "Are you a gym member?")}
              </span>
              <Link
                href="/member/login"
                className="font-bold text-primary hover:underline flex items-center gap-1 transition-all"
              >
                <span>{t("switchToMemberPortal", "Member Portal Sign In")}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>

        {/* Minimal Footer Copyright */}
        <footer className="w-full text-center py-4 mt-auto">
          <p className="text-xs text-outline opacity-60">
            {t("copyright", "© 2026 GymFlow SaaS. All rights reserved.")}
          </p>
        </footer>
      </section>
    </main>
  );
}
