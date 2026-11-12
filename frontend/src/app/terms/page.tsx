import type { Metadata } from "next";
import LegalView from "@/components/legal/LegalView";

export const metadata: Metadata = {
  title: "Terms & Conditions | Sportium",
  description:
    "Sportium Terms and Conditions of service for administrators, staff, and members.",
};

export default function TermsPage() {
  return <LegalView initialTab="terms" />;
}

