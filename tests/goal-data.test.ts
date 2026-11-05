import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseBackup,
  normalizePlanner,
  parseLocalDate,
  localDate,
  validateRange,
} from "../src/lib/goal-data.ts";
const goal = {
  id: "g",
  goal: "目标",
  summary: "说明",
  motivationalQuote: "",
  createdAt: 1,
  phases: [
    {
      id: "p",
      title: "阶段",
      description: "",
      duration: "一周",
      isRecurring: false,
      steps: [
        {
          id: "s",
          title: "行动",
          description: "",
          estimatedDuration: "1 小时",
          difficulty: "Easy",
          type: "Action",
          isBreakable: true,
        },
      ],
    },
  ],
};
const content = {
  id: "old",
  title: "笔记",
  notes: "**保留**",
  tags: ["blue:研究"],
  status: "todo",
  createdAt: "2026-10-28T00:00:00Z",
  updatedAt: "2026-10-28T00:00:00Z",
};
const planner = {
  dateRange: { from: "2026-10-28T00:00:00", to: "2026-11-05T00:00:00" },
  metadata: { "day-20261028-7": content, "month-20261028-1": content },
};
test("legacy planner notes move to stable calendar IDs with revived dates", () => {
  const { value } = parseBackup(planner);
  assert.equal(value.data?.metadata["day-20261028-0"].notes, "**保留**");
  assert.equal(value.data?.metadata["month-20261001-0"].title, "笔记");
  assert.ok(value.data?.dateRange.from instanceof Date);
});
test("single goal and archived goal arrays import", () => {
  assert.equal(parseBackup(goal).kind, "goals");
  assert.equal(
    parseBackup([goal]).value.plans[0].phases[0].steps[0].title,
    "行动",
  );
});
test("full backup roundtrips all data and completion state", () => {
  const value = {
    version: 1,
    data: planner,
    plans: [goal],
    tasks: [
      { id: "t", planId: "g", stepId: "s", date: "2026-10-29", done: true },
    ],
  };
  const parsed = parseBackup(value);
  const again = parseBackup(
    JSON.parse(JSON.stringify({ version: 1, ...parsed.value })),
  );
  assert.equal(again.value.tasks[0].done, true);
  assert.equal(again.value.plans[0].id, "g");
  assert.ok(
    again.value.data?.metadata["day-20261028-0"].createdAt instanceof Date,
  );
});
test("invalid dates, inverted and excessive ranges reject", () => {
  assert.throws(() => parseLocalDate("2026-02-30"));
  assert.throws(() =>
    validateRange({ from: new Date(2026, 4, 1), to: new Date(2026, 3, 1) }),
  );
  assert.throws(() =>
    validateRange({ from: new Date(2020, 0, 1), to: new Date(2026, 0, 1) }),
  );
  assert.equal(localDate(parseLocalDate("2026-10-28")), "2026-10-28");
});
test("invalid imports reject before modifying state", () => {
  assert.throws(() => parseBackup({ version: 5 }));
  assert.throws(() =>
    parseBackup({
      ...goal,
      phases: [
        {
          ...goal.phases[0],
          steps: [{ ...goal.phases[0].steps[0], difficulty: "Unknown" }],
        },
      ],
    }),
  );
  assert.throws(() =>
    normalizePlanner({ ...planner, metadata: { bad: content } }),
  );
  assert.throws(() =>
    parseBackup({
      version: 1,
      data: null,
      plans: [goal],
      tasks: [
        {
          id: "t",
          planId: "missing",
          stepId: "s",
          date: "2026-10-28",
          done: false,
        },
      ],
    }),
  );
});
test("duplicate target IDs and duplicate scheduled tasks reject", () => {
  assert.throws(() =>
    parseBackup({ version: 1, data: null, plans: [goal, goal], tasks: [] }),
  );
  const task = {
    id: "t",
    planId: "g",
    stepId: "s",
    date: "2026-10-28",
    done: false,
  };
  assert.throws(() =>
    parseBackup({
      version: 1,
      data: null,
      plans: [goal],
      tasks: [task, { ...task, id: "t2" }],
    }),
  );
});

test("original planner example remains importable without losing notes", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = JSON.parse(
    await readFile(
      new URL("../public/data/博士计划.json", import.meta.url),
      "utf8",
    ),
  );
  const result = parseBackup(source);
  assert.equal(
    Object.keys(result.value.data!.metadata).length,
    Object.keys(source.metadata).length,
  );
});
