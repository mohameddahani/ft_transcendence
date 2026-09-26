export type Gender = "MALE" | "FEMALE";

export interface OwnerProfile {
  id?: string;
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
  isAccountVerified: boolean;
  accountStatus: string;
  termsAccepted: boolean;
  subscription?: unknown[];
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  birthDate?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  companyName?: string;
}

