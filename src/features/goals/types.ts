export type Language = "en" | "zh";

export enum Difficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
}

export enum TaskType {
  Research = "Research",
  Action = "Action",
  Milestone = "Milestone",
  Preparation = "Preparation",
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  estimatedDuration: string; // e.g., "1 hour", "1.5 hours"
  difficulty: Difficulty;
  type: TaskType;
  isBreakable: boolean; // True if this task can be further decomposed into a sub-protocol
}

export interface PlanPhase {
  id: string;
  title: string; // e.g., "Phase 1: Conditioning"
  description: string;
  duration: string; // e.g., "Weeks 1-4"
  isRecurring: boolean; // True if this represents a daily/weekly cycle
  frequency?: string; // e.g., "Daily", "Every Monday"
  steps: PlanStep[];
}

export interface RemainingWork {
  sourceKey: string;
  stepId: string;
  title: string;
  reason: string;
  estimatedMinutes: number | null;
}
export interface PlanningHorizon {
  outcome: string;
  reviewDate: string;
  remainingWork: RemainingWork[];
}
export interface PlanResponse {
  id: string; // Unique ID for the plan itself
  parentId?: string; // ID of the parent plan if this is a sub-protocol
  parentStepId?: string;
  goal: string;
  summary: string;
  motivationalQuote: string;
  phases: PlanPhase[];
  horizon?: PlanningHorizon;
  planning?: {
    mode?: "rolling" | "strict";
    currentSituation?: string;
    successCriteria?: string;
    startDate: string;
    endDate: string;
    dailyMinutes: number;
    taskMinutes?: number; // Maximum duration of a concrete action; absent in legacy plans.
    weekdays: number[];
  };
  createdAt: number;
}

export interface ChartData {
  name: string;
  value: number;
}
