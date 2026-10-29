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
  Mail,
  ShieldCheck,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

import { adminLoginSchema, AdminLoginFormValues } from "@/schemas/auth";
import { loginUser } from "@/lib/api/auth";

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
    <main className="flex h-screen w-screen overflow-hidden">
      {/* Left Side: Motivational Fitness Imagery (Desktop Only) */}
      <section className="hidden lg:flex lg:w-7/12 relative h-full bg-on-surface overflow-hidden select-none">
        <div
          className="absolute inset-0 z-0 opacity-80 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAN9pUea2DevEnyv4Q-A9KSkxUTh1zsrs-mbLoPLeeWeuL9nH5pZqcPQvQMVImGR5-3i_C_A5z6qjBz1rMwYVSoKXiDAeNDhFUWXr41MxKOuDVE5kT5yft3wQeqxcICfQoyPPX_tbZ9DjBqjTOSlpma84fNISwMVeSYp4bIHB-bkOSmrnRdud33Wu8HSUs_Afo2tECEVa8RTmL_H4mdipadx1OWkmyhEv7UpyM-dHBImO7QqLKyFvo5')",
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
            <span className="font-headline text-2xl font-bold tracking-tight text-white" suppressHydrationWarning>
              {t("brandName", "GymFlow")}
            </span>
          </div>

          <div className="max-w-xl">
            <h1 className="font-headline text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight" suppressHydrationWarning>
              {t("heroTitle", "Elevate Your Performance.")}
            </h1>
            <p className="text-base lg:text-lg text-white/80 leading-relaxed" suppressHydrationWarning>
              {t(
                "heroSubtitle",
                "The ultimate ecosystem for high-performance fitness management. Synchronize your progress, payments, and potential in one unified interface."
              )}
            </p>
          </div>

          <div className="flex items-center gap-4 text-white/60 text-xs font-bold uppercase tracking-widest">
            <span>{t("power", "Power")}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span>{t("precision", "Precision")}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span>{t("performance", "Performance")}</span>
          </div>
        </div>
      </section>

      {/* Right Side: Login Form */}
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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t("adminPortal", "Administrator Portal")}</span>
            </div>
            <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">
              {t("adminSignIn", "Admin Sign In")}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {t("adminLoginSubtitle", "Sign in to access your administrative workspace and gym management tools.")}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                htmlFor="email"
              >
                {t("emailAddress", "Email Address")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@gymflow.com"
                  {...register("email")}
                  className={`w-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 py-3 bg-surface-container-lowest border ${
                    errors.email
                      ? "border-error focus:ring-error"
                      : "border-outline-variant"
                  } rounded-xl form-input-focus transition-all outline-none text-sm text-on-surface placeholder:text-outline`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-error font-medium mt-1">
                  {errors.email.message}
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
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline transition-all"
                >
                  {t("forgotPassword", "Forgot password?")}
                </Link>
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
                  <span>{t("signInAdminPortal", "Sign In as Administrator")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Footnote / Secondary Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              {t("gymOwner", "Gym owner?")}{" "}
              <Link
                href="/register"
                className="text-primary font-semibold hover:underline decoration-2 underline-offset-4"
              >
                {t("createAccount", "Create an account")}
              </Link>
            </p>
          </div>

          {/* Switcher to Staff and Member Portals */}
          <div className="mt-6 pt-5 border-t border-outline-variant/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
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
