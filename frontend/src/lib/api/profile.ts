import api from "@/lib/axios";
import { getApiEndpoint } from "@/lib/api/config";
import { AdminProfile, StaffProfile, UpdateProfileInput } from "@/types/profile";

export async function fetchAdminProfile(): Promise<AdminProfile> {
  const url = getApiEndpoint("/api/users/admins/me");
  const response = await api.get<AdminProfile>(url);
  return response.data;
}

export async function updateAdminProfile(
  data: UpdateProfileInput
): Promise<void> {
  const url = getApiEndpoint("/api/users/admins/edit-profile");
  await api.patch(url, data);
}

export async function uploadAdminProfileImage(file: File): Promise<void> {
  const url = getApiEndpoint("/api/users/admins/profile-image");
  const formData = new FormData();
  formData.append("image", file);

  await api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function deleteAdminProfileImage(): Promise<void> {
  const url = getApiEndpoint("/api/users/admins/profile-image");
  await api.delete(url);
}

export async function fetchStaffProfile(): Promise<StaffProfile> {
  const url = getApiEndpoint("/api/users/staffs/me");
  const response = await api.get<StaffProfile>(url);
  return response.data;
}

export async function uploadStaffProfileImage(file: File): Promise<void> {
  const url = getApiEndpoint("/api/users/staffs/profile-image");
  const formData = new FormData();
  formData.append("image", file);

  await api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function deleteStaffProfileImage(): Promise<void> {
  const url = getApiEndpoint("/api/users/staffs/profile-image");
  await api.delete(url);
}

/**
 * Request email change for Admin / Owner
 */
export async function requestEmailChangeAdmin(data: {
  email: string;
  currentPassword: string;
}): Promise<{ message: string }> {
  const url = getApiEndpoint("/api/users/admins/email-change");
  const response = await api.post<{ message: string }>(url, data);
  return response.data;
}

/**
 * Request email change for Staff
 */
export async function requestEmailChangeStaff(data: {
  email: string;
  currentPassword: string;
}): Promise<{ message: string }> {
  const url = getApiEndpoint("/api/users/staffs/email-change");
  const response = await api.post<{ message: string }>(url, data);
  return response.data;
}

/**
 * Request email change for Member
 */
export async function requestEmailChangeMember(data: {
  email: string;
  currentPassword: string;
}): Promise<{ message: string }> {
  const url = getApiEndpoint("/api/users/members/email-change");
  const response = await api.post<{ message: string }>(url, data);
  return response.data;
}


