import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | GymFlow Member Portal",
  description: "Recover your gym member credentials and workouts access.",
};

export default function MemberForgotPasswordAliasPage() {
  return <ForgotPasswordForm role="member" />;
}

