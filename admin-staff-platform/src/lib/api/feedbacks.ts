import api from "@/lib/axios";
import { FeedbackItem, UpdateFeedbackStatusInput } from "@/types/feedback";

export async function fetchAllFeedbacks(
  page: number = 1,
  limit: number = 50
): Promise<FeedbackItem[]> {
  const response = await api.get<FeedbackItem[]>(
    `/api/admins/feedbacks?page=${page}&limit=${limit}`
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchFeedbackById(id: string): Promise<FeedbackItem> {
  const response = await api.get<FeedbackItem>(`/api/admins/feedbacks/${id}`);
  return response.data;
}

export async function updateFeedbackStatus(
  id: string,
  data: UpdateFeedbackStatusInput
): Promise<FeedbackItem> {
  const response = await api.patch<FeedbackItem>(
    `/api/admins/feedbacks/${id}`,
    data
  );
  return response.data;
}
