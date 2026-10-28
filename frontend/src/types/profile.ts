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

export interface StaffProfile {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  userName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  admin?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    companyName?: string;
    profileImageUrl?: string;
  } | null;
  profileImageUrl: string;
  profileImagePublicId?: string | null;
  role: string;
  accountStatus: string;
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
