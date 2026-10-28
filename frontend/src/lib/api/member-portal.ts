import axios from "@/lib/axios";
import {
  MemberProfile,
  MemberMembership,
  MemberVisit,
  MemberAttendance,
} from "@/types/member-portal";
import { WorkingHour, SpecialHour } from "@/types/working-hours";
import { AdminNotification } from "@/types/notification";
import { FeedbackItem, CreateMemberFeedbackInput } from "@/types/feedback";

/* =========================================================================
   Member Profile APIs
========================================================================= */

export async function fetchMemberProfile(): Promise<MemberProfile> {
  const response = await axios.get<MemberProfile>("/api/users/members/me");
  return response.data;
}

export async function uploadMemberProfileImage(file: File): Promise<{ profileImageUrl?: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await axios.post<{ profileImageUrl?: string }>(
    "/api/users/members/profile-image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function deleteMemberProfileImage(): Promise<{ message?: string }> {
  const response = await axios.delete<{ message?: string }>(
    "/api/users/members/profile-image"
  );
  return response.data;
}

/* =========================================================================
   Member Memberships APIs
========================================================================= */

export async function fetchMyActiveMembership(): Promise<MemberMembership | null> {
  try {
    const response = await axios.get<MemberMembership | null>("/api/members/memberships/me");
    return response.data;
  } catch {
    return null;
  }
}

export async function fetchAllMyMemberships(
  page: number = 1,
  limit: number = 30
): Promise<MemberMembership[]> {
  try {
    const response = await axios.get<MemberMembership[]>(
      `/api/members/memberships/all?page=${page}&limit=${limit}`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

/* =========================================================================
   Member Working & Special Hours APIs
========================================================================= */

export async function fetchMemberWorkingHours(
  page: number = 1,
  limit: number = 50
): Promise<WorkingHour[]> {
  try {
    const response = await axios.get<WorkingHour[]>(
      `/api/members/working-hours?page=${page}&limit=${limit}`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchMemberWorkingHourById(id: string): Promise<WorkingHour> {
  const response = await axios.get<WorkingHour>(`/api/members/working-hours/${id}`);
  return response.data;
}

export async function fetchMemberSpecialHours(
  page: number = 1,
  limit: number = 50
): Promise<SpecialHour[]> {
  try {
    const response = await axios.get<SpecialHour[]>(
      `/api/members/special-hours?page=${page}&limit=${limit}`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchMemberSpecialHourById(id: string): Promise<SpecialHour> {
  const response = await axios.get<SpecialHour>(`/api/members/special-hours/${id}`);
  return response.data;
}

/* =========================================================================
   Member Visits APIs
========================================================================= */

export async function createMemberVisit(visitDateAndTime: string): Promise<{ rawToken?: string }> {
  const response = await axios.post<{ rawToken?: string }>(
    "/api/members/visits",
    { visitDateAndTime }
  );
  return response.data;
}

export async function cancelMemberVisit(visitId: string): Promise<{ message?: string }> {
  const response = await axios.patch<{ message?: string }>(
    `/api/members/visits/cancel/${visitId}`
  );
  return response.data;
}

export async function fetchUpcomingVisits(
  page: number = 1,
  limit: number = 30
): Promise<MemberVisit[]> {
  try {
    const response = await axios.get<MemberVisit[]>(
      `/api/members/visits/upcoming?page=${page}&limit=${limit}`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchTodayVisits(
  page: number = 1,
  limit: number = 30
): Promise<MemberVisit[]> {
  try {
    const response = await axios.get<MemberVisit[]>(
      `/api/members/visits/today?page=${page}&limit=${limit}`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchTodayVisitById(id: string): Promise<MemberVisit> {
  const response = await axios.get<MemberVisit>(`/api/members/visits/today/${id}`);
  return response.data;
}

/* =========================================================================
   Member Attendances APIs
========================================================================= */

export async function fetchMemberAttendances(
  page: number = 1,
  limit: number = 30
): Promise<MemberAttendance[]> {
  try {
    const response = await axios.get<MemberAttendance[]>(
      `/api/members/attendances?page=${page}&limit=${limit}`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchMemberAttendanceById(id: string): Promise<MemberAttendance> {
  const response = await axios.get<MemberAttendance>(`/api/members/attendances/${id}`);
  return response.data;
}

/* =========================================================================
   Member Notifications APIs
========================================================================= */

export async function fetchMemberNotifications(
  page: number = 1,
  limit: number = 30
): Promise<AdminNotification[]> {
  try {
    const response = await axios.get<AdminNotification[]>(
      `/api/members/notifications?page=${page}&limit=${limit}`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchMemberNotificationById(id: string): Promise<AdminNotification> {
  const response = await axios.get<AdminNotification>(
    `/api/members/notifications/${id}`
  );
  return response.data;
}

/* =========================================================================
   Member Feedbacks APIs
========================================================================= */

export async function fetchMemberFeedbacks(
  page: number = 1,
  limit: number = 50
): Promise<FeedbackItem[]> {
  try {
    const response = await axios.get<FeedbackItem[]>(
      `/api/members/feedbacks?page=${page}&limit=${limit}`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchMemberFeedbackById(id: string): Promise<FeedbackItem> {
  const response = await axios.get<FeedbackItem>(`/api/members/feedbacks/${id}`);
  return response.data;
}

export async function createMemberFeedback(
  data: CreateMemberFeedbackInput
): Promise<FeedbackItem> {
  const response = await axios.post<FeedbackItem>(
    "/api/members/feedbacks/create",
    data
  );
  return response.data;
}

export async function deleteMemberFeedback(id: string): Promise<{ message?: string }> {
  const response = await axios.delete<{ message?: string }>(
    `/api/members/feedbacks/${id}`
  );
  return response.data;
}

export async function likeMemberFeedback(feedbackId: string): Promise<void> {
  await axios.post("/api/members/feedbacks/like", { feedbackId });
}

export async function removeLikeMemberFeedback(feedbackId: string): Promise<void> {
  await axios.post("/api/members/feedbacks/remove-like", { feedbackId });
}

