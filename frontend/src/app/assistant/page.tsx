/**
 * `/assistant` — the AI panel's route.
 *
 * A route of its own rather than a change to the team's `page.tsx`: this branch adds
 * only new files under `src/`, so merging the AI work into the frontend is a
 * fast-forward rather than a conflict in someone else's layout. When the team's shell
 * exists, `<AssistantPanel />` moves into it and this file goes away.
 */

import type { Metadata } from "next";

import { AssistantPanel } from "@/components/assistant/AssistantPanel";

export const metadata: Metadata = {
  title: "Gym assistant",
  description: "Ask about members, revenue, attendance and feedback.",
};

export default function AssistantPage() {
  return <AssistantPanel />;
}
