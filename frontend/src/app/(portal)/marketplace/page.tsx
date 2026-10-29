"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Loader2 } from "lucide-react";
import MarketplaceAdminView from "@/components/marketplace/admin/MarketplaceAdminView";
import MarketplaceMemberView from "@/components/marketplace/member/MarketplaceMemberView";

export default function MarketplacePage() {
  const { role, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (role === "Member") {
    return <MarketplaceMemberView />;
  }

  // Admin and Staff accounts access the Admin Marketplace management view
  return <MarketplaceAdminView />;
}
