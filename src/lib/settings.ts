import { Circle, Timer, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const THEME = {
  status: {
    todo: {
      color: "text-muted-foreground",
      label: "To Do",
      icon: Circle,
    },
    "in-progress": {
      color: "text-amber-500",
      label: "In Progress",
      icon: Timer,
    },
    done: {
      color: "text-emerald-500",
      label: "Done",
      icon: CheckCircle2,
    },
  },
  tags: {
    colors: {
      red: {
        bg: "bg-red-100 dark:bg-red-500/20",
        border: "border-red-200 dark:border-red-500/30",
        text: "text-red-700 dark:text-red-300",
        label: "Red",
      },
      amber: {
        bg: "bg-amber-100 dark:bg-amber-500/20",
        border: "border-amber-200 dark:border-amber-500/30",
        text: "text-amber-700 dark:text-amber-300",
        label: "Amber",
      },
      emerald: {
        bg: "bg-emerald-100 dark:bg-emerald-500/20",
        border: "border-emerald-200 dark:border-emerald-500/30",
        text: "text-emerald-700 dark:text-emerald-300",
        label: "Emerald",
      },
      blue: {
        bg: "bg-blue-100 dark:bg-blue-500/20",
        border: "border-blue-200 dark:border-blue-500/30",
        text: "text-blue-700 dark:text-blue-300",
        label: "Blue",
      },
      purple: {
        bg: "bg-purple-100 dark:bg-purple-500/20",
        border: "border-purple-200 dark:border-purple-500/30",
        text: "text-purple-700 dark:text-purple-300",
        label: "Purple",
      },
      pink: {
        bg: "bg-pink-100 dark:bg-pink-500/20",
        border: "border-pink-200 dark:border-pink-500/30",
        text: "text-pink-700 dark:text-pink-300",
        label: "Pink",
      },
    },
  },
  sizes: {
    icon: {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    },
  },
  views: {
    season: {
      base: "bg-white",
      border: "border-blue-500",
      text: "text-blue-900",
      progress: "bg-blue-100",
      indicator: "text-blue-500",
      size: "w-[150px] h-[150px]",
      label: "Season",
    },
    month: {
      base: "bg-white",
      border: "border-emerald-500",
      text: "text-emerald-900",
      progress: "bg-emerald-100",
      indicator: "text-emerald-500",
      size: "w-[120px] h-[120px]",
      label: "Month",
    },
    week: {
      base: "bg-white",
      border: "border-amber-500",
      text: "text-amber-900",
      progress: "bg-amber-100",
      indicator: "text-amber-500",
      size: "w-[100px] h-[100px]",
      label: "Week",
    },
    day: {
      base: "bg-white",
      border: "border-red-500",
      text: "text-red-900",
      progress: "bg-red-100",
      indicator: "text-red-500",
      size: "w-[80px] h-[80px]",
      label: "Day",
    },
  },
} as const;

export type ViewMode = keyof typeof THEME.views;
export type StatusType = keyof typeof THEME.status;
export type IconSize = keyof typeof THEME.sizes.icon;
export type TagColor = keyof typeof THEME.tags.colors;

export interface StatusConfig {
  color: string;
  label: string;
  icon: LucideIcon;
}

export interface TagConfig {
  bg: string;
  border: string;
  text: string;
  label: string;
}
