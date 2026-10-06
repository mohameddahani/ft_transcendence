"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HelpCircle,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  User,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import { useTranslation } from "react-i18next";

interface TopBarProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

export default function TopBar({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}: TopBarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const {
    user,
    fullName,
    companyName,
    role,
    photo,
    initials,
    logout,
  } = useCurrentUser();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumbs dynamically based on pathname (Logo & brand are strictly in SideBar)
  const breadcrumb = useMemo(() => {
    if (!pathname || pathname === "/dashboard") {
      return { section: null, title: t("navDashboard") || "Dashboard" };
    }
    if (pathname.startsWith("/check-in")) {
      return {
        section: t("frontDesk") || "Front desk",
        title: t("navCheckIn") || "Check-in",
      };
    }
    if (pathname.startsWith("/members")) {
      return {
        section: t("frontDesk") || "Front desk",
        title: t("navMembers") || "Members",
      };
    }
    if (pathname.startsWith("/payments")) {
      return {
        section: t("frontDesk") || "Front desk",
        title: t("navPayments") || "Payments",
      };
    }
    if (
      pathname.startsWith("/membership-plans") ||
      pathname.startsWith("/subscriptions")
    ) {
      return {
        section: t("gymSetup") || "Gym setup",
        title: t("navMembershipPlans") || "Membership plans",
      };
    }
    if (pathname.startsWith("/operating-hours")) {
      return {
        section: t("gymSetup") || "Gym setup",
        title: t("navOpeningHours") || "Opening hours",
      };
    }
    if (pathname.startsWith("/staffs")) {
      return {
        section: t("gymSetup") || "Gym setup",
        title: t("navStaff") || "Staff",
      };
    }
    if (pathname.startsWith("/feedbacks")) {
      return {
        section: t("insight") || "Insight",
        title: t("navFeedback") || "Feedback",
      };
    }
    if (pathname.startsWith("/gymflow-subscription")) {
      return {
        section: t("account") || "Account",
        title: t("navGymflowSubscription") || "GymFlow subscription",
      };
    }
    if (pathname.startsWith("/profile") || pathname.startsWith("/settings")) {
      return {
        section: t("account") || "Account",
        title: t("navProfile") || "Profile",
      };
    }
    // Fallback
    const raw = pathname.replace(/^\//, "").split("/")[0];
    const formatted =
      raw.charAt(0).toUpperCase() + raw.slice(1).replace(/-/g, " ");
    return { section: null, title: formatted };
  }, [pathname, t]);

  return (
    <header className="flex justify-between items-center w-full px-4 sm:px-6 h-16 sticky top-0 z-30 bg-surface-container-lowest/80 dark:bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/50 transition-colors">
      {/* Left: Mobile hamburger toggle & Desktop contextual breadcrumb (No duplicate logo) */}
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Navigation Menu"
          className="p-2 lg:hidden rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
        >
          {isMobileSidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Desktop Breadcrumb Navigation */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          {breadcrumb.section && (
            <>
              <span className="text-on-surface-variant/75 font-medium tracking-wide">
                {breadcrumb.section}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-outline-variant/70 rtl:rotate-180" />
            </>
          )}
          <span className="font-headline font-semibold text-on-surface text-sm tracking-tight">
            {breadcrumb.title}
          </span>
        </div>
      </div>

      {/* Right: Actions, Theme, Language & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* Help Button */}
        <button
          type="button"
          title={t("help")}
          aria-label={t("help")}
          className="w-9 h-9 items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all cursor-pointer hidden sm:flex"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Dark / Light Theme Toggle */}
        <ThemeToggle />

        {/* TopBar Integrated Language Switcher */}
        <LanguageSwitcher inline />

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-outline-variant/50 mx-1 sm:mx-1.5" />

        {/* Quick Log Out Button */}
        <button
          type="button"
          onClick={logout}
          title={t("logOut")}
          aria-label={t("logOut")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-error hover:bg-error/10 border border-error/20 transition-all text-xs font-semibold cursor-pointer active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5 text-error" />
          <span className="hidden sm:inline">{t("logOut")}</span>
        </button>

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 hover:opacity-90 transition-all rounded-xl p-1 sm:px-2 sm:py-1 cursor-pointer hover:bg-surface-container-low"
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
          >
            <div className="text-right hidden sm:block">
              <p className="font-headline text-xs font-bold leading-tight text-on-surface">
                {fullName}
              </p>
              <p className="text-[11px] text-on-surface-variant font-medium leading-tight">
                {role}
              </p>
            </div>

            {photo ? (
              <img
                className="w-9 h-9 rounded-full ring-2 ring-primary/20 object-cover shadow-2xs"
                alt={fullName}
                src={photo}
              />
            ) : (
              <div className="w-9 h-9 rounded-full ring-2 ring-primary/20 bg-primary/10 text-primary flex items-center justify-center font-headline font-bold text-xs shadow-2xs select-none">
                {initials}
              </div>
            )}

            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant hidden sm:block" />
          </button>

          {/* User Profile Popup Menu */}
          {isProfileOpen && (
            <div
              role="menu"
              className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-60 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/60 shadow-xl z-50 p-2 animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <div className="px-3 py-2.5 border-b border-outline-variant/50 mb-1">
                <p className="font-headline font-bold text-sm text-on-surface">
                  {fullName}
                </p>
                {user?.email && (
                  <p className="text-xs text-on-surface-variant truncate">
                    {user.email}
                  </p>
                )}
                {companyName && (
                  <p className="text-xs text-primary font-medium truncate mt-0.5">
                    {companyName}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                    {role} {t("workspace")}
                  </span>
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <User className="w-4 h-4 text-on-surface-variant" />
                <span>{t("navProfile") || "Profile"}</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error/10 transition-colors text-left rtl:text-right cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-error" />
                <span>{t("logOut")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
