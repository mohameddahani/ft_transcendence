import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | GymFlow Administrator",
  description: "Recover your administrator account credentials for the GymFlow management platform.",
};

export default function AdminForgotPasswordPage() {
  return <ForgotPasswordForm role="admin" />;
}

