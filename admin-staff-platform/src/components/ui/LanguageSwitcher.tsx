"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown, Check } from "lucide-react";

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇲🇦" },
];

interface LanguageSwitcherProps {
  inline?: boolean;
}

export default function LanguageSwitcher({ inline = false }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside - must be called unconditionally before any early returns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isPortalRoute =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/members") ||
    pathname?.startsWith("/membership-plans") ||
    pathname?.startsWith("/subscriptions") ||
    pathname?.startsWith("/payments") ||
    pathname?.startsWith("/settings");

  // Don't render floating language switcher on portal pages where TopBar provides inline switcher
  if (!inline && isPortalRoute) {
    return null;
  }

  const currentCode = (i18n.language || "en").slice(0, 2);
  const currentLang =
    LANGUAGES.find((lang) => lang.code === currentCode) || LANGUAGES[0];

  const handleSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    const isRtl = code === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = code;
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={
        inline
          ? "relative select-none"
          : "fixed top-4 right-4 rtl:right-auto rtl:left-4 z-50 select-none"
      }
    >
      {/* Switcher Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 rounded-xl border border-outline-variant/60 text-on-surface text-sm font-medium transition-all active:scale-[0.98] cursor-pointer ${
          inline
            ? "px-2.5 py-1.5 bg-surface-container-low hover:bg-surface-container"
            : "px-3.5 py-2 bg-surface-container-lowest/90 backdrop-blur-md shadow-sm hover:shadow-md hover:border-primary/50"
        }`}
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="font-semibold uppercase text-xs tracking-wider">
          {currentLang.code}
        </span>
        <span className="hidden sm:inline text-xs text-on-surface-variant font-normal">
          {currentLang.nativeName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-on-surface-variant transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 py-1.5 rounded-xl bg-surface-container-lowest/95 backdrop-blur-lg border border-outline-variant/70 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/30">
            Select Language
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left rtl:text-right transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-on-surface hover:bg-surface-container/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium leading-tight">
                      {lang.nativeName}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/80">
                      {lang.name}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
