export type Gender = "MALE" | "FEMALE";

export interface AdminProfile {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  userName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  role: string;
  profileImageUrl: string;
  profileImagePublicId?: string | null;
  isAccountVerified: boolean;
  accountStatus: string;
  termsAccepted: boolean;
  subscription?: Array<{
    id: string;
    planId: string;
    subscriptionStatus: string;
    startedAt: string;
    expiresAt: string;
    amount: string;
  }>;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  birthDate?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  companyName?: string;
}
