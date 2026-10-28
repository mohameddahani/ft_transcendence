import type { Metadata } from "next";
import StaffLoginForm from "@/components/auth/StaffLoginForm";

export const metadata: Metadata = {
  title: "Staff Sign In | GymFlow",
  description:
    "Sign in to the GymFlow Staff Portal for front desk operations, member check-in, attendance, and member services.",
};

export default function StaffsLoginPage() {
  return <StaffLoginForm />;
}
