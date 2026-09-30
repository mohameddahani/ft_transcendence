"use client";

import React, { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import SideBar from "@/components/layout/SideBar";
import AddMemberModal from "@/components/members/AddMemberModal";
import { Plus } from "lucide-react";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex flex-col text-on-surface">
      {/* Global Sticky Top Navigation Bar */}
      <TopBar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex flex-1">
        {/* Global Fixed SideBar Navigation */}
        <SideBar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onQuickAction={() => setIsAddMemberOpen(true)}
        />

        {/* Dynamic Main Workspace Area */}
        <main className="flex-1 lg:ml-64 rtl:lg:ml-0 rtl:lg:mr-64 min-h-[calc(100vh-64px)] bg-surface p-4 sm:p-6 lg:p-lg transition-all">
          {children}
        </main>
      </div>

      {/* Floating Quick Action Button on Mobile */}
      <div className="fixed bottom-4 right-4 rtl:right-auto rtl:left-4 lg:hidden z-40">
        <button
          type="button"
          onClick={() => setIsAddMemberOpen(true)}
          title="Add New Member"
          aria-label="Add New Member"
          className="w-14 h-14 rounded-full primary-gradient text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Quick Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
      />
    </div>
  );
}
