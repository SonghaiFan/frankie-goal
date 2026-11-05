import { test } from "node:test";
import assert from "node:assert/strict";
import { nextAction } from "../src/lib/next-action.ts";
const task = {id:"old",planId:"goal",stepId:"s",date:"2026-10-20",done:false};
test("missed days remain actionable and dependencies and future dates are respected",()=>{
  assert.equal(nextAction([task],"2026-10-29")?.id,"old");
  assert.equal(nextAction([{...task,date:"2026-11-01"}],"2026-10-29"),undefined);
  const second = {...task,id:"second",dependsOn:["old"]};
  assert.equal(nextAction([second,task],"2026-10-29")?.id,"old");
  assert.equal(nextAction([second,{...task,done:true}],"2026-10-29")?.id,"second");
  assert.equal(nextAction([{...second,dependsOn:["missing"]}],"2026-10-29"),undefined);
});
test("an unfinished started action can be resumed without erasing completed work",()=>{
  const started={...task,id:"started",date:"2026-10-28",startedAt:"2026-10-28T10:00:00Z"};
  assert.equal(nextAction([task,started],"2026-10-29")?.id,"started");
  assert.equal(nextAction([{...task,done:true},{...started,done:true}],"2026-10-29"),undefined);
});
