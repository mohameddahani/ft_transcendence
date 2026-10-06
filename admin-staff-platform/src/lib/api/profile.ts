import api from "@/lib/axios";
import { getApiEndpoint } from "@/lib/api/config";
import { AdminProfile, UpdateProfileInput } from "@/types/profile";

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
