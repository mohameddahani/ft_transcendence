export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

export interface RegisterUserPayload {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string; // ISO / YYYY-MM-DD format
  email: string;
  password: string;
  phoneNumber: string;
  companyName: string;
  termsAccepted: boolean;
}

export interface RegisterResponse {
  message: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    companyName: string;
    gender: Gender;
    birthDate: string;
  };
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  userType?: string;
  userName?: string;
  phoneNumber?: string;
  companyName?: string;
  profileImage?: string | null;
  photo?: string | null;
  avatar?: string | null;
  accountStatus?: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  message?: string;
}
