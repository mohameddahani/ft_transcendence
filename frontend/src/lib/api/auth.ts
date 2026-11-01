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

/**
 * Verify owner / admin email address using token
 */
export async function verifyEmail(token: string): Promise<{ message: string }> {
  const url = getApiEndpoint(`/api/auth/email-verification?token=${encodeURIComponent(token)}`);
  const response = await api.post<{ message: string }>(url, {});
  return response.data;
}

/**
 * Reset password for owner / admin using token
 */
export async function resetPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  const url = getApiEndpoint(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
  const response = await api.post<{ message: string }>(url, { password });
  return response.data;
}

/**
 * Verify new email change for admin, member, or staff
 * Supports:
 * - Admin:  POST /api/auth/email-change?token=...
 * - Staff:  POST /api/auth/staffs/email-change?token=...
 * - Member: POST /api/auth/members/email-change?token=...
 */
export async function verifyEmailChange(token: string): Promise<{ message: string }> {
  // If user is currently signed in, check role to query matching endpoint first
  let userRole = "";
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem("gym_user") : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      userRole = (parsed?.role || parsed?.userType || "").toUpperCase();
    }
  } catch {
    // ignore
  }

  const endpointList =
    userRole === "STAFF"
      ? [
          `/api/auth/staffs/email-change?token=${encodeURIComponent(token)}`,
          `/api/auth/email-change?token=${encodeURIComponent(token)}`,
          `/api/auth/members/email-change?token=${encodeURIComponent(token)}`,
        ]
      : userRole === "MEMBER"
      ? [
          `/api/auth/members/email-change?token=${encodeURIComponent(token)}`,
          `/api/auth/email-change?token=${encodeURIComponent(token)}`,
          `/api/auth/staffs/email-change?token=${encodeURIComponent(token)}`,
        ]
      : [
          `/api/auth/email-change?token=${encodeURIComponent(token)}`,
          `/api/auth/staffs/email-change?token=${encodeURIComponent(token)}`,
          `/api/auth/members/email-change?token=${encodeURIComponent(token)}`,
        ];

  let lastError: unknown = null;
  for (const endpoint of endpointList) {
    try {
      const url = getApiEndpoint(endpoint);
      const response = await api.post<{ message?: string }>(url, {});
      return {
        message:
          response.data?.message || "Email address has been successfully confirmed and updated!",
      };
    } catch (err: unknown) {
      lastError = err;
      // If error is 400 "Invalid token", try the next role endpoint
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const status = (err as { response?: { status?: number; data?: { message?: string } } }).response?.status;
        const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || "";
        if (status === 400 && typeof msg === "string" && msg.toLowerCase().includes("invalid token")) {
          continue;
        }
        if (status === 404) {
          continue;
        }
      }
      // For any critical error (e.g. "Token expired", "Token already used"), break and throw it
      throw err;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return { message: "Email change verified successfully!" };
}

export async function verifyEmailChangeAdmin(token: string): Promise<{ message: string }> {
  const url = getApiEndpoint(`/api/auth/email-change?token=${encodeURIComponent(token)}`);
  const response = await api.post<{ message: string }>(url, {});
  return response.data;
}

export async function verifyEmailChangeStaff(token: string): Promise<{ message: string }> {
  const url = getApiEndpoint(`/api/auth/staffs/email-change?token=${encodeURIComponent(token)}`);
  const response = await api.post<{ message: string }>(url, {});
  return response.data;
}

export async function verifyEmailChangeMember(token: string): Promise<{ message: string }> {
  const url = getApiEndpoint(`/api/auth/members/email-change?token=${encodeURIComponent(token)}`);
  const response = await api.post<{ message: string }>(url, {});
  return response.data;
}


/**
 * Set password for Member using initial setup token
 */
export async function setPasswordMember(
  token: string,
  password: string
): Promise<{ message: string }> {
  const url = getApiEndpoint(`/api/auth/members/set-password?token=${encodeURIComponent(token)}`);
  const response = await api.post<{ message: string }>(url, { password });
  return response.data;
}

/**
 * Reset password for Member using reset token
 */
export async function resetPasswordMember(
  token: string,
  password: string
): Promise<{ message: string }> {
  const url = getApiEndpoint(`/api/auth/members/reset-password?token=${encodeURIComponent(token)}`);
  const response = await api.post<{ message: string }>(url, { password });
  return response.data;
}

/**
 * Set password for Staff using initial setup token
 */
export async function setPasswordStaff(
  token: string,
  password: string
): Promise<{ message: string }> {
  const url = getApiEndpoint(`/api/auth/staffs/set-password?token=${encodeURIComponent(token)}`);
  const response = await api.post<{ message: string }>(url, { password });
  return response.data;
}

/**
 * Reset password for Staff using reset token
 */
export async function resetPasswordStaff(
  token: string,
  password: string
): Promise<{ message: string }> {
  const url = getApiEndpoint(`/api/auth/staffs/reset-password?token=${encodeURIComponent(token)}`);
  const response = await api.post<{ message: string }>(url, { password });
  return response.data;
}

/**
 * Request password reset email for Admin / Owner
 */
export async function forgotPasswordAdmin(email: string): Promise<{ message: string }> {
  const url = getApiEndpoint("/api/auth/forgot-password");
  const response = await api.post<{ message: string }>(url, { email });
  return response.data;
}

/**
 * Request password reset email for Staff
 */
export async function forgotPasswordStaff(userName: string): Promise<{ message: string }> {
  const url = getApiEndpoint("/api/auth/staffs/forgot-password");
  const response = await api.post<{ message: string }>(url, { userName });
  return response.data;
}

/**
 * Request password reset email for Member
 */
export async function forgotPasswordMember(userName: string): Promise<{ message: string }> {
  const url = getApiEndpoint("/api/auth/members/forgot-password");
  const response = await api.post<{ message: string }>(url, { userName });
  return response.data;
}


