import { format, startOfQuarter, startOfMonth, startOfWeek } from "date-fns";
export type BlockLevel = "season" | "month" | "week" | "day";
export interface BlockIndices {
  seasonIndex?: number;
  monthIndex?: number;
  weekIndex?: number;
  dayIndex?: number;
}
export interface BlockIdentifier {
  level: BlockLevel;
  indices: BlockIndices;
  date: Date;
}

// Calendar identity is independent of the selected range and array position.
// Keep the original three-part ID shape so legacy imports remain readable.
export function generateBlockId({ level, date }: BlockIdentifier): string {
  const stableDate =
    level === "season"
      ? startOfQuarter(date)
      : level === "month"
        ? startOfMonth(date)
        : level === "week"
          ? startOfWeek(date, { weekStartsOn: 1 })
          : date;
  return `${level}-${format(stableDate, "yyyyMMdd")}-0`;
}
