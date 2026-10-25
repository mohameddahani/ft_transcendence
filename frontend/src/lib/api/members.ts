import api from "@/lib/axios";
import { BackendMember, AddMemberInput, UpdateMemberInput } from "@/types/member";
import { getApiEndpoint } from "@/lib/api/config";

export async function fetchMembers(page = 1, limit = 50): Promise<BackendMember[]> {
  const url = getApiEndpoint(`/api/admins/members?page=${page}&limit=${limit}`);
  const response = await api.get<BackendMember[] | { members?: BackendMember[]; data?: BackendMember[] }>(
    url
  );

  const payload = response.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.members)) {
    return payload.members;
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data;
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

export async function freezeMember(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/members/freeze/${id}`);
  await api.patch(url, {});
}

export async function banMember(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/members/ban/${id}`);
  await api.patch(url, {});
}
