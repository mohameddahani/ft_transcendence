/**
 * `/assistant/documents` — the owner's document manager (task 3.7).
 */

import type { Metadata } from "next";

import { DocumentManager } from "@/components/assistant/DocumentManager";

export const metadata: Metadata = {
  title: "Gym documents",
  description: "Upload the gym's rules and policies for the assistant to answer from.",
};

export default function DocumentsPage() {
  return <DocumentManager />;
}
