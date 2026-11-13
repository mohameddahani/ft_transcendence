import { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register your club | Sportium",
  description: "Create your Sportium admin account and bring your club into one place: members, plans, payments and check-ins."
};

export default function RegisterPage() {
  return <RegisterForm />;
}
