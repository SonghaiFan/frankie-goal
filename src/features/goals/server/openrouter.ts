const text = { type: "string" };
const boolean = { type: "boolean" };
const object = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
export const planSchema = object({
  goal: text,
  summary: text,
  motivationalQuote: text,
  phases: {
    type: "array",
    items: object({
      id: text,
      title: text,
      description: text,
      duration: text,
      isRecurring: boolean,
      frequency: {
        type: "string",
        description:
          "Recurrence frequency, or an empty string for a non-recurring phase",
      },
      steps: {
        type: "array",
        items: object({
          id: text,
          title: text,
          description: text,
          estimatedDuration: text,
          isBreakable: boolean,
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
          type: {
            type: "string",
            enum: ["Research", "Action", "Milestone", "Preparation"],
          },
        }),
      },
    }),
  },
});

export class OpenRouterError extends Error {}
interface Options {
  apiKey: string;
  model: string;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
  schema?: Record<string, unknown>;
  schemaName?: string;
}

// Parse complete SSE events before decoding JSON; chunks can split UTF-8 characters,
// JSON tokens, CRLF delimiters, or the [DONE] marker at any byte boundary.
export async function* streamOpenRouter(
  prompt: string,
  options: Options,
): AsyncGenerator<string> {
  const response = await (options.fetcher || fetch)(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
        "X-OpenRouter-Title": "franklin-goal",
      },
      body: JSON.stringify({
        model: options.model,
        stream: true,
        messages: [{ role: "user", content: prompt }],
        provider: { require_parameters: true },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: options.schemaName || "goal_plan",
            strict: true,
            schema: options.schema || planSchema,
          },
        },
      }),
      signal: options.signal,
    },
  );
  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new OpenRouterError(
        "OpenRouter 密钥无效或无访问权限，请检查 OPENROUTER_API_KEY。",
      );
    if (response.status === 402)
      throw new OpenRouterError("OpenRouter 余额不足，请检查账户额度。");
    if (response.status === 429)
      throw new OpenRouterError("OpenRouter 请求过于频繁，请稍后重试。");
    if (response.status === 400 || response.status === 404)
      throw new OpenRouterError(
        "OpenRouter 模型或请求参数不可用，请确认 OPENROUTER_MODEL 支持结构化输出。",
      );
    throw new OpenRouterError("OpenRouter 服务暂时不可用，请稍后重试。");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new OpenRouterError("OpenRouter 未返回可读取的内容。");
  const decoder = new TextDecoder();
  let buffer = "",
    ended = false;
  function parseEvent(event: string): string | undefined {
    const data = event
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return;
    if (data.trim() === "[DONE]") {
      ended = true;
      return;
    }
    let chunk;
    try {
      chunk = JSON.parse(data);
    } catch {
      throw new OpenRouterError("OpenRouter 返回了无法读取的响应，请重试。");
    }
    if (chunk.error)
      throw new OpenRouterError(
        "OpenRouter 生成过程中发生错误，请稍后重试或更换模型。",
      );
    const choice = chunk.choices?.[0];
    if (choice?.finish_reason === "length")
      throw new OpenRouterError(
        "OpenRouter 生成内容达到模型限制，请缩小目标范围后重试。",
      );
    if (
      choice?.finish_reason === "content_filter" ||
      choice?.finish_reason === "error" ||
      choice?.delta?.refusal
    )
      throw new OpenRouterError(
        "OpenRouter 未能完成此次生成，请调整目标后重试。",
      );
    const content = choice?.delta?.content;
    return typeof content === "string" ? content : undefined;
  }
  try {
    while (!ended) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      // Normalize only complete CRLF pairs; a trailing CR remains buffered.
      buffer = buffer.replaceAll("\r\n", "\n");
      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const event = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const content = parseEvent(event);
        if (content) yield content;
        if (ended) break;
      }
      if (done) {
        if (buffer.trim()) {
          const content = parseEvent(buffer);
          if (content) yield content;
        }
        break;
      }
    }
    if (!ended) throw new OpenRouterError("OpenRouter 连接提前中断，请重试。");
  } finally {
    try {
      await reader.cancel();
    } catch {}
    reader.releaseLock();
  }
}
