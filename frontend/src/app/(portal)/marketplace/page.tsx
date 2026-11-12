"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Loader2 } from "lucide-react";
import MarketplaceAdminView from "@/components/marketplace/admin/MarketplaceAdminView";
import MarketplaceMemberView from "@/components/marketplace/member/MarketplaceMemberView";

export default function MarketplacePage() {
  const { role, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="size-8 text-toota-green animate-spin" />
        <span className="text-xs font-medium text-toota-muted">
          Loading Web3 Marketplace…
        </span>
      </div>
    );
  }

  if (role === "Member") {
    return <MarketplaceMemberView />;
  }

  // Admin and Staff accounts access the Admin Marketplace management view
  return <MarketplaceAdminView />;
}
