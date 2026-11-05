import type { ScheduledTask } from "./goal-data";
// Choose only work whose start date and dependencies allow it. Never label a missed day as failure.
export function nextAction(tasks: ScheduledTask[], today: string) {
  return tasks.filter((t) => !t.done && t.date <= today &&
    (!t.dependsOn?.length || t.dependsOn.every((id) => tasks.some((p) => p.id === id && p.done))))
    .sort((a, b) => Number(Boolean(b.startedAt)) - Number(Boolean(a.startedAt)) || a.date.localeCompare(b.date))[0];
}
