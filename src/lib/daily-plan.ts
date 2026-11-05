import { pendingSources, resolveDecomposition } from "./decomposition.ts";
import type { PlanResponse, PlanningHorizon, RemainingWork } from "../features/goals/types";
import type { ScheduledTask } from "./goal-data";
import { localDate, parseLocalDate } from "./goal-data.ts";
export type DailySettings = NonNullable<PlanResponse["planning"]>;
export interface ActionOutline {
  stepId: string;
  title: string;
  description: string;
  minutes: number;
  earliestDate: string;
  actionId?: string;
  sourceKey?: string;
  acceptance?: string;
  dependsOn?: string[];
}
export interface DailyAction extends ActionOutline {
  date: string;
}
export interface DailyDraft {
  settings: DailySettings;
  actions: DailyAction[];
  assumptions: string[];
  sourceSignature: string;
  completionSignature: string;
  decompositionSignature?: string;
  horizon?: PlanningHorizon;
  capacityMinutes?: number;
}
const completionSignature = (planId: string, tasks: ScheduledTask[]) =>
  JSON.stringify(
    tasks
      .filter((t) => t.planId === planId && t.done)
      .map((t) => t.id)
      .sort(),
  );
export const sourceSignature = (plan: PlanResponse) =>
  JSON.stringify(
    plan.phases.map((p) => [
      p.id,
      p.title,
      p.description,
      p.duration,
      p.isRecurring,
      p.frequency || "",
      p.steps.map((s) => [
        s.id,
        s.title,
        s.description,
        s.estimatedDuration,
        s.difficulty,
        s.type,
        s.isBreakable,
      ]),
    ]),
  );
export function validateSettings(settings: DailySettings) {
  if (!settings || typeof settings !== "object")
    throw new Error("计划设置无效");
  if (settings.mode !== undefined && !["rolling", "strict"].includes(settings.mode)) throw new Error("规划模式无效");
  if ([settings.currentSituation, settings.successCriteria].some((v) => v !== undefined && (typeof v !== "string" || v.length > 2000))) throw new Error("补充信息最多各 2000 字");
  const start = parseLocalDate(settings.startDate),
    end = parseLocalDate(settings.endDate);
  if (start > end || end.getTime() - start.getTime() > 90 * 86400000)
    throw new Error("计划范围需为 1 至 90 天");
  if (
    !Number.isInteger(settings.dailyMinutes) ||
    settings.dailyMinutes < 5 ||
    settings.dailyMinutes > 480
  )
    throw new Error("每天投入时间需为 5 至 480 分钟");
  if (settings.taskMinutes !== undefined && (
    !Number.isInteger(settings.taskMinutes) || settings.taskMinutes < 5 ||
    settings.taskMinutes > settings.dailyMinutes
  )) throw new Error("任务颗粒度需为 5 分钟至每天可投入时间之间");
  if (
    !Array.isArray(settings.weekdays) ||
    !settings.weekdays.length ||
    settings.weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6) ||
    new Set(settings.weekdays).size !== settings.weekdays.length
  )
    throw new Error("请至少选择一个可安排的星期");
  const days: string[] = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1))
    if (settings.weekdays.includes(day.getDay())) days.push(localDate(day));
  if (!days.length) throw new Error("所选日期范围内没有可安排的日子");
  return days;
}
export function taskMinutes(
  task: ScheduledTask,
  plans: PlanResponse[],
): { minutes: number; estimated: boolean } {
  if (task.minutes !== undefined)
    return { minutes: task.minutes, estimated: false };
  const duration =
    plans
      .find((p) => p.id === task.planId)
      ?.phases.flatMap((p) => p.steps)
      .find((s) => s.id === task.stepId)?.estimatedDuration || "";
  const hours = duration.match(/(\d+(?:\.\d+)?)\s*(?:小时|hours?|hrs?|h\b)/i),
    minutes = duration.match(
      /(\d+(?:\.\d+)?)\s*(?:分钟|分|minutes?|mins?|m\b)/i,
    );
  const total = Number(hours?.[1] || 0) * 60 + Number(minutes?.[1] || 0);
  return total > 0
    ? { minutes: Math.ceil(total), estimated: false }
    : { minutes: 30, estimated: true };
}
export function remainingStepIds(
  plan: PlanResponse,
  tasks: ScheduledTask[],
): string[] {
  return plan.phases.flatMap((phase) =>
    phase.steps
      .filter((step) => {
        const related = tasks.filter(
          (t) => t.planId === plan.id && t.stepId === step.id,
        );
        return (
          plan.horizon?.remainingWork.some((w) => w.stepId === step.id) || phase.isRecurring || !related.length || !related.every((t) => t.done)
        );
      })
      .map((s) => s.id),
  );
}
export function occupiedMinutes(
  planId: string,
  tasks: ScheduledTask[],
  plans: PlanResponse[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const task of tasks) {
    if (task.planId === planId && !task.done) continue;
    result[task.date] =
      (result[task.date] || 0) + taskMinutes(task, plans).minutes;
  }
  return result;
}
function validateOutlines(
  plan: PlanResponse,
  actions: ActionOutline[],
  settings: DailySettings,
  tasks: ScheduledTask[],
  sourceSteps?: string[],
  deferred: RemainingWork[] = [],
) {
  const remaining = sourceSteps ?? remainingStepIds(plan, tasks);
  if (!remaining.length) throw new Error("这份目标中的行动都已完成");
  if (!Array.isArray(actions) || (!actions.length && !deferred.length) || actions.length > 200)
    throw new Error("每日计划需包含 1 至 200 个行动，请缩小目标或日期范围");
  for (const a of actions) {
    if (
      !a ||
      !remaining.includes(a.stepId) ||
      typeof a.title !== "string" ||
      !a.title.trim() ||
      a.title.length > 200 ||
      typeof a.description !== "string" ||
      a.description.length > 3000 ||
      !Number.isInteger(a.minutes) ||
      a.minutes < 1 ||
      a.minutes > settings.dailyMinutes
    )
      throw new Error("行动需关联原始步骤，并在每天可用时间内完成");
    if (a.minutes > (settings.taskMinutes ?? settings.dailyMinutes))
      throw new Error(`「${a.title}」超过任务颗粒度 ${settings.taskMinutes} 分钟，请继续拆分行动`);
    parseLocalDate(a.earliestDate);
    if (
      a.earliestDate < settings.startDate ||
      (settings.mode !== "rolling" && a.earliestDate > settings.endDate)
    )
      throw new Error("行动的最早开始日期超出计划范围");
  }
  if (remaining.some((id) => !actions.some((a) => a.stepId === id) && !deferred.some((w) => w.stepId === id)))
    throw new Error("生成结果遗漏了目标步骤，请重试或缩小目标范围");
}
export function buildDailyDraft(
  plan: PlanResponse,
  outlines: ActionOutline[],
  settings: DailySettings,
  tasks: ScheduledTask[],
  plans: PlanResponse[],
  assumptions: string[] = [],
  decompositionSignature?: string,
  horizon?: PlanningHorizon,
): DailyDraft {
  const days = validateSettings(settings);
  const sourceSteps = decompositionSignature ? pendingSources(plan, plans, tasks).sources
    .map((s) => s.rootStepId).filter((id) => remainingStepIds(plan, tasks).includes(id)) : undefined;
  const rolling = settings.mode === "rolling";
  const remainingWork = horizon?.remainingWork.map((w) => ({ ...w })) || [];
  if (!rolling && remainingWork.length) throw new Error("严格模式下仍有待安排工作，请增加容量或切换滚动阶段规划");
  validateOutlines(plan, outlines, settings, tasks, sourceSteps, remainingWork);
  const occupied = occupiedMinutes(plan.id, tasks, plans),
    actions: DailyAction[] = [];
  const capacityMinutes = days.reduce((n, d) => n + Math.max(0, settings.dailyMinutes - (occupied[d] || 0)), 0);
  let overflowed = false;
  let cursor = 0;
  for (const outline of outlines) {
    while (
      cursor < days.length &&
      (days[cursor] < outline.earliestDate ||
        (occupied[days[cursor]] || 0) + outline.minutes > settings.dailyMinutes)
    )
      cursor++;
    if (cursor >= days.length && rolling) {
      overflowed = true;
      const existing = remainingWork.find((w) => w.sourceKey === outline.sourceKey);
      const detail = `待执行：${outline.title}。${outline.acceptance || outline.description}`;
      if (existing) {
        existing.reason += `；${detail}`;
        if (existing.estimatedMinutes !== null) existing.estimatedMinutes += outline.minutes;
      } else remainingWork.push({ sourceKey: outline.sourceKey || JSON.stringify([plan.id, outline.stepId]), stepId: outline.stepId,
        title: outline.title, reason: `本期容量或前置顺序限制。${detail}`, estimatedMinutes: outline.minutes });
      continue;
    }
    if (cursor >= days.length)
      throw new Error(
        `结束日期前放不下「${outline.title}」。请延长日期范围或增加每天投入时间；已有日程会占用每日额度。`,
      );
    const date = days[cursor];
    occupied[date] = (occupied[date] || 0) + outline.minutes;
    actions.push({ ...outline, date });
  }
  const draft = {
    settings,
    actions,
    ...(decompositionSignature ? { decompositionSignature } : {}),
    assumptions,
    capacityMinutes,
    ...(horizon || rolling ? { horizon: {
      outcome: overflowed ? `本期安排 ${actions.length} 个行动；完成标准以各行动为准，整个目标仍有待安排工作。` : (horizon?.outcome || "完成本期列出的行动，并逐项检查完成标准。"),
      reviewDate: horizon?.reviewDate || settings.endDate,
      remainingWork,
    } } : {}),
    sourceSignature: sourceSignature(plan),
    completionSignature: completionSignature(plan.id, tasks),
  };
  validateDailyDraft(plan, draft, tasks, plans);
  return draft;
}
export function validateDailyDraft(
  plan: PlanResponse,
  draft: DailyDraft,
  tasks: ScheduledTask[],
  plans: PlanResponse[],
) {
  const days = validateSettings(draft.settings);
  if (draft.sourceSignature !== sourceSignature(plan))
    throw new Error("目标内容已改变，请重新生成每日计划");
  if (draft.completionSignature !== completionSignature(plan.id, tasks))
    throw new Error("行动完成状态已改变，请重新生成每日计划");
  const sourceSteps = draft.decompositionSignature ? pendingSources(plan, plans, tasks).sources
    .map((s) => s.rootStepId).filter((id) => remainingStepIds(plan, tasks).includes(id)) : undefined;
  const deferred = draft.horizon?.remainingWork || [];
  if (draft.settings.mode !== "rolling" && deferred.length) throw new Error("严格模式不能留下待安排工作");
  if (draft.horizon) {
    parseLocalDate(draft.horizon.reviewDate);
    if (draft.horizon.reviewDate < draft.settings.startDate || draft.horizon.reviewDate > draft.settings.endDate)
      throw new Error("复盘日期需在本期范围内");
  }
  validateOutlines(plan, draft.actions, draft.settings, tasks, sourceSteps, deferred);
  if (draft.decompositionSignature) {
    const graph = pendingSources(plan, plans, tasks);
    if (draft.decompositionSignature !== resolveDecomposition(plan, plans).signature)
      throw new Error("子拆解已改变，请重新生成每日计划");
    for (const work of deferred) {
      const source = graph.sources.find((s) => s.key === work.sourceKey);
      if (!source || source.rootStepId !== work.stepId || !work.title?.trim() || !work.reason?.trim() ||
          (work.estimatedMinutes !== null && (!Number.isInteger(work.estimatedMinutes) || work.estimatedMinutes < 0)))
        throw new Error("待安排工作必须关联有效任务，并说明原因和估时");
    }
    const seen = new Set<string>();
    for (const action of draft.actions) {
      const source = graph.sources.find((s) => s.key === action.sourceKey);
      if (!source || source.rootStepId !== action.stepId)
        throw new Error("行动未关联当前有效的子任务，请重新生成");
      if (!action.acceptance?.trim() || action.acceptance.length > 1000)
        throw new Error("每个行动都需要明确的完成标准（最多 1000 字）");
      if (!action.actionId || seen.has(action.actionId) || !Array.isArray(action.dependsOn) ||
          action.dependsOn.some((id) => !seen.has(id)))
        throw new Error("前置行动必须存在且排在当前行动之前");
      seen.add(action.actionId);
    }
    const remaining = remainingStepIds(plan, tasks);
    if (graph.sources.some((s) => remaining.includes(s.rootStepId) && !draft.actions.some((a) => a.sourceKey === s.key) && !deferred.some((w) => w.sourceKey === s.key)))
      throw new Error("生成结果遗漏了已有子拆解中的任务，请重试");
  }
  const occupied = occupiedMinutes(plan.id, tasks, plans);
  let previous = draft.settings.startDate;
  for (const action of draft.actions) {
    parseLocalDate(action.date);
    if (!days.includes(action.date))
      throw new Error(`「${action.title}」不在所选可安排日期内`);
    if (action.date < action.earliestDate || action.date < previous)
      throw new Error("请保持行动执行顺序，循环行动也不能提前到指定日期之前");
    previous = action.date;
    occupied[action.date] = (occupied[action.date] || 0) + action.minutes;
    if (occupied[action.date] > draft.settings.dailyMinutes)
      throw new Error(
        `${action.date} 超过每天 ${draft.settings.dailyMinutes} 分钟的额度（含已有日程），请调整日期或用时`,
      );
  }
}
