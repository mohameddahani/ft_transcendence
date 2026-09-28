import DocumentManager from "@/components/assistant/DocumentManager";

export const metadata = { title: "Gym documents" };

export default function DocumentsPage() {
  return (
    <main className="flex flex-1 p-4">
      <DocumentManager />
    </main>
  );
}
