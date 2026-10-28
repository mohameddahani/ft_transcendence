import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | GymFlow",
  description: "Sign in to access your enterprise dashboard and manage your fitness brand.",
};

export default function LoginPage() {
  return <LoginForm />;
}
