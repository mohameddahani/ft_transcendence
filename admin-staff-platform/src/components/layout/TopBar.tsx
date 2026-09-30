"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface TopBarProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

export default function TopBar({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}: TopBarProps) {
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayBrand = companyName || "Kinetic Enterprise";
  const brandInitial = (displayBrand[0] || "K").toUpperCase();

  return (
    <header className="flex justify-between items-center w-full px-lg h-16 sticky top-0 z-40 bg-surface-bright/80 backdrop-blur-md border-b border-outline-variant transition-colors">
      {/* Left: Brand Logo & Search */}
      <div className="flex items-center gap-4 lg:gap-xl">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Navigation Menu"
          className="p-2 lg:hidden rounded-lg hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
        >
          {isMobileSidebarOpen ? (
            <X className="w-5 h-5 text-on-surface" />
          ) : (
            <Menu className="w-5 h-5 text-on-surface" />
          )}
        </button>

        <Link
          href="/dashboard"
          className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white text-base shadow-sm font-black">
            {brandInitial}
          </span>
          <span className="hidden sm:inline">{displayBrand}</span>
        </Link>

        {/* Global Search Input */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operations..."
            className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full w-64 text-label-md text-on-surface placeholder:text-on-surface-variant/70 focus:ring-2 focus:ring-primary-container outline-none transition-all"
          />
        </div>
      </div>

      {/* Right: Actions, Theme, Language & User Profile */}
      <div className="flex items-center gap-2 sm:gap-md">
        {/* Notifications Dropdown */}
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-label="Notifications"
            className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all relative cursor-pointer"
          >
            <Bell className="w-5 h-5 text-on-surface-variant" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-lg border border-outline-variant shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant/60 flex items-center justify-between">
                <span className="font-bold text-sm text-on-surface">Notifications</span>
              </div>
              <div className="p-6 text-center text-on-surface-variant text-xs">
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* Help Button */}
        <button
          type="button"
          title="Help & Documentation"
          aria-label="Help"
          className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all cursor-pointer hidden sm:flex"
        >
          <HelpCircle className="w-5 h-5 text-on-surface-variant" />
        </button>

        {/* Dark / Light Theme Toggle */}
        <ThemeToggle />

        {/* TopBar Integrated Language Switcher */}
        <LanguageSwitcher inline />

        {/* Vertical Divider */}
        <div className="h-8 w-[1px] bg-outline-variant mx-1 sm:mx-sm" />

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-sm hover:opacity-90 transition-all rounded-full sm:rounded-xl p-1 sm:px-2 sm:py-1 cursor-pointer"
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
          >
            <div className="text-right hidden sm:block">
              <p className="text-label-md font-bold leading-tight text-on-surface">
                {fullName}
              </p>
              <p className="text-xs text-on-surface-variant font-medium leading-tight">
                {role}
              </p>
            </div>

            {photo ? (
              <img
                className="w-10 h-10 rounded-full border-2 border-primary-container object-cover shadow-sm"
                alt={fullName}
                src={photo}
              />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-primary-container bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm select-none">
                {initials}
              </div>
            )}
          </button>

          {/* User Profile Popup Menu */}
          {isProfileOpen && (
            <div
              role="menu"
              className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-60 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-lg border border-outline-variant shadow-xl z-50 p-2 animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <div className="px-3 py-2.5 border-b border-outline-variant/60 mb-1">
                <p className="font-bold text-sm text-on-surface">{fullName}</p>
                {user?.email && (
                  <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                )}
                {companyName && (
                  <p className="text-xs text-primary font-medium truncate mt-0.5">
                    {companyName}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                    {role} Access
                  </span>
                </div>
              </div>

              <Link
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <Settings className="w-4 h-4 text-on-surface-variant" />
                <span>Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-error hover:bg-error/10 transition-colors text-left rtl:text-right cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-error" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
