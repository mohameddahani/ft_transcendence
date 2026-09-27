export type SubscriptionStatus = "ACTIVE" | "PENDING" | "EXPIRED" | "CANCELLED";

export interface SubscriptionUser {
  id: string;
  firstName?: string;
  lastName?: string;
  userName: string;
  email: string;
  companyName: string;
  phoneNumber?: string;
  role?: string;
  accountStatus?: string;
}

export interface SubscriptionPlan {
  id: string;
  planName: string;
  maxMembers: number;
  description?: string | null;
  isActive: boolean;
}

export interface SubscriptionPlanDuration {
  id: string;
  durationDays: number;
  price: number | string;
  planId: string;
}

export interface Subscription {
  id: string;
  userId: string;
  user?: SubscriptionUser;
  planId: string;
  plan?: SubscriptionPlan;
  planDurationId: string;
  planDuration?: SubscriptionPlanDuration;
  subscriptionStatus: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  amount: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActiveSubscriptionDto {
  planId: string;
  planDurationId: string;
  userName: string;
}

export interface CancelSubscriptionDto {
  adminId: string;
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  total: number;
  page: number;
  limit: number;
}

