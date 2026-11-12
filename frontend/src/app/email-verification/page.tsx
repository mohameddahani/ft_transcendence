import type { Metadata } from "next";
import EmailVerificationView from "@/components/auth/EmailVerificationView";

export const metadata: Metadata = {
  title: "Verify Your Email | Sportium",
  description: "Verify your email address to activate your Sportium account.",
};

export default function EmailVerificationPage() {
  return <EmailVerificationView />;
}

