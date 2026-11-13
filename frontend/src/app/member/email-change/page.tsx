import type { Metadata } from "next";
import EmailChangeView from "@/components/auth/EmailChangeView";

export const metadata: Metadata = {
  title: "Confirm Member Email Change | Sportium",
  description: "Confirm and activate your new member email address for Sportium.",
};

export default function MemberEmailChangePage() {
  return <EmailChangeView role="member" />;
}

