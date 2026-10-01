export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export type StaffAccountStatus = "ACTIVE" | "PENDING" | "INACTIVE" | "BANNED";

export interface BackendStaffAdmin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  role: string;
  profileImageUrl?: string;
}

export interface BackendStaff {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender | string;
  birthDate: string;
  userName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  admin?: BackendStaffAdmin;
  role: "STAFF" | string;
  profileImageUrl?: string;
  accountStatus: StaffAccountStatus | string;
  createdAt: string;
  updatedAt: string;
}

export interface AddStaffInput {
  firstName: string;
  lastName: string;
  gender: Gender | string;
  birthDate: string;
  email: string;
  phoneNumber: string;
}

export type UpdateStaffInput = Partial<AddStaffInput>;
