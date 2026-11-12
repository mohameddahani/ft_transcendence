import api from "@/lib/axios";
import { BackendMember, AddMemberInput, UpdateMemberInput } from "@/types/member";
import { getApiEndpoint } from "@/lib/api/config";

export async function fetchMembers(
  page = 1,
  limit = 20,
  search?: string
): Promise<BackendMember[]> {
  let endpoint = `/api/admins/members?page=${page}&limit=${limit}`;
  if (search && search.trim().length > 0) {
    endpoint += `&search=${encodeURIComponent(search.trim())}`;
  }
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
