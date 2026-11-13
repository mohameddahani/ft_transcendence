import api from "@/lib/axios";
import { RequestEmailChangeFormValues } from "@/schemas/owner-profile.schema";

export interface ApiResponse {
  message: string;
  [key: string]: unknown;
}

/**
 * Request email change for platform owner
 * Endpoint: POST /api/users/owners/email-change
 */
export async function requestEmailChangeOwner(
  data: RequestEmailChangeFormValues
): Promise<ApiResponse> {
  const response = await api.post<ApiResponse>(
    "/api/users/owners/email-change",
    data
  );
  return response.data;
}

/**
 * Confirm email change using token
 * Endpoint: POST /api/auth/email-change?token=...
 */
export async function verifyEmailChange(token: string): Promise<ApiResponse> {
  const response = await api.post<ApiResponse>(
    `/api/auth/email-change?token=${encodeURIComponent(token)}`
  );
  return response.data;
}

/**
 * Request password reset email for owner
 * Endpoint: POST /api/auth/forgot-password
 */
export async function forgotPassword(email: string): Promise<ApiResponse> {
  const response = await api.post<ApiResponse>(
    "/api/auth/forgot-password",
    { email }
  );
  return response.data;
}

/**
 * Reset owner password using token
 * Endpoint: POST /api/auth/reset-password?token=...
 */
export async function resetPassword(
  token: string,
  password: string
): Promise<ApiResponse> {
  const response = await api.post<ApiResponse>(
    `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
    { password }
  );
  return response.data;
}

