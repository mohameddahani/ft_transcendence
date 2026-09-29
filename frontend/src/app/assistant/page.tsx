import AssistantPanel from "@/components/assistant/AssistantPanel";

export const metadata = { title: "Assistant" };

export default function AssistantPage() {
  return (
    <main className="flex flex-1 p-4">
      <AssistantPanel />
    </main>
  );
}
