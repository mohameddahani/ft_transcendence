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
      className={`px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-bright border-t border-outline-variant ${className}`}
    >
      {/* Range text */}
      <p className="text-xs text-on-surface-variant">
        {t("showing") || "Showing"}{" "}
        <span className="font-bold text-on-surface">
          {startItem} - {endItem}
        </span>{" "}
        {t("of") || "of"}{" "}
        <span className="font-bold text-on-surface">{totalItems}</span>{" "}
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
          className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-on-surface rtl:rotate-180" />
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
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "primary-gradient text-white shadow-xs scale-105"
                    : "border border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
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
          className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-on-surface rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}

