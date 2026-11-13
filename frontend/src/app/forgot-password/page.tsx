import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | Sportium Administrator",
  description: "Recover your administrator account credentials for the Sportium platform.",
};

export default function AdminForgotPasswordPage() {
  return <ForgotPasswordForm role="admin" />;
}
