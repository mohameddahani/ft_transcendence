"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SportiumLogo } from "@/components/brand/SportiumLogo";

interface SimpleAuthShellProps {
  children: ReactNode;
}

export default function SimpleAuthShell({ children }: SimpleAuthShellProps) {
  const { t } = useTranslation();

  return (
    <main className="relative flex min-h-screen w-full flex-col justify-between bg-[var(--toota-main)] px-4 py-6 text-[var(--toota-ink)] sm:px-6 lg:px-8">
      {/* Top Header: Logo on left, Language & Theme toggles on right */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link
          href="/"
          aria-label="Sportium home"
          className="rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
        >
          <SportiumLogo className="h-7 text-[var(--toota-ink)]" />
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <div className="flex items-center justify-center rounded-full bg-[var(--toota-pill)] p-0.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content: Centered minimalist card without side images */}
      <div className="my-auto flex w-full justify-center py-8">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-[var(--toota-card)] p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/10 sm:p-8">
            {children}
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="w-full py-4 text-center">
        <p className="text-xs text-[#8a9098]">
          {t("sportiumCopyright", "© 2026 Sportium. All rights reserved.")}
        </p>
      </footer>
    </main>
  );
}

