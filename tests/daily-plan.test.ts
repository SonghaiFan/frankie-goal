import { test } from "node:test";
import assert from "node:assert/strict";
import type { PlanResponse } from "../src/features/goals/types";
import type { ScheduledTask } from "../src/lib/goal-data";
import { parseBackup } from "../src/lib/goal-data.ts";
import {
  buildDailyDraft,
  validateDailyDraft,
  remainingStepIds,
  taskMinutes,
  type DailySettings,
  type ActionOutline,
} from "../src/lib/daily-plan.ts";
const plan = {
  id: "goal",
  goal: "作品集",
  summary: "",
  motivationalQuote: "",
  createdAt: 1,
  phases: [
    {
      id: "phase",
      title: "制作",
      description: "",
      duration: "三天",
      isRecurring: false,
      steps: [
        {
          id: "s1",
          title: "完成三个项目",
          description: "",
          estimatedDuration: "3天",
          difficulty: "Medium",
          type: "Action",
          isBreakable: true,
        },
        {
          id: "s2",
          title: "检查发布",
          description: "",
          estimatedDuration: "45 minutes",
          difficulty: "Easy",
          type: "Action",
          isBreakable: false,
        },
      ],
    },
  ],
} as PlanResponse;
const settings: DailySettings = {
  startDate: "2026-10-30",
  endDate: "2026-11-06",
  dailyMinutes: 60,
  weekdays: [1, 2, 3, 4, 5],
};
const action = (
  stepId: string,
  minutes = 30,
  earliestDate = settings.startDate,
): ActionOutline => ({
  stepId,
  title: "完成一个可展示的产出",
  description: "提交一个完整页面",
  minutes,
  earliestDate,
});
const actions = [action("s1"), action("s1"), action("s2", 45)];
test("multi-session steps pack into daily capacity and skip weekends", () => {
  const draft = buildDailyDraft(plan, actions, settings, [], [plan]);
  assert.deepEqual(
    draft.actions.map((a) => a.date),
    ["2026-10-30", "2026-10-30", "2026-11-02"],
  );
  assert.deepEqual(
    draft.actions.map((a) => a.stepId),
    ["s1", "s1", "s2"],
  );
});
test("other goals and completed work consume capacity while own unfinished schedule is replaceable", () => {
  const other = { ...plan, id: "other" };
  const tasks: ScheduledTask[] = [
    {
      id: "o",
      planId: "other",
      stepId: "s1",
      date: "2026-10-30",
      done: false,
      minutes: 40,
    },
    {
      id: "own",
      planId: plan.id,
      stepId: "s1",
      date: "2026-11-02",
      done: false,
      minutes: 60,
    },
  ];
  const draft = buildDailyDraft(plan, actions, settings, tasks, [plan, other]);
  assert.deepEqual(
    draft.actions.map((a) => a.date),
    ["2026-11-02", "2026-11-02", "2026-11-03"],
  );
});
test("completed source steps are retained and excluded from new work", () => {
  const tasks: ScheduledTask[] = [
    {
      id: "done",
      planId: plan.id,
      stepId: "s1",
      date: "2026-10-30",
      done: true,
      minutes: 30,
    },
  ];
  assert.deepEqual(remainingStepIds(plan, tasks), ["s2"]);
  const draft = buildDailyDraft(plan, [action("s2", 45)], settings, tasks, [
    plan,
  ]);
  assert.equal(draft.actions[0].date, "2026-11-02");
  assert.throws(() => buildDailyDraft(plan, actions, settings, tasks, [plan]));
});
test("recurring occurrences cannot be scheduled earlier than their anchors", () => {
  const recurring = {
    ...plan,
    phases: [
      {
        ...plan.phases[0],
        isRecurring: true,
        steps: [plan.phases[0].steps[0]],
      },
    ],
  };
  const draft = buildDailyDraft(
    recurring,
    [action("s1", 20, "2026-10-30"), action("s1", 20, "2026-11-03")],
    settings,
    [],
    [recurring],
  );
  assert.deepEqual(
    draft.actions.map((a) => a.date),
    ["2026-10-30", "2026-11-03"],
  );
});
test("infeasible schedules, missing steps and invented references are rejected", () => {
  const short = { ...settings, endDate: settings.startDate };
  assert.throws(
    () => buildDailyDraft(plan, actions, short, [], [plan]),
    /放不下/,
  );
  assert.throws(
    () => buildDailyDraft(plan, [action("s1")], settings, [], [plan]),
    /遗漏/,
  );
  assert.throws(
    () => buildDailyDraft(plan, [action("unknown")], settings, [], [plan]),
    /关联/,
  );
});
test("edited previews revalidate occupancy, source revision and chronological order before applying", () => {
  const draft = buildDailyDraft(plan, actions, settings, [], [plan]);
  assert.throws(
    () =>
      validateDailyDraft(
        plan,
        {
          ...draft,
          actions: draft.actions.map((a) => ({ ...a, date: "2026-10-30" })),
        },
        [],
        [plan],
      ),
    /超过/,
  );
  assert.throws(
    () =>
      validateDailyDraft(
        plan,
        {
          ...draft,
          actions: draft.actions.map((a, i) => ({
            ...a,
            date: i === 0 ? "2026-11-03" : a.date,
          })),
        },
        [],
        [plan],
      ),
    /顺序/,
  );
  assert.throws(
    () => validateDailyDraft({ ...plan, phases: [] }, draft, [], [plan]),
    /已改变/,
  );
});
test("invalid planning windows, blank weekdays and non-positive durations reject", () => {
  assert.throws(() =>
    buildDailyDraft(plan, actions, { ...settings, weekdays: [] }, [], [plan]),
  );
  assert.throws(() =>
    buildDailyDraft(
      plan,
      actions,
      { ...settings, endDate: "2026-02-30" },
      [],
      [plan],
    ),
  );
  assert.throws(() =>
    buildDailyDraft(
      plan,
      [action("s1", 0), action("s2")],
      settings,
      [],
      [plan],
    ),
  );
});
test("daily sessions retain titles, notes, source IDs and minutes through backup roundtrip", () => {
  const tasks: ScheduledTask[] = actions.map((a, i) => ({
    id: `a${i}`,
    planId: plan.id,
    stepId: a.stepId,
    date: settings.startDate,
    done: i === 0,
    title: a.title,
    description: a.description,
    minutes: a.minutes,
    batchId: "batch",
  }));
  const imported = parseBackup(
    JSON.parse(
      JSON.stringify({ version: 1, data: null, plans: [plan], tasks }),
    ),
  );
  assert.deepEqual(imported.value.tasks, tasks);
});
test("old schedules use recognizable minutes or an explicit 30-minute estimate", () => {
  const task: ScheduledTask = {
    id: "old",
    planId: plan.id,
    stepId: "s2",
    date: settings.startDate,
    done: false,
  };
  assert.deepEqual(taskMinutes(task, [plan]), {
    minutes: 45,
    estimated: false,
  });
  assert.deepEqual(taskMinutes({ ...task, stepId: "s1" }, [plan]), {
    minutes: 30,
    estimated: true,
  });
});

test("a completion change while previewing requires regeneration, preserving completed sessions", () => {
  const draft = buildDailyDraft(plan, actions, settings, [], [plan]);
  const done: ScheduledTask = {
    id: "completed-after-preview",
    planId: plan.id,
    stepId: "s1",
    date: settings.startDate,
    done: true,
    minutes: 15,
    batchId: "old",
  };
  assert.throws(
    () => validateDailyDraft(plan, draft, [done], [plan]),
    /完成状态已改变/,
  );
});

test("saved planning preferences survive export/import and ignore JSON property ordering", () => {
  const withSettings = { ...plan, planning: settings };
  const imported = parseBackup(
    JSON.parse(
      JSON.stringify({
        version: 1,
        data: null,
        plans: [withSettings],
        tasks: [],
      }),
    ),
  ).value.plans[0];
  assert.deepEqual(imported.planning, settings);
  const draft = buildDailyDraft(
    withSettings,
    actions,
    settings,
    [],
    [withSettings],
  );
  assert.doesNotThrow(() =>
    validateDailyDraft(imported, draft, [], [imported]),
  );
});

test("granularity limits generation and edited actions without padding short tasks", () => {
  const granular = { ...settings, taskMinutes: 15 };
  const draft = buildDailyDraft(plan, [action("s1", 15), action("s2", 3)], granular, [], [plan]);
  assert.equal(draft.actions[1].minutes, 3);
  assert.throws(() => buildDailyDraft(plan, [action("s1", 16), action("s2", 3)], granular, [], [plan]), /颗粒度/);
  draft.actions[0].minutes = 16;
  assert.throws(() => validateDailyDraft(plan, draft, [], [plan]), /颗粒度/);
  for (const taskMinutes of [0, 4, 61, 15.5, NaN]) {
    assert.throws(() => buildDailyDraft(plan, [action("s1"), action("s2")], { ...settings, taskMinutes }, [], [plan]), /颗粒度/);
  }
});

test("granularity survives backups and legacy planning settings remain readable", () => {
  const saved = { ...plan, planning: { ...settings, taskMinutes: 15 } };
  const backup = { version: 1, data: null, plans: [saved], tasks: [] };
  assert.equal(parseBackup(backup).value.plans[0].planning?.taskMinutes, 15);
  assert.equal(parseBackup({ ...backup, plans: [{ ...plan, planning: settings }] }).value.plans[0].planning?.taskMinutes, undefined);
  assert.throws(() => parseBackup({ ...backup, plans: [{ ...saved, planning: { ...settings, taskMinutes: 90 } }] }), /设置无效/);
});

test("unified decomposition reuses nested leaves, preserves lineage and rejects stale previews", async () => {
  const { resolveDecomposition } = await import("../src/lib/decomposition.ts");
  const child = { ...plan, id: "child", parentId: plan.id, parentStepId: "s1", goal: "细化制作",
    phases: [{ ...plan.phases[0], steps: [{ ...plan.phases[0].steps[0], id: "leaf" }] }] };
  const plans = [plan, child];
  const graph = resolveDecomposition(plan, plans);
  assert.deepEqual(graph.sources.map((s) => [s.planId, s.stepId, s.rootStepId]), [["child", "leaf", "s1"], ["goal", "s2", "s2"]]);
  const outlines = graph.sources.map((s, i) => ({ ...action(s.rootStepId, 15), actionId: `a${i}`, sourceKey: s.key,
    acceptance: "保存可打开的页面", dependsOn: i ? ["a0"] : [] }));
  const draft = buildDailyDraft(plan, outlines, settings, [], plans, [], graph.signature);
  assert.throws(() => validateDailyDraft(plan, draft, [], [plan, { ...child, phases: [{ ...child.phases[0], title: "已修改" }] }]), /子拆解已改变/);
  assert.throws(() => buildDailyDraft(plan, [{ ...outlines[0], acceptance: "" }, outlines[1]], settings, [], plans, [], graph.signature), /完成标准/);
  assert.throws(() => buildDailyDraft(plan, [{ ...outlines[0], dependsOn: ["a1"] }, outlines[1]], settings, [], plans, [], graph.signature), /前置行动/);
  assert.throws(() => buildDailyDraft(plan, [{ ...outlines[0], sourceKey: "invented" }, outlines[1]], settings, [], plans, [], graph.signature), /有效的子任务/);
  assert.equal(parseBackup({ version: 1, data: null, plans, tasks: [] }).value.plans[1].parentStepId, "s1");
});

test("child schedules cannot duplicate parent work; completed leaves are excluded", async () => {
  const { pendingSources, resolveDecomposition } = await import("../src/lib/decomposition.ts");
  const child = { ...plan, id: "child", parentId: plan.id, parentStepId: "s1",
    phases: [{ ...plan.phases[0], steps: [{ ...plan.phases[0].steps[0], id: "leaf" }] }] };
  const plans = [plan, child];
  const scheduled = { id: "old", planId: "child", stepId: "leaf", date: settings.startDate, done: false };
  assert.throws(() => pendingSources(plan, plans, [scheduled]), /另一份计划/);
  const done = { ...scheduled, done: true };
  const graph = pendingSources(plan, plans, [done]);
  assert.deepEqual(graph.sources.map((s) => s.stepId), ["s2"]);
  const source = graph.sources[0];
  const draft = buildDailyDraft(plan, [{ ...action("s2", 15), sourceKey: source.key, actionId: "a", acceptance: "发布成功", dependsOn: [] }], settings, [done], plans, [], graph.signature);
  assert.equal(draft.actions.length, 1);
  assert.throws(() => pendingSources(child, plans, [{ ...scheduled, planId: plan.id, stepId: "s1" }]), /另一份计划/);
  const legacy = { ...child, parentStepId: undefined };
  assert.equal(resolveDecomposition(plan, [plan, legacy]).warnings.length, 1);
  assert.equal(resolveDecomposition(plan, [plan, legacy]).sources[0].planId, plan.id);
  assert.throws(() => resolveDecomposition(plan, [plan, child, { ...child, id: "duplicate" }]), /多份子拆解/);
});

test("decomposition signature ignores property ordering and demands every child leaf", async () => {
  const { resolveDecomposition } = await import("../src/lib/decomposition.ts");
  const child = { ...plan, id: "child", parentId: plan.id, parentStepId: "s1" };
  const plans = [plan, child];
  const graph = resolveDecomposition(plan, plans);
  const reordered = { ...child, phases: child.phases.map((p) => ({ ...p, steps: p.steps.map((s) => Object.fromEntries(Object.entries(s).reverse())) })) } as PlanResponse;
  assert.equal(resolveDecomposition(plan, [plan, reordered]).signature, graph.signature);
  const outlines = [graph.sources[0], graph.sources[2]].map((s, i) => ({...action(s.rootStepId, 5),sourceKey:s.key,actionId:String(i),acceptance:"保存结果",dependsOn:[]}));
  assert.throws(() => buildDailyDraft(plan, outlines, settings, [], plans, [], graph.signature), /遗漏了已有子拆解/);
});

test("rolling plans keep overflow explicitly deferred while strict plans reject overflow", async () => {
  const { resolveDecomposition } = await import("../src/lib/decomposition.ts");
  const graph = resolveDecomposition(plan, [plan]);
  const small = { ...settings, mode: "rolling" as const, endDate: settings.startDate, dailyMinutes: 30 };
  const actions = graph.sources.map((s,i) => ({ ...action(s.rootStepId, 30), actionId:String(i),sourceKey:s.key,acceptance:"有可检查的结果",dependsOn:i?["0"]:[] }));
  const draft = buildDailyDraft(plan, actions, small, [], [plan], [], graph.signature, {outcome:"完成作品集",reviewDate:settings.startDate,remainingWork:[]});
  assert.equal(draft.actions.length,1);
  assert.equal(draft.horizon?.remainingWork.length,1);
  assert.equal(draft.horizon?.remainingWork[0].estimatedMinutes,30);
  assert.equal(draft.capacityMinutes,30);
  assert.throws(()=>buildDailyDraft(plan,actions,{...small,mode:"strict"},[],[plan],[],graph.signature),/放不下/);
  const saved = {...plan,horizon:draft.horizon,planning:small};
  const restored = parseBackup({version:1,data:null,plans:[saved],tasks:[]}).value.plans[0];
  assert.deepEqual(restored.horizon,draft.horizon);
  assert.equal(restored.planning?.mode,"rolling");
});

test("finishing a partial stage never completes its whole source; no-capacity drafts preserve all work", async () => {
  const { resolveDecomposition, pendingSources } = await import("../src/lib/decomposition.ts");
  const graph = resolveDecomposition(plan,[plan]);
  const remainingWork = graph.sources.map(s=>({sourceKey:s.key,stepId:s.rootStepId,title:s.step.title,reason:"待诊断后继续",estimatedMinutes:null}));
  const horizon = {outcome:"先检查现状",reviewDate:settings.startDate,remainingWork};
  const partialPlan = {...plan,horizon};
  const completed = [{id:"done",planId:plan.id,stepId:"s1",date:settings.startDate,done:true,sourceKey:graph.sources[0].key,minutes:5}];
  assert.ok(remainingStepIds(partialPlan,completed).includes("s1"));
  assert.equal(pendingSources(partialPlan,[partialPlan],completed).sources.length,2);
  const draft = buildDailyDraft(plan,[],{...settings,mode:"rolling"},[],[plan],[],graph.signature,horizon);
  assert.equal(draft.actions.length,0);
  assert.equal(draft.horizon?.remainingWork.length,2);
  assert.throws(()=>buildDailyDraft(plan,[],{...settings,mode:"strict"},[],[plan],[],graph.signature,horizon),/严格模式/);
});
