export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface PlatformPlan {
  id: string;
  planName: string;
  maxMembers: number;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformPlanDuration {
  id: string;
  durationDays: number;
  price: string | number;
  planId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SportiumSubscription {
  id?: string;
  subscriptionStatus: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  amount: string | number;
  plan: PlatformPlan;
  planDuration: PlatformPlanDuration;
}

// Backwards compatibility alias
export type GymflowSubscription = SportiumSubscription;
