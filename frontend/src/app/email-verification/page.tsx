import type { Metadata } from "next";
import EmailVerificationView from "@/components/auth/EmailVerificationView";

export const metadata: Metadata = {
  title: "Verify Your Email | GymFlow",
  description: "Verify your email address to activate your GymFlow administrator account.",
};

export default function EmailVerificationPage() {
  return <EmailVerificationView />;
}

