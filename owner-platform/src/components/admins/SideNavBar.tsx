"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Building2, Package, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <aside className="fixed left-0 top-[40px] h-[calc(100vh-40px)] w-64 bg-surface-container-low dark:bg-surface-container-lowest border-r border-outline-variant flex flex-col py-container-padding z-40">
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
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-element-gap px-layout-margin py-2 duration-200 ease-in-out font-body-md text-body-md transition-colors",
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
      </nav>

      {/* Footer Settings Link */}
      <div className="mt-auto border-t border-outline-variant pt-container-padding">
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
  );
}

