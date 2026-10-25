"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Zap, ArrowRight, ShieldCheck, BarChart3, Users, Dumbbell, UserCheck, QrCode } from "lucide-react";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg brand-gradient flex items-center justify-center">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <span className="font-bold text-xl text-on-surface font-headline tracking-tight">
              {t("brandName", "GymFlow")}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 pr-28 rtl:pr-0 rtl:pl-28">
            <Link
              href="/member/login"
              className="text-xs sm:text-sm font-bold text-primary hover:text-primary-container px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 transition-all flex items-center gap-1.5 border border-primary/20"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>{t("memberSignInBtn", "Member Login")}</span>
            </Link>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-on-surface px-3 py-1.5 transition-colors"
            >
              {t("signIn", "Sign In")}
            </Link>
            <Link
              href="/register"
              className="hidden sm:flex brand-gradient text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:opacity-95 transition-all items-center gap-1.5"
            >
              <span>{t("adminSignUp", "Admin Sign Up")}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Landing */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 sm:py-20">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {t("landingBadge", "Next-Gen Fitness Brand Operating System")}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-on-surface tracking-tight leading-tight mb-6">
            {t("landingTitle", "The Operating System for Modern Fitness Brands")}
          </h1>

          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            {t(
              "landingDesc",
              "Unite your members, trainers, and administrators in one seamless ecosystem. Real-time digital check-in passes, automated billing, and live shift analytics."
            )}
          </p>

          {/* Action CTAs: Member, Admin, Staff */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
            <Link
              href="/member/login"
              className="w-full sm:w-auto brand-gradient text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
            >
              <Dumbbell className="w-5 h-5" />
              <span>{t("loginAsMember", "Login as a Member")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-base px-6 py-3.5 rounded-xl border border-outline-variant/50 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{t("accessAdminPortal", "Admin Portal")}</span>
            </Link>

            <Link
              href="/staff/login"
              className="w-full sm:w-auto bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold text-base px-6 py-3.5 rounded-xl border border-outline-variant/40 transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-secondary" />
              <span>{t("staffPortal", "Staff Portal")}</span>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left rtl:text-right max-w-3xl mx-auto pt-8 border-t border-outline-variant/30">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm font-headline mb-1 text-on-surface">
                {t("memberEcosystem", "Member Experience")}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t(
                  "memberEcosystemDesc",
                  "Digital QR passes for turnstile access, visit history, plan renewals, and trainer feedback."
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm font-headline mb-1 text-on-surface">
                {t("staffFlow", "Staff & Front Desk")}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t(
                  "staffFlowDesc",
                  "High-speed member check-in validations, shift logs, and instant customer service tools."
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center mb-3">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm font-headline mb-1 text-on-surface">
                {t("dataDensity", "Admin Analytics")}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t(
                  "dataDensityDesc",
                  "Full control over membership tiers, pricing, operating schedules, revenue, and staff."
                )}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/30 py-6 text-center text-xs text-on-surface-variant">
        <p>© 2026 GymFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
