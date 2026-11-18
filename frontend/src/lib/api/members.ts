import api from "@/lib/axios";
import { BackendMember, AddMemberInput, UpdateMemberInput } from "@/types/member";
import { getApiEndpoint } from "@/lib/api/config";

export interface FetchMembersParams {
  page?: number;
  limit?: number;
  search?: string;
  accountStatus?: string;
  membershipStatus?: string;
}

export async function fetchMembers(
  pageOrParams: number | FetchMembersParams = 1,
  limit = 20,
  search?: string,
  accountStatus?: string,
  membershipStatus?: string
): Promise<BackendMember[]> {
  let page = 1;
  let pageLimit = 20;
  let querySearch: string | undefined;
  let queryAccountStatus: string | undefined;
  let queryMembershipStatus: string | undefined;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 20;
    querySearch = pageOrParams.search;
    queryAccountStatus = pageOrParams.accountStatus;
    queryMembershipStatus = pageOrParams.membershipStatus;
  } else {
    page = pageOrParams;
    pageLimit = limit;
    querySearch = search;
    queryAccountStatus = accountStatus;
    queryMembershipStatus = membershipStatus;
  }

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageLimit));
  if (querySearch && querySearch.trim()) {
    query.set("search", querySearch.trim());
  }
  if (queryAccountStatus && queryAccountStatus !== "ALL") {
    query.set("accountStatus", queryAccountStatus);
  }
  if (queryMembershipStatus && queryMembershipStatus !== "ALL") {
    query.set("membershipStatus", queryMembershipStatus);
  }

  const endpoint = `/api/admins/members?${query.toString()}`;
  const url = getApiEndpoint(endpoint);
  const response = await api.get<BackendMember[]>(url);
  const payload = response.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
}

export async function fetchMember(id: string): Promise<BackendMember> {
  const url = getApiEndpoint(`/api/admins/members/${id}`);
  const response = await api.get<BackendMember>(url);
  return response.data;
}

export async function createMember(data: AddMemberInput): Promise<void> {
  const url = getApiEndpoint("/api/admins/members");
  await api.post(url, data);
}

export async function updateMember(id: string, data: UpdateMemberInput): Promise<void> {
  const url = getApiEndpoint(`/api/admins/members/${id}`);
  await api.patch(url, data);
}

export async function activeMember(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/members/active/${id}`);
  await api.patch(url, {});
}

export async function banMember(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/members/ban/${id}`);
  await api.patch(url, {});
}
