"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Loader2, User } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";

export default function TopNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    async function loadOwnerInfo() {
      try {
        const res = await api.get("/api/users/owners/me");
        if (isMounted && res.data) {
          if (
            res.data.profileImageUrl &&
            !res.data.profileImageUrl.includes("default-image")
          ) {
            setAvatarUrl(res.data.profileImageUrl);
          } else {
            setAvatarUrl(null);
          }
          if (res.data.firstName) {
            setOwnerName(`${res.data.firstName} ${res.data.lastName || ""}`.trim());
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    loadOwnerInfo();

    // Listen for custom profile update events dispatched by OwnerProfileView
    const handleProfileUpdated = () => {
      loadOwnerInfo();
    };
    window.addEventListener("owner-profile-updated", handleProfileUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("owner-profile-updated", handleProfileUpdated);
    };
  }, [pathname]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await api.post("/api/logout");
    } catch {
      // Ignore network error on logout
    } finally {
      localStorage.removeItem("access_token");
      toast.info("Logged out successfully");
      router.push("/login");
      router.refresh();
      setLoggingOut(false);
    }
  };

  const isProfileActive = pathname === "/profile";

  return (
    <header className="fixed top-0 w-full z-50 h-row-height-md bg-surface-container dark:bg-surface-container-highest flex justify-between items-center px-layout-margin border-b border-outline-variant">
      <div className="flex items-center gap-element-gap">
        <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">
          Platform Owner Portal
        </span>
      </div>

      <div className="flex items-center gap-layout-margin">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-element-gap cursor-pointer active:opacity-80 hover:bg-surface-container-high transition-colors p-1 px-2 rounded disabled:opacity-50 text-left border-none bg-transparent"
          title="Log out of Super Admin Portal"
        >
          {loggingOut ? (
            <Loader2 className="size-4 text-primary animate-spin" />
          ) : (
            <LogOut className="size-4 text-primary dark:text-primary-fixed" />
          )}
          <span className="font-body-md text-body-md text-on-surface-variant">
            {loggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>

        {/* Profile Avatar Button */}
        <Link
          href="/profile"
          className={`w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border transition-all cursor-pointer ${
            isProfileActive
              ? "border-primary ring-2 ring-primary/40 shadow-sm"
              : "border-outline-variant hover:border-primary/60 hover:ring-1 hover:ring-primary/30"
          }`}
          title={ownerName ? `Owner Profile (${ownerName})` : "Owner Profile"}
          aria-label="View Owner Profile"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Owner Avatar"
              className="w-full h-full object-cover"
              onError={() => setAvatarUrl(null)}
            />
          ) : (
            <User className="size-4 text-on-secondary-container" />
          )}
        </Link>
      </div>
    </header>
  );
}
