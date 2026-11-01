"use client";

import { useState, useEffect } from "react";

/**
 * Extracts authentication token from URL hash fragment (#token=XYZ)
 * or URL search parameters (?token=XYZ) with fallback resilience.
 */
export function useAuthToken(): { token: string; isReady: boolean } {
  const [token, setToken] = useState<string>("");
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    function parseToken(): string {
      if (typeof window === "undefined") return "";

      // 1. Try reading from URL hash (#token=XYZ or #XYZ)
      const hash = window.location.hash;
      if (hash) {
        const cleanHash = hash.replace(/^#/, "");
        // If query string formatted in hash: token=XYZ&...
        const hashParams = new URLSearchParams(cleanHash);
        const tokenFromHash = hashParams.get("token");
        if (tokenFromHash) return tokenFromHash;

        // If prefix style: token=XYZ
        if (cleanHash.startsWith("token=")) {
          return cleanHash.substring("token=".length);
        }

        // If the hash itself is raw token (contains dots like JWT or length > 20)
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

    setToken(parseToken());
    setIsReady(true);

    const handleHashChange = () => {
      setToken(parseToken());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return { token, isReady };
}

