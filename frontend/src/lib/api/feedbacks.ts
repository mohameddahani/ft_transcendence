import api from "@/lib/axios";
import {
  FeedbackItem,
  RawMemberFeedbackResponse,
  UpdateFeedbackStatusInput,
} from "@/types/feedback";

export interface FetchFeedbacksParams {
  page?: number;
  limit?: number;
  search?: string;
  feedbackStatus?: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED" | string;
  sentimentType?: "NEGATIVE" | "NEUTRAL" | "POSITIVE" | string;
  rating?: number;
}

export async function fetchAllFeedbacks(
  pageOrParams: number | FetchFeedbacksParams = 1,
  limit: number = 20,
  search?: string,
  feedbackStatus?: string,
  sentimentType?: string,
  rating?: number
): Promise<FeedbackItem[]> {
  let page = 1;
  let pageLimit = 20;
  let querySearch: string | undefined;
  let queryStatus: string | undefined;
  let querySentiment: string | undefined;
  let queryRating: number | undefined;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 20;
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

  const response = await api.get<RawMemberFeedbackResponse[]>(
    `/api/admins/feedbacks?${query.toString()}`
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
