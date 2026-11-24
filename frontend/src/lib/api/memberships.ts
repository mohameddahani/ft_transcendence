import axios from "axios";
import { Membership, MembershipFilterParams } from "@/types/membership";

function buildQuery(params?: MembershipFilterParams): string {
  if (!params) return "";
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.membershipStatus?.trim())
    query.set("membershipStatus", params.membershipStatus.trim());
  if (params.membershipPlanId?.trim())
    query.set("membershipPlanId", params.membershipPlanId.trim());

  const str = query.toString();
  return str ? `?${str}` : "";
}

export async function fetchAdminMemberships(
  params?: MembershipFilterParams
): Promise<Membership[]> {
  try {
    const res = await axios.get<Membership[]>(
      `/api/admins/memberships${buildQuery(params)}`
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function fetchStaffMemberships(
  params?: MembershipFilterParams
): Promise<Membership[]> {
  try {
    const res = await axios.get<Membership[]>(
      `/api/staffs/memberships${buildQuery(params)}`
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function fetchAdminMembershipDetail(
  id: string
): Promise<Membership | null> {
  try {
    const res = await axios.get<Membership>(`/api/admins/memberships/${id}`);
    return res.data || null;
  } catch {
    return null;
  }
}

export async function fetchStaffMembershipDetail(
  id: string
): Promise<Membership | null> {
  try {
    const res = await axios.get<Membership>(`/api/staffs/memberships/${id}`);
    return res.data || null;
  } catch {
    return null;
  }
}

export async function fetchMemberMemberships(
  params?: MembershipFilterParams
): Promise<Membership[]> {
  try {
    const res = await axios.get<Membership[]>(
      `/api/members/memberships/all${buildQuery(params)}`
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function fetchMemberActiveMembership(): Promise<Membership | null> {
  try {
    const res = await axios.get<Membership | null>(
      "/api/members/memberships/me"
    );
    return res.data || null;
  } catch {
    return null;
  }
}

