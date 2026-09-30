"use client";

import React, { useState } from "react";
import {
  Settings,
  Building,
  Shield,
  Bell,
  Globe,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function SettingsPage() {
  const { fullName, role } = useCurrentUser();
  const [gymName, setGymName] = useState("Kinetic Enterprise Fitness");
  const [contactEmail, setContactEmail] = useState("contact@kinetic.com");
  const [maxCapacity, setMaxCapacity] = useState("250");
  const [autoRenew, setAutoRenew] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Facility settings updated successfully!");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Platform & Facility Settings
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Configure gym enterprise preferences, smart turnstiles, and operational rules.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Facility Profile */}
        <div className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant">
            <Building className="w-5 h-5 text-primary" />
            <h3 className="font-headline font-bold text-base text-on-surface">
              Gym Facility Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Facility Name
              </label>
              <input
                type="text"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Operations Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Max Safe Floor Capacity
              </label>
              <input
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Current Admin
              </label>
              <input
                type="text"
                disabled
                value={`${fullName} (${role})`}
                className="w-full px-3.5 py-2.5 bg-surface-variant border border-outline-variant rounded-xl text-sm text-on-surface-variant cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Automation & Rules */}
        <div className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant">
            <Bell className="w-5 h-5 text-secondary" />
            <h3 className="font-headline font-bold text-base text-on-surface">
              Automated Member Notifications
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
              <div>
                <p className="text-sm font-bold text-on-surface">
                  Auto-notify expiring memberships (30 days & 7 days)
                </p>
                <p className="text-xs text-on-surface-variant">
                  Sends friendly automated email reminders to members prior to renewal date.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-5 h-5 text-primary rounded accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
              <div>
                <p className="text-sm font-bold text-on-surface">
                  SMS emergency alerts for high occupancy
                </p>
                <p className="text-xs text-on-surface-variant">
                  Notify on-duty managers if facility occupancy exceeds 90%.
                </p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-5 h-5 text-primary rounded accent-primary cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 primary-gradient text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
