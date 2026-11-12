import type { Metadata } from "next";
import EmailChangeView from "@/components/auth/EmailChangeView";

export const metadata: Metadata = {
  title: "Confirm Staff Email Change | Sportium",
  description: "Confirm and activate your new staff email address for Sportium.",
};

export default function StaffsEmailChangePage() {
  return <EmailChangeView role="staff" />;
}

