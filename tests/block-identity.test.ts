import { test } from "node:test";
import assert from "node:assert/strict";
import { generateBlockId } from "../src/lib/block-utils.ts";
test("changing date-range offsets keeps notes attached to the same day", () => {
  const date = new Date(2026, 9, 28);
  assert.equal(
    generateBlockId({ level: "day", date, indices: { dayIndex: 3 } }),
    generateBlockId({ level: "day", date, indices: { dayIndex: 10 } }),
  );
});
test("quarter, month and Monday-start week use calendar boundaries", () => {
  const date = new Date(2026, 9, 28);
  assert.equal(
    generateBlockId({ level: "season", date, indices: {} }),
    "season-20261001-0",
  );
  assert.equal(
    generateBlockId({ level: "month", date, indices: {} }),
    "month-20261001-0",
  );
  assert.equal(
    generateBlockId({ level: "week", date, indices: {} }),
    "week-20261026-0",
  );
});
