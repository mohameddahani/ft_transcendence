export interface PlanDuration {
  id: string;
  durationDays: number;
  price: number | string;
  planId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformPlan {
  id: string;
  planName: string;
  maxMembers: number;
  description?: string | null;
  isActive: boolean;
  durations: PlanDuration[];
  createdAt: string;
  updatedAt: string;
}

export interface AddPlanDto {
  planName: string;
  maxMembers: number;
  description?: string;
}

export interface AddPlanDurationDto {
  planId: string;
  durationDays: number;
  price: number;
}

export interface UpdatePlanDto {
  planName?: string;
  maxMembers?: number;
  description?: string;
  isActive?: boolean;
}

