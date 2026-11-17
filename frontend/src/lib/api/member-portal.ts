import axios from "@/lib/axios";
import {
  MemberProfile,
  MemberMembership,
  MemberVisit,
  MemberAttendance,
} from "@/types/member-portal";
import { WorkingHour, SpecialHour } from "@/types/working-hours";
import { AdminNotification } from "@/types/notification";
import {
  FeedbackItem,
  CreateMemberFeedbackInput,
  RawMemberFeedbackResponse,
} from "@/types/feedback";

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

export interface FetchMemberWorkingHoursParams {
  page?: number;
  limit?: number;
  dayOfWeek?: number;
  isClosed?: boolean;
}

export async function fetchMemberWorkingHours(
  pageOrParams: number | FetchMemberWorkingHoursParams = 1,
  limit: number = 50,
  dayOfWeek?: number,
  isClosed?: boolean
): Promise<WorkingHour[]> {
  try {
    let page = 1;
    let pageLimit = 50;
    let queryDayOfWeek: number | undefined;
    let queryIsClosed: boolean | undefined;

    if (typeof pageOrParams === "object") {
      page = pageOrParams.page ?? 1;
      pageLimit = pageOrParams.limit ?? 50;
      queryDayOfWeek = pageOrParams.dayOfWeek;
      queryIsClosed = pageOrParams.isClosed;
    } else {
      page = pageOrParams;
      pageLimit = limit;
      queryDayOfWeek = dayOfWeek;
      queryIsClosed = isClosed;
    }

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", String(pageLimit));
    if (queryDayOfWeek !== undefined) {
      query.set("dayOfWeek", String(queryDayOfWeek));
    }
    if (queryIsClosed !== undefined) {
      query.set("isClosed", String(queryIsClosed));
    }

    const response = await axios.get<WorkingHour[]>(
      `/api/members/working-hours?${query.toString()}`
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

export interface FetchMemberSpecialHoursParams {
  page?: number;
  limit?: number;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export async function fetchMemberSpecialHours(
  pageOrParams: number | FetchMemberSpecialHoursParams = 1,
  limit: number = 50,
  from?: string,
  to?: string
): Promise<SpecialHour[]> {
  try {
    let page = 1;
    let pageLimit = 50;
    let queryFrom: string | undefined;
    let queryTo: string | undefined;

    if (typeof pageOrParams === "object") {
      page = pageOrParams.page ?? 1;
      pageLimit = pageOrParams.limit ?? 50;
      queryFrom = pageOrParams.from;
      queryTo = pageOrParams.to;
    } else {
      page = pageOrParams;
      pageLimit = limit;
      queryFrom = from;
      queryTo = to;
    }

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", String(pageLimit));
    if (queryFrom && queryFrom.trim().length > 0) {
      query.set("from", queryFrom.trim());
    }
    if (queryTo && queryTo.trim().length > 0) {
      query.set("to", queryTo.trim());
    }

    const response = await axios.get<SpecialHour[]>(
      `/api/members/special-hours?${query.toString()}`
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

export interface FetchMemberAttendancesParams {
  page?: number;
  limit?: number;
  attendanceMethod?: "QR_CODE" | "MANUAL" | string;
  from?: string; // ISO timestamp
  to?: string;   // ISO timestamp
}

export async function fetchMemberAttendances(
  pageOrParams: number | FetchMemberAttendancesParams = 1,
  limit: number = 30,
  attendanceMethod?: string,
  from?: string,
  to?: string
): Promise<MemberAttendance[]> {
  try {
    let page = 1;
    let pageLimit = 30;
    let queryMethod: string | undefined;
    let queryFrom: string | undefined;
    let queryTo: string | undefined;

    if (typeof pageOrParams === "object") {
      page = pageOrParams.page ?? 1;
      pageLimit = pageOrParams.limit ?? 30;
      queryMethod = pageOrParams.attendanceMethod;
      queryFrom = pageOrParams.from;
      queryTo = pageOrParams.to;
    } else {
      page = pageOrParams;
      pageLimit = limit;
      queryMethod = attendanceMethod;
      queryFrom = from;
      queryTo = to;
    }

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", String(pageLimit));

    if (queryMethod && queryMethod !== "ALL") {
      query.set("attendanceMethod", queryMethod);
    }
    if (queryFrom && queryFrom.trim().length > 0) {
      query.set("from", queryFrom.trim());
    }
    if (queryTo && queryTo.trim().length > 0) {
      query.set("to", queryTo.trim());
    }

    const response = await axios.get<MemberAttendance[]>(
      `/api/members/attendances?${query.toString()}`
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

export interface FetchMemberNotificationsParams {
  page?: number;
  limit?: number;
  search?: string;
  notificationType?: string;
  isRead?: boolean;
}

export async function fetchMemberNotifications(
  pageOrParams: number | FetchMemberNotificationsParams = 1,
  limit: number = 30,
  search?: string,
  notificationType?: string,
  isRead?: boolean
): Promise<AdminNotification[]> {
  try {
    let page = 1;
    let pageLimit = 30;
    let querySearch: string | undefined;
    let queryType: string | undefined;
    let queryIsRead: boolean | undefined;

    if (typeof pageOrParams === "object") {
      page = pageOrParams.page ?? 1;
      pageLimit = pageOrParams.limit ?? 30;
      querySearch = pageOrParams.search;
      queryType = pageOrParams.notificationType;
      queryIsRead = pageOrParams.isRead;
    } else {
      page = pageOrParams;
      pageLimit = limit;
      querySearch = search;
      queryType = notificationType;
      queryIsRead = isRead;
    }

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", String(pageLimit));

    if (querySearch && querySearch.trim().length > 0) {
      query.set("search", querySearch.trim());
    }
    if (queryType && queryType !== "ALL") {
      query.set("notificationType", queryType);
    }
    if (queryIsRead !== undefined) {
      query.set("isRead", String(queryIsRead));
    }

    const response = await axios.get<AdminNotification[]>(
      `/api/members/notifications?${query.toString()}`
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

export async function markAllMemberNotificationsRead(): Promise<void> {
  await axios.patch("/api/members/notifications");
}

export async function markMemberNotificationRead(id: string): Promise<void> {
  await axios.patch(`/api/members/notifications/${id}`);
}

/* =========================================================================
   Member Feedbacks APIs
========================================================================= */

export interface FetchMemberFeedbacksParams {
  page?: number;
  limit?: number;
  search?: string;
  feedbackStatus?: string;
  sentimentType?: string;
  rating?: number;
}

export async function fetchMemberFeedbacks(
  pageOrParams: number | FetchMemberFeedbacksParams = 1,
  limit: number = 50,
  search?: string,
  feedbackStatus?: string,
  sentimentType?: string,
  rating?: number
): Promise<FeedbackItem[]> {
  try {
    let page = 1;
    let pageLimit = 50;
    let querySearch: string | undefined;
    let queryStatus: string | undefined;
    let querySentiment: string | undefined;
    let queryRating: number | undefined;

    if (typeof pageOrParams === "object") {
      page = pageOrParams.page ?? 1;
      pageLimit = pageOrParams.limit ?? 50;
      querySearch = pageOrParams.search;
      queryStatus = pageOrParams.feedbackStatus;
      querySentiment = pageOrParams.sentimentType;
      queryRating = pageOrParams.rating;
    } else {
      page = pageOrParams;
      pageLimit = limit;
      querySearch = search;
      queryStatus = feedbackStatus;
      querySentiment = sentimentType;
      queryRating = rating;
    }

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", String(pageLimit));

    if (querySearch && querySearch.trim().length > 0) {
      query.set("search", querySearch.trim());
    }
    if (queryStatus && queryStatus !== "ALL") {
      query.set("feedbackStatus", queryStatus);
    }
    if (querySentiment && querySentiment !== "ALL") {
      query.set("sentimentType", querySentiment);
    }
    if (typeof queryRating === "number" && !isNaN(queryRating)) {
      query.set("rating", String(queryRating));
    }

    const response = await axios.get<RawMemberFeedbackResponse[]>(
      `/api/members/feedbacks?${query.toString()}`
    );
    const rawList = Array.isArray(response.data) ? response.data : [];
    return rawList.map((item: RawMemberFeedbackResponse) => {
      const base = item?.feedbackData ? item.feedbackData : item;
      const isLiked = Boolean(item?.isLiked ?? base?.isLiked ?? false);
      const likeCount = item?.likeCount ?? base?.likeCount ?? base?._count?.likes ?? 0;
      return {
        ...(base as FeedbackItem),
        isLiked,
        likeCount,
        _count: {
          ...base?._count,
          likes: likeCount,
        },
      };
    });
  } catch {
    return [];
  }
}

export async function fetchMemberFeedbackById(id: string): Promise<FeedbackItem> {
  const response = await axios.get<RawMemberFeedbackResponse>(`/api/members/feedbacks/${id}`);
  const item = response.data;
  const base = item?.feedbackData ? item.feedbackData : item;
  const isLiked = Boolean(item?.isLiked ?? base?.isLiked ?? false);
  const likeCount = item?.likeCount ?? base?.likeCount ?? base?._count?.likes ?? 0;
  return {
    ...(base as FeedbackItem),
    isLiked,
    likeCount,
    _count: {
      ...base?._count,
      likes: likeCount,
    },
  };
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

