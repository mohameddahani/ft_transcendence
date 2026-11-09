import type { Metadata } from "next";
import LegalView from "@/components/legal/LegalView";

export const metadata: Metadata = {
  title: "Privacy Policy | GymFlow",
  description:
    "GymFlow Privacy Policy, data collection standards, and user protection rights.",
};

export default function PrivacyPage() {
  return <LegalView initialTab="privacy" />;
}

