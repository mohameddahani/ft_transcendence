"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  ScanLine,
  Users,
  CreditCard,
  Layers,
  Clock,
  UserCheck,
  MessageSquareQuote,
  Sparkles,
  Crown,
  User,
  CalendarCheck,
  Store,
  ShoppingBag,
  Sun,
  Moon,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTranslation } from "react-i18next";
import { triggerOpenAddMemberModal } from "@/lib/events/modal-events";
import { SportiumIcon } from "@/components/brand/SportiumLogo";

interface SideBarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onQuickAction?: () => void;
}

export default function SideBar({
  isMobileOpen,
  onCloseMobile,
  onQuickAction,
}: SideBarProps) {
  const pathname = usePathname();
  const { logout, role, companyName, isLoading } = useCurrentUser();
  const { t } = useTranslation();

  const isAdmin = role === "Admin";
  const isMember = role === "Member";

  // Theme synchronization with Toota segmented toggle
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme =
        localStorage.getItem("toota-theme") || localStorage.getItem("theme");
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDarkMode =
        savedTheme === "dark" ||
        (!savedTheme && prefersDark) ||
        document.documentElement.classList.contains("dark") ||
        document.documentElement.dataset.theme === "dark";

      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        document.documentElement.dataset.theme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.dataset.theme = "light";
      }
      setIsDark(isDarkMode);
    };
    syncTheme();
    window.addEventListener("themechange", syncTheme);
    return () => window.removeEventListener("themechange", syncTheme);
  }, []);

  const handleSetTheme = (themeMode: "light" | "dark") => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
      localStorage.setItem("theme", "dark");
      localStorage.setItem("toota-theme", "dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.dataset.theme = "light";
      localStorage.setItem("theme", "light");
      localStorage.setItem("toota-theme", "light");
      setIsDark(false);
    }
    window.dispatchEvent(new Event("themechange"));
  };

  const isRouteActive = (route: string) => {
    if (route === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (route === "/profile") {
      return (
        pathname === "/profile" ||
        pathname.startsWith("/profile/") ||
        pathname === "/settings"
      );
    }
    if (route === "/membership-plans") {
      return (
        pathname === "/membership-plans" ||
        pathname.startsWith("/membership-plans/") ||
        pathname === "/subscriptions"
      );
    }
    if (route === "/marketplace") {
      return pathname === "/marketplace" || pathname.startsWith("/marketplace/");
    }
    if (route === "/assistant") {
      return pathname === "/assistant" || pathname.startsWith("/assistant/");
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  // Toota pill navigation link style
  const getPillClasses = (active: boolean) =>
    `group flex items-center gap-3 px-5 py-3 rounded-full text-sm font-medium transition-all select-none ${
      active
        ? "bg-white text-black font-semibold shadow-sm"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  const renderContent = () => (
    <div className="flex flex-col h-full p-5 text-white select-none">
      {/* Toota Brand Header */}
      <div className="flex items-center justify-between mb-8 px-2 shrink-0">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity min-w-0"
        >
          {/* Sportium Brand Icon */}
          <SportiumIcon className="size-8 text-white shrink-0" />
          <span className="font-sans font-bold text-xl tracking-wider uppercase text-white truncate">
            {companyName || "SPORTIUM"}
          </span>
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close Navigation"
          className="lg:hidden p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <nav
        aria-label="Main Navigation"
        className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pe-1"
      >
        {/* Overview / Dashboard */}
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          aria-current={isRouteActive("/dashboard") ? "page" : undefined}
          className={getPillClasses(isRouteActive("/dashboard"))}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span className="truncate">{t("navDashboard") || "Overview"}</span>
        </Link>

        {isLoading ? (
          <div className="flex flex-col gap-2 px-2 py-4 animate-pulse">
            <div className="h-10 w-full bg-white/5 rounded-full" />
            <div className="h-10 w-full bg-white/5 rounded-full" />
            <div className="h-10 w-full bg-white/5 rounded-full" />
            <div className="h-10 w-full bg-white/5 rounded-full" />
          </div>
        ) : isMember ? (
          /* Member Navigation Items */
          <>
            <Link
              href="/visits"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/visits") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/visits"))}
            >
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navVisits") || "Visits & Attendances"}</span>
            </Link>

            <Link
              href="/operating-hours"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/operating-hours") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/operating-hours"))}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navOpeningHours") || "Gym hours"}</span>
            </Link>

            <Link
              href="/feedbacks"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/feedbacks") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/feedbacks"))}
            >
              <MessageSquareQuote className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navFeedback") || "Feedback"}</span>
            </Link>

            <Link
              href="/marketplace"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/marketplace") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/marketplace"))}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navMarketplace") || "Marketplace"}</span>
            </Link>

            <Link
              href="/assistant"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/assistant") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/assistant"))}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navAiAssistant") || "AI assistant"}</span>
              <span
                className={`ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isRouteActive("/assistant")
                    ? "bg-black/10 text-black"
                    : "bg-white/10 text-[#a3e635]"
                }`}
              >
                AI
              </span>
            </Link>

            <Link
              href="/profile"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/profile") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/profile"))}
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navProfile") || "Profile & Memberships"}</span>
            </Link>
          </>
        ) : (
          /* Admin & Staff Navigation Items */
          <>
            <Link
              href="/check-in"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/check-in") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/check-in"))}
            >
              <ScanLine className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navCheckIn") || "Check-in"}</span>
            </Link>

            <Link
              href="/members"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/members") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/members"))}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navMembers") || "Members"}</span>
            </Link>

            <Link
              href="/payments"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/payments") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/payments"))}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navPayments") || "Payments"}</span>
            </Link>

            <Link
              href="/marketplace"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/marketplace") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/marketplace"))}
            >
              <Store className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navMarketplace") || "Marketplace"}</span>
            </Link>

            {isAdmin && (
              <>
                <Link
                  href="/membership-plans"
                  onClick={onCloseMobile}
                  aria-current={isRouteActive("/membership-plans") ? "page" : undefined}
                  className={getPillClasses(isRouteActive("/membership-plans"))}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {t("navMembershipPlans") || "Membership plans"}
                  </span>
                </Link>

                <Link
                  href="/operating-hours"
                  onClick={onCloseMobile}
                  aria-current={isRouteActive("/operating-hours") ? "page" : undefined}
                  className={getPillClasses(isRouteActive("/operating-hours"))}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {t("navOpeningHours") || "Opening hours"}
                  </span>
                </Link>

                <Link
                  href="/staffs"
                  onClick={onCloseMobile}
                  aria-current={isRouteActive("/staffs") ? "page" : undefined}
                  className={getPillClasses(isRouteActive("/staffs"))}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t("navStaff") || "Staff"}</span>
                </Link>
              </>
            )}

            <Link
              href="/feedbacks"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/feedbacks") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/feedbacks"))}
            >
              <MessageSquareQuote className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navFeedback") || "Feedback"}</span>
            </Link>

            <Link
              href="/assistant"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/assistant") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/assistant"))}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navAiAssistant") || "AI assistant"}</span>
              <span
                className={`ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isRouteActive("/assistant")
                    ? "bg-black/10 text-black"
                    : "bg-white/10 text-[#a3e635]"
                }`}
              >
                AI
              </span>
            </Link>

            {isAdmin && (
              <Link
                href="/gymflow-subscription"
                onClick={onCloseMobile}
                aria-current={
                  isRouteActive("/gymflow-subscription") ? "page" : undefined
                }
                className={getPillClasses(isRouteActive("/gymflow-subscription"))}
              >
                <Crown className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {t("navGymflowSubscription") || "Subscription"}
                </span>
              </Link>
            )}

            <Link
              href="/profile"
              onClick={onCloseMobile}
              aria-current={isRouteActive("/profile") ? "page" : undefined}
              className={getPillClasses(isRouteActive("/profile"))}
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate">{t("navProfile") || "Profile"}</span>
            </Link>
          </>
        )}

        {/* Quick Add Member Pill Action (Admin/Staff only) */}
        {!isLoading && !isMember && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                if (onQuickAction) {
                  onQuickAction();
                } else {
                  triggerOpenAddMemberModal();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer border border-white/10 shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-[#a3e635]" />
              <span>{t("addNewMember") || "Add Member"}</span>
            </button>
          </div>
        )}
      </nav>

      {/* Toota Theme Segmented Control pinned to bottom */}
      <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-2 shrink-0">
        <p className="text-sm font-normal text-white/90 px-1">
          {isDark ? "Dark Mode" : "Light Mode"}
        </p>
        <div className="toota-seg">
          <button
            type="button"
            onClick={() => handleSetTheme("light")}
            className={!isDark ? "on" : ""}
            aria-label="Light mode"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSetTheme("dark")}
            className={isDark ? "on" : ""}
            aria-label="Dark mode"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        {/* User Session Info & Log Out */}
        <div className="flex items-center justify-between text-xs text-white/70 px-1 pt-2">
          <span className="truncate max-w-[150px]">
            {isLoading
              ? "..."
              : isMember
              ? t("roleGymMember") || "Member"
              : isAdmin
              ? t("roleGymAdministrator") || "Administrator"
              : t("roleGymStaff") || "Staff"}
          </span>
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              logout();
            }}
            title={t("logOut") || "Log Out"}
            aria-label={t("logOut") || "Log Out"}
            className="p-1.5 rounded-full text-white/60 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed SideBar: Width 256px (w-64) */}
      <aside className="fixed left-0 rtl:left-auto rtl:right-0 top-0 h-screen w-64 bg-toota-side hidden lg:flex flex-col z-40 shadow-xl">
        {renderContent()}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Offcanvas Drawer */}
      <div
        className={`fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 w-64 bg-toota-side z-50 flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        {renderContent()}
      </div>
    </>
  );
}
