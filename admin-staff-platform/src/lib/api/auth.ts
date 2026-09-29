import api from "@/lib/axios";
import {
  RegisterUserPayload,
  RegisterResponse,
  LoginUserPayload,
  LoginResponse,
} from "@/types/auth";

export async function registerAdmin(data: RegisterUserPayload): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>("/api/auth/register", data);
  return response.data;
}

export async function loginUser(data: LoginUserPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/api/auth/login", data);
  return response.data;
}
