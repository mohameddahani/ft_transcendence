import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Sportium | Sports club and gym management platform",
  description:
    "Run your sports club in one place: members, plans, payments, check-ins, staff and an AI assistant.",
};

export default function Home() {
  return <Landing />;
}

