import type { Metadata } from "next";
import PasswordSetupForm from "@/components/auth/PasswordSetupForm";

export const metadata: Metadata = {
  title: "Reset Staff Password | GymFlow Staff Portal",
  description: "Reset your GymFlow operational staff credentials to resume terminal access.",
};

export default function StaffResetPasswordPage() {
  return <PasswordSetupForm mode="staff-reset" />;
}

