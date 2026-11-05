"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditableTimeBlock, TimeBlockContent } from "@/types/time";
import { format } from "date-fns";
import { Calendar, X } from "lucide-react";
import dynamic from "next/dynamic";
import { ScheduledTasks } from "./ScheduledTasks";
import { localDate } from "@/lib/goal-data";
const MarkdownEditor=dynamic(()=>import("@/components/ui/markdown-editor").then(m=>m.MarkdownEditor),{ssr:false});
import { StatusIcon } from "@/components/ui/status-icon";
import { getBlockStatus, calculateBlockProgress } from "@/lib/time-utils";
import { Progress } from "@/components/ui/progress";
import { useTime } from "@/hooks/useTime";
import { THEME, TagColor } from "@/lib/settings";
import { TagSelect } from "@/components/ui/tag-select";
import { cn } from "@/lib/utils";

interface TimeBlockDialogProps {
  block: EditableTimeBlock;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (block: EditableTimeBlock) => void;
}

export function TimeBlockDialog({
  block,
  open,
  onOpenChange,
  onSave,
}: TimeBlockDialogProps) {
  const currentTime = useTime();
  const progress = calculateBlockProgress(block, currentTime);
  const status = getBlockStatus(block);

  const [editedBlock, setEditedBlock] = useState<
    EditableTimeBlock & { content: TimeBlockContent }
  >(() => ({
    ...block,
    content: {
      id: block.id,
      title: block.content?.title || block.label || "",
      notes: block.content?.notes || "",
      tags: block.content?.tags || [],
      status: block.content?.status || getBlockStatus(block),
      createdAt: block.content?.createdAt || new Date(),
      updatedAt: block.content?.updatedAt || new Date(),
    },
  }));

  const handleContentUpdate = (update: Partial<TimeBlockContent>) => {
    setEditedBlock((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        ...update,
        updatedAt: new Date(),
      },
    }));
  };

  const getHierarchyText = () => {
    const parts = [];
    if (block.seasonIndex !== undefined)
      parts.push(`Season ${block.seasonIndex + 1}`);
    if (block.monthIndex !== undefined)
      parts.push(`Month ${block.monthIndex + 1}`);
    if (block.weekIndex !== undefined)
      parts.push(`Week ${block.weekIndex + 1}`);
    if (block.dayIndex !== undefined) parts.push(`Day ${block.dayIndex + 1}`);
    return parts.join(" > ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-4 pb-4 border-b">
          <DialogDescription className="sr-only">编辑此时间块的标题、笔记和标签，并查看关联目标行动。</DialogDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon status={status} size="lg" />
              <div className="space-y-1">
                <DialogTitle className="text-xl">
                  {editedBlock.content.title || "Untitled Block"}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{getHierarchyText()}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                    {block.id}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {Math.round(progress)}%
              </div>
              <div className="text-xs text-muted-foreground">Time elapsed</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Start</span>
              </div>
              <div className="font-medium">
                {format(block.startDateTime, "MMM d, yyyy")}
                <span className="text-muted-foreground ml-2">
                  {format(block.startDateTime, "p")}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>End</span>
              </div>
              <div className="font-medium">
                {format(block.endDateTime, "MMM d, yyyy")}
                <span className="text-muted-foreground ml-2">
                  {format(block.endDateTime, "p")}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="py-4 space-y-6">
            {block.dayIndex !== undefined && <ScheduledTasks date={localDate(block.date)} />}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Input
                  value={editedBlock.content.title}
                  onChange={(e) =>
                    handleContentUpdate({ title: e.target.value })
                  }
                  placeholder="Enter title"
                  className="text-lg font-medium"
                />
              </div>
              <Progress value={progress} className="h-1" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Tags</label>
                  <span className="text-xs text-muted-foreground">
                    Optional
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    const tags = editedBlock.content.tags;
                    const newTag = `${
                      Object.keys(THEME.tags.colors)[0]
                    }:new-tag`;
                    handleContentUpdate({ tags: [...tags, newTag] });
                  }}
                >
                  <span className="mr-1">+</span> Add Tag
                </Button>
              </div>
              <div className="space-y-2">
                {editedBlock.content.tags.map((tag, index) => {
                  const [
                    color = Object.keys(THEME.tags.colors)[0],
                    label = "",
                  ] = tag.split(":");
                  return (
                    <div
                      key={index}
                      className="group flex items-center gap-2 p-1.5 rounded-lg border bg-card/50 hover:bg-card"
                    >
                      <TagSelect
                        value={color as TagColor}
                        onValueChange={(newColor) => {
                          const newTags = [...editedBlock.content.tags];
                          newTags[index] = `${newColor}:${label}`;
                          handleContentUpdate({ tags: newTags });
                        }}
                      />
                      <Input
                        value={label}
                        onChange={(e) => {
                          const newTags = [...editedBlock.content.tags];
                          newTags[index] = `${color}:${e.target.value}`;
                          handleContentUpdate({ tags: newTags });
                        }}
                        className="flex-1 h-8"
                        placeholder="Tag name"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newTags = [...editedBlock.content.tags];
                          newTags.splice(index, 1);
                          handleContentUpdate({ tags: newTags });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Notes</label>
                  <span className="text-xs text-muted-foreground">
                    Optional
                  </span>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none border rounded-lg">
                <MarkdownEditor
                  key={block.id}
                  value={editedBlock.content.notes}
                  onChange={(value) => handleContentUpdate({ notes: value })}
                  placeholder="Add notes about this time block..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-medium mr-1">Created:</span>
                  {format(editedBlock.content.createdAt, "MMM d, yyyy p")}
                </div>
                {editedBlock.content.updatedAt >
                  editedBlock.content.createdAt && (
                  <div>
                    <span className="font-medium mr-1">Updated:</span>
                    {format(editedBlock.content.updatedAt, "MMM d, yyyy p")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => { onSave(editedBlock); onOpenChange(false); }} className="px-8">
            保存修改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
