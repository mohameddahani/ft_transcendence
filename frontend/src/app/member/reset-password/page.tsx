import type { Metadata } from "next";
import PasswordSetupForm from "@/components/auth/PasswordSetupForm";

export const metadata: Metadata = {
  title: "Reset Member Password | Sportium Member Portal",
  description: "Reset your Sportium member password to restore access to your profile.",
};

export default function MemberResetPasswordAliasPage() {
  return <PasswordSetupForm mode="member-reset" />;
}

