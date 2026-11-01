import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | GymFlow Staff Portal",
  description: "Recover your staff portal account access and credentials.",
};

export default function StaffForgotPasswordPage() {
  return <ForgotPasswordForm role="staff" />;
}

