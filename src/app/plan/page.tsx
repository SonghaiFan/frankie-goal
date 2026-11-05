"use client";
import { useEffect, useState } from "react";
import { NextAction } from "@/components/NextAction";
import { AppNavigation } from "@/components/AppNavigation";
import { TimeBlockView } from "@/components/TimeBlockView";
import { ScheduledTasks } from "@/components/ScheduledTasks";
import { DataControls } from "@/components/DataControls";
import { SaveIndicator } from "@/components/SaveIndicator";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { localDate, parseLocalDate } from "@/lib/goal-data";
import { useDatasets } from "@/hooks/useDatasets";
import { toast } from "sonner";

export default function PlanPage() {
  const data = useStore((s) => s.data),
    setData = useStore((s) => s.setData),
    importData = useStore((s) => s.importData);
  const [mounted, setMounted] = useState(false);
  const { datasets } = useDatasets();
  useEffect(() => setMounted(true), []);
  function changeDate(value: string, isStart: boolean) {
    if (!data || !value) return;
    try {
      setData({
        ...data,
        dateRange: {
          ...data.dateRange,
          [isStart ? "from" : "to"]: parseLocalDate(value),
        },
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function loadExample(filename: string) {
    if (!filename) return;
    if (
      !window.confirm("示例将替换当前时间块笔记；目标与日程会保留。是否继续？")
    )
      return;
    try {
      const response = await fetch(`/data/${encodeURIComponent(filename)}`);
      if (!response.ok) throw new Error("示例加载失败");
      importData(await response.json());
      toast.success("已加载示例");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <>
      <AppNavigation />
      <main className="container py-6 space-y-6">
        <header className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold">今天，先向前一点</h1>
              <p className="text-sm text-muted-foreground mt-1">
                计划可以调整，已经做过的不会清零。
              </p>
            </div>
            <DataControls />
          </div>
          {mounted && data && (
            <details><summary className="text-sm cursor-pointer text-muted-foreground">需要时调整日历范围</summary>
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm">
                开始日期{" "}
                <input
                  aria-label="开始日期"
                  type="date"
                  value={localDate(data.dateRange.from)}
                  onChange={(e) => changeDate(e.target.value, true)}
                  className="border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-sm">
                结束日期{" "}
                <input
                  aria-label="结束日期"
                  type="date"
                  value={localDate(data.dateRange.to)}
                  onChange={(e) => changeDate(e.target.value, false)}
                  className="border rounded px-2 py-1.5"
                />
              </label>
              {datasets.length > 0 && (
                <select
                  aria-label="加载示例"
                  defaultValue=""
                  onChange={(e) => {
                    void loadExample(e.target.value);
                    e.target.value = "";
                  }}
                  className="text-sm border rounded p-2 max-w-60"
                >
                  <option value="">加载示例…</option>
                  {datasets.map((d) => (
                    <option key={d.id} value={d.filename}>
                      {d.title}
                    </option>
                  ))}
                </select>
              )}
              <SaveIndicator />
            </div></details>
          )}
        </header>
        {!mounted ? (
          <p>正在加载…</p>
        ) : (
          <>
            <NextAction />
            <details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm">查看完整计划与已完成行动</summary><div className="mt-4"><ScheduledTasks /></div></details>
            <details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm">查看时间日历</summary>
            {data ? (
              <TimeBlockView dateRange={data.dateRange} />
            ) : (
              <Button
                onClick={() => {
                  const from = new Date();
                  from.setHours(0, 0, 0, 0);
                  setData({
                    dateRange: {
                      from,
                      to: new Date(from.getFullYear(), from.getMonth() + 1, 0),
                    },
                    metadata: {},
                  });
                }}
              >
                查看时间规划
              </Button>
            )}</details>
          </>
        )}
      </main>
    </>
  );
}
