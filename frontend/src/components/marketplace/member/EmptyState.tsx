import type { ReactNode } from "react";
import { Package } from "lucide-react";

export function EmptyState({
  title,
  body,
  compact = false,
  icon,
  action,
}: {
  title: string;
  body: string;
  compact?: boolean;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-toota-inner px-6 text-center text-toota-muted transition-colors ${
        compact ? "py-10" : "py-16"
      }`}
    >
      <div className="grid size-12 place-items-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-2xs">
        {icon ?? <Package className="size-6 text-zinc-500 dark:text-zinc-400" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        <p className="max-w-md text-xs leading-relaxed text-toota-muted">
          {body}
        </p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
