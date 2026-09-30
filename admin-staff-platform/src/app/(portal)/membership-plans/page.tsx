"use client";

import React, { useState } from "react";
import { CreditCard, Plus, Sparkles } from "lucide-react";
import { toast } from "react-toastify";

export default function MembershipPlansPage() {
  const [plans] = useState<any[]>([]);

  return (
    <div className="space-y-6 max-w-container-max mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Membership Plans
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Create, configure, and monitor subscription tiers for your facility.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.info("Create plan action will connect to plans API.")}
          className="flex items-center gap-2 px-5 py-2.5 primary-gradient text-white font-bold rounded-xl text-label-md shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Tier</span>
        </button>
      </div>

      {/* Empty State / Awaiting Plans API */}
      {plans.length === 0 && (
        <div className="p-16 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7" />
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface">
            No Membership Plans Configured
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1 mb-6">
            Membership tiers define your pricing structure, durations, and facility access permissions. Once connected to your backend plans endpoint, active plans will appear here.
          </p>
          <button
            type="button"
            onClick={() => toast.info("Configure tier modal")}
            className="inline-flex items-center gap-2 px-5 py-2.5 primary-gradient text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Membership Tier</span>
          </button>
        </div>
      )}
    </div>
  );
}
