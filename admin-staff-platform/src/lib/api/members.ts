import api from "@/lib/axios";
import { BackendMember } from "@/types/member";
import { getApiEndpoint } from "@/lib/api/config";

export async function fetchMembers(page = 1, limit = 50): Promise<BackendMember[]> {
  // Construct URL taking API_URL from .env and appending endpoint with required pagination
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
