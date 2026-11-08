"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  ShieldCheck,
  User,
  ChevronRight,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
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
    isLoading,
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

  // Compute breadcrumbs dynamically based on pathname
  const breadcrumb = useMemo(() => {
    if (!pathname || pathname === "/dashboard") {
      return { section: null, title: t("navDashboard") || "Overview" };
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
    if (pathname.startsWith("/visits")) {
      return {
        section:
          role === "Member"
            ? t("memberPortal") || "Member portal"
            : t("frontDesk") || "Front desk",
        title: t("navVisVisits") || "Visits & Attendances",
      };
    }
    if (pathname.startsWith("/operating-hours")) {
      return {
        section:
          role === "Member"
            ? t("memberPortal") || "Member portal"
            : t("gymSetup") || "Gym setup",
        title: t("navOpeningHours") || "Gym hours",
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
        section:
          role === "Member"
            ? t("memberPortal") || "Member portal"
            : t("insight") || "Insight",
        title: t("navFeedback") || "Feedback",
      };
    }
    if (pathname.startsWith("/marketplace")) {
      return {
        section:
          role === "Member"
            ? t("memberPortal") || "Member portal"
            : t("frontDesk") || "Front desk",
        title: t("navMarketplace") || "Marketplace",
      };
    }
    if (pathname.startsWith("/gymflow-subscription")) {
      return {
        section: t("account") || "Account",
        title: t("navGymflowSubscription") || "Subscription",
      };
    }
    if (pathname.startsWith("/profile") || pathname.startsWith("/settings")) {
      return {
        section:
          role === "Member"
            ? t("memberPortal") || "Member portal"
            : t("account") || "Account",
        title: t("navProfile") || "Profile",
      };
    }
    // Fallback
    const raw = pathname.replace(/^\//, "").split("/")[0];
    const formatted =
      raw.charAt(0).toUpperCase() + raw.slice(1).replace(/-/g, " ");
    return { section: null, title: formatted };
  }, [pathname, t, role]);

  const isDashboard = !pathname || pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-30 w-full px-6 py-4 bg-toota-main/80 backdrop-blur-md transition-colors flex items-center justify-between gap-4 border-b border-black/5 dark:border-white/5">
      {/* Left: Mobile hamburger toggle & contextual heading */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Navigation Menu"
          className="p-2 lg:hidden rounded-full text-toota-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          {isMobileSidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Heading & Subtitle */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {breadcrumb.section && !isDashboard && (
              <>
                <span className="text-xs font-medium text-toota-muted hidden sm:inline">
                  {breadcrumb.section}
                </span>
                <ChevronRight className="w-3 h-3 text-toota-muted rtl:rotate-180 hidden sm:inline" />
              </>
            )}
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-toota-ink truncate">
              {breadcrumb.title}
            </h1>
          </div>
          <p className="text-xs text-toota-muted truncate mt-0.5">
            {isDashboard
              ? t("dashboardSubtitle") ||
                "This Lot Offers Uncompromising Performance"
              : companyName || "Facility Portal"}
          </p>
        </div>
      </div>

      {/* Right: Notifications, Language & User Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* Language Switcher */}
        <LanguageSwitcher inline />

        {/* User Avatar with Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer p-0.5 rounded-full"
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
            title={fullName}
          >
            {isLoading ? (
              <div className="w-11 h-11 rounded-full bg-black/10 dark:bg-white/10 animate-pulse shadow-sm" />
            ) : photo ? (
              <img
                className="w-11 h-11 rounded-full object-cover shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/10 dark:ring-white/10"
                alt={fullName}
                src={photo}
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#475569] text-white flex items-center justify-center font-semibold text-xs shadow-[0_1px_3px_rgba(0,0,0,0.08)] select-none">
                {initials}
              </div>
            )}
          </button>

          {/* User Profile Popup Menu */}
          {isProfileOpen && (
            <div
              role="menu"
              className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 rounded-2xl bg-toota-pill text-toota-ink shadow-xl z-50 p-2.5 border border-black/5 dark:border-white/10 animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <div className="px-3 py-2 border-b border-black/5 dark:border-white/10 mb-1.5">
                <p className="font-bold text-sm text-toota-ink truncate">
                  {fullName}
                </p>
                {user?.email && (
                  <p className="text-xs text-toota-muted truncate mt-0.5">
                    {user.email}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-toota-muted">
                    {role} Workspace
                  </span>
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-toota-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <User className="w-4 h-4 text-toota-muted" />
                <span>{t("navProfile") || "Profile & Settings"}</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors text-left rtl:text-right cursor-pointer mt-1"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>{t("logOut")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
