import type { Metadata } from "next";
import MemberLoginForm from "@/components/auth/MemberLoginForm";

export const metadata: Metadata = {
  title: "Member sign in | Sportium",
  description:
    "Sign in to your Sportium member portal: your memberships, QR check-in pass, visit booking, attendance history and opening hours.",
};

export default function MemberLoginPage() {
  return <MemberLoginForm />;
}
