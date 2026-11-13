import type { Metadata } from "next";
import TermsOfServiceView from "@/components/legal/TermsOfServiceView";

export const metadata: Metadata = {
  title: "Terms of Service | Sportium",
  description:
    "Sportium Terms of Service, contractual conditions, and user responsibilities.",
};

export default function TermsPage() {
  return <TermsOfServiceView />;
}
