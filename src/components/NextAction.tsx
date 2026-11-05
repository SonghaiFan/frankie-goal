"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { localDate } from "@/lib/goal-data";
import { nextAction } from "@/lib/next-action";
import { Button } from "./ui/button";

export function NextAction() {
  const tasks = useStore((s) => s.tasks), plans = useStore((s) => s.plans);
  const start = useStore((s) => s.startTask), toggle = useStore((s) => s.toggleTask);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const task = nextAction(tasks, localDate(new Date()));
  const focused = task && focusedId === task.id;
  if (!tasks.length) return <section className="rounded-2xl border bg-white/80 p-5 space-y-3"><h2 className="text-xl font-semibold">先找到一个能开始的小行动</h2><p className="text-sm text-muted-foreground">不需要先规划好全部时间。写下一个目标，先试行一小段。</p><Link href="/" className="underline text-sm">选择一个目标</Link></section>;
  if (!task) return <section className="rounded-2xl border bg-white/80 p-5 space-y-2"><h2 className="text-xl font-semibold">现在可以停一停</h2><p className="text-sm text-muted-foreground">{tasks.every((t) => t.done) ? "本期安排的行动已经做完。可以休息，待安排的目标工作会保留，准备好后再规划下一期。" : "现在没有已到开始日期且前置条件满足的行动。可以查看后续安排，不必提前赶进度。"}</p><Link href="/" className="underline text-sm">需要时再调整目标</Link></section>;
  const plan = plans.find((p) => p.id === task.planId);
  const title = task.title || plan?.phases.flatMap((p) => p.steps).find((s) => s.id === task.stepId)?.title || "下一步";
  return <section aria-label="今天先做这一件" className="rounded-2xl border border-ink/20 bg-white/90 p-5 md:p-7 space-y-4">
    <p className="text-xs text-muted-foreground">{focused ? "这一会儿，只做这一件" : "今天先做这一件"}</p>
    <h2 className="text-xl font-semibold">{title}</h2>
    <p className="text-sm text-muted-foreground">{task.startedAt ? "你已经开始过，可以从这里接着做。" : "先投入 5 分钟就好，不必一次完成。"} 间断不会清空已经完成的进度。</p>
    {focused ? <div className="space-y-3 text-sm"><p>{task.description || "先打开需要的材料，做出一个小的实际动作。"}</p>{task.acceptance && <p>完成时检查：{task.acceptance}</p>}<p className="text-muted-foreground">做一点后，你可以继续，也可以停下；开始不等于完成，不会自动勾选任务。</p></div> : <details className="text-sm"><summary className="cursor-pointer">查看做法与完成标准</summary><p className="mt-2">{task.description}</p><p>{task.acceptance}</p></details>}
    {paused && <p role="status" className="text-sm">这次先到这里。开始记录已保存，下次可以接着做。</p>}
    <div className="flex flex-wrap gap-3">
      {!focused ? <Button onClick={() => { start(task.id); setFocusedId(task.id); setPaused(false); }}>{task.startedAt ? "再做 5 分钟" : "先做 5 分钟"}</Button> : <>
        <Button onClick={() => { toggle(task.id); setFocusedId(null); setPaused(false); }}>这项已完成</Button>
        <Button variant="outline" onClick={() => { setFocusedId(null); setPaused(true); }}>今天先到这里</Button>
      </>}
      <Link className="text-sm underline self-center text-muted-foreground" href={`/?goal=${task.planId}`}>需要时再调整计划</Link>
    </div>
  </section>;
}
