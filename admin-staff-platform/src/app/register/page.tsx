import { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "GymFlow Admin Sign Up",
  description: "Configure your dashboard and scale your fitness brand.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
