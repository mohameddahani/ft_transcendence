import type { Metadata } from "next";
import PasswordSetupForm from "@/components/auth/PasswordSetupForm";

export const metadata: Metadata = {
  title: "Reset Staff Password | Sportium Staff Portal",
  description: "Reset your Sportium operational staff credentials to resume terminal access.",
};

export default function StaffResetPasswordAliasPage() {
  return <PasswordSetupForm mode="staff-reset" />;
}

