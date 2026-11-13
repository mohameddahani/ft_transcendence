import type { Metadata } from "next";
import PlansDashboard from "@/components/plans/PlansDashboard";

export const metadata: Metadata = {
  title: "Super Admin Portal | Platform Plans",
  description: "Configure subscription tiers and member thresholds for SaaS clients.",
};

export default function PlansPage() {
  return <PlansDashboard />;
}

