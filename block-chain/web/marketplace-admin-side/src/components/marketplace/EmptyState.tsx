import { Package } from "lucide-react";
export function EmptyState({
  title,
  body,
  compact = false,
}: {
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center text-muted-foreground ${
        compact ? "py-8" : "py-16"
      }`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted/60 text-muted-foreground">
        <Package className="size-6" />
      </div>
      <strong className="text-sm font-semibold text-foreground">{title}</strong>
      <span className="max-w-sm text-xs leading-relaxed">{body}</span>
    </div>
  );
}
