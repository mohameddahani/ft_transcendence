export type FeedbackStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";

export type SentimentType = "NEGATIVE" | "NEUTRAL" | "POSITIVE";

export interface FeedbackMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  photo?: string | null;
  profileImageUrl?: string | null;
  gender?: string;
}

export interface FeedbackItem {
  id: string;
  content: string;
  rating: number;
  sentiment?: SentimentType | null;
  sentimentScore?: number | string | null;
  feedbackStatus: FeedbackStatus;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionNote?: string | null;
  member?: FeedbackMember | null;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    userName?: string;
    companyName?: string;
  };
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count?: {
    likes?: number;
  };
  isLiked?: boolean;
  likeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RawMemberFeedbackResponse extends Partial<FeedbackItem> {
  feedbackData?: FeedbackItem;
  isLiked?: boolean;
  likeCount?: number;
}

export interface UpdateFeedbackStatusInput {
  feedbackStatus: FeedbackStatus;
  resolutionNote?: string;
}

export interface CreateMemberFeedbackInput {
  content: string;
  rating: number;
}

