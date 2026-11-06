"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Calculates a sliding window of visible page numbers (default: max 5).
 * e.g., if totalPages = 10, currentPage = 7 -> [5, 6, 7, 8, 9]
 */
export function getVisiblePages(
  currentPage: number,
  totalPages: number,
  maxVisible = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = currentPage - half;
  let end = currentPage + half;

  if (start < 1) {
    start = 1;
    end = maxVisible;
  } else if (end > totalPages) {
    end = totalPages;
    start = totalPages - maxVisible + 1;
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  itemLabel?: string;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  isLoading = false,
  itemLabel,
  className = "",
}: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 0 || totalItems <= 0) return null;

  const visiblePages = getVisiblePages(currentPage, totalPages, 5);
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={`px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40 bg-transparent ${className}`}
    >
      {/* Range text */}
      <p className="text-xs text-toota-muted">
        {t("showing") || "Showing"}{" "}
        <span className="font-semibold text-toota-ink">
          {startItem} - {endItem}
        </span>{" "}
        {t("of") || "of"}{" "}
        <span className="font-semibold text-toota-ink">{totalItems}</span>{" "}
        {itemLabel || ""}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoading}
          aria-label={t("previousPage") || "Previous Page"}
          className="size-8 rounded-full border border-border/40 hover:bg-toota-inner transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center text-toota-ink"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </button>

        {/* 5 Sliding Page Buttons */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page) => {
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                aria-current={isActive ? "page" : undefined}
                className={`size-8 flex items-center justify-center rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-toota-ink text-background dark:bg-white dark:text-black font-semibold shadow-xs"
                    : "border border-border/40 hover:bg-toota-inner text-toota-muted hover:text-toota-ink"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isLoading}
          aria-label={t("nextPage") || "Next Page"}
          className="size-8 rounded-full border border-border/40 hover:bg-toota-inner transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center text-toota-ink"
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}

