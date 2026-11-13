import { BackendMember } from "./member";

export type PaymentStatus =
  | "PAID"
  | "PENDING"
  | "UNPAID"
  | "PARTIAL"
  | "OVERDUE"
  | string;

export interface BackendPayment {
  id: string;
  adminId: string;
  member: BackendMember;
  amount: string | number;
  paidAt?: string | null;
  dueDate?: string | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}
