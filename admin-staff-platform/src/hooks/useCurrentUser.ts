"use client";

import { useState, useEffect } from "react";
import { AuthUser } from "@/types/auth";

export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kinetic_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setUser(parsed);
        }
      }
    } catch {
      // ignore JSON parse error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/admins/logout", { method: "POST" });
    } catch {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // ignore
      }
    } finally {
      localStorage.removeItem("kinetic_user");
      window.location.href = "/login";
    }
  };

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || user?.userName || "User";
  const companyName = user?.companyName || "";
  
  // Format role to proper case (e.g., ADMIN -> Admin, STAFF -> Staff)
  const rawRole = (user?.role || user?.userType || "Staff").toUpperCase();
  const role = rawRole === "ADMIN" ? "Admin" : rawRole === "OWNER" ? "Owner" : "Staff";

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
