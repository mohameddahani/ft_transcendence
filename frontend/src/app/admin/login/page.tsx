import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Administrator Sign In | GymFlow",
  description:
    "Sign in to the GymFlow Administrator Portal to manage club operations, subscriptions, staff, and analytics.",
};

export default function AdminLoginPage() {
  return <LoginForm />;
}
