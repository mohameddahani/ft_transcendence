import type { Metadata } from "next";
import EmailChangeView from "@/components/auth/EmailChangeView";

export const metadata: Metadata = {
  title: "Confirm Email Change | GymFlow",
  description: "Confirm and activate your new email address for your GymFlow account.",
};

export default function EmailChangePage() {
  return <EmailChangeView />;
}