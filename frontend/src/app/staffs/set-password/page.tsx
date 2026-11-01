import type { Metadata } from "next";
import PasswordSetupForm from "@/components/auth/PasswordSetupForm";

export const metadata: Metadata = {
  title: "Set Staff Password | GymFlow Staff Portal",
  description: "Establish your staff credentials to access desk terminals and shift management.",
};

export default function StaffSetPasswordPage() {
  return <PasswordSetupForm mode="staff-set" />;
}

