import type { Metadata } from "next";
import EmailVerificationView from "@/components/auth/EmailVerificationView";

export const metadata: Metadata = {
  title: "Verify Admin Email | Sportium",
  description: "Verify your administrator email address for Sportium.",
};

export default function AdminEmailVerificationPage() {
  return <EmailVerificationView role="admin" />;
}

