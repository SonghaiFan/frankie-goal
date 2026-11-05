import { useState } from "react";
import {
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
} from "date-fns";
import type { TimeBlock, DateRange } from "@/types/time";

export function useTimeBlocks(dateRange: DateRange) {
  const [hoveredBlock, setHoveredBlock] = useState<TimeBlock | null>(null);

  const getTimePeriodSummary = () => {
    if (!dateRange.from || !dateRange.to) return null;

    const days = differenceInDays(dateRange.to, dateRange.from);
    const weeks = differenceInWeeks(dateRange.to, dateRange.from);
    const months = differenceInMonths(dateRange.to, dateRange.from);
    const seasons = Math.ceil(months / 3);

    return `${days} days, ${weeks} weeks, ${months} months, ${seasons} season`;
  };

  return {
    hoveredBlock,
    setHoveredBlock,
    getTimePeriodSummary,
  };
}
