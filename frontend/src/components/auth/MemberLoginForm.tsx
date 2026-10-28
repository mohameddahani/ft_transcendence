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
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  QrCode,
  CalendarCheck,
  Award,
  Zap,
} from "lucide-react";

import { memberLoginSchema, MemberLoginFormValues } from "@/schemas/auth";
import { loginMember } from "@/lib/api/auth";

export default function MemberLoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberLoginFormValues>({
    resolver: zodResolver(memberLoginSchema),
    defaultValues: {
      userName: "",
      password: "",
    },
  });

  const onSubmit = async (data: MemberLoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await loginMember({
        userName: data.userName.trim(),
        password: data.password.trim(),
      });

      const memberObject =
        response.user ||
        (response as unknown as { member?: unknown }).member;

      if (memberObject) {
        try {
          localStorage.setItem("gym_user", JSON.stringify(memberObject));
          localStorage.removeItem("kinetic_user");
        } catch {
          // ignore localStorage error if in private mode
        }
      }

      const greetingName =
        (memberObject as { firstName?: string })?.firstName ||
        (memberObject as { userName?: string })?.userName ||
        "Member";

      toast.success(
        t("welcomeBackMember", "Welcome back, {{name}}!", { name: greetingName })
      );

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
      {/* Left Side: Member Fitness Experience Imagery (Desktop Only) */}
      <section className="hidden lg:flex lg:w-7/12 relative h-full bg-on-surface overflow-hidden select-none">
        <div
          className="absolute inset-0 z-0 opacity-80 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1600&auto=format&fit=crop')",
          }}
        />

        {/* Ambient Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-10" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none z-10" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] pointer-events-none z-10" />

        {/* Floating Brand & Fitness Value Statements */}
        <div className="relative z-20 flex flex-col justify-between w-full p-12 lg:p-16 text-white h-full">
          {/* Top Brand Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
              <Zap className="w-5 h-5 text-primary fill-primary" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight font-headline">
                GymFlow
              </span>
              <span className="block text-[11px] font-semibold text-white/70 uppercase tracking-widest">
                {t("memberExperience", "Member Experience")}
              </span>
            </div>
          </div>

          {/* Motivational Hero Text & Value Highlights */}
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white/90">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{t("seamlessWorkoutLife", "Your Fitness Journey in One Place")}</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black font-headline tracking-tight leading-tight">
              {t("memberHeroTitle", "Push Your Limits. Track Every Milestone.")}
            </h1>

            <p className="text-sm xl:text-base text-white/80 leading-relaxed font-normal">
              {t(
                "memberHeroSubtitle",
                "Instant digital QR check-in, real-time membership renewals, attendance streaks, and direct feedback with your gym coaches."
              )}
            </p>

            {/* Micro Feature Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col gap-1">
                <QrCode className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold">{t("fastQrCheckin", "QR Check-In")}</span>
                <span className="text-[10px] text-white/70 leading-tight">
                  {t("instantAccess", "Instant turnstile entry")}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col gap-1">
                <CalendarCheck className="w-5 h-5 text-secondary" />
                <span className="text-xs font-bold">{t("visitHistory", "Visit Logs")}</span>
                <span className="text-[10px] text-white/70 leading-tight">
                  {t("trackAttendance", "Track monthly progress")}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col gap-1">
                <Award className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold">{t("activePass", "Active Pass")}</span>
                <span className="text-[10px] text-white/70 leading-tight">
                  {t("plansRenewals", "Plans & validities")}
                </span>
              </div>
            </div>
          </div>

          {/* Social Proof Quote */}
          <div className="pt-4 border-t border-white/15 text-xs text-white/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <span className="font-medium">
                {t("quoteAuthor", "Connected to top tier fitness clubs worldwide")}
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">
              v2.5
            </span>
          </div>
        </div>
      </section>

      {/* Right Side: Clean Member Login Form */}
      <section className="w-full lg:w-5/12 h-full flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto bg-surface">
        <div className="w-full max-w-md mx-auto my-auto py-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center text-white shadow-xs">
                <Dumbbell className="w-4 h-4" />
              </div>
              <span className="font-headline font-bold text-lg tracking-tight text-on-surface">
                GymFlow
              </span>
            </Link>

            {/* Member Portal Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t("memberPortal", "Member Portal")}
            </span>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-1.5 mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface font-headline tracking-tight">
              {t("memberSignInTitle", "Welcome, Athlete!")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t(
                "memberSignInSubtitle",
                "Enter your member username and password provided during gym registration."
              )}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                htmlFor="userName"
              >
                {t("memberUsername", "Member Username")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="userName"
                  type="text"
                  placeholder="e.g. mohamed-dahani-x14s"
                  autoComplete="username"
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
              <div className="flex justify-between items-center">
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="password"
                >
                  {t("password", "Password")}
                </label>
              </div>
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
                  <span>{t("signInMemberPortal", "Sign In as Member")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Switcher to Admin and Staff Portals */}
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
                {t("areYouStaff", "Are you a staff member?")}
              </span>
              <Link
                href="/staff/login"
                className="font-bold text-primary hover:underline flex items-center gap-1 transition-all"
              >
                <span>{t("switchToStaffPortal", "Staff Portal Sign In")}</span>
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
