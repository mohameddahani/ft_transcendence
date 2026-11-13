import type { Metadata } from "next";
import EmailChangeView from "@/components/auth/EmailChangeView";

export const metadata: Metadata = {
  title: "Confirm Admin Email Change | Sportium",
  description: "Confirm and activate your new administrator email address for Sportium.",
};

export default function AdminEmailChangePage() {
  return <EmailChangeView role="admin" />;
}

