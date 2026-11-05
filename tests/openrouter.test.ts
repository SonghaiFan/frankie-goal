import { test } from "node:test";
import assert from "node:assert/strict";
import {
  streamOpenRouter,
  OpenRouterError,
} from "../src/features/goals/server/openrouter.ts";
import { generateGoalPlan } from "../src/features/goals/server/generate.ts";
const frame = (content: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\r\n\r\n`;
function response(sse: string) {
  const bytes = new TextEncoder().encode(sse);
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );
}
async function collect(fetcher: typeof fetch) {
  let text = "";
  for await (const part of streamOpenRouter("test", {
    apiKey: "test-key",
    model: "test/model",
    fetcher,
  }))
    text += part;
  return text;
}
test("OpenRouter request authenticates on server and requires structured JSON while parsing split UTF-8, CRLF, comments and usage", async () => {
  let payload: Record<string, any> | undefined;
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer test-key",
    );
    payload = JSON.parse(String(init?.body));
    return response(
      ": OPENROUTER PROCESSING\r\n\r\n" +
        frame("中文目标") +
        'data: {"choices":[],"usage":{"total_tokens":2}}\r\n\r\ndata: [DONE]\r\n\r\n',
    );
  };
  assert.equal(await collect(fetcher), "中文目标");
  assert.equal(payload?.model, "test/model");
  assert.equal(payload?.stream, true);
  assert.equal(payload?.response_format.type, "json_schema");
  assert.equal(payload?.provider.require_parameters, true);
  assert.equal(
    payload?.response_format.json_schema.schema.additionalProperties,
    false,
  );
});
test("multi-line SSE events are parsed as one event", async () => {
  const fetcher: typeof fetch = async () =>
    response(
      'data: {"choices":\ndata: [{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n',
    );
  assert.equal(await collect(fetcher), "ok");
});
test("HTTP failures return useful errors without leaking upstream response bodies", async () => {
  for (const [status, message] of [
    [401, "密钥"],
    [402, "余额"],
    [429, "频繁"],
    [400, "模型"],
    [503, "不可用"],
  ] as const) {
    const fetcher: typeof fetch = async () =>
      new Response("private upstream detail test-key", { status });
    await assert.rejects(
      () => collect(fetcher),
      (error) =>
        error instanceof OpenRouterError &&
        error.message.includes(message) &&
        !error.message.includes("test-key"),
    );
  }
});
test("mid-stream provider errors, length limits and truncated connections fail rather than producing saved plans", async () => {
  for (const sse of [
    'data: {"error":{"message":"private detail"}}\n\n',
    'data: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n',
    frame('{"goal":"partial"}'),
  ]) {
    await assert.rejects(
      () => collect(async () => response(sse)),
      OpenRouterError,
    );
  }
});
test("goal generation preserves partial/final identity, language and parent task time constraints", async (t) => {
  const previousKey = process.env.OPENROUTER_API_KEY,
    previousModel = process.env.OPENROUTER_MODEL;
  process.env.OPENROUTER_API_KEY = "test-key";
  process.env.OPENROUTER_MODEL = "test/model";
  t.after(() => {
    if (previousKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.OPENROUTER_MODEL;
    else process.env.OPENROUTER_MODEL = previousModel;
  });
  const raw = {
    goal: "整理素材",
    summary: "从素材开始",
    motivationalQuote: "开始行动",
    phases: [],
  };
  let sentPrompt = "";
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init: RequestInit) => {
      sentPrompt = JSON.parse(String(init.body)).messages[0].content;
      return response(
        frame('{"goal":"整理素材",') +
          frame(
            '"summary":"从素材开始","motivationalQuote":"开始行动","phases":[]}',
          ) +
          "data: [DONE]\n\n",
      );
    },
  );
  const partials: string[] = [];
  const plan = await generateGoalPlan("整理素材", "zh", {
    parentContext: "完成作品集",
    parentTaskContext: {
      duration: "45 minutes",
      description: "整理三个项目",
      isRecurring: false,
    },
    onPartialUpdate: (plan) => partials.push(plan.id),
  });
  assert.equal(plan.goal, raw.goal);
  assert.ok(partials.length > 0);
  assert.ok(partials.every((id) => id === plan.id));
  assert.match(sentPrompt, /45 minutes/);
  assert.match(sentPrompt, /完成作品集/);
  assert.match(sentPrompt, /CHINESE/);
});
