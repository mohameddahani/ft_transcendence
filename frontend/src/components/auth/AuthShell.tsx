"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SportiumLogo } from "@/components/brand/SportiumLogo";
import { muted } from "@/components/auth/authStyles";

type Portal = { href: string; label: string };

// the sign-in page frame: dark brand panel with a drawing on the left, glass card on the right, links to the other portals
export default function AuthShell({
  panelTitle,
  illustration,
  portals = [],
  wide = false,
  children,
}: {
  panelTitle: string;
  illustration: ReactNode;
  portals?: Portal[];
  wide?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <main className="relative flex min-h-screen w-full bg-[var(--toota-main)] text-[var(--toota-ink)] lg:h-screen lg:overflow-hidden">
      {/* Top right quick actions (Language & Theme) */}
      <div className="fixed top-4 right-4 rtl:right-auto rtl:left-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <div className="flex items-center justify-center rounded-full bg-[var(--toota-pill)] p-0.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          <ThemeToggle />
        </div>
      </div>

      {/* Left: the platform's dark panel (desktop only) */}
      <section className="relative m-3 hidden overflow-hidden rounded-[32px] bg-[#1b1f23] text-white lg:flex lg:w-[54%] dark:bg-[#0f1114] dark:ring-1 dark:ring-white/10">
        {/* court lines, fading out from the top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_80%_60%_at_30%_0%,black,transparent)]"
        />

        <div className="relative z-10 flex w-full flex-col p-12 xl:p-14">
          <Link
            href="/"
            aria-label="Sportium home"
            className="self-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
          >
            <SportiumLogo className="h-8 text-white" />
          </Link>

          {/* drawn at 540x440, then zoomed to fit narrower or shorter screens; always left to right, like a screenshot */}
          <div className="flex flex-1 items-center justify-center py-6">
            <div dir="ltr" className="[zoom:0.8] [@media(min-width:1280px)_and_(min-height:781px)]:[zoom:1] [@media(max-height:780px)]:[zoom:0.74]">
              {illustration}
            </div>
          </div>

          <p className="font-headline text-3xl leading-[1.1] font-semibold tracking-[-0.03em] xl:text-[2.6rem]">
            {panelTitle}
            <span className="mt-1 block text-white/55">
              {t("loginPanelTitle2a", "Built for")}{" "}
              <span className="bg-[linear-gradient(transparent_82%,#a3e635_82%,#a3e635_89%,transparent_89%)] text-white">
                {t("loginPanelTitle2b", "every sports club.")}
              </span>
            </span>
          </p>
        </div>
      </section>

      {/* Right: the sign-in card */}
      <section className="relative flex w-full flex-col items-center px-5 py-20 sm:px-10 lg:w-[46%] lg:overflow-y-auto lg:pt-20 lg:pb-10">
        <div
          className={`my-auto w-full ${wide ? "max-w-[580px]" : "max-w-[440px]"}`}
        >
          {/* Mobile branding */}
          <Link
            href="/"
            aria-label="Sportium home"
            className="mb-8 inline-flex lg:hidden"
          >
            <SportiumLogo className="h-7 text-[var(--toota-ink)]" />
          </Link>

          <div className="rounded-[28px] bg-[var(--toota-card)] p-7 shadow-[0_1px_4px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-9 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_4px_20px_-2px_rgba(0,0,0,0.4)]">
            {children}
          </div>

          {/* Switcher to the other portals */}
          {portals.length > 0 && (
            <>
              <p className={`mt-6 text-center text-xs font-medium ${muted}`}>
                {t("otherPortals", "Not your portal? Sign in to yours")}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                {portals.map((portal) => (
                  <Link
                    key={portal.href}
                    href={portal.href}
                    className="group flex h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--toota-pill)] px-3 text-xs font-semibold shadow-sm ring-1 ring-black/5 transition-shadow hover:ring-2 hover:ring-[#a3e635] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] dark:ring-white/10"
                  >
                    <span>{portal.label}</span>
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Minimal Footer Copyright */}
        <footer className="w-full pt-8 text-center">
          <p className="text-xs text-[#8a9098]">
            {t("sportiumCopyright", "© 2026 Sportium. All rights reserved.")}
          </p>
        </footer>
      </section>
    </main>
  );
}

// the small pill above the card title, with a lime icon
export function PortalBadge({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--toota-pill)] py-1 pr-3.5 pl-1 text-xs font-semibold shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      <span className="grid size-6 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
        {icon}
      </span>
      {label}
    </span>
  );
}
