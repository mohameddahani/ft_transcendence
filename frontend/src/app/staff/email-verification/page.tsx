import type { Metadata } from "next";
import EmailVerificationView from "@/components/auth/EmailVerificationView";

export const metadata: Metadata = {
  title: "Verify Staff Email | Sportium",
  description: "Verify your staff email address for Sportium.",
};

export default function StaffEmailVerificationPage() {
  return <EmailVerificationView role="staff" />;
}

