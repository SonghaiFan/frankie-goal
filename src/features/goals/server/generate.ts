import { DECOMPOSITION_METHOD } from "../../../lib/decomposition.ts";
import type { PlanResponse, Language } from "../types";
import { streamOpenRouter, OpenRouterError } from "./openrouter.ts";
interface TaskContext {
  duration: string;
  description?: string;
  isRecurring?: boolean;
}
interface GenOptions {
  parentContext?: string;
  parentTaskContext?: TaskContext;
  onPartialUpdate?: (plan: PlanResponse) => void;
  signal?: AbortSignal;
}
const naiveJsonRepair = (jsonStr: string): string => {
  let modified = jsonStr.trim();

  // Remove markdown code blocks if present
  if (modified.startsWith("```json")) {
    modified = modified.replace(/^```json/, "");
  }
  if (modified.startsWith("```")) {
    modified = modified.replace(/^```/, "");
  }
  // We don't remove the trailing ``` yet because the string might be incomplete

  // Basic stack to track open brackets/braces
  const stack = [];
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < modified.length; i++) {
    const char = modified[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{" || char === "[") {
        stack.push(char);
      } else if (char === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
        }
      } else if (char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  // Append missing closing brackets in reverse order
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === "{") modified += "}";
    if (open === "[") modified += "]";
  }

  return modified;
};

export async function generateGoalPlan(
  goal: string,
  language: Language,
  options: GenOptions = {},
): Promise<PlanResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new OpenRouterError("请先配置 OPENROUTER_API_KEY。");
  const parentContextInfo = options.parentContext
    ? `CONTEXT: This goal is a sub-component of a larger objective: "${options.parentContext}".`
    : "CONTEXT: This is a Root Level objective.";

  let timeConstraintInfo = "";
  if (options.parentTaskContext) {
    timeConstraintInfo = `
      CRITICAL CONSTRAINTS:
      1. TOTAL DURATION LIMIT: The entire plan must fit within "${options.parentTaskContext.duration}".
      2. SCOPE: Bound by parent task description: "${options.parentTaskContext.description || "N/A"}".
      ${options.parentTaskContext.isRecurring ? "3. RECURRENCE: This defines the routine for a single cycle of the parent task." : ""}
      `;
  }

  const langInstruction =
    language === "zh"
      ? "OUTPUT LANGUAGE: CHINESE (Simplified). All titles, descriptions, summaries, and quotes MUST be in Chinese."
      : "OUTPUT LANGUAGE: ENGLISH.";

  // --- FIRST PRINCIPLES STRATEGY PROMPT ---
  const adaptivePrompt = `
    Act as a Strategic Architect using **FIRST PRINCIPLES THINKING**.
    User Goal: "${goal}"
    ${parentContextInfo}
    ${timeConstraintInfo}
    ${langInstruction}

    SHARED DECOMPOSITION METHOD: ${DECOMPOSITION_METHOD}

    YOUR CORE PHILOSOPHY:
    1. **Reject Analogy**: Do not simply copy how others do things. Do not produce a generic "to-do list".
    2. **Boil Down to Axioms**: Deconstruct the goal into its most fundamental truths. What is actually required to make this happen from a logic standpoint?
    3. **Rebuild from Ground Up**: Construct a protocol based *only* on these fundamental components.
    4. **Optimize for Efficiency**: Find the most direct path between the current state and the goal state, ignoring convention.

    --- DECISION LOGIC (MACRO vs MICRO) ---

    **CASE A: MACRO STRATEGY (Strategic/High-Level)**
    - TRIGGER: If the goal takes **MORE THAN 24 HOURS**, requires learning, or complex assembly.
    - STRUCTURE: 
       1. **Phases**: Group steps into logical Phases.
       2. **Steps**: MIXED DURATIONS ALLOWED. 
          - **Simple Steps**: Use **HOURS**.
          - **Complex Steps**: Use **DAYS** or **WEEKS**.
       3. **'isBreakable'**: **TRUE** for most steps.

    **CASE B: MICRO STRATEGY (Tactical/Execution)**
    - TRIGGER: If the goal is a specific task (< 24 HOURS) or has a strict "TOTAL DURATION LIMIT" (e.g. "1 Hour").
    - STRUCTURE:
       1. **Phases**: Return exactly ONE Phase named "Execution Protocol" (or "执行流程").
       2. **Steps**: Must be **HOURS** or **MINUTES**.
       3. **'isBreakable'**: MUST be **FALSE**.

    **OVERRIDE RULE:**
    If a "TOTAL DURATION LIMIT" is provided, you MUST strictly respect it.

    --- CONTENT REQUIREMENTS ---
    - **Goal Title**: Simplify the user's input into a concise, punchy title (max 5-7 words).
    - **Summary**: Explain the "First Principles" logic. Why is this the most efficient path? What fundamental truth is this based on?
    - **Motivational Quote**: Provide a quote about that fits the context.
    - **Steps**: Be actionable, direct, and non-bureaucratic.

    Every step ID must be unique across all phases. Return an empty frequency string for non-recurring phases.
    GENERATE THE JSON NOW based on this First Principles analysis.
  `;

  const planId = crypto.randomUUID(),
    createdAt = Date.now();
  let accumulatedText = "";
  for await (const content of streamOpenRouter(adaptivePrompt, {
    apiKey,
    model: process.env.OPENROUTER_MODEL || "google/gemini-3.1-pro-preview",
    signal: options.signal,
  })) {
    accumulatedText += content;
    if (options.onPartialUpdate) {
      try {
        const partial = JSON.parse(naiveJsonRepair(accumulatedText));
        if (partial.goal || partial.phases)
          options.onPartialUpdate({
            id: planId,
            createdAt,
            goal: partial.goal || goal,
            summary: partial.summary || "",
            motivationalQuote: partial.motivationalQuote || "",
            phases: partial.phases || [],
          });
      } catch {
        /* Incomplete JSON is expected during generation. */
      }
    }
  }
  // Never repair a final truncated response into an apparently complete plan.
  try {
    const parsed = JSON.parse(accumulatedText.trim());
    return { ...parsed, id: planId, createdAt };
  } catch {
    throw new OpenRouterError(
      "OpenRouter 返回的目标格式不完整，请重试或更换支持结构化输出的模型。",
    );
  }
}
