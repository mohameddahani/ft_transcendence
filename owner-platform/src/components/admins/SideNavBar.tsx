"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Building2, Package, CreditCard, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/DashboardShell";
import { ThemeToggle } from "@/components/theme/ThemeProvider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Gym Owners", href: "/admins", icon: Building2 },
  { label: "SaaS Plans", href: "/plans", icon: Package },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
];

export default function SideNavBar() {
  const pathname = usePathname();
  const { isMobileOpen, closeSidebar } = useSidebar();

  const renderNavLinks = (onItemClick?: () => void) => (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-element-gap px-layout-margin py-2.5 duration-200 ease-in-out font-body-md text-body-md transition-colors",
              isActive
                ? "bg-secondary-container text-on-secondary-container border-r-2 border-primary"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* 1. Mobile Off-Canvas Drawer Backdrop & Container */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={closeSidebar}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-surface-container-low dark:bg-surface-container-lowest border-r border-outline-variant flex flex-col py-4 z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Mobile Drawer Header */}
            <div className="px-5 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary flex items-center justify-center rounded text-on-primary">
                  <Terminal className="size-4" />
                </div>
                <div>
                  <h2 className="font-headline-sm text-sm font-bold text-on-surface">Management</h2>
                  <p className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">
                    SaaS Admin
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeSidebar}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 space-y-1">
              {renderNavLinks(closeSidebar)}
            </nav>

            {/* Mobile Footer Settings & Theme */}
            <div className="mt-auto border-t border-outline-variant pt-3 space-y-1">
              <div className="px-layout-margin">
                <ThemeToggle showLabel className="w-full justify-start px-0 py-2" />
              </div>
              <Link
                href="/settings"
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-element-gap px-layout-margin py-2.5 text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 ease-in-out font-body-md text-body-md",
                  pathname === "/settings" && "bg-secondary-container text-on-secondary-container border-r-2 border-primary"
                )}
              >
                <Settings className="size-5 shrink-0" />
                <span>Settings</span>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* 2. Desktop Persistent Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-[40px] h-[calc(100vh-40px)] w-64 bg-surface-container-low dark:bg-surface-container-lowest border-r border-outline-variant flex-col py-container-padding z-30">
        {/* Brand / Section Header */}
        <div className="px-layout-margin mb-layout-margin">
          <div className="flex items-center gap-element-gap mb-1">
            <div className="w-6 h-6 bg-primary flex items-center justify-center rounded text-on-primary">
              <Terminal className="size-4" />
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Management</h2>
          </div>
          <p className="text-[11px] font-label-caps text-on-surface-variant uppercase tracking-wider">
            SaaS Admin
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {renderNavLinks()}
        </nav>

        {/* Footer Settings & Theme Link */}
        <div className="mt-auto border-t border-outline-variant pt-container-padding space-y-1">
          <div className="px-layout-margin">
            <ThemeToggle showLabel className="w-full justify-start px-0 py-1.5" />
          </div>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-element-gap px-layout-margin py-2 text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 ease-in-out font-body-md text-body-md",
              pathname === "/settings" && "bg-secondary-container text-on-secondary-container border-r-2 border-primary"
            )}
          >
            <Settings className="size-5 shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

