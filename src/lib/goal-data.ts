import type { PlanResponse, PlanStep } from "../features/goals/types";
import type { DateRange, TimeBlockContent } from "../types/time";

export interface ScheduledTask {
  id: string;
  planId: string;
  stepId: string;
  date: string;
  done: boolean;
  startedAt?: string;
  title?: string;
  description?: string;
  minutes?: number;
  batchId?: string;
  sourceKey?: string;
  sourcePath?: string[];
  acceptance?: string;
  dependsOn?: string[];
}
export interface PlannerData {
  dateRange: DateRange;
  metadata: Record<string, TimeBlockContent>;
}
export interface WorkspaceData {
  data: PlannerData | null;
  plans: PlanResponse[];
  tasks: ScheduledTask[];
}

export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseLocalDate(value: string): Date {
  const date = new Date(`${value}T00:00:00`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    localDate(date) !== value
  )
    throw new Error("日期无效");
  return date;
}
export function validateRange(range: DateRange) {
  if (
    !Number.isFinite(range.from.getTime()) ||
    !Number.isFinite(range.to.getTime()) ||
    range.from > range.to ||
    range.to.getTime() - range.from.getTime() > 3 * 366 * 86400000
  )
    throw new Error("请选择有效的日期范围（最多三年）");
}
const record = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("数据格式无效");
  return v as Record<string, unknown>;
};
const string = (v: unknown): string => {
  if (typeof v !== "string") throw new Error("文本字段无效");
  return v;
};
const array = (v: unknown): unknown[] => {
  if (!Array.isArray(v)) throw new Error("列表字段无效");
  return v;
};
const bool = (v: unknown): boolean => {
  if (typeof v !== "boolean") throw new Error("状态字段无效");
  return v;
};
const dateValue = (v: unknown): Date => {
  if (!(typeof v === "string" || v instanceof Date))
    throw new Error("日期无效");
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) throw new Error("日期无效");
  return d;
};

export function validatePlan(value: unknown): PlanResponse {
  const p = record(value);
  if (
    !string(p.id) ||
    !string(p.goal) ||
    typeof p.createdAt !== "number" ||
    !Number.isFinite(p.createdAt)
  )
    throw new Error("目标数据无效");
  const steps = new Set<string>();
  const phases = array(p.phases).map((value) => {
    const phase = record(value);
    return {
      id: string(phase.id),
      title: string(phase.title),
      description: string(phase.description),
      duration: string(phase.duration),
      isRecurring: bool(phase.isRecurring),
      frequency:
        phase.frequency === undefined ? undefined : string(phase.frequency),
      steps: array(phase.steps).map((value) => {
        const s = record(value);
        if (
          !string(s.id) ||
          steps.has(s.id as string) ||
          !["Easy", "Medium", "Hard"].includes(string(s.difficulty)) ||
          !["Research", "Action", "Milestone", "Preparation"].includes(
            string(s.type),
          )
        )
          throw new Error("任务数据无效");
        steps.add(s.id as string);
        return {
          id: s.id,
          title: string(s.title),
          description: string(s.description),
          estimatedDuration: string(s.estimatedDuration),
          difficulty: s.difficulty,
          type: s.type,
          isBreakable: bool(s.isBreakable),
        } as PlanStep;
      }),
    };
  });
  let planning: PlanResponse["planning"];
  if (p.planning !== undefined) {
    const settings = record(p.planning),
      startDate = string(settings.startDate),
      endDate = string(settings.endDate),
      dailyMinutes = settings.dailyMinutes,
      weekdays = array(settings.weekdays);
    const start = parseLocalDate(startDate),
      end = parseLocalDate(endDate);
    if (
      start > end ||
      end.getTime() - start.getTime() > 90 * 86400000 ||
      typeof dailyMinutes !== "number" ||
      !Number.isInteger(dailyMinutes) ||
      dailyMinutes < 5 ||
      dailyMinutes > 480 ||
      (settings.taskMinutes !== undefined && (
        typeof settings.taskMinutes !== "number" ||
        !Number.isInteger(settings.taskMinutes) || settings.taskMinutes < 5 ||
        settings.taskMinutes > dailyMinutes
      )) ||
      ([settings.currentSituation, settings.successCriteria].some((v) => v !== undefined && (typeof v !== "string" || v.length > 2000))) ||
      (settings.mode !== undefined && !["rolling", "strict"].includes(String(settings.mode))) ||
      !weekdays.length ||
      weekdays.some(
        (d) => typeof d !== "number" || !Number.isInteger(d) || d < 0 || d > 6,
      ) ||
      new Set(weekdays).size !== weekdays.length
    )
      throw new Error("保存的每日计划设置无效");
    planning = {
      startDate,
      endDate,
      dailyMinutes,
      weekdays: weekdays as number[],
      ...(typeof settings.currentSituation === "string" ? { currentSituation: settings.currentSituation } : {}),
      ...(typeof settings.successCriteria === "string" ? { successCriteria: settings.successCriteria } : {}),
      ...(settings.mode !== undefined ? { mode: settings.mode as "rolling" | "strict" } : {}),
      ...(settings.taskMinutes !== undefined ? { taskMinutes: settings.taskMinutes as number } : {}),
    };
  }
  let horizon: PlanResponse["horizon"];
  if (p.horizon !== undefined) {
    const h = record(p.horizon);
    const reviewDate = string(h.reviewDate);
    parseLocalDate(reviewDate);
    horizon = { outcome: string(h.outcome), reviewDate, remainingWork: array(h.remainingWork).map((value) => {
      const w = record(value);
      if (w.estimatedMinutes !== null && (typeof w.estimatedMinutes !== "number" || !Number.isInteger(w.estimatedMinutes) || w.estimatedMinutes < 0))
        throw new Error("待安排工作估时无效");
      const stepId = string(w.stepId);
      if (!steps.has(stepId)) throw new Error("待安排工作引用的步骤不存在");
      return { sourceKey: string(w.sourceKey), stepId, title: string(w.title), reason: string(w.reason), estimatedMinutes: w.estimatedMinutes as number | null };
    }) };
  }
  return {
    ...(horizon ? { horizon } : {}),
    id: p.id as string,
    goal: p.goal as string,
    ...(planning ? { planning } : {}),
    summary: string(p.summary),
    motivationalQuote: string(p.motivationalQuote),
    createdAt: p.createdAt as number,
    parentId: p.parentId === undefined ? undefined : string(p.parentId),
    ...(p.parentStepId !== undefined ? { parentStepId: string(p.parentStepId) } : {}),
    phases,
  };
}

export function normalizePlanner(value: unknown): PlannerData {
  const p = record(value),
    range = record(p.dateRange);
  const dateRange = { from: dateValue(range.from), to: dateValue(range.to) };
  validateRange(dateRange);
  const metadata: Record<string, TimeBlockContent> = {};
  for (const [key, value] of Object.entries(record(p.metadata))) {
    const m = record(value);
    const match = /^(season|month|week|day)-(\d{6}|\d{8})-\d+$/.exec(key);
    if (!match) throw new Error("时间块标识无效");
    const [, level, digits] = match;
    const d = parseLocalDate(
      `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8) || "01"}`,
    );
    if (level === "season") d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
    if (level === "month") d.setDate(1);
    if (level === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const id = `${level}-${localDate(d).replaceAll("-", "")}-0`;
    if (metadata[id])
      throw new Error("同一时间块含有多份内容，请先检查原始备份");
    if (!["todo", "in-progress", "done"].includes(string(m.status)))
      throw new Error("时间块状态无效");
    metadata[id] = {
      id,
      title: string(m.title),
      notes: string(m.notes),
      tags: array(m.tags).map(string),
      status: m.status as TimeBlockContent["status"],
      createdAt: dateValue(m.createdAt),
      updatedAt: dateValue(m.updatedAt),
    };
  }
  return { dateRange, metadata };
}

// Accept the combined backup and both original projects' JSON exports.
export function parseBackup(value: unknown): {
  kind: "workspace" | "goals" | "planner";
  value: WorkspaceData;
} {
  if (Array.isArray(value)) {
    const plans = value.map(validatePlan);
    if (new Set(plans.map((p) => p.id)).size !== plans.length)
      throw new Error("目标标识重复");
    return { kind: "goals", value: { data: null, plans, tasks: [] } };
  }
  const p = record(value);
  if ("phases" in p)
    return {
      kind: "goals",
      value: { data: null, plans: [validatePlan(p)], tasks: [] },
    };
  if ("dateRange" in p)
    return {
      kind: "planner",
      value: { data: normalizePlanner(p), plans: [], tasks: [] },
    };
  if (p.version !== 1) throw new Error("不支持此备份版本");
  const plans = array(p.plans).map(validatePlan);
  if (new Set(plans.map((p) => p.id)).size !== plans.length)
    throw new Error("目标标识重复");
  const tasks = array(p.tasks).map((value) => {
    const t = record(value),
      planId = string(t.planId),
      stepId = string(t.stepId),
      date = string(t.date);
    parseLocalDate(date);
    if (
      !plans.some(
        (p) =>
          p.id === planId &&
          p.phases.some((ph) => ph.steps.some((s) => s.id === stepId)),
      )
    )
      throw new Error("日程引用的任务不存在");
    const task: ScheduledTask = {
      id: string(t.id),
      planId,
      stepId,
      date,
      done: bool(t.done),
    };
    if (t.startedAt !== undefined) {
      task.startedAt = string(t.startedAt);
      if (!Number.isFinite(Date.parse(task.startedAt))) throw new Error("开始记录无效");
    }
    if (t.sourceKey !== undefined) task.sourceKey = string(t.sourceKey);
    if (t.sourcePath !== undefined) task.sourcePath = array(t.sourcePath).map(string);
    if (t.acceptance !== undefined) task.acceptance = string(t.acceptance);
    if (t.dependsOn !== undefined) task.dependsOn = array(t.dependsOn).map(string);
    if (t.title !== undefined) task.title = string(t.title);
    if (t.description !== undefined) task.description = string(t.description);
    if (t.batchId !== undefined) {
      task.batchId = string(t.batchId);
      if (!task.batchId) throw new Error("计划批次无效");
    }
    if (t.minutes !== undefined) {
      if (
        typeof t.minutes !== "number" ||
        !Number.isInteger(t.minutes) ||
        t.minutes < 1 ||
        t.minutes > 480
      )
        throw new Error("任务分钟数无效");
      task.minutes = t.minutes;
    }
    return task;
  });
  if (
    new Set(
      tasks.filter((t) => !t.batchId).map((t) => `${t.planId}:${t.stepId}`),
    ).size !== tasks.filter((t) => !t.batchId).length ||
    new Set(tasks.map((t) => t.id)).size !== tasks.length
  )
    throw new Error("日程任务重复");
  return {
    kind: "workspace",
    value: {
      plans,
      tasks,
      data: p.data === null ? null : normalizePlanner(p.data),
    },
  };
}
