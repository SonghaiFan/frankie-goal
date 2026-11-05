"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { resolveDecomposition } from "@/lib/decomposition";
import { useRouter } from "next/navigation";
import type { PlanResponse } from "@/features/goals/types";
import { useStore } from "@/lib/store";
import { localDate, parseLocalDate } from "@/lib/goal-data";
import {
  remainingStepIds,
  validateDailyDraft,
  taskMinutes,
  validateSettings,
  type DailyDraft,
  type DailySettings,
} from "@/lib/daily-plan";
import { Button } from "./ui/button";
import { toast } from "sonner";
const WEEKDAYS = [
  { value: 1, label: "一" },
  { value: 2, label: "二" },
  { value: 3, label: "三" },
  { value: 4, label: "四" },
  { value: 5, label: "五" },
  { value: 6, label: "六" },
  { value: 0, label: "日" },
];
function initialSettings(): DailySettings {
  const today = new Date(),
    end = new Date(today);
  end.setDate(end.getDate() + 13);
  return {
    startDate: localDate(today),
    endDate: localDate(end),
    mode: "rolling",
    dailyMinutes: 60,
    taskMinutes: 30,
    weekdays: [1, 2, 3, 4, 5, 6, 0],
  };
}
export function DailyPlanBuilder({ plan }: { plan: PlanResponse }) {
  const pending = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      pending.current?.abort();
    },
    [],
  );
  const router = useRouter(),
    tasks = useStore((s) => s.tasks),
    plans = useStore((s) => s.plans),
    apply = useStore((s) => s.applyDailyPlan);
  const [settings, setSettings] = useState<DailySettings>(
      () => plan.planning ? { ...plan.planning, mode: plan.planning.mode ?? "rolling", taskMinutes: plan.planning.taskMinutes ?? Math.min(30, plan.planning.dailyMinutes) } : initialSettings(),
    ),
    [draft, setDraft] = useState<DailyDraft | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const decomposition = useMemo(() => {
    try { return resolveDecomposition(plan, plans); } catch { return null; }
  }, [plan, plans]);
  const existing = tasks.filter((t) => t.planId === plan.id),
    completed = existing.filter((t) => t.done),
    remaining = remainingStepIds(plan, tasks);
  const unknown = tasks.filter(
    (t) =>
      (t.planId !== plan.id || t.done) &&
      t.date >= settings.startDate &&
      t.date <= settings.endDate &&
      taskMinutes(t, plans).estimated,
  ).length;
  const validationError = useMemo(() => {
    if (!draft) return "";
    try {
      validateDailyDraft(plan, draft, tasks, plans);
      return "";
    } catch (e) {
      return (e as Error).message;
    }
  }, [plan, draft, tasks, plans]);
  function change(update: Partial<DailySettings>) {
    setSettings((s) => ({ ...s, ...update }));
    setDraft(null);
    setError("");
  }
  async function generate() {
    try {
      validateSettings(settings);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    setLoading(true);
    setError("");
    setDraft(null);
    try {
      const current = useStore.getState();
      pending.current = new AbortController();
      const response = await fetch("/api/daily-plan", {
        method: "POST",
        signal: pending.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          settings,
          plans: current.plans,
          tasks: current.tasks,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "每日计划生成失败");
      validateDailyDraft(
        plan,
        data.draft,
        useStore.getState().tasks,
        useStore.getState().plans,
      );
      setDraft(data.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "每日计划生成失败");
    } finally {
      setLoading(false);
    }
  }
  const days = draft
    ? [...new Set(draft.actions.map((a) => a.date))].sort()
    : [];
  function edit(index: number, update: Partial<DailyDraft["actions"][number]>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            actions: d.actions.map((a, i) =>
              i === index ? { ...a, ...update } : a,
            ),
          }
        : null,
    );
  }
  return (
    <section
      aria-label="生成每日计划"
      className="rounded-2xl border border-ink/20 bg-white/80 p-5 md:p-6 space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            下一步 · 从目标到日历
          </p>
          <h3 className="text-xl font-semibold">把这份目标变成每日计划</h3>
          <p className="text-sm text-muted-foreground mt-2">
            沿用目标的拆解逻辑，复用已有子任务，细化到可验收的行动后再排期。
          </p>
        </div>
        {existing.length > 0 && (
          <span className="text-xs rounded-full bg-ink/5 px-3 py-2">
            已安排 {existing.length} 项 · 已完成 {completed.length} 项
          </span>
        )}
      </div>
      {decomposition && (
        <p className="text-xs text-muted-foreground">
          当前拆解路径含 {decomposition.sources.length} 个末级任务，其中 {decomposition.sources.filter((s) => s.planId !== plan.id).length} 个来自已有子拆解。
          {decomposition.warnings.join(" ")}
        </p>
      )}
      <fieldset disabled={loading} className="space-y-4">
        <label className="block text-sm space-y-2">规划方式
          <select aria-label="规划方式" value={settings.mode ?? "rolling"} onChange={(e) => change({ mode: e.target.value as "rolling" | "strict" })} className="block w-full border rounded-lg p-2 bg-transparent">
            <option value="rolling">滚动阶段规划 · 先做本期能做的</option>
            <option value="strict">严格截止日期 · 本期完成全部目标</option>
          </select>
        </label>
        <p className="text-xs text-muted-foreground">先试行，不需要一次安排完所有事情。没做完的工作会保留，已经完成的不会清零。</p>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">可选：补充现状与想达到的结果，不清楚也可以先开始</summary>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <label>我现在的情况<textarea aria-label="当前情况" maxLength={2000} value={settings.currentSituation || ""} onChange={(e) => change({currentSituation:e.target.value})} placeholder="例如：还没测过水平；每天能稳定专注半小时" className="block w-full border rounded-lg p-2 bg-transparent mt-1" /></label>
            <label>怎样算有进展<textarea aria-label="目标验收标准" maxLength={2000} value={settings.successCriteria || ""} onChange={(e) => change({successCriteria:e.target.value})} placeholder="例如：先完成一次诊断，找出两个薄弱点" className="block w-full border rounded-lg p-2 bg-transparent mt-1" /></label>
          </div>
        </details>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-sm space-y-1.5 block">
            计划从哪天开始
            <input
              aria-label="每日计划开始日期"
              type="date"
              value={settings.startDate}
              onChange={(e) => change({ startDate: e.target.value })}
              className="block w-full border rounded-lg bg-transparent p-2"
            />
          </label>
          <label className="text-sm space-y-1.5 block">
            {settings.mode === "strict" ? "全部完成的截止日期" : "这次先安排到哪天"}
            <input
              aria-label="每日计划结束日期"
              type="date"
              value={settings.endDate}
              onChange={(e) => change({ endDate: e.target.value })}
              className="block w-full border rounded-lg bg-transparent p-2"
            />
          </label>
          <label className="text-sm space-y-1.5 block">
            每天可投入（分钟）
            <input
              aria-label="每天可投入分钟"
              type="number"
              min={5}
              max={480}
              step={5}
              value={settings.dailyMinutes}
              onChange={(e) => change({ dailyMinutes: Number(e.target.value), taskMinutes: Math.min(settings.taskMinutes ?? 30, Math.max(5, Number(e.target.value))) })}
              className="block w-full border rounded-lg bg-transparent p-2"
            />
          </label>
          <label className="text-sm space-y-1.5 block">
            任务颗粒度（分钟）
            <input
              aria-label="任务颗粒度分钟"
              aria-describedby="task-granularity-help"
              type="number"
              min={5}
              max={settings.dailyMinutes}
              step={5}
              value={settings.taskMinutes ?? 30}
              onChange={(e) => change({ taskMinutes: Number(e.target.value) })}
              className="block w-full border rounded-lg bg-transparent p-2"
            />
          </label>
        </div>
        <p id="task-granularity-help" className="text-xs text-muted-foreground">
          拆到多细：每个行动不超过此时长，并有明确产出。较短的完整行动可以保留，不会为了凑时间拉长任务。
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm mr-2">可安排的星期</span>
          {WEEKDAYS.map((day) => (
            <label
              key={day.value}
              className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-sm ${settings.weekdays.includes(day.value) ? "bg-ink text-paper" : "text-muted-foreground"}`}
            >
              <input
                aria-label={`安排星期${day.label}`}
                type="checkbox"
                className="sr-only"
                checked={settings.weekdays.includes(day.value)}
                onChange={(e) =>
                  change({
                    weekdays: e.target.checked
                      ? [...settings.weekdays, day.value]
                      : settings.weekdays.filter((d) => d !== day.value),
                  })
                }
              />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-muted-foreground">
        每天的额度会扣除其他目标和已完成行动的用时。重新生成将替换本目标尚未完成的日程，保留已完成项。
        {plan.phases.some((p) => p.isRecurring) &&
          " 循环行动仅安排在本次日期范围内。"}
      </p>
      {unknown > 0 && (
        <p className="text-xs text-amber-800">
          有 {unknown} 条已有日程缺少可识别的分钟估时，本次暂按每条 30
          分钟预留。
        </p>
      )}
      <div className="flex flex-wrap gap-3 items-center">
        <Button
          onClick={() => void generate()}
          disabled={loading || !remaining.length}
        >
          {loading
            ? "正在细化行动并安排日期…"
            : draft
              ? "重新生成预览"
              : existing.length
                ? "重新规划每日行动"
                : "生成每日计划"}
        </Button>
        {!remaining.length && (
          <span className="text-sm text-muted-foreground">
            {plan.phases.some((p) => p.steps.length)
              ? "所有行动都已完成。"
              : "先添加行动，或使用 AI 拆解目标。"}
          </span>
        )}
        {loading && (
          <span role="status" className="text-xs text-muted-foreground">
            正在检查步骤、每日容量和已有日程，通常需要几十秒。
          </span>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="text-sm text-red-700 border border-red-200 rounded-lg p-3"
        >
          {error}
        </p>
      )}
      {!draft && plan.horizon && (
        <div className="rounded-lg bg-ink/5 p-3 text-sm space-y-2">
          <p>本期预期成果（待完成后验收）：{plan.horizon.outcome}</p>
          <p>待安排工作：{plan.horizon.remainingWork.length} 项 · 建议复盘：{plan.horizon.reviewDate}</p>
          {!!plan.horizon.remainingWork.length && <details><summary className="cursor-pointer">查看保留的工作</summary><ul className="space-y-2 mt-2">{plan.horizon.remainingWork.map((w,i)=><li key={i}>{w.title}：{w.reason}</li>)}</ul></details>}
          <a href="/plan" className="underline">先开始一个行动</a>
        </div>
      )}
      {draft && (
        <div className="space-y-4 border-t pt-5">
          <div>
            <h4 className="font-semibold">每日计划预览</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {draft.actions.length} 个行动 · {days.length} 天 · 共{" "}
              {draft.actions.reduce((n, a) => n + a.minutes, 0)}{" "}
              分钟。可调整下方内容，应用后才会写入日程。
            </p>
          </div>
          {draft.horizon && (
            <div className="rounded-lg bg-ink/5 p-4 space-y-3 text-sm">
              <p className="font-medium">本期预期成果 · 完成行动后再验收</p>
              <p>{draft.horizon.outcome}</p>
              <p>本期可用 {draft.capacityMinutes} 分钟 · 已安排 {draft.actions.reduce((n, a) => n + a.minutes, 0)} 分钟 · 建议 {draft.horizon.reviewDate} 看看实际进展再调整</p>
              {!!draft.horizon.remainingWork.length && <details>
                <summary className="cursor-pointer">以后再安排 · {draft.horizon.remainingWork.length} 项（仍保留在目标中）</summary>
                <ul className="mt-2 space-y-2">{draft.horizon.remainingWork.map((w, i) => <li key={i}><strong>{w.title}</strong>：{w.reason}（{w.estimatedMinutes === null ? "需要实践后估时" : `估计还需 ${w.estimatedMinutes} 分钟，待验证`}）</li>)}</ul>
              </details>}
              {!draft.actions.length && <p>本期没有可安排的行动。调整日期或可用时间即可，原计划和完成记录仍然保留。</p>}
            </div>
          )}
          {draft.assumptions.length > 0 && (
            <details className="text-sm rounded-lg bg-ink/5 p-3">
              <summary className="cursor-pointer">
                估时与安排依据 · {draft.assumptions.length} 条
              </summary>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {draft.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </details>
          )}
          {days.map((date) => (
            <section
              key={date}
              aria-label={`预览 ${date}`}
              className="rounded-xl border p-4 space-y-3"
            >
              <h5 className="font-semibold text-sm">
                {date}{" "}
                <span className="font-normal text-muted-foreground ml-2">
                  {
                    ["日", "一", "二", "三", "四", "五", "六"][
                      parseLocalDate(date).getDay()
                    ]
                  }{" "}
                  ·{" "}
                  {draft.actions
                    .filter((a) => a.date === date)
                    .reduce((n, a) => n + a.minutes, 0)}{" "}
                  分钟
                </span>
              </h5>
              {draft.actions.map((action, index) =>
                action.date !== date ? null : (
                  <div key={index} className="border-t pt-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <input
                        aria-label={`行动 ${index + 1} 标题`}
                        value={action.title}
                        onChange={(e) => edit(index, { title: e.target.value })}
                        className="flex-1 min-w-40 text-sm bg-transparent border rounded p-2"
                      />
                      <input
                        aria-label={`行动 ${index + 1} 日期`}
                        type="date"
                        value={action.date}
                        onChange={(e) => {
                          if (e.target.value)
                            edit(index, { date: e.target.value });
                        }}
                        className="text-sm bg-transparent border rounded p-2"
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          aria-label={`行动 ${index + 1} 分钟`}
                          type="number"
                          min={1}
                          max={draft.settings.taskMinutes ?? draft.settings.dailyMinutes}
                          value={action.minutes}
                          onChange={(e) =>
                            edit(index, { minutes: Number(e.target.value) })
                          }
                          className="w-16 text-sm bg-transparent border rounded p-2"
                        />
                        分钟
                      </label>
                    </div>
                    <textarea
                      aria-label={`行动 ${index + 1} 说明`}
                      value={action.description}
                      onChange={(e) =>
                        edit(index, { description: e.target.value })
                      }
                      rows={2}
                      className="w-full text-sm bg-transparent border rounded p-2"
                    />
                    {action.acceptance !== undefined && (
                      <label className="block text-xs text-muted-foreground space-y-1">
                        完成标准
                        <textarea aria-label={`行动 ${index + 1} 完成标准`} value={action.acceptance}
                          onChange={(e) => edit(index, { acceptance: e.target.value })}
                          className="block w-full text-sm bg-transparent border rounded p-2" rows={2} />
                      </label>
                    )}
                    {!!action.dependsOn?.length && (
                      <p className="text-xs text-muted-foreground">前置行动：{action.dependsOn.map((id) => draft.actions.find((a) => a.actionId === id)?.title).join("、")}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {action.sourceKey && decomposition?.sources.find((s) => s.key === action.sourceKey)?.path.join(" → ")}
                      {!action.sourceKey && "来自："}
                      {
                        !action.sourceKey && plan.phases
                          .flatMap((p) => p.steps)
                          .find((s) => s.id === action.stepId)?.title
                      }
                    </p>
                  </div>
                ),
              )}
            </section>
          ))}
          {validationError && (
            <p role="alert" className="text-sm text-red-700">
              {validationError}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!!validationError || loading || !draft.actions.length}
              onClick={() => {
                try {
                  apply(plan.id, draft);
                  toast.success("每日计划已加入日程");
                  router.push("/plan");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              先试行这份计划 · {draft.actions.length} 个行动
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              收起预览
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
