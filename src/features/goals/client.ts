import type { Language, PlanResponse } from "./types";
export async function generatePlan(
  goal: string,
  language: Language,
  onPartial: (plan: PlanResponse) => void,
  context?: {
    parentContext: string;
    parentTaskContext: {
      duration: string;
      description: string;
      isRecurring: boolean;
    };
  },
) {
  const response = await fetch("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, language, ...context }),
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || "生成失败");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("无法读取生成结果");
  const decoder = new TextDecoder();
  let buffer = "",
    result: PlanResponse | undefined;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const message = JSON.parse(line);
    if (message.type === "error") throw new Error(message.error);
    if (message.type === "partial") onPartial(message.plan);
    if (message.type === "complete") result = message.plan;
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      lines.forEach(consume);
      if (done) break;
    }
    consume(buffer);
  } finally {
    reader.releaseLock();
  }
  if (!result) throw new Error("生成被中断，请重试");
  return result;
}
