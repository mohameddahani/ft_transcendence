import type { Metadata } from "next";
import PasswordSetupForm from "@/components/auth/PasswordSetupForm";

export const metadata: Metadata = {
  title: "Reset Password | Sportium Administrator",
  description: "Reset your administrator credentials for Sportium management portal.",
};

export default function ResetPasswordPage() {
  return <PasswordSetupForm mode="admin-reset" />;
}

