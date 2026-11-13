"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Loader2 } from "lucide-react";
import MarketplaceAdminView from "@/components/marketplace/admin/MarketplaceAdminView";
import MarketplaceMemberView from "@/components/marketplace/member/MarketplaceMemberView";
import { useTranslation } from "react-i18next";

export default function MarketplacePage() {
  const { role, isLoading } = useCurrentUser();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="size-8 text-toota-green animate-spin" />
        <span className="text-xs font-medium text-toota-muted">
          {t("loadingWeb3Marketplace") || "Loading Web3 Marketplace…"}
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
