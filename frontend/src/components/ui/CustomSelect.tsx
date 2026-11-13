"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  icon?: React.ReactNode;
  "aria-label"?: string;
  id?: string;
  name?: string;
}

interface DropdownCoords {
  top: number;
  left: number;
  width: number;
  openUpwards: boolean;
}

function calculatePosition(triggerEl: HTMLElement): DropdownCoords {
  const rect = triggerEl.getBoundingClientRect();
  const dropdownHeight = 240;
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpwards = spaceBelow < dropdownHeight && rect.top > spaceBelow;

  const width = Math.max(rect.width, 160);
  let left = rect.left;

  // Prevent horizontal screen overflow
  if (left + width > window.innerWidth - 12) {
    left = Math.max(12, window.innerWidth - width - 12);
  }
  if (left < 12) {
    left = 12;
  }

  const top = openUpwards ? rect.top - 6 : rect.bottom + 6;

  return {
    top,
    left,
    width,
    openUpwards,
  };
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className,
  dropdownClassName,
  icon,
  "aria-label": ariaLabel,
  id,
  name,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<DropdownCoords | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      setCoords(null);
    } else {
      if (triggerRef.current) {
        setCoords(calculatePosition(triggerRef.current));
      }
      setIsOpen(true);
    }
  };

  // Keep position pinned on window scroll or resize while open
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      if (triggerRef.current) {
        setCoords(calculatePosition(triggerRef.current));
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Handle outside click & escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setCoords(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setCoords(null);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={selectId}
        name={name}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={cn(
          "w-full h-10 px-3.5 rounded-full bg-toota-inner border border-border/40 text-xs font-medium text-toota-ink flex items-center justify-between gap-2 transition-all cursor-pointer select-none text-start",
          "hover:bg-toota-inner/80 focus:outline-hidden focus:ring-1 focus:ring-ring",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          isOpen && "ring-1 ring-ring border-transparent",
          className
        )}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {icon && <span className="shrink-0 text-toota-muted">{icon}</span>}
          <span
            className={cn(
              "truncate",
              !selectedOption && "text-toota-muted font-normal"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-toota-muted transition-transform duration-200",
            isOpen && "rotate-180 text-toota-ink"
          )}
        />
      </button>

      {/* Standardized Dropdown Menu rendered via Portal with synchronous coordinates */}
      {isOpen &&
        mounted &&
        coords &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              top: coords.openUpwards ? undefined : `${coords.top}px`,
              bottom: coords.openUpwards
                ? `${window.innerHeight - coords.top}px`
                : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className={cn(
              "toota-card bg-popover text-popover-foreground border border-border/60 shadow-2xl rounded-2xl p-1.5 space-y-0.5 text-xs z-50 max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100",
              dropdownClassName
            )}
          >
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <div
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (option.disabled) return;
                    onChange(option.value);
                    setIsOpen(false);
                    setCoords(null);
                    triggerRef.current?.focus();
                  }}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-between transition-colors select-none text-start",
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-toota-inner text-toota-ink",
                    option.disabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="size-3.5 shrink-0 text-primary ms-2" />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
