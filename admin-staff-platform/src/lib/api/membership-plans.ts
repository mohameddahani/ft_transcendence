import api from "@/lib/axios";
import { getApiEndpoint } from "@/lib/api/config";
import {
  MembershipPlan,
  AddMembershipPlanInput,
  UpdateMembershipPlanInput,
  AddMembershipPlanDurationInput,
  UpdateMembershipPlanDurationInput,
} from "@/types/membership-plan";

export async function fetchMembershipPlans(
  page = 1,
  limit = 50
): Promise<MembershipPlan[]> {
  const url = getApiEndpoint(`/api/membership-plans?page=${page}&limit=${limit}`);
  const response = await api.get<MembershipPlan[]>(url);
  const data = response.data;
  return Array.isArray(data) ? data : [];
}

export async function fetchMembershipPlan(id: string): Promise<MembershipPlan> {
  const url = getApiEndpoint(`/api/membership-plans/${id}`);
  const response = await api.get<MembershipPlan>(url);
  return response.data;
}

export async function createMembershipPlan(
  data: AddMembershipPlanInput
): Promise<void> {
  const url = getApiEndpoint("/api/membership-plans");
  await api.post(url, data);
}

export async function updateMembershipPlan(
  id: string,
  data: UpdateMembershipPlanInput
): Promise<void> {
  const url = getApiEndpoint(`/api/membership-plans/${id}`);
  console.log(url);
  await api.patch(url, data);
}

export async function addMembershipPlanDuration(
  data: AddMembershipPlanDurationInput
): Promise<void> {
  const url = getApiEndpoint("/api/membership-plans/durations");
  await api.post(url, data);
}

export async function updateMembershipPlanDuration(
  id: string,
  data: UpdateMembershipPlanDurationInput
): Promise<void> {
  const url = getApiEndpoint(`/api/membership-plans/durations/${id}`);
  await api.patch(url, data);
}
