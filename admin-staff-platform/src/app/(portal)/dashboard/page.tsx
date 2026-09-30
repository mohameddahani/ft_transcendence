"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  Plus,
  ArrowRight,
  Loader2,
  RefreshCw,
  Building,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchMembers } from "@/lib/api/members";
import { BackendMember } from "@/types/member";
import axios from "axios";
import { toast } from "react-toastify";

export default function DashboardPage() {
  const { fullName, companyName, role, user } = useCurrentUser();
  const [members, setMembers] = useState<BackendMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMembers();
      setMembers(data);
    } catch (err: unknown) {
      let msg = "Failed to load members";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length;
  const inactiveOrOther = totalMembers - activeMembers;

  return (
    <div className="space-y-6 max-w-container-max mx-auto">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {companyName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <Building className="w-3.5 h-3.5" />
                {companyName}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
              {role} Workspace
            </span>
          </div>

          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
            Welcome back, {fullName}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time management dashboard and facility operations.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={loadMembers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/members"
            className="flex items-center gap-2 px-4 py-2 primary-gradient text-white rounded-xl text-sm font-bold shadow-md hover:opacity-95 transition-all"
          >
            <span>View All Members</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row (Based solely on real data from GET /api/admins/members) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Members */}
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Total Members
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <span className="font-headline text-3xl font-bold text-on-surface">
                {totalMembers}
              </span>
            )}
            <span className="text-xs text-on-surface-variant">Live from API</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            Registered in this gym account
          </p>
        </div>

        {/* Metric 2: Active Members */}
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Active Members
            </span>
            <div className="w-10 h-10 rounded-xl bg-secondary-container/20 text-on-secondary-container flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-secondary" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            ) : (
              <span className="font-headline text-3xl font-bold text-on-surface">
                {activeMembers}
              </span>
            )}
            <span className="text-xs font-semibold text-secondary">
              {totalMembers > 0
                ? `${Math.round((activeMembers / totalMembers) * 100)}% active`
                : "—"}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            Currently active status
          </p>
        </div>

        {/* Metric 3: Inactive / Other Status */}
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Inactive / Pending
            </span>
            <div className="w-10 h-10 rounded-xl bg-surface-variant text-on-surface-variant flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant" />
            ) : (
              <span className="font-headline text-3xl font-bold text-on-surface">
                {inactiveOrOther}
              </span>
            )}
            <span className="text-xs text-on-surface-variant">Non-active</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            Frozen or inactive accounts
          </p>
        </div>
      </div>

      {/* Real Members Data Table from GET /api/admins/members */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="font-headline font-bold text-base text-on-surface">
              Recent Members
            </h3>
            <p className="text-xs text-on-surface-variant">
              Fetched from <code className="bg-surface-container px-1 py-0.5 rounded text-[11px]">GET /api/admins/members</code>
            </p>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant">
            {totalMembers} {totalMembers === 1 ? "member" : "members"} found
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Loading members from API...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6 m-4 rounded-xl bg-error-container/20 border border-error-container text-error text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error loading members</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && members.length === 0 && (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-3 text-on-surface-variant">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-headline font-bold text-base text-on-surface">
              No members found
            </h4>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-4">
              Your member registry is currently empty. As soon as members register or are added, they will appear here in real-time.
            </p>
            <Link
              href="/members"
              className="inline-flex items-center gap-1.5 px-4 py-2 primary-gradient text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Go to Members Page</span>
            </Link>
          </div>
        )}

        {/* Members Table */}
        {!isLoading && !error && members.length > 0 && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-xs">
                {members.slice(0, 10).map((member) => {
                  const memberName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.userName || "Member";
                  const memberInitials = (member.firstName?.[0] || "") + (member.lastName?.[0] || "") || "M";
                  const hasPhoto = member.photo && member.photo !== "default-member-image.jpg" && member.photo !== "default-image.jpg";
                  const activePlan = member.memberships?.[0]?.membershipPlan?.name || member.memberships?.[0]?.membershipPlan?.planName || "—";
                  const joinedDate = member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—";

                  return (
                    <tr key={member.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {hasPhoto ? (
                            <img
                              src={member.photo!}
                              alt={memberName}
                              className="w-8 h-8 rounded-full object-cover border border-outline-variant"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs select-none">
                              {memberInitials}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-on-surface">{memberName}</p>
                            <p className="text-[11px] text-on-surface-variant">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-on-surface-variant font-mono text-[11px]">
                        @{member.userName || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-on-surface-variant">
                        {member.phoneNumber || "—"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            member.status === "ACTIVE"
                              ? "bg-secondary-container/20 text-on-secondary-container border border-secondary-container/30"
                              : "bg-surface-variant text-on-surface-variant border border-outline-variant/30"
                          }`}
                        >
                          {member.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-on-surface font-medium">
                        {activePlan}
                      </td>
                      <td className="px-6 py-3.5 text-on-surface-variant">
                        {joinedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
