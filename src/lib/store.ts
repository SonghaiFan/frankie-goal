import { resolveDecomposition } from "./decomposition";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PlanResponse, Language } from "@/features/goals/types";
import type { TimeBlockContent } from "@/types/time";
import {
  normalizePlanner,
  parseBackup,
  parseLocalDate,
  validateRange,
  type PlannerData,
  type WorkspaceData,
} from "./goal-data";
import { validateDailyDraft, type DailyDraft } from "./daily-plan";
import { toast } from "sonner";

interface Store extends WorkspaceData {
  language: Language;
  lastSavedAt: Date | null;
  isSaving: boolean;
  setLanguage: (language: Language) => void;
  setData: (data: PlannerData) => void;
  updateBlockMetadata: (id: string, content: TimeBlockContent) => void;
  resetData: () => void;
  importData: (value: unknown) => void;
  exportData: () => WorkspaceData & { version: 1 };
  saveChanges: () => Promise<void>;
  addPlan: (plan: PlanResponse) => void;
  deletePlan: (id: string) => void;
  scheduleTask: (planId: string, stepId: string, date: string) => void;
  applyDailyPlan: (planId: string, draft: DailyDraft) => void;
  startTask: (id: string) => void;
  toggleTask: (id: string) => void;
  unscheduleTask: (id: string) => void;
}
const now = new Date();
now.setHours(0, 0, 0, 0);
const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
const emptyMetadata: Record<string, TimeBlockContent> = {};
export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      data: { dateRange: { from: now, to: end }, metadata: {} },
      plans: [],
      tasks: [],
      language: "zh",
      lastSavedAt: null,
      isSaving: false,
      setLanguage: (language) => set({ language }),
      setData: (data) => {
        validateRange(data.dateRange);
        set({ data, lastSavedAt: new Date() });
      },
      updateBlockMetadata: (id, content) =>
        set((s) => ({
          data: s.data
            ? { ...s.data, metadata: { ...s.data.metadata, [id]: content } }
            : null,
          lastSavedAt: new Date(),
        })),
      resetData: () => set({ data: null, tasks: [], lastSavedAt: new Date() }),
      addPlan: (plan) =>
        set((s) => ({
          plans: [plan, ...s.plans.filter((p) => p.id !== plan.id)],
          lastSavedAt: new Date(),
        })),
      deletePlan: (id) =>
        set((s) => ({
          plans: s.plans.filter((p) => p.id !== id),
          tasks: s.tasks.filter((t) => t.planId !== id),
          lastSavedAt: new Date(),
        })),
      scheduleTask: (planId, stepId, date) => {
        const state = get(),
          day = parseLocalDate(date);
        if (
          !state.plans.some(
            (p) =>
              p.id === planId &&
              p.phases.some((ph) => ph.steps.some((s) => s.id === stepId)),
          )
        )
          throw new Error("找不到任务");
        const current = state.data?.dateRange;
        const dateRange = {
          from: current && current.from < day ? current.from : day,
          to: current && current.to > day ? current.to : day,
        };
        validateRange(dateRange);
        if (
          state.tasks.some(
            (t) => t.planId === planId && t.stepId === stepId && t.batchId,
          )
        )
          throw new Error("该步骤已拆成每日行动，请使用每日计划重新规划日期");
        const existing = state.tasks.find(
          (t) => t.planId === planId && t.stepId === stepId,
        );
        set({
          data: { dateRange, metadata: state.data?.metadata || {} },
          tasks: [
            ...state.tasks.filter((t) => t !== existing),
            {
              id: existing?.id || crypto.randomUUID(),
              planId,
              stepId,
              date,
              done: existing?.done || false,
            },
          ],
          lastSavedAt: new Date(),
        });
      },
      applyDailyPlan: (planId, draft) => {
        const state = get(),
          plan = state.plans.find((p) => p.id === planId);
        if (!plan) throw new Error("找不到目标");
        if (!draft.actions.length) throw new Error("本期没有可执行行动，请调整日期或可用时间后重新生成");
        validateDailyDraft(plan, draft, state.tasks, state.plans);
        const batchId = crypto.randomUUID();
        const actionIds = new Map(draft.actions.map((a) => [a.actionId, crypto.randomUUID()]));
        const sources = resolveDecomposition(plan, state.plans).sources;
        const tasks = [
          ...state.tasks.filter((t) => t.planId !== planId || t.done),
          ...draft.actions.map((a) => ({
            id: (a.actionId ? actionIds.get(a.actionId) : undefined) || crypto.randomUUID(),
            planId,
            stepId: a.stepId,
            date: a.date,
            done: false,
            title: a.title,
            description: a.description,
            minutes: a.minutes,
            batchId,
            ...(a.sourceKey ? {
              sourceKey: a.sourceKey,
              sourcePath: sources.find((s) => s.key === a.sourceKey)?.path,
              acceptance: a.acceptance,
              dependsOn: a.dependsOn?.map((id) => actionIds.get(id)!),
            } : {}),
          })),
        ];
        const current = state.data?.dateRange,
          from = parseLocalDate(draft.settings.startDate),
          to = parseLocalDate(draft.settings.endDate);
        const dateRange = {
          from: current && current.from < from ? current.from : from,
          to: current && current.to > to ? current.to : to,
        };
        validateRange(dateRange);
        set({
          tasks,
          plans: state.plans.map((p) =>
            p.id === planId ? { ...p, planning: draft.settings, horizon: draft.horizon } : p,
          ),
          data: { dateRange, metadata: state.data?.metadata || {} },
          lastSavedAt: new Date(),
        });
      },
      startTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id && !t.done ? { ...t, startedAt: new Date().toISOString() } : t), lastSavedAt: new Date() })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t,
          ),
          lastSavedAt: new Date(),
        })),
      unscheduleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          lastSavedAt: new Date(),
        })),
      importData: (value) => {
        const imported = parseBackup(value),
          state = get();
        if (imported.kind === "workspace")
          set({ ...imported.value, lastSavedAt: new Date() });
        else if (imported.kind === "planner")
          set({ data: imported.value.data, lastSavedAt: new Date() });
        else {
          // Preserve existing plans and schedules if an imported ID conflicts.
          const plans = imported.value.plans.map((p) => ({ ...p }));
          const ids = new Map(
            plans.map((p) => [
              p.id,
              state.plans.some((old) => old.id === p.id)
                ? crypto.randomUUID()
                : p.id,
            ]),
          );
          for (const p of plans) {
            p.id = ids.get(p.id)!;
            if (p.parentId) p.parentId = ids.get(p.parentId) || p.parentId;
          }
          set({ plans: [...plans, ...state.plans], lastSavedAt: new Date() });
        }
      },
      exportData: () => {
        const { data, plans, tasks } = get();
        return { version: 1, data, plans, tasks };
      },
      saveChanges: async () => {
        set({ lastSavedAt: new Date() });
        toast.success("已保存到此浏览器");
      },
    }),
    {
      name: "frankie-goal-v1",
      version: 1,
      storage: createJSONStorage(() => window.localStorage),
      partialize: ({ data, plans, tasks, language, lastSavedAt }) => ({
        data,
        plans,
        tasks,
        language,
        lastSavedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.data) state.data = normalizePlanner(state.data);
        if (state.lastSavedAt) state.lastSavedAt = new Date(state.lastSavedAt);
      },
    },
  ),
);
export const useData = () => useStore((s) => s.data);
export const useDateRange = () => useStore((s) => s.data?.dateRange ?? null);
export const useMetadata = () =>
  useStore((s) => s.data?.metadata ?? emptyMetadata);
export const useIsSaving = () => useStore((s) => s.isSaving);
export const useLastSavedAt = () => useStore((s) => s.lastSavedAt);
export const useHasCachedData = () => useStore((s) => Boolean(s.data));
export const useStoreActions = () => ({
  setData: useStore((s) => s.setData),
  updateBlockMetadata: useStore((s) => s.updateBlockMetadata),
  resetData: useStore((s) => s.resetData),
  importData: useStore((s) => s.importData),
  exportData: useStore((s) => s.exportData),
  saveChanges: useStore((s) => s.saveChanges),
});
