import type { Metadata } from "next";
import PrivacyPolicyView from "@/components/legal/PrivacyPolicyView";

export const metadata: Metadata = {
  title: "Privacy Policy | Sportium",
  description:
    "Sportium Privacy Policy, data collection standards, and user protection rights.",
};

export default function PrivacyPage() {
  return <PrivacyPolicyView />;
}
