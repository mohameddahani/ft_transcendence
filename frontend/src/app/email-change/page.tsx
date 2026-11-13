import type { Metadata } from "next";
import { Suspense } from "react";
import EmailChangeView from "@/components/auth/EmailChangeView";

export const metadata: Metadata = {
  title: "Confirm Email Change | Sportium",
  description: "Confirm and activate your new email address for your Sportium account.",
};

export default function EmailChangePage() {
  return (
    <Suspense>
      <EmailChangeView />
    </Suspense>
  );
}
