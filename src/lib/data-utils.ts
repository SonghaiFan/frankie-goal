import { TimeBlockStore, DateRange } from "@/types/time";

export interface ExportedData {
  blocks: TimeBlockStore;
  dateRange: DateRange | null;
}

export function downloadData(data: ExportedData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `time-planner-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedData(jsonString: string): ExportedData {
  const data = JSON.parse(jsonString);
  if (!data.blocks || !data.dateRange) {
    throw new Error("Invalid data format");
  }
  return data;
}
