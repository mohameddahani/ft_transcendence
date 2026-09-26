export type Gender = "MALE" | "FEMALE";

export type Role = "OWNER" | "ADMIN" | "STAFF" | "MEMBER";

export type UserAccountStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "BANNED";

export interface SubscriptionPlan {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSubscription {
  id?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  plan?: SubscriptionPlan;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  userName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  role: Role;
  profileImageUrl: string;
  profileImagePublicId?: string | null;
  isAccountVerified: boolean;
  accountStatus: UserAccountStatus;
  termsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  subscription?: UserSubscription[];
}

// Backward-compatible alias for any existing imports
export type GymAdmin = AdminUser;
export type AdminStatus = UserAccountStatus;
