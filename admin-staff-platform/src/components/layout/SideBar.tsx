"use client";

import React from "react";
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
} from "lucide-react";
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
  const { logout, role, companyName } = useCurrentUser();
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

  const getItemClasses = (active: boolean) =>
    `relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group select-none ${
      active
        ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary font-semibold border border-primary/20 shadow-2xs"
        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
    }`;

  const renderContent = () => (
    <>
      {/* Brand Header: GymFlow & Facility Monogram (Exclusive to Sidebar) */}
      <div className="h-16 flex items-center justify-between gap-3 px-4 sm:px-5 border-b border-outline-variant/50 shrink-0 bg-surface-container-lowest transition-colors">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-3 hover:opacity-95 transition-opacity min-w-0"
        >
          {/* Bespoke GymFlow Kinetic Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center shadow-xs shrink-0 ring-1 ring-white/10">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 5v14" />
              <path d="M18 5v14" />
              <path d="M2 9v6" />
              <path d="M22 9v6" />
              <path d="M6 12h12" />
            </svg>
          </div>

          {/* Brand & Gym Title */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-base text-on-surface tracking-tight leading-tight">
                GymFlow
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider border border-primary/20 leading-none">
                PRO
              </span>
            </div>
            <span className="text-[11px] font-medium text-on-surface-variant truncate leading-none mt-1">
              {companyName || "Kinetic Enterprise"}
            </span>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close Navigation"
          className="lg:hidden p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <nav
        aria-label="Main"
        className="flex-1 py-4 px-3 flex flex-col gap-3 text-xs overflow-y-auto"
      >
        {/* Top Standalone: Dashboard */}
        <div>
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/dashboard") ? "page" : undefined}
            className={getItemClasses(isRouteActive("/dashboard"))}
          >
            {isRouteActive("/dashboard") && (
              <span className="absolute left-0 rtl:left-auto rtl:right-0 top-2 bottom-2 w-1 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-primary" />
            )}
            <LayoutDashboard className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium tracking-tight">
              {t("navDashboard") || "Dashboard"}
            </span>
          </Link>
        </div>

        {/* Group 1: Front desk */}
        <div className="flex flex-col gap-1">
          <span className="px-3 pt-2 pb-0.5 text-[11px] font-bold tracking-wider uppercase font-headline text-on-surface-variant/70 select-none">
            {t("frontDesk") || "Front desk"}
          </span>

          {/* Check-in */}
          <Link
            href="/check-in"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/check-in") ? "page" : undefined}
            className={getItemClasses(isRouteActive("/check-in"))}
          >
            {isRouteActive("/check-in") && (
              <span className="absolute left-0 rtl:left-auto rtl:right-0 top-2 bottom-2 w-1 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-primary" />
            )}
            <ScanLine className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium tracking-tight">
              {t("navCheckIn") || "Check-in"}
            </span>
          </Link>

          {/* Members */}
          <Link
            href="/members"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/members") ? "page" : undefined}
            className={getItemClasses(isRouteActive("/members"))}
          >
            {isRouteActive("/members") && (
              <span className="absolute left-0 rtl:left-auto rtl:right-0 top-2 bottom-2 w-1 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-primary" />
            )}
            <Users className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium tracking-tight">
              {t("navMembers") || "Members"}
            </span>
          </Link>

          {/* Payments */}
          <Link
            href="/payments"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/payments") ? "page" : undefined}
            className={getItemClasses(isRouteActive("/payments"))}
          >
            {isRouteActive("/payments") && (
              <span className="absolute left-0 rtl:left-auto rtl:right-0 top-2 bottom-2 w-1 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-primary" />
            )}
            <CreditCard className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium tracking-tight">
              {t("navPayments") || "Payments"}
            </span>
          </Link>
        </div>

        {/* Group 2: Gym setup */}
        <div className="flex flex-col gap-1">
          <span className="px-3 pt-2 pb-0.5 text-[11px] font-bold tracking-wider uppercase font-headline text-on-surface-variant/70 select-none">
            {t("gymSetup") || "Gym setup"}
          </span>

          {/* Membership plans */}
          <Link
            href="/membership-plans"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/membership-plans") ? "page" : undefined}
            className={getItemClasses(isRouteActive("/membership-plans"))}
          >
            {isRouteActive("/membership-plans") && (
              <span className="absolute left-0 rtl:left-auto rtl:right-0 top-2 bottom-2 w-1 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-primary" />
            )}
            <Layers className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium tracking-tight">
              {t("navMembershipPlans") || "Membership plans"}
            </span>
          </Link>

          {/* Opening hours */}
          <Link
            href="/operating-hours"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/operating-hours") ? "page" : undefined}
            className={getItemClasses(isRouteActive("/operating-hours"))}
          >
            {isRouteActive("/operating-hours") && (
              <span className="absolute left-0 rtl:left-auto rtl:right-0 top-2 bottom-2 w-1 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-primary" />
            )}
            <Clock className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium tracking-tight">
              {t("navOpeningHours") || "Opening hours"}
            </span>
          </Link>

          {/* Staff */}
          <Link
            href="/staffs"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/staffs") ? "page" : undefined}
            className={getItemClasses(isRouteActive("/staffs"))}
          >
            {isRouteActive("/staffs") && (
              <span className="absolute left-0 rtl:left-auto rtl:right-0 top-2 bottom-2 w-1 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-primary" />
            )}
            <UserCheck className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium tracking-tight">
              {t("navStaff") || "Staff"}
            </span>
          </Link>
        </div>

        {/* Group 3: Insight */}
        <div className="flex flex-col gap-1">
          <span className="px-3 pt-2 pb-0.5 text-[11px] font-bold tracking-wider uppercase font-headline text-on-surface-variant/70 select-none">
            {t("insight") || "Insight"}
          </span>

          {/* Feedback */}
          <Link
            href="/feedbacks"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/feedbacks") ? "page" : undefined}
            className={getItemClasses(isRouteActive("/feedbacks"))}
          >
            {isRouteActive("/feedbacks") && (
              <span className="absolute left-0 rtl:left-auto rtl:right-0 top-2 bottom-2 w-1 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-primary" />
            )}
            <MessageSquareQuote className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium tracking-tight">
              {t("navFeedback") || "Feedback"}
            </span>
          </Link>

          {/* AI assistant (Preview trigger) */}
          <button
            type="button"
            onClick={() =>
              handleComingSoon(t("navAiAssistant") || "AI assistant")
            }
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all text-xs font-medium text-left rtl:text-right cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-[18px] h-[18px] shrink-0 text-primary" />
              <span className="tracking-tight">
                {t("navAiAssistant") || "AI assistant"}
              </span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant border border-outline-variant/40 tracking-wider">
              AI
            </span>
          </button>
        </div>

        {/* Group 4: Account */}
        <div className="flex flex-col gap-1">
          <span className="px-3 pt-2 pb-0.5 text-[11px] font-bold tracking-wider uppercase font-headline text-on-surface-variant/70 select-none">
            {t("account") || "Account"}
          </span>

          {/* GymFlow subscription */}
          <Link
            href="/gymflow-subscription"
            onClick={onCloseMobile}
            aria-current={
              isRouteActive("/gymflow-subscription") ? "page" : undefined
            }
            className={getItemClasses(isRouteActive("/gymflow-subscription"))}
          >
            {isRouteActive("/gymflow-subscription") && (
              <span className="absolute left-0 rtl:left-auto rtl:right-0 top-2 bottom-2 w-1 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-primary" />
            )}
            <Crown className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium tracking-tight">
              {t("navGymflowSubscription") || "GymFlow subscription"}
            </span>
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            onClick={onCloseMobile}
            aria-current={isRouteActive("/profile") ? "page" : undefined}
            className={getItemClasses(isRouteActive("/profile"))}
          >
            {isRouteActive("/profile") && (
              <span className="absolute left-0 rtl:left-auto rtl:right-0 top-2 bottom-2 w-1 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full bg-primary" />
            )}
            <User className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium tracking-tight">
              {t("navProfile") || "Profile"}
            </span>
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/50 text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:border-primary/40"
            >
              <PlusCircle className="w-4 h-4 text-primary" />
              <span>{t("addNewMember") || "Add Member"}</span>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom Footer Pill: Session & Workspace Role */}
      <div className="p-3 px-4 border-t border-outline-variant/50 flex items-center justify-between shrink-0 bg-surface-container-lowest transition-colors">
        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/50 text-on-surface text-[11px] font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="truncate max-w-[130px]">
            {isAdmin
              ? t("roleGymAdministrator") || "Gym administrator"
              : t("roleGymStaff") || "Gym staff"}
          </span>
        </div>

        {/* Direct Log Out Button */}
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            logout();
          }}
          title={t("logOut") || "Log Out"}
          aria-label={t("logOut") || "Log Out"}
          className="p-1.5 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Fixed SideBar: Width 256px (w-64) */}
      <aside className="fixed left-0 rtl:left-auto rtl:right-0 top-0 h-screen w-64 flex flex-col bg-surface-container-lowest border-r rtl:border-r-0 rtl:border-l border-outline-variant/50 hidden lg:flex z-40 transition-colors shadow-2xs">
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
        className={`fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 w-64 bg-surface-container-lowest border-r rtl:border-r-0 rtl:border-l border-outline-variant/50 z-50 flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
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
