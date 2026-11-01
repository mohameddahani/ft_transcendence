import type { Metadata } from "next";
import PasswordSetupForm from "@/components/auth/PasswordSetupForm";

export const metadata: Metadata = {
  title: "Reset Password | GymFlow Administrator",
  description: "Reset your administrator credentials for GymFlow management portal.",
};

export default function ResetPasswordPage() {
  return <PasswordSetupForm mode="admin-reset" />;
}

