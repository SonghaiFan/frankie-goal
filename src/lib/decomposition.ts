import type { PlanResponse, PlanStep } from "../features/goals/types";

export const DECOMPOSITION_METHOD = `Use first-principles decomposition: identify the necessary outcomes, preserve the parent's rationale and scope, and derive only work needed for those outcomes. Reuse existing child breakdowns rather than inventing a competing plan. Split work until each action has one observable deliverable or verifiable stopping condition within the requested time granularity. Preserve prerequisite order. Never mistake elapsed calendar duration for focused effort or reduce estimates merely to fit a deadline.`;

export interface TaskSource {
  key: string;
  planId: string;
  stepId: string;
  rootStepId: string;
  path: string[];
  rationale: string[];
  step: PlanStep;
  recurring: boolean;
  frequency: string;
}
export function resolveDecomposition(root: PlanResponse, plans: PlanResponse[]) {
  const sources: TaskSource[] = [], warnings: string[] = [];
  const visited = new Set<string>();
  function visit(plan: PlanResponse, path: string[], rootStepId?: string, recurring = false, frequency = "", rationale: string[] = []) {
    if (visited.has(plan.id)) throw new Error("子拆解存在循环引用，请检查目标关系");
    visited.add(plan.id);
    if (visited.size > 20) throw new Error("拆解层级超过 20 层，请精简目标");
    for (const phase of plan.phases) for (const step of phase.steps) {
      const children = plans.filter((p) => p.parentId === plan.id && p.parentStepId === step.id);
      if (children.length > 1) throw new Error(`「${step.title}」有多份子拆解，请保留一份后再生成计划`);
      const child = children[0], nextPath = [...path, phase.title, step.title];
      const repeats = recurring || phase.isRecurring;
      const cadence = phase.frequency || frequency;
      if (child && child.phases.some((p) => p.steps.length)) {
        visit(child, nextPath, rootStepId || step.id, repeats, cadence, [...rationale, plan.summary]);
      } else {
        sources.push({ key: JSON.stringify([plan.id, step.id]), planId: plan.id, stepId: step.id,
          rootStepId: rootStepId || step.id, path: nextPath, rationale: [...rationale, plan.summary], step,
          recurring: repeats, frequency: cadence });
      }
    }
    if (plans.some((p) => p.parentId === plan.id && !p.parentStepId))
      warnings.push(`「${plan.goal}」有旧版子拆解未关联具体步骤，本次不猜测关联；请打开子拆解选择对应的上层步骤。`);
    visited.delete(plan.id);
  }
  visit(root, [root.goal]);
  return { sources, warnings, signature: JSON.stringify(sources.map((s) => [
    s.key, s.rootStepId, s.path, s.rationale, s.recurring, s.frequency,
    s.step.id, s.step.title, s.step.description, s.step.estimatedDuration,
    s.step.difficulty, s.step.type, s.step.isBreakable,
  ])) };
}

export function pendingSources(root: PlanResponse, plans: PlanResponse[], tasks: import("./goal-data").ScheduledTask[]) {
  const graph = resolveDecomposition(root, plans);
  const sources = graph.sources.filter((source) => {
    const lineage = [{ planId: source.planId, stepId: source.stepId }];
    let current = plans.find((p) => p.id === source.planId);
    const ancestors = new Set<string>();
    while (current?.parentId && current.parentStepId) {
      if (ancestors.has(current.id)) throw new Error("子拆解存在循环引用");
      ancestors.add(current.id);
      lineage.push({ planId: current.parentId, stepId: current.parentStepId });
      current = plans.find((p) => p.id === current!.parentId);
    }
    const related = tasks.filter((t) => t.sourceKey === source.key ||
      (!t.sourceKey && lineage.some((p) => t.planId === p.planId && t.stepId === p.stepId)));
    if (related.some((t) => t.planId !== root.id && !t.done))
      throw new Error(`「${source.path.at(-1)}」已在另一份计划中安排，请先移除那里的未完成日程，再从当前目标统一规划`);
    const hasRemaining = plans.some((p) => p.horizon?.remainingWork.some((w) => w.sourceKey === source.key));
    return hasRemaining || source.recurring || !related.length || !related.every((t) => t.done);
  });
  return { ...graph, sources };
}
