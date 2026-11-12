import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Administrator Sign In | Sportium",
  description:
    "Sign in to the Sportium Administrator Portal to manage club operations, subscriptions, staff, and analytics.",
};

export default function AdminLoginPage() {
  return <LoginForm />;
}
