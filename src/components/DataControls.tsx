"use client";
import { useRef } from "react";
import { useStore } from "@/lib/store";
import { Button } from "./ui/button";
import { toast } from "sonner";
export function DataControls() {
  const input = useRef<HTMLInputElement>(null),
    exportData = useStore((s) => s.exportData),
    importData = useStore((s) => s.importData);
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(exportData(), null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `franklin-goal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={download}>
        导出备份
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => input.current?.click()}
      >
        导入数据
      </Button>
      <input
        ref={input}
        aria-label="导入 JSON 数据"
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            if (file.size > 10 * 1024 * 1024)
              throw new Error("文件不能超过 10 MB");
            const data = JSON.parse(await file.text());
            if (
              !window.confirm(
                "导入备份将替换其中的时间规划；完整备份还将替换目标与日程。是否继续？",
              )
            )
              return;
            importData(data);
            toast.success("导入完成");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "导入失败");
          }
        }}
      />
    </div>
  );
}
