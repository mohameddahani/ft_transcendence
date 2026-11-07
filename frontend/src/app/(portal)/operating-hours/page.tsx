"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminStaffOperatingHoursView from "@/components/operating-hours/AdminStaffOperatingHoursView";
import MemberOperatingHoursView from "@/components/operating-hours/MemberOperatingHoursView";

export default function OperatingHoursPage() {
  const { role, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 text-toota-ink animate-spin" />
      </div>
    );
  }

  if (role === "Member") {
    return <MemberOperatingHoursView />;
  }

  return <AdminStaffOperatingHoursView />;
}
