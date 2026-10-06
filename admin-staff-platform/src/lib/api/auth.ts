import api from "@/lib/axios";
import {
  RegisterUserPayload,
  RegisterResponse,
  LoginUserPayload,
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
