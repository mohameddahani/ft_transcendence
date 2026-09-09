/**
 * What the assistant is doing, in words a gym owner recognises.
 *
 * This component is the reason the service emits `tool` events at all. A tool round
 * plus a model call is several seconds, and a spinner during those seconds says only
 * "wait"; "checking who hasn't been in" says the answer is being looked up rather
 * than made up -- which is exactly the doubt an assistant over a database has to
 * answer.
 */

import type { ToolRun } from "@/lib/assistant/types";

const PHRASES: Record<string, string> = {
  get_gym_overview: "Pulling up the gym's numbers",
  search_members: "Searching members",
  get_member_detail: "Opening a member's record",
  list_expiring_memberships: "Checking memberships that are running out",
  list_inactive_members: "Checking who hasn't been in",
  get_revenue: "Adding up revenue",
  get_attendance_stats: "Looking at attendance",
  list_recent_feedback: "Reading recent feedback",
  get_my_membership: "Checking your membership",
  get_my_payments: "Checking your payments",
  get_my_attendance: "Checking your visits",
};

/** An unknown name still reads as a sentence: tools are added every phase, and a
 *  raw identifier in front of an evaluator looks like a bug. */
function phrase(name: string): string {
  return PHRASES[name] ?? name.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function ToolActivity({ runs }: { runs: ToolRun[] }) {
  if (runs.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1" aria-label="Assistant activity">
      {runs.map((run, index) => (
        <li
          key={`${run.name}-${index}`}
          className="flex items-center gap-2 text-xs text-black/55 dark:text-white/55"
        >
          <span aria-hidden="true" className="inline-block w-3 text-center">
            {run.status === "running" ? "◦" : run.status === "done" ? "✓" : "!"}
          </span>
          <span className={run.status === "error" ? "text-red-600 dark:text-red-400" : undefined}>
            {phrase(run.name)}
            {run.status === "running" ? "…" : null}
            {run.status === "error" ? " — could not complete" : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
