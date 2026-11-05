"use client";
import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { localDate } from "@/lib/goal-data";
import { generatePlan } from "@/features/goals/client";
import {
  Difficulty,
  TaskType,
  type PlanResponse,
  type PlanStep,
} from "@/features/goals/types";
import { AppNavigation } from "@/components/AppNavigation";
import { NextAction } from "@/components/NextAction";
import { DailyPlanBuilder } from "@/components/DailyPlanBuilder";
import { DataControls } from "@/components/DataControls";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
const PlanDisplay = dynamic(
  () => import("@/features/goals/components/PlanDisplay"),
  { ssr: false, loading: () => <p>正在加载目标…</p> },
);
function Goals() {
  const plans = useStore((s) => s.plans),
    tasks = useStore((s) => s.tasks),
    language = useStore((s) => s.language),
    setLanguage = useStore((s) => s.setLanguage),
    addPlan = useStore((s) => s.addPlan),
    deletePlan = useStore((s) => s.deletePlan),
    schedule = useStore((s) => s.scheduleTask);
  const [mounted, setMounted] = useState(false),
    [activeId, setActiveId] = useState<string | null>(null),
    [draft, setDraft] = useState(""),
    [loading, setLoading] = useState(false),
    [partial, setPartial] = useState<PlanResponse | null>(null),
    [error, setError] = useState(""),
    [date, setDate] = useState(localDate(new Date())),
    [decomposing, setDecomposing] = useState<string | null>(null);
  const params = useSearchParams();
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (params.get("goal")) setActiveId(params.get("goal"));
  }, [params]);
  const saved = plans.find((p) => p.id === activeId),
    plan = partial || saved;
  async function generate(step?: PlanStep) {
    const goal = step?.title || draft.trim();
    if (!goal || loading) return;
    setError("");
    setLoading(true);
    setDecomposing(step?.title || null);
    const parent = step ? saved : undefined;
    try {
      const result = await generatePlan(
        goal,
        language,
        setPartial,
        parent && step
          ? {
              parentContext: parent.goal,
              parentTaskContext: {
                duration: step.estimatedDuration,
                description: step.description,
                isRecurring: parent.phases.some(
                  (p) => p.isRecurring && p.steps.some((s) => s.id === step.id),
                ),
              },
            }
          : undefined,
      );
      if (parent && step) { result.parentId = parent.id; result.parentStepId = step.id; }
      addPlan(result);
      setActiveId(result.id);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setPartial(null);
      setLoading(false);
      setDecomposing(null);
    }
  }
  function manual() {
    if (!draft.trim() || loading) return;
    const id = crypto.randomUUID();
    addPlan({
      id,
      goal: draft.trim(),
      summary: "手动创建的目标，可添加行动并安排日期。",
      motivationalQuote: "",
      createdAt: Date.now(),
      phases: [
        {
          id: crypto.randomUUID(),
          title: "行动计划",
          description: "",
          duration: "",
          isRecurring: false,
          steps: [],
        },
      ],
    });
    setActiveId(id);
    setDraft("");
  }
  function addStep(form: FormData) {
    if (!saved) return;
    const title = String(form.get("title") || "").trim();
    if (!title) return;
    const step: PlanStep = {
      id: crypto.randomUUID(),
      title,
      description: String(form.get("description") || ""),
      estimatedDuration: String(form.get("duration") || "待估算"),
      difficulty: Difficulty.Easy,
      type: TaskType.Action,
      isBreakable: true,
    };
    const phases = saved.phases.length
      ? saved.phases
      : [
          {
            id: crypto.randomUUID(),
            title: "行动计划",
            description: "",
            duration: "",
            isRecurring: false,
            steps: [],
          },
        ];
    addPlan({
      ...saved,
      phases: phases.map((p, i) =>
        i === phases.length - 1 ? { ...p, steps: [...p.steps, step] } : p,
      ),
    });
  }
  if (!mounted) return <p className="p-8">正在加载…</p>;
  return (
    <>
      <AppNavigation />
      <main className="goal-workspace min-h-screen bg-paper text-ink">
        <div className="max-w-7xl mx-auto p-5 md:p-8">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Goals → Actions → Time
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                把想做的事，变成每天的行动。
              </h1>
            </div>
            <DataControls />
          </div>
          {mounted && tasks.length > 0 && <NextAction />}
          <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-8">
            <aside className="space-y-4">
              <Button
                disabled={loading}
                variant="outline"
                className="w-full"
                onClick={() => {
                  setActiveId(null);
                  setError("");
                }}
              >
                ＋ 新目标
              </Button>
              <label className="flex justify-between items-center text-xs">
                拆解语言
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "zh" | "en")}
                  className="border rounded p-1 bg-transparent"
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </label>
              <h2 className="text-xs text-muted-foreground pt-3">
                目标归档 · {plans.length}
              </h2>
              <div className="flex lg:flex-col gap-2 overflow-auto">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className={`flex min-w-[170px] lg:min-w-0 rounded-lg border ${activeId === p.id ? "border-ink bg-white" : "border-transparent"}`}
                  >
                    <button
                      disabled={loading}
                      className="text-left flex-1 px-3 py-3 text-sm break-words"
                      onClick={() => {
                        setActiveId(p.id);
                        setError("");
                      }}
                    >
                      {p.parentId ? "↳ " : ""}
                      {p.goal}
                    </button>
                    <button
                      disabled={loading}
                      aria-label={`删除目标 ${p.goal}`}
                      className="px-2 text-muted-foreground"
                      onClick={() => {
                        if (window.confirm("删除此目标及关联日程？")) {
                          deletePlan(p.id);
                          if (p.id === activeId) setActiveId(null);
                        }
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </aside>
            <section className="min-w-0 space-y-6">
              {!plan && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void generate();
                  }}
                  className="rounded-2xl bg-white/70 border p-6 space-y-5"
                >
                  <label htmlFor="goal" className="block font-medium">
                    你的下一个目标是什么？
                  </label>
                  <textarea
                    id="goal"
                    maxLength={5000}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="例如：三个月内完成作品集，每周可以投入五小时"
                    className="w-full min-h-32 rounded-lg border bg-transparent p-4"
                    required
                    disabled={loading}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button disabled={loading || !draft.trim()} type="submit">
                      {loading ? "正在拆解…" : "AI 拆解目标"}
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={loading || !draft.trim()}
                      onClick={manual}
                    >
                      手动创建
                    </Button>
                    <Link
                      href="/plan"
                      className="text-sm self-center underline"
                    >
                      直接规划时间
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI 拆解需要配置 OpenRouter；也可手动创建目标和行动。
                  </p>
                </form>
              )}
              {error && (
                <p
                  role="alert"
                  className="p-4 border border-red-200 rounded-lg text-sm text-red-700"
                >
                  {error}
                </p>
              )}
              {plan && (
                <>
                  {saved?.parentId && (
                    <button
                      disabled={loading}
                      className="text-sm underline"
                      onClick={() => setActiveId(saved.parentId!)}
                    >
                      ← 返回上层目标
                    </button>
                  )}
                  {saved?.parentId && !loading && (
                    <label className="block text-sm space-y-2">
                      这份子拆解对应的上层步骤
                      <select aria-label="关联上层步骤" value={saved.parentStepId || ""}
                        onChange={(e) => addPlan({ ...saved, parentStepId: e.target.value || undefined })}
                        className="block w-full rounded-lg border bg-white p-2">
                        <option value="">请选择，关联后上层计划才能复用</option>
                        {plans.find((p) => p.id === saved.parentId)?.phases.flatMap((p) => p.steps).map((step) => (
                          <option key={step.id} value={step.id} disabled={plans.some((p) => p.id !== saved.id && p.parentId === saved.parentId && p.parentStepId === step.id)}>{step.title}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <h2 className="text-3xl font-semibold">{plan.goal}</h2>
                  {!loading && saved && (
                    <DailyPlanBuilder key={saved.id} plan={saved} />
                  )}
                  <PlanDisplay
                    plan={plan}
                    language={language}
                    isStreaming={loading}
                    isDecomposing={Boolean(decomposing)}
                    decomposingTask={decomposing}
                    onBreakdown={(stepId) => {
                      const step = saved?.phases
                        .flatMap((p) => p.steps)
                        .find((s) => s.id === stepId);
                      const child = plans.find((p) => p.parentId === saved?.id && p.parentStepId === stepId);
                      if (child && !loading) setActiveId(child.id);
                      else if (step && !loading) void generate(step);
                    }}
                  />
                  {!loading && saved && (
                    <>
                      <details className="rounded-xl border bg-white/60 p-5 space-y-4">
                        <summary className="text-sm cursor-pointer text-muted-foreground">
                          手动安排单个原始步骤
                        </summary>
                        <div className="flex flex-wrap justify-between gap-3">
                          <h3 className="font-semibold">安排到日程</h3>
                          <label className="text-sm flex gap-2 items-center">
                            计划日期
                            <input
                              aria-label="计划日期"
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="border rounded px-2 py-1 bg-transparent"
                            />
                          </label>
                        </div>
                        {saved.phases
                          .flatMap((p) => p.steps)
                          .map((step) => {
                            const scheduled = tasks.find(
                              (t) =>
                                t.planId === saved.id && t.stepId === step.id,
                            );
                            const hasDailyActions = tasks.some(
                              (t) =>
                                t.planId === saved.id &&
                                t.stepId === step.id &&
                                t.batchId,
                            );
                            return (
                              <div
                                key={step.id}
                                className="flex flex-wrap justify-between items-center gap-3 border-t pt-3"
                              >
                                <div className="text-sm flex-1 min-w-40">
                                  <p>{step.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {step.estimatedDuration}
                                    {scheduled
                                      ? ` · ${scheduled.date} ${scheduled.done ? "已完成" : "已安排"}`
                                      : ""}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={hasDailyActions}
                                  onClick={() => {
                                    try {
                                      schedule(saved.id, step.id, date);
                                      toast.success("已加入日程");
                                    } catch (e) {
                                      toast.error((e as Error).message);
                                    }
                                  }}
                                >
                                  {hasDailyActions
                                    ? "已生成每日行动"
                                    : scheduled
                                      ? "调整日期"
                                      : "加入日程"}
                                </Button>
                              </div>
                            );
                          })}
                        <Link
                          href="/plan"
                          className="inline-block text-sm underline"
                        >
                          查看时间规划 →
                        </Link>
                      </details>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          addStep(new FormData(e.currentTarget));
                          e.currentTarget.reset();
                        }}
                        className="rounded-xl border p-5 space-y-3"
                      >
                        <h3 className="font-semibold">添加行动</h3>
                        <div className="flex flex-wrap gap-3">
                          <input
                            aria-label="行动名称"
                            name="title"
                            required
                            placeholder="行动名称"
                            className="flex-1 min-w-40 p-2 border rounded bg-white/60"
                          />
                          <input
                            aria-label="预计用时"
                            name="duration"
                            placeholder="预计用时，如 45 分钟"
                            className="p-2 border rounded bg-white/60"
                          />
                        </div>
                        <textarea
                          aria-label="行动说明"
                          name="description"
                          placeholder="行动说明（选填）"
                          className="w-full p-2 border rounded bg-white/60"
                        />
                        <Button type="submit" variant="outline">
                          添加行动
                        </Button>
                      </form>
                    </>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p>正在加载…</p>}>
      <Goals />
    </Suspense>
  );
}
