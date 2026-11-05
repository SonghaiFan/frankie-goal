export interface DateRange {
  from: Date;
  to: Date;
}

export type ViewMode = "season" | "month" | "week" | "day";

export interface TimeBlockContent {
  id: string;
  title: string;
  notes: string;
  tags: string[];
  status: "todo" | "in-progress" | "done";
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeBlockHierarchy {
  parentId?: string;
  childIds: string[];
  level: ViewMode;
}

export interface TimeBlock {
  id?: string;
  date: Date;
  startDateTime: Date;
  endDateTime: Date;
  label?: string;
  seasonIndex?: number;
  monthIndex?: number;
  weekIndex?: number;
  dayIndex?: number;
  hierarchy?: TimeBlockHierarchy;
}

export interface EditableTimeBlock extends TimeBlock {
  id: string;
  content: TimeBlockContent;
}

export type TimeBlockStore = {
  blocks: Record<string, EditableTimeBlock>;
  hierarchy: Record<string, TimeBlockHierarchy>;
  metadata: Record<string, TimeBlockContent>;
};
