import type { Metadata } from "next";
import MemberLoginForm from "@/components/auth/MemberLoginForm";

export const metadata: Metadata = {
  title: "Member Sign In | GymFlow",
  description:
    "Sign in to the GymFlow Member Portal to access your active memberships, QR check-in pass, attendance history, and facility hours.",
};

export default function MemberLoginPage() {
  return <MemberLoginForm />;
}
