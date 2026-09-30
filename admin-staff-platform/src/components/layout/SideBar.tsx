"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  Settings,
  PlusCircle,
  X,
} from "lucide-react";

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

  const navLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      materialIcon: "dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      name: "Members",
      href: "/members",
      icon: Users,
      materialIcon: "group",
      isActive: pathname.startsWith("/members"),
    },
    {
      name: "Membership Plans",
      href: "/membership-plans",
      icon: CreditCard,
      materialIcon: "card_membership",
      isActive:
        pathname.startsWith("/membership-plans") ||
        pathname.startsWith("/subscriptions"),
    },
    {
      name: "Payments",
      href: "/payments",
      icon: Receipt,
      materialIcon: "payments",
      isActive: pathname.startsWith("/payments"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      materialIcon: "settings",
      isActive: pathname.startsWith("/settings"),
    },
  ];

  const renderNavItems = () => (
    <nav className="flex-1 py-md">
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              link.isActive
                ? "text-primary border-e-4 border-primary font-bold bg-primary-container/10"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {link.materialIcon}
            </span>
            <span className="text-label-md">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderQuickAction = () => (
    <div className="p-4 mt-auto">
      <div className="p-4 bg-primary-container/5 rounded-xl border border-primary-container/20">
        <p className="text-label-sm text-primary mb-2 font-bold tracking-wider">
          QUICK ACTION
        </p>
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            if (onQuickAction) {
              onQuickAction();
            }
          }}
          className="w-full py-2 primary-gradient text-white font-bold rounded-lg text-label-md shadow-sm active:scale-[0.98] transition-all hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed SideBar */}
      <aside className="fixed left-0 rtl:left-auto rtl:right-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col bg-surface-container-lowest border-r rtl:border-r-0 rtl:border-l border-outline-variant hidden lg:flex z-30 transition-colors">
        {renderNavItems()}
        {renderQuickAction()}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Offcanvas Drawer */}
      <div
        className={`fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 w-64 bg-surface-container-lowest border-r rtl:border-r-0 rtl:border-l border-outline-variant z-50 flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-outline-variant">
          <span className="font-headline-md font-bold text-on-surface text-base">
            Kinetic Navigation
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderNavItems()}
        {renderQuickAction()}
      </div>
    </>
  );
}
