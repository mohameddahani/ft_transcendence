import type { Metadata } from "next";
import PasswordSetupForm from "@/components/auth/PasswordSetupForm";

export const metadata: Metadata = {
  title: "Reset Member Password | GymFlow Member Portal",
  description: "Reset your GymFlow member password to restore access to your profile.",
};

export default function MemberResetPasswordAliasPage() {
  return <PasswordSetupForm mode="member-reset" />;
}

