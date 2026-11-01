import type { Metadata } from "next";
import PasswordSetupForm from "@/components/auth/PasswordSetupForm";

export const metadata: Metadata = {
  title: "Set Member Password | GymFlow Member Portal",
  description: "Establish your member password to access workouts, digital passes, and classes.",
};

export default function MemberSetPasswordAliasPage() {
  return <PasswordSetupForm mode="member-set" />;
}

