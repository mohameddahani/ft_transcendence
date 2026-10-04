"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut, PlusCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

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
  const { logout, role } = useCurrentUser();
  const { t } = useTranslation();

  const isAdmin = role === "Admin" || role === "Owner";

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
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  const handleComingSoon = (featureName: string) => {
    toast.info(`${featureName} ${t("featureComingSoon") || "is coming soon!"}`);
  };

  const renderContent = () => (
    <>
      {/* Brand Header: GymFlow */}
      <div className="h-16 flex items-center justify-between gap-2.5 px-5 border-b border-[#e2e8f0] dark:border-slate-800 text-[17px] font-semibold text-slate-900 dark:text-white shrink-0 bg-white dark:bg-[#0c1322]">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 hover:opacity-95 transition-opacity"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="32" height="32" rx="8" fill="#2563eb" />
            <path d="M9 12.5h3v7H9zM20 12.5h3v7h-3zM12 15h8v2h-8z" fill="#fff" />
            <path
              d="M6.5 14h2.5v4H6.5zM23 14h2.5v4H23z"
              fill="#fff"
              opacity=".75"
            />
          </svg>
          <span className="tracking-tight">GymFlow</span>
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close Navigation"
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <nav
        aria-label="Main"
        className="flex-1 py-5 px-3 flex flex-col gap-4 text-sm font-medium overflow-y-auto"
      >
        {/* Top Standalone: Dashboard */}
        <div>
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/dashboard") ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRouteActive("/dashboard")
                ? "bg-[#eff6ff] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-400 font-semibold border border-blue-100/70 dark:border-blue-500/20"
                : "text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="m12 14 4-4" />
              <path d="M3.34 19a10 10 0 1 1 17.32 0" />
            </svg>
            <span>{t("navDashboard") || "Dashboard"}</span>
          </Link>
        </div>

        {/* Group 1: Front desk */}
        <div className="flex flex-col gap-0.5">
          <span className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#5b6b80] dark:text-slate-400">
            {t("frontDesk") || "Front desk"}
          </span>

          {/* Check-in */}
          <Link
            href="/check-in"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/check-in") ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRouteActive("/check-in")
                ? "bg-[#eff6ff] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-400 font-semibold border border-blue-100/70 dark:border-blue-500/20"
                : "text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" />
            </svg>
            <span>{t("navCheckIn") || "Check-in"}</span>
          </Link>

          {/* Members */}
          <Link
            href="/members"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/members") ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRouteActive("/members")
                ? "bg-[#eff6ff] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-400 font-semibold border border-blue-100/70 dark:border-blue-500/20"
                : "text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>{t("navMembers") || "Members"}</span>
          </Link>

          {/* Payments */}
          <Link
            href="/payments"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/payments") ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRouteActive("/payments")
                ? "bg-[#eff6ff] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-400 font-semibold border border-blue-100/70 dark:border-blue-500/20"
                : "text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
              <path d="M8 7h8M8 11h8M8 15h5" />
            </svg>
            <span>{t("navPayments") || "Payments"}</span>
          </Link>
        </div>

        {/* Group 2: Gym setup */}
        <div className="flex flex-col gap-0.5">
          <span className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#5b6b80] dark:text-slate-400">
            {t("gymSetup") || "Gym setup"}
          </span>

          {/* Membership plans */}
          <Link
            href="/membership-plans"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/membership-plans") ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRouteActive("/membership-plans")
                ? "bg-[#eff6ff] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-400 font-semibold border border-blue-100/70 dark:border-blue-500/20"
                : "text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="m12 2 10 5-10 5L2 7Z" />
              <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>{t("navMembershipPlans") || "Membership plans"}</span>
          </Link>

          {/* Opening hours */}
          <Link
            href="/operating-hours"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/operating-hours") ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRouteActive("/operating-hours")
                ? "bg-[#eff6ff] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-400 font-semibold border border-blue-100/70 dark:border-blue-500/20"
                : "text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>{t("navOpeningHours") || "Opening hours"}</span>
          </Link>

          {/* Staff */}
          <Link
            href="/staffs"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/staffs") ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRouteActive("/staffs")
                ? "bg-[#eff6ff] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-400 font-semibold border border-blue-100/70 dark:border-blue-500/20"
                : "text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            <span>{t("navStaff") || "Staff"}</span>
          </Link>
        </div>

        {/* Group 3: Insight */}
        <div className="flex flex-col gap-0.5">
          <span className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#5b6b80] dark:text-slate-400">
            {t("insight") || "Insight"}
          </span>

          {/* Feedback */}
          <Link
            href="/feedbacks"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/feedbacks") ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRouteActive("/feedbacks")
                ? "bg-[#eff6ff] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-400 font-semibold border border-blue-100/70 dark:border-blue-500/20"
                : "text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{t("navFeedback") || "Feedback"}</span>
          </Link>

          {/* AI assistant (No page yet) */}
          <button
            type="button"
            onClick={() => handleComingSoon(t("navAiAssistant") || "AI assistant")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 text-sm transition-colors text-left rtl:text-right cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0 text-blue-600 dark:text-blue-400"
              >
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
              </svg>
              <span>{t("navAiAssistant") || "AI assistant"}</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 tracking-tight">
              AI
            </span>
          </button>
        </div>

        {/* Group 4: Account */}
        <div className="flex flex-col gap-0.5">
          <span className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#5b6b80] dark:text-slate-400">
            {t("account") || "Account"}
          </span>

          {/* GymFlow subscription */}
          <Link
            href="/gymflow-subscription"
            onClick={onCloseMobile}
            aria-current={
              isRouteActive("/gymflow-subscription") ? "page" : undefined
            }
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRouteActive("/gymflow-subscription")
                ? "bg-[#eff6ff] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-400 font-semibold border border-blue-100/70 dark:border-blue-500/20"
                : "text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
            <span>{t("navGymflowSubscription") || "GymFlow subscription"}</span>
          </Link>

          {/* Profile (renamed from settings) */}
          <Link
            href="/profile"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/profile") ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRouteActive("/profile")
                ? "bg-[#eff6ff] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-400 font-semibold border border-blue-100/70 dark:border-blue-500/20"
                : "text-[#475569] dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            <span>{t("navProfile") || "Profile"}</span>
          </Link>
        </div>

        {/* Optional Quick Add Member Action */}
        {onQuickAction && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onQuickAction();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-container/10 hover:bg-primary-container/20 text-primary border border-primary/20 text-xs font-bold transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("addNewMember") || "Add Member"}</span>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom Footer Pill: Gym Administrator */}
      <div className="p-3 px-5 border-t border-[#e2e8f0] dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#0c1322]">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff6ff] dark:bg-blue-950/60 text-[#2563eb] dark:text-blue-400 text-[11px] font-semibold border border-blue-100 dark:border-blue-900/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] dark:bg-blue-400 animate-pulse"></span>
          <span>
            {isAdmin
              ? t("roleGymAdministrator") || "Gym administrator"
              : t("roleGymStaff") || "Gym staff"}
          </span>
        </span>

        {/* Direct Log Out Button */}
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            logout();
          }}
          title={t("logOut") || "Log Out"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Fixed SideBar: Width 256px (w-64) */}
      <aside className="fixed left-0 rtl:left-auto rtl:right-0 top-0 h-screen w-64 flex flex-col bg-white dark:bg-[#0c1322] border-r rtl:border-r-0 rtl:border-l border-[#e2e8f0] dark:border-slate-800 hidden lg:flex z-40 transition-colors">
        {renderContent()}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Offcanvas Drawer */}
      <div
        className={`fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 w-64 bg-white dark:bg-[#0c1322] border-r rtl:border-r-0 rtl:border-l border-[#e2e8f0] dark:border-slate-800 z-50 flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
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
