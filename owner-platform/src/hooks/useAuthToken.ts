"use client";

import { useSyncExternalStore } from "react";

function parseToken(): string {
  if (typeof window === "undefined") return "";

  // 1. Try reading from URL hash (#token=XYZ or #XYZ)
  const hash = window.location.hash;
  if (hash) {
    const cleanHash = hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(cleanHash);
    const tokenFromHash = hashParams.get("token");
    if (tokenFromHash) return tokenFromHash;

    if (cleanHash.startsWith("token=")) {
      return cleanHash.substring("token=".length);
    }

    if (cleanHash.length > 20 && !cleanHash.includes("=")) {
      return cleanHash;
    }
  }

  // 2. Fallback to standard URL search parameters (?token=XYZ)
  const searchParams = new URLSearchParams(window.location.search);
  const tokenFromSearch = searchParams.get("token");
  if (tokenFromSearch) return tokenFromSearch;

  return "";
}

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}

/**
 * Extracts authentication / verification token from URL hash fragment (#token=XYZ)
 * or URL search parameters (?token=XYZ) with fallback resilience.
 */
export function useAuthToken(): { token: string; isReady: boolean } {
  const token = useSyncExternalStore(subscribe, parseToken, () => "");
  const isReady = useSyncExternalStore(subscribe, () => true, () => false);

  return { token, isReady };
}
