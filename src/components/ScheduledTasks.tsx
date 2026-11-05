"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { taskMinutes } from "@/lib/daily-plan";
import { parseLocalDate } from "@/lib/goal-data";
export function ScheduledTasks({ date }: { date?: string }) {
  const tasks = useStore((s) => s.tasks),
    plans = useStore((s) => s.plans),
    toggle = useStore((s) => s.toggleTask),
    remove = useStore((s) => s.unscheduleTask);
  const visible = tasks
    .filter((t) => !date || t.date === date)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!visible.length) return null;
  const days = [...new Set(visible.map((t) => t.date))];
  return (
    <section
      aria-label="目标日程"
      className="rounded-xl border p-5 mb-6 bg-background space-y-5"
    >
      <h2 className="font-semibold">
        每日行动{" "}
        <span className="text-sm font-normal text-muted-foreground">
          {visible.filter((t) => t.done).length}/{visible.length} 已完成 ·{" "}
          {days.length} 天
        </span>
      </h2>
      {days.map((day) => {
        const daily = visible.filter((t) => t.date === day),
          total = daily.reduce((n, t) => n + taskMinutes(t, plans).minutes, 0);
        return (
          <section
            key={day}
            aria-label={`日程 ${day}`}
            className="border-t pt-4 space-y-3"
          >
            <h3 className="text-sm font-semibold">
              {day} · 星期
              {
                ["日", "一", "二", "三", "四", "五", "六"][
                  parseLocalDate(day).getDay()
                ]
              }
              <span className="ml-3 font-normal text-muted-foreground">
                {daily.length} 个行动 · {total} 分钟
                {daily.some((t) => taskMinutes(t, plans).estimated)
                  ? "（含估算）"
                  : ""}
              </span>
            </h3>
            {daily.map((task) => {
              const plan = plans.find((p) => p.id === task.planId),
                phase = plan?.phases.find((p) =>
                  p.steps.some((s) => s.id === task.stepId),
                ),
                step = phase?.steps.find((s) => s.id === task.stepId),
                title = task.title || step?.title || "未命名行动";
              return (
                <div key={task.id} className="flex items-start gap-3 text-sm">
                  <input
                    aria-label={`完成 ${title}`}
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggle(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={
                        task.done
                          ? "line-through text-muted-foreground"
                          : "font-medium"
                      }
                    >
                      {title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Link
                        href={`/?goal=${task.planId}`}
                        className="underline"
                      >
                        {plan?.goal}
                      </Link>{" "}
                      · {phase?.title} ·{" "}
                      {task.minutes
                        ? `${task.minutes} 分钟`
                        : step?.estimatedDuration}
                    </p>
                    {task.sourcePath && <p className="text-xs text-muted-foreground mt-1">{task.sourcePath.join(" → ")}</p>}
                    {task.acceptance && <p className="text-xs mt-2">完成标准：{task.acceptance}</p>}
                    {!!task.dependsOn?.length && <p className="text-xs text-muted-foreground mt-1">前置：{task.dependsOn.map((id) => tasks.find((t) => t.id === id)?.title || "已移除的行动").join("、")}</p>}
                    {task.description && (
                      <p className="text-xs leading-relaxed mt-2 whitespace-pre-wrap text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(task.id)}
                    aria-label={`移除日程 ${title}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    移除
                  </button>
                </div>
              );
            })}
          </section>
        );
      })}
    </section>
  );
}
