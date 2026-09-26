import type { Metadata } from "next";
import SubscriptionsTable from "@/components/subscriptions/SubscriptionsTable";

export const metadata: Metadata = {
  title: "Super Admin Portal | Platform Subscriptions",
  description: "Oversee and manage enterprise-level licenses and service levels.",
};

export default function SubscriptionsPage() {
  return <SubscriptionsTable />;
}

