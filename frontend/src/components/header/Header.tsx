"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, LogIn, Menu, Moon, Sun, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  authRoutes,
  landingSections,
  loginOptions,
  saasName,
} from "@/utils/constants";
import { buttonClass, Container } from "@/components/landing/primitives";
import { EASE_OUT } from "@/components/landing/motion";

const iconButton =
  "inline-flex size-10 items-center justify-center rounded-full text-foreground/80 " +
  "transition-colors duration-200 hover:bg-muted hover:text-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground"
      >
        {saasName.charAt(0)}
      </span>
      <span className="text-lg font-semibold tracking-[-0.02em] text-foreground">
        {saasName}
      </span>
    </span>
  );
}

/** Closes a floating panel on outside click or Escape. */
function useDismiss(
  open: boolean,
  close: () => void,
  ref: React.RefObject<HTMLElement | null>,
  returnFocusTo?: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        returnFocusTo?.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close, ref, returnFocusTo]);
}

function LoginMenu() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useDismiss(open, close, wrapperRef, triggerRef);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={buttonClass("ghost", "sm")}
      >
        Log in
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="absolute top-full right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-border bg-popover p-1.5 shadow-xl shadow-slate-900/10"
          >
            <p className="px-3 pt-2 pb-1.5 text-xs font-medium text-muted-foreground">
              Choose your account type
            </p>
            <ul>
              {loginOptions.map((option) => (
                <li key={option.href}>
                  <Link
                    href={option.href}
                    onClick={close}
                    className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {option.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                    <LogIn
                      size={16}
                      aria-hidden="true"
                      className="text-muted-foreground transition-colors group-hover:text-primary"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className={iconButton}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle color theme"
    >
      <Sun size={18} className="dark:hidden" aria-hidden="true" />
      <Moon size={18} className="hidden dark:block" aria-hidden="true" />
    </button>
  );
}

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useDismiss(mobileOpen, closeMobile, headerRef, menuButtonRef);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer when the layout switches to desktop.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200",
        scrolled || mobileOpen
          ? "border-border bg-background/85 shadow-xs backdrop-blur-md"
          : "border-transparent bg-background",
      )}
    >
      <Container>
        <nav
          aria-label="Main"
          className="flex h-16 items-center justify-between gap-4 sm:h-18"
        >
          <Link
            href="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            aria-label={`${saasName} home`}
          >
            <BrandMark />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {landingSections.map((section) => (
              <li key={section.href}>
                <a
                  href={section.href}
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <div className="hidden md:block">
              <LoginMenu />
            </div>
            <Link
              href={authRoutes.register}
              className={buttonClass("primary", "sm", "hidden sm:inline-flex")}
            >
              Register your club
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              className={cn(iconButton, "md:hidden")}
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? (
                <X size={20} aria-hidden="true" />
              ) : (
                <Menu size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>
      </Container>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            id={mobileMenuId}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background shadow-lg md:hidden"
          >
            <Container className="py-4">
              <ul className="grid gap-1">
                {landingSections.map((section) => (
                  <li key={section.href}>
                    <a
                      href={section.href}
                      onClick={closeMobile}
                      className="flex min-h-11 items-center rounded-xl px-3 text-base font-medium text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>

              <p className="mt-5 px-3 text-xs font-medium text-muted-foreground">
                Log in as
              </p>
              <ul className="mt-1 grid gap-1">
                {loginOptions.map((option) => (
                  <li key={option.href}>
                    <Link
                      href={option.href}
                      onClick={closeMobile}
                      className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      {option.label}
                      <LogIn size={16} aria-hidden="true" className="text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href={authRoutes.register}
                onClick={closeMobile}
                className={buttonClass("primary", "lg", "mt-5 w-full")}
              >
                Register your club
              </Link>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;

