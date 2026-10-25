import api from "@/lib/axios";
import {
  RegisterUserPayload,
  RegisterResponse,
  LoginUserPayload,
  StaffLoginPayload,
  MemberLoginPayload,
  LoginResponse,
} from "@/types/auth";
import { getApiEndpoint } from "@/lib/api/config";

export async function registerAdmin(data: RegisterUserPayload): Promise<RegisterResponse> {
  const url = getApiEndpoint("/api/auth/register");
  const response = await api.post<RegisterResponse>(url, data);
  return response.data;
}

export async function loginUser(data: LoginUserPayload): Promise<LoginResponse> {
  const url = getApiEndpoint("/api/auth/login");
  const response = await api.post<LoginResponse>(url, data);
  return response.data;
}

export async function loginStaff(data: StaffLoginPayload): Promise<LoginResponse> {
  const url = getApiEndpoint("/api/auth/staffs/login");
  const response = await api.post<LoginResponse>(url, data);
  return response.data;
}

export async function logoutStaff(): Promise<{ success: boolean; message?: string }> {
  const url = getApiEndpoint("/api/auth/staffs/logout");
  const response = await api.post<{ success: boolean; message?: string }>(url, {});
  return response.data;
}

export async function loginMember(data: MemberLoginPayload): Promise<LoginResponse> {
  const url = getApiEndpoint("/api/auth/members/login");
  const response = await api.post<LoginResponse>(url, data);
  return response.data;
}

export async function logoutMember(): Promise<{ success: boolean; message?: string }> {
  const url = getApiEndpoint("/api/auth/members/logout");
  const response = await api.post<{ success: boolean; message?: string }>(url, {});
  return response.data;
}

export async function refreshMember(): Promise<{ accessToken: string }> {
  const url = getApiEndpoint("/api/auth/members/refresh");
  const response = await api.post<{ accessToken: string }>(url, {});
  return response.data;
}
