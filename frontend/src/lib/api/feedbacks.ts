import api from "@/lib/axios";
import {
  FeedbackItem,
  RawMemberFeedbackResponse,
  UpdateFeedbackStatusInput,
} from "@/types/feedback";

export async function fetchAllFeedbacks(
  page: number = 1,
  limit: number = 50
): Promise<FeedbackItem[]> {
  const response = await api.get<RawMemberFeedbackResponse[]>(
    `/api/admins/feedbacks?page=${page}&limit=${limit}`
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
