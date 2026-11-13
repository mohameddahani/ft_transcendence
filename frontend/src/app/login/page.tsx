import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in | Sportium",
  description: "Sign in to Sportium to run your club: members, plans, payments, check-ins and the AI assistant.",
};

export default function LoginPage() {
  return <LoginForm />;
}
