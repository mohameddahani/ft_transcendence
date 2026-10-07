"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Zap, ArrowRight, ShieldCheck, BarChart3, Users } from "lucide-react";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg kinetic-gradient flex items-center justify-center">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <span className="font-bold text-xl text-on-surface font-headline tracking-tight">
              {t("brandName", "GymFlow")}
            </span>
          </div>

          <div className="flex items-center gap-3 pr-28 rtl:pr-0 rtl:pl-28">
            <Link
              href="/login"
              className="text-sm font-semibold text-on-surface-variant hover:text-on-surface px-4 py-2 transition-colors"
            >
              {t("signIn", "Sign In")}
            </Link>
            <Link
              href="/register"
              className="kinetic-gradient text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <span>{t("adminSignUp", "Admin Sign Up")}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Landing Placeholder */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {t("landingBadge", "Landing Page in Development")}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-on-surface tracking-tight leading-tight mb-6">
            {t("landingTitle", "The Operating System for Modern Fitness Brands")}
          </h1>

          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            {t(
              "landingDesc",
              "Configure your enterprise dashboard, optimize operations, and unlock high-impact data density built for fitness growth."
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="w-full sm:w-auto kinetic-gradient text-white font-semibold text-base px-8 py-3.5 rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>{t("goToRegistration", "Go to Admin Registration")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-base px-8 py-3.5 rounded-xl border border-outline-variant/50 transition-all flex items-center justify-center"
            >
              {t("accessPortal", "Access Admin Portal")}
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left rtl:text-right max-w-3xl mx-auto pt-8 border-t border-outline-variant/30">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm font-headline mb-1 text-on-surface">
                {t("dataDensity", "Data Density")}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t(
                  "dataDensityDesc",
                  "Real-time operational dashboards engineered for multi-location performance."
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm font-headline mb-1 text-on-surface">
                {t("staffFlow", "Staff & Admin Flow")}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t(
                  "staffFlowDesc",
                  "Granular role control and simplified shift and member management."
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm font-headline mb-1 text-on-surface">
                {t("security", "Enterprise Security")}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t(
                  "securityDesc",
                  "Encrypted token sessions and robust data isolation out of the box."
                )}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/30 py-6 text-center text-xs text-on-surface-variant">
        <p>© 2026 GymFlow Kinetic Enterprise. All rights reserved.</p>
      </footer>
    </div>
  );
}
