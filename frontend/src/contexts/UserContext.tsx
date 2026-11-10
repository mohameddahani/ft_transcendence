"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { AuthUser } from "@/types/auth";

export interface UserContextValue {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  isLoading: boolean;
  role: "Admin" | "Staff" | "Member" | "Owner" | null;
  logout: () => Promise<void>;
  firstName: string;
  lastName: string;
  fullName: string;
  companyName: string;
  photo: string | null;
  initials: string;
  refetchUser: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue | null>(null);

// Module-level in-flight promise to guarantee that simultaneous sync requests share a single fetch
let inFlightSyncPromise: Promise<AuthUser | null> | null = null;
let lastSyncedTime = 0;
const USER_CACHE_TTL_MS = 20_000;

export async function fetchLiveUserData(force = false): Promise<AuthUser | null> {
  const now = Date.now();
  if (!force && lastSyncedTime > 0 && now - lastSyncedTime < USER_CACHE_TTL_MS) {
    try {
      const stored = localStorage.getItem("gym_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  if (inFlightSyncPromise) {
    return inFlightSyncPromise;
  }

  inFlightSyncPromise = (async () => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("gym_user") : null;
      const parsed = stored ? JSON.parse(stored) : null;
      const currentRole = (parsed?.role || parsed?.userType || "").toUpperCase();

      let endpoint = "";
      if (currentRole === "MEMBER") {
        endpoint = "/api/users/members/me";
      } else if (currentRole === "STAFF") {
        endpoint = "/api/users/staffs/me";
      } else if (currentRole === "ADMIN") {
        endpoint = "/api/users/admins/me";
      }

      if (!endpoint) return parsed;

      const res = await fetch(endpoint);
      if (res.ok) {
        const dbData = await res.json();
        if (dbData && typeof dbData === "object") {
          const resolvedCompanyName =
            dbData.companyName ||
            dbData.admin?.companyName ||
            parsed?.companyName ||
            "";

          const mergedUser: AuthUser = {
            ...parsed,
            ...dbData,
            companyName: resolvedCompanyName,
            photo:
              dbData.profileImageUrl ||
              dbData.photo ||
              parsed?.photo ||
              null,
          };

          try {
            localStorage.setItem("gym_user", JSON.stringify(mergedUser));
          } catch {
            // ignore
          }

          lastSyncedTime = Date.now();
          return mergedUser;
        }
      }
      return parsed;
    } catch {
      return null;
    } finally {
      inFlightSyncPromise = null;
    }
  })();

  return inFlightSyncPromise;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load from local storage
  const loadCached = useCallback(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("gym_user") : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setUser(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncWithDb = useCallback(async (force = false) => {
    const updatedUser = await fetchLiveUserData(force);
    if (updatedUser) {
      setUser(updatedUser);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCached();
    syncWithDb();

    const handleStorageUpdate = () => {
      loadCached();
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("user_updated", handleStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("user_updated", handleStorageUpdate);
    };
  }, [loadCached, syncWithDb]);

  // Derived role
  const rawRole = (user?.role || user?.userType || "").toUpperCase();
  const role: "Admin" | "Staff" | "Member" | "Owner" | null =
    rawRole === "ADMIN"
      ? "Admin"
      : rawRole === "OWNER"
      ? "Owner"
      : rawRole === "MEMBER"
      ? "Member"
      : rawRole === "STAFF"
      ? "Staff"
      : user
      ? "Staff"
      : null;

  const logout = useCallback(async () => {
    try {
      if (role === "Member") {
        await fetch("/api/auth/members/logout", { method: "POST" });
      } else if (role === "Staff") {
        await fetch("/api/auth/staffs/logout", { method: "POST" });
      } else {
        await fetch("/api/auth/admins/logout", { method: "POST" });
      }
    } catch {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // ignore
      }
    } finally {
      localStorage.removeItem("gym_user");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("assistant_thread_id");
        sessionStorage.removeItem("thread_id");
      }
      window.location.href =
        role === "Member" ? "/member/login" : role === "Staff" ? "/staff/login" : "/login";
    }
  }, [role]);

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || user?.userName || "User";
  const companyName =
    user?.companyName ||
    (user as unknown as { admin?: { companyName?: string } })?.admin?.companyName ||
    "";

  const candidatePhoto = user?.photo || user?.profileImage || user?.avatar || null;
  const isDefaultImage =
    candidatePhoto &&
    (candidatePhoto.includes("default-image.jpg") ||
      candidatePhoto.includes("default-avatar") ||
      candidatePhoto.includes("placeholder"));
  const photo = isDefaultImage ? null : candidatePhoto;

  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user?.userName?.slice(0, 2).toUpperCase() ||
    "U";

  const refetchUser = useCallback(async () => {
    await syncWithDb(true);
  }, [syncWithDb]);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      setUser,
      isLoading,
      role,
      logout,
      firstName,
      lastName,
      fullName,
      companyName,
      photo,
      initials,
      refetchUser,
    }),
    [
      user,
      isLoading,
      role,
      logout,
      firstName,
      lastName,
      fullName,
      companyName,
      photo,
      initials,
      refetchUser,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue | null {
  return useContext(UserContext);
}

