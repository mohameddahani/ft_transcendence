"use client";

import React, { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import SideBar from "@/components/layout/SideBar";
import AddMemberModal from "@/components/members/AddMemberModal";
import { Plus } from "lucide-react";
import { UserProvider } from "@/contexts/UserContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { triggerOpenAddMemberModal } from "@/lib/events/modal-events";
import SubscriptionRequired from "@/components/subscription/SubscriptionRequired";

function PortalLayoutInner({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { role, isLoading } = useCurrentUser();

  return (
    <div className="min-h-screen bg-toota-side flex text-toota-ink antialiased selection:bg-[#a3e635] selection:text-black">
      {/* Global Fixed SideBar Navigation */}
      <SideBar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onQuickAction={triggerOpenAddMemberModal}
      />

      {/* Dynamic Content Column (Offset on desktop for fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:ms-64 min-h-screen bg-toota-side">
        {/* Dynamic Main Workspace Area with rounded left corners on desktop */}
        <div className="flex-1 flex flex-col min-w-0 bg-toota-main text-toota-ink lg:rounded-s-[32px] overflow-hidden min-h-screen transition-colors">
          {/* Global Sticky Top Navigation Bar */}
          <TopBar
            onToggleMobileSidebar={() =>
              setIsMobileSidebarOpen(!isMobileSidebarOpen)
            }
            isMobileSidebarOpen={isMobileSidebarOpen}
          />

          {/* Dynamic Main Workspace Area */}
          <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 transition-all">
            {children}
          </main>
        </div>
      </div>

      {/* Floating Quick Action Button on Mobile (Admin/Staff only) */}
      {!isLoading && role !== "Member" && (
        <div className="fixed bottom-4 right-4 rtl:right-auto rtl:left-4 lg:hidden z-40">
          <button
            type="button"
            onClick={triggerOpenAddMemberModal}
            title="Add New Member"
            aria-label="Add New Member"
            className="w-14 h-14 rounded-full bg-[#1b1f23] text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform cursor-pointer border border-white/20"
          >
            <Plus className="w-6 h-6 text-[#a3e635]" />
          </button>
        </div>
      )}

      {/* Plans popup and floating button for an owner whose platform subscription has ended */}
      {!isLoading && role === "Admin" && <SubscriptionRequired />}

      {/* Quick Add Member Modal (Admin/Staff only) */}
      {!isLoading && role !== "Member" && (
        <AddMemberModal />
      )}
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <PortalLayoutInner>{children}</PortalLayoutInner>
    </UserProvider>
  );
}
