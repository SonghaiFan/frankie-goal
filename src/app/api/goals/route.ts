import { generateGoalPlan } from "@/features/goals/server/generate";
import { validatePlan } from "@/lib/goal-data";
import { OpenRouterError } from "@/features/goals/server/openrouter";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求格式无效" }, { status: 400 });
  }
  if (
    !body ||
    typeof body.goal !== "string" ||
    !body.goal.trim() ||
    body.goal.length > 5000 ||
    !["en", "zh"].includes(body.language)
  )
    return Response.json(
      { error: "请填写目标（最多 5000 字）并选择语言" },
      { status: 400 },
    );
  if (
    body.parentContext !== undefined &&
    (typeof body.parentContext !== "string" || body.parentContext.length > 5000)
  )
    return Response.json({ error: "上层目标无效" }, { status: 400 });
  if (
    body.parentTaskContext !== undefined &&
    (!body.parentTaskContext ||
      typeof body.parentTaskContext.duration !== "string" ||
      body.parentTaskContext.duration.length > 200 ||
      typeof body.parentTaskContext.description !== "string" ||
      body.parentTaskContext.description.length > 5000 ||
      typeof body.parentTaskContext.isRecurring !== "boolean")
  )
    return Response.json({ error: "任务约束无效" }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY)
    return Response.json(
      {
        error:
          "请先在 .env.local 中配置 OPENROUTER_API_KEY，再重启服务。手动目标与时间规划仍可使用。",
      },
      { status: 503 },
    );
  const generationController = new AbortController();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    cancel() {
      generationController.abort();
    },
    async start(controller) {
      let closed = false;
      const send = (value: unknown) => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(value) + "\n"));
          } catch {
            closed = true;
          }
        }
      };
      try {
        const plan = await generateGoalPlan(body.goal.trim(), body.language, {
          signal: AbortSignal.any([
            request.signal,
            generationController.signal,
            AbortSignal.timeout(110_000),
          ]),
          parentContext: body.parentContext,
          parentTaskContext: body.parentTaskContext,
          onPartialUpdate: (plan) => send({ type: "partial", plan }),
        });
        send({ type: "complete", plan: validatePlan(plan) });
      } catch (error) {
        send({
          type: "error",
          error:
            error instanceof OpenRouterError
              ? error.message
              : "目标生成失败或超时，请检查 OpenRouter 配置和网络后重试。",
        });
      } finally {
        if (!closed) {
          closed = true;
          controller.close();
        }
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
