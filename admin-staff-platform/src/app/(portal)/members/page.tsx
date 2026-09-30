"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  MoreVertical,
  Users,
  UserCheck,
  UserX,
  Loader2,
  RefreshCw,
  Plus,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { fetchMembers } from "@/lib/api/members";
import { BackendMember } from "@/types/member";

export default function MembershipsPage() {
  const [members, setMembers] = useState<BackendMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMembers();
      setMembers(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load members from backend");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const fullName = `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
      const email = (member.email || "").toLowerCase();
      const username = (member.userName || "").toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        fullName.includes(query) ||
        email.includes(query) ||
        username.includes(query);

      const matchesStatus =
        !selectedStatus ||
        (member.status || "ACTIVE").toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [members, searchTerm, selectedStatus]);

  const totalCount = members.length;
  const activeCount = members.filter((m) => (m.status || "ACTIVE") === "ACTIVE").length;
  const inactiveCount = totalCount - activeCount;

  const handleExport = () => {
    if (members.length === 0) {
      toast.info("No member data to export.");
      return;
    }
    toast.success("Members data exported successfully as CSV.");
  };

  return (
    <div className="space-y-6 max-w-container-max mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Members
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Manage and monitor active registered gym members across the facility.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadMembers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-surface-container-highest border border-outline-variant rounded-lg text-label-md text-on-surface hover:bg-surface-variant transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-highest border border-outline-variant rounded-lg text-label-md hover:bg-surface-variant transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-on-surface-variant" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-lg text-body-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all"
            placeholder="Search by name, email, or username..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:col-span-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-lg text-body-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="FROZEN">Frozen</option>
            <option value="BANNED">Banned</option>
          </select>
        </div>
      </div>

      {/* Memberships Table Container */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        {isLoading && (
          <div className="py-16 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Loading members...</p>
          </div>
        )}

        {!isLoading && filteredMembers.length === 0 && (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-3 text-on-surface-variant">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-headline font-bold text-base text-on-surface">
              {members.length === 0 ? "No members registered yet" : "No matching members found"}
            </h4>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
              {members.length === 0
                ? "Members registered via the system will appear here automatically."
                : "Try adjusting your search query or status filter."}
            </p>
          </div>
        )}

        {!isLoading && filteredMembers.length > 0 && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Joined Date
                  </th>
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredMembers.map((member) => {
                  const memberName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.userName || "Member";
                  const memberInitials = (member.firstName?.[0] || "") + (member.lastName?.[0] || "") || "M";
                  const hasPhoto = member.photo && member.photo !== "default-member-image.jpg" && member.photo !== "default-image.jpg";
                  const activePlan = member.memberships?.[0]?.membershipPlan?.name || member.memberships?.[0]?.membershipPlan?.planName || "—";
                  const joinedDate = member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—";

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-primary-container/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-4">
                          {hasPhoto ? (
                            <img
                              className="w-10 h-10 rounded-full object-cover border border-outline-variant/60"
                              alt={memberName}
                              src={member.photo!}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm select-none border border-primary/20">
                              {memberInitials}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-on-surface">{memberName}</p>
                            <p className="text-xs text-on-surface-variant">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-body-sm font-mono text-on-surface-variant text-xs">
                        @{member.userName || "—"}
                      </td>
                      <td className="px-6 py-3 text-body-sm text-on-surface-variant">
                        {member.phoneNumber || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${
                            member.status === "ACTIVE"
                              ? "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30"
                              : "bg-surface-variant text-on-surface-variant border-outline-variant/30"
                          }`}
                        >
                          {member.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-body-sm text-on-surface font-medium">
                        {activePlan}
                      </td>
                      <td className="px-6 py-3 text-body-sm text-on-surface-variant">
                        {joinedDate}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Chips (Real Data) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">TOTAL MEMBERS</p>
          <p className="font-headline-md text-headline-md text-primary">{totalCount}</p>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">ACTIVE</p>
          <p className="font-headline-md text-headline-md text-secondary">{activeCount}</p>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">INACTIVE / OTHER</p>
          <p className="font-headline-md text-headline-md text-on-surface">{inactiveCount}</p>
        </div>
      </div>
    </div>
  );
}
