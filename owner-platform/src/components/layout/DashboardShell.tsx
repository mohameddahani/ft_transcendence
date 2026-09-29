"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isMobileOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  openSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close sidebar on page navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const toggleSidebar = () => setIsMobileOpen((prev) => !prev);
  const closeSidebar = () => setIsMobileOpen(false);
  const openSidebar = () => setIsMobileOpen(true);

  return (
    <SidebarContext.Provider
      value={{ isMobileOpen, toggleSidebar, closeSidebar, openSidebar }}
    >
      <div className="min-h-screen bg-background text-on-surface font-body-md selection:bg-primary selection:text-on-primary">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}
