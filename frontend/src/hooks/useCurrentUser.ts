"use client";

import { useState, useEffect } from "react";
import { AuthUser } from "@/types/auth";

export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const loadCached = () => {
      try {
        const stored = localStorage.getItem("gym_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setUser(parsed);
          }
        }
      } catch {
        // ignore JSON parse error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCached();

    // Fetch live user and company data directly from database
    const syncWithDb = async () => {
      try {
        const stored = localStorage.getItem("gym_user") || localStorage.getItem("kinetic_user");
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

        if (!endpoint) return;

        const res = await fetch(endpoint);
        if (res.ok) {
          const dbData = await res.json();
          if (dbData && typeof dbData === "object" && isMounted) {
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

            setUser(mergedUser);
            try {
              localStorage.setItem("gym_user", JSON.stringify(mergedUser));
              localStorage.removeItem("kinetic_user");
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // Fail silently if offline or token expired
      }
    };

    syncWithDb();

    // Listen to profile updates dispatched within the app
    const handleStorageUpdate = () => {
      loadCached();
    };
    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("user_updated", handleStorageUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("user_updated", handleStorageUpdate);
    };
  }, []);

  // Format role to proper case (e.g., ADMIN -> Admin, STAFF -> Staff, MEMBER -> Member)
  const rawRole = (user?.role || user?.userType || "").toUpperCase();
  const role =
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
      localStorage.removeItem("kinetic_user");
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

  // Check if valid photo URL exists and is not a backend placeholder like default-image.jpg
  const candidatePhoto = user?.photo || user?.profileImage || user?.avatar || null;
  const isDefaultImage =
    !candidatePhoto ||
    candidatePhoto === "default-image.jpg" ||
    candidatePhoto === "default-member-image.jpg";
  const photo = isDefaultImage ? null : candidatePhoto;

  const initials =
    (firstName[0] || "") + (lastName[0] || "") ||
    (fullName[0] || "U").toUpperCase();

  return {
    user,
    fullName,
    firstName,
    lastName,
    companyName,
    role,
    photo,
    initials,
    isLoading,
    logout,
  };
}
