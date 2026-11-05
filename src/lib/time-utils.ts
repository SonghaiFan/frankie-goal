import {
  isWithinInterval,
  isSameQuarter,
  isSameMonth,
  isSameWeek,
  isSameDay,
  startOfQuarter,
  endOfQuarter,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  eachQuarterOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachDayOfInterval,
  format,
  areIntervalsOverlapping,
  addDays,
} from "date-fns";
import type {
  TimeBlock,
  ViewMode,
  TimeBlockContent,
  EditableTimeBlock,
} from "@/types/time";
import { generateBlockId } from "./block-utils";

export function getBlockStatus(
  block: EditableTimeBlock,
  currentTime: Date = new Date()
): TimeBlockContent["status"] {
  if (currentTime < block.startDateTime) {
    return "todo";
  }

  if (currentTime > block.endDateTime) {
    return "done";
  }

  return "in-progress";
}

export function getTimeRangeText(block: EditableTimeBlock): string {
  return `${format(block.startDateTime, "p")} - ${format(
    block.endDateTime,
    "p"
  )}`;
}

export function calculateBlockProgress(
  block: EditableTimeBlock,
  currentTime: Date
): number {
  if (currentTime < block.startDateTime) return 0;
  if (currentTime > block.endDateTime) return 100;

  const totalDuration =
    block.endDateTime.getTime() - block.startDateTime.getTime();
  const elapsedDuration = currentTime.getTime() - block.startDateTime.getTime();
  const progress = Math.min(100, (elapsedDuration / totalDuration) * 100);

  // Round to 2 decimal places for consistent formatting
  return Math.round(progress * 100) / 100;
}

export function getSeasonBlocks(dateRange: {
  start: Date;
  end: Date;
}): TimeBlock[] {
  const months = eachMonthOfInterval(dateRange);
  const seasons: TimeBlock[] = [];

  months.forEach((date, index) => {
    const seasonIndex = Math.floor(date.getMonth() / 3);
    const existingSeasonIndex = seasons.findIndex(
      (s) => s.seasonIndex === seasonIndex && s.date.getFullYear() === date.getFullYear()
    );

    if (existingSeasonIndex === -1) {
      const seasonName = `Q${seasonIndex + 1}`;
      const year = date.getFullYear();
      const startDateTime = startOfQuarter(date);
      const endDateTime = endOfQuarter(date);
      seasons.push({
        date,
        label: `${seasonName} ${year}`,
        seasonIndex,
        id: `season-${year}-${seasonIndex}`,
        startDateTime,
        endDateTime,
      });
    }
  });

  return seasons;
}

export function getMonthBlocks(dateRange: {
  start: Date;
  end: Date;
}): TimeBlock[] {
  const months = eachMonthOfInterval(dateRange);

  return months.map((date, index) => ({
    date,
    label: format(date, "MMMM yyyy"),
    monthIndex: index,
    seasonIndex: Math.floor(date.getMonth() / 3),
    id: `month-${format(date, "yyyy-MM")}`,
    startDateTime: startOfMonth(date),
    endDateTime: endOfMonth(date),
  }));
}

export function getWeekBlocks(dateRange: {
  start: Date;
  end: Date;
}): TimeBlock[] {
  const weeks = eachWeekOfInterval(dateRange, { weekStartsOn: 1 });

  return weeks.map((date, index) => {
    const endOfWeekDate = endOfWeek(date, { weekStartsOn: 1 });
    return {
      date,
      label: `${format(date, "MMM d")} - ${format(endOfWeekDate, "MMM d")}`,
      weekIndex: index,
      monthIndex: date.getMonth(),
      seasonIndex: Math.floor(date.getMonth() / 3),
      id: `week-${format(date, "yyyy-MM-ww")}`,
      startDateTime: startOfWeek(date, { weekStartsOn: 1 }),
      endDateTime: endOfWeekDate,
    };
  });
}

export function getDayBlocks(dateRange: {
  start: Date;
  end: Date;
}): TimeBlock[] {
  const days = eachDayOfInterval(dateRange);

  return days.map((date, index) => {
    const start = startOfDay(date);
    const end = endOfDay(date);

    return {
      date,
      label: format(date, "EEEE, MMMM d"),
      dayIndex: index,
      weekIndex: Math.floor(index / 7),
      monthIndex: date.getMonth(),
      seasonIndex: Math.floor(date.getMonth() / 3),
      id: `day-${format(date, "yyyy-MM-dd")}`,
      startDateTime: start,
      endDateTime: end,
    };
  });
}

export function generateTimeBlocks({
  start,
  end,
  view,
}: {
  start: Date;
  end: Date;
  view: ViewMode;
}): TimeBlock[] {
  switch (view) {
    case "season":
      return getSeasonBlocks({ start, end });
    case "month":
      return getMonthBlocks({ start, end });
    case "week":
      return getWeekBlocks({ start, end });
    case "day":
      return getDayBlocks({ start, end });
  }
}

export function areBlocksRelated(
  blockA: EditableTimeBlock,
  blockB: EditableTimeBlock
): boolean {
  return areIntervalsOverlapping(
    { start: blockA.startDateTime, end: blockA.endDateTime },
    { start: blockB.startDateTime, end: blockB.endDateTime }
  );
}
