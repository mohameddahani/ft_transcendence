"use client";

import React from "react";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

interface AuthLayoutShellProps {
  children: React.ReactNode;
  heroTitle?: string;
  heroSubtitle?: string;
}

export default function AuthLayoutShell({
  children,
  heroTitle,
  heroSubtitle,
}: AuthLayoutShellProps) {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen w-screen overflow-x-hidden">
      {/* Top right quick actions (Language & Theme) */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <LanguageSwitcher />
        <div className="p-1 rounded-xl bg-surface-container-high border border-outline-variant/60 shadow-xs">
          <ThemeToggle />
        </div>
      </div>

      {/* Left Side: Motivational Fitness Imagery (Desktop Only) */}
      <section className="hidden lg:flex lg:w-6/12 xl:w-7/12 relative min-h-screen bg-on-surface overflow-hidden select-none">
        <div
          className="absolute inset-0 z-0 opacity-80 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAN9pUea2DevEnyv4Q-A9KSkxUTh1zsrs-mbLoPLeeWeuL9nH5pZqcPQvQMVImGR5-3i_C_A5z6qjBz1rMwYVSoKXiDAeNDhFUWXr41MxKOuDVE5kT5yft3wQeqxcICfQoyPPX_tbZ9DjBqjTOSlpma84fNISwMVeSYp4bIHB-bkOSmrnRdud33Wu8HSUs_Afo2tECEVa8RTmL_H4mdipadx1OWkmyhEv7UpyM-dHBImO7QqLKyFvo5')",
          }}
        />

        {/* Overlay Gradient for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent z-10" />

        {/* Brand Identity on Imagery */}
        <div className="relative z-20 flex flex-col justify-between h-full p-12 lg:p-16 w-full text-white">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Dumbbell className="w-6 h-6" />
            </div>
            <span className="font-headline text-2xl font-bold tracking-tight text-white" suppressHydrationWarning>
              {t("brandName", "GymFlow")}
            </span>
          </Link>

          <div className="max-w-xl space-y-4">
            <h1 className="font-headline text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight" suppressHydrationWarning>
              {heroTitle || t("heroTitle", "Elevate Your Performance.")}
            </h1>
            <p className="text-sm lg:text-base text-white/80 leading-relaxed" suppressHydrationWarning>
              {heroSubtitle ||
                t(
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

      {/* Right Side: Form or Interactive Content */}
      <section className="w-full lg:w-6/12 xl:w-5/12 min-h-screen flex flex-col justify-between items-center px-6 sm:px-10 lg:px-12 py-10 brand-mesh relative overflow-y-auto">
        {/* Mobile Header Branding */}
        <div className="lg:hidden flex items-center gap-3 w-full max-w-[460px] mb-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="font-headline text-2xl font-bold text-primary">
              {t("brandName", "GymFlow")}
            </span>
          </Link>
        </div>

        {/* Content Container */}
        <div className="w-full max-w-[460px] my-auto">
          {children}
        </div>

        {/* Footer */}
        <footer className="w-full max-w-[460px] text-center pt-8 mt-4">
          <p className="text-xs text-outline opacity-60">
            {t("copyright", "© 2026 GymFlow SaaS. All rights reserved.")}
          </p>
        </footer>
      </section>
    </main>
  );
}

