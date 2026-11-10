import type { Metadata } from "next";
import StaffLoginForm from "@/components/auth/StaffLoginForm";

export const metadata: Metadata = {
  title: "Staff sign in | Sportium",
  description:
    "Sign in to the Sportium staff portal for the front desk: member check-in, visits, attendance and member services.",
};

export default function StaffLoginPage() {
  return <StaffLoginForm />;
}
