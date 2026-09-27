import type { Metadata } from "next";
import OwnerProfileView from "@/components/profile/OwnerProfileView";

export const metadata: Metadata = {
  title: "Super Admin Portal | Owner Profile",
  description: "Manage your personal profile credentials, contact information, and platform identity.",
};

export default function ProfilePage() {
  return <OwnerProfileView />;
}

