import type { Metadata } from "next";
import EmailVerificationView from "@/components/auth/EmailVerificationView";

export const metadata: Metadata = {
  title: "Verify Member Email | Sportium",
  description: "Verify your member email address for Sportium.",
};

export default function MembersEmailVerificationPage() {
  return <EmailVerificationView role="member" />;
}

