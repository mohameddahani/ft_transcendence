"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthUser } from "@/types/auth";
import {
  useUserContext,
  fetchLiveUserData,
  type UserContextValue,
} from "@/contexts/UserContext";

export function useCurrentUser(): UserContextValue {
  const context = useUserContext();

  // If inside UserProvider, use the shared context directly (zero duplicate network calls!)
  const [localUser, setLocalUser] = useState<AuthUser | null>(null);
  const [localLoading, setLocalLoading] = useState<boolean>(true);

  const loadLocal = useCallback(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("gym_user") : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setLocalUser(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setLocalLoading(false);
    }
  }, []);

  const syncLocal = useCallback(async (force = false) => {
    const updated = await fetchLiveUserData(force);
    if (updated) {
      setLocalUser(updated);
    }
    setLocalLoading(false);
  }, []);

  useEffect(() => {
    if (context) return; // If context is active, skip local effect

    loadLocal();
    syncLocal();

    const handleStorageUpdate = () => {
      loadLocal();
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("user_updated", handleStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("user_updated", handleStorageUpdate);
    };
  }, [context, loadLocal, syncLocal]);

  if (context) {
    return context;
  }

  // Fallback if rendered outside UserProvider
  const user = localUser;
  const isLoading = localLoading;

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

  const logout = async () => {
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
  };

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

  return {
    user,
    setUser: setLocalUser,
    isLoading,
    role,
    logout,
    firstName,
    lastName,
    fullName,
    companyName,
    photo,
    initials,
    refetchUser: () => syncLocal(true),
  };
}
