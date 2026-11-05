"use client";

import { useState } from "react";
import { EditableTimeBlock, ViewMode } from "@/types/time";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TimeBlockDialog } from "./TimeBlockDialog";
import { useStoreActions } from "@/lib/store";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronDown, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { THEME, TagColor } from "@/lib/settings";
import { Circle } from "lucide-react";
import { useStore } from "@/lib/store";
import { localDate } from "@/lib/goal-data";

interface TimeBlockProps {
  block: EditableTimeBlock;
  view: ViewMode;
  progress: number;
  relatedBlocks: string[];
  onHover: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
  selectedBlockId?: string | null;
}

const blockVariants: Variants = {
  initial: {
    scale: 0.97,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
  },
};

const progressVariants: Variants = {
  initial: {
    scaleX: 0,
    opacity: 0,
  },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    opacity: 0.1,
    transition: {
      type: "spring",
      stiffness: 60,
      damping: 20,
    },
  }),
};

const contentVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

const statusVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

const expandedContentVariants: Variants = {
  initial: {
    height: 0,
    opacity: 0,
    scale: 0.98,
  },
  animate: {
    height: "auto",
    opacity: 1,
    scale: 1,
    transition: {
      height: {
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
      opacity: {
        duration: 0.2,
      },
      scale: {
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    scale: 0.98,
    transition: {
      height: {
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
      opacity: {
        duration: 0.15,
      },
      scale: {
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
    },
  },
};

export function TimeBlock({
  block,
  view,
  progress,
  relatedBlocks,
  onHover,
  onSelect,
  selectedBlockId,
}: TimeBlockProps) {
  const tasks = useStore((s) => s.tasks);
  const plans = useStore((s) => s.plans);
  const dailyTasks =
    view === "day" ? tasks.filter((t) => t.date === localDate(block.date)) : [];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { updateBlockMetadata } = useStoreActions();
  const isHighlighted =
    relatedBlocks.includes(block.id) || block.id === selectedBlockId;
  const isSelected = block.id === selectedBlockId;
  const hasContent =
    block.content.title || block.content.notes || block.content.tags.length > 0;

  const tagColor = block.content.tags[0]?.split(":")[0] as TagColor | undefined;
  const tagConfig = tagColor ? THEME.tags.colors[tagColor] : undefined;

  const handleSave = (editedBlock: EditableTimeBlock) => {
    if (!editedBlock.content) return;

    updateBlockMetadata(editedBlock.id, {
      id: editedBlock.content.id,
      title: editedBlock.content.title,
      notes: editedBlock.content.notes,
      tags: editedBlock.content.tags,
      status: editedBlock.content.status,
      createdAt: editedBlock.content.createdAt,
      updatedAt: new Date(),
    });
  };

  const getDateLabel = () => {
    switch (view) {
      case "season":
        return `Q${block.seasonIndex! + 1}`;
      case "month":
        return format(block.date, "MMM");
      case "week":
        return `W${block.weekIndex! + 1}`;
      case "day":
        return format(block.date, "d");
      default:
        return "";
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger selection when clicking buttons
    if ((e.target as HTMLElement).closest("button")) return;

    onSelect?.(isSelected ? null : block.id);
  };

  return (
    <>
      <motion.div
        className={cn(
          "group relative rounded-lg border bg-card overflow-hidden cursor-pointer",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:z-20",
          hasContent
            ? "border-border/50"
            : "border-dashed border-muted-foreground/25",
          isHighlighted && "!border-primary ring-2 ring-primary/30 z-10",
          isSelected && "!border-primary ring-2 ring-primary/50 z-20 shadow-lg",
          isExpanded && "sm:col-span-2 md:col-span-3 lg:col-span-4",
        )}
        variants={blockVariants}
        initial="initial"
        animate="animate"
        layout
        onHoverStart={() => !isSelected && onHover(block.id)}
        onHoverEnd={() => !isSelected && onHover(null)}
        onClick={handleClick}
        whileHover="hover"
        whileTap="tap"
        style={{
          boxShadow: isHighlighted
            ? isSelected
              ? "0 0 0 2px var(--primary), 0 4px 12px rgba(0,0,0,0.1)"
              : "0 0 0 1px var(--primary)"
            : undefined,
        }}
      >
        <motion.div
          className={cn(
            "absolute inset-0 bg-primary/5 transition-opacity duration-200",
            isHighlighted ? "opacity-100" : "opacity-0",
          )}
          initial={false}
          animate={{ opacity: isHighlighted ? 1 : 0 }}
        />
        <motion.div
          className="absolute inset-0 bg-primary origin-left"
          variants={progressVariants}
          initial="initial"
          animate="animate"
          custom={progress}
          style={{
            opacity: isHighlighted ? 0.15 : 0.1,
            transformOrigin: "left",
          }}
        />

        <motion.div
          className={cn(
            "relative w-full py-1 px-2 text-xs font-medium border-b flex items-center justify-between",
            tagConfig
              ? cn(tagConfig.bg, tagConfig.border, tagConfig.text)
              : cn(
                  block.content.status === "done" &&
                    "bg-green-500/10 border-green-500/20",
                  block.content.status === "in-progress" &&
                    "bg-primary/10 border-primary/20",
                  block.content.status === "todo" &&
                    "bg-muted border-border/50",
                ),
          )}
          variants={contentVariants}
        >
          <span>{getDateLabel()}</span>
          <div className="flex items-center gap-1">
            <AnimatePresence mode="wait">
              {block.content.status === "in-progress" && (
                <motion.span
                  className="relative flex h-2 w-2"
                  variants={statusVariants}
                >
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/80" />
                </motion.span>
              )}
              {block.content.status === "done" && (
                <motion.span
                  className="h-2 w-2 rounded-full bg-green-500/80"
                  variants={statusVariants}
                />
              )}
            </AnimatePresence>
            <div className="flex items-center">
              <button
                type="button"
                aria-label="Edit time block"
                className={cn(
                  "h-6 w-6 inline-flex items-center justify-center rounded-sm",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-accent/50 active:bg-accent/70",
                  "transition-colors",
                  "opacity-0 group-hover:opacity-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDialogOpen(true);
                }}
              >
                <span className="sr-only">Edit</span>
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
                aria-expanded={isExpanded}
                className={cn(
                  "h-6 w-6 inline-flex items-center justify-center rounded-sm",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-accent/50 active:bg-accent/70",
                  "transition-colors",
                  "opacity-0 group-hover:opacity-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                <span className="sr-only">
                  {isExpanded ? "Collapse" : "Expand"}
                </span>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="relative p-2">
          <div className="flex items-start justify-between gap-2">
            <motion.div className="flex-1 space-y-2" variants={contentVariants}>
              <div className="min-h-[1.5rem]">
                <p
                  className={cn(
                    "text-sm font-medium leading-tight",
                    !isExpanded && "line-clamp-2",
                  )}
                >
                  {block.content.title || ""}
                </p>
              </div>

              {block.content.tags.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-1"
                  variants={contentVariants}
                >
                  {block.content.tags.map((tag) => {
                    const [
                      color = Object.keys(THEME.tags.colors)[0],
                      label = "",
                    ] = tag.split(":");
                    const tagConfig =
                      THEME.tags.colors[color as TagColor] ||
                      Object.values(THEME.tags.colors)[0];

                    return (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 font-medium transition-all",
                          "hover:scale-105 active:scale-95 cursor-default",
                          tagConfig.bg,
                          tagConfig.border,
                          tagConfig.text,
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <Circle className="h-1.5 w-1.5 fill-current" />
                          {label}
                        </span>
                      </Badge>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          </div>

          {dailyTasks.length > 0 && (
            <div className="space-y-2 border-t pt-2 mt-2">
              <p className="text-[10px] text-muted-foreground">
                每日行动 · {dailyTasks.filter((t) => t.done).length}/
                {dailyTasks.length}
              </p>
              {dailyTasks.map((t) => {
                const title =
                  t.title ||
                  plans
                    .find((p) => p.id === t.planId)
                    ?.phases.flatMap((p) => p.steps)
                    .find((s) => s.id === t.stepId)?.title;
                return (
                  <p
                    key={t.id}
                    className={cn(
                      "text-xs leading-relaxed",
                      t.done && "line-through text-muted-foreground",
                    )}
                  >
                    {t.done ? "✓ " : "○ "}
                    {title}
                    {t.minutes ? ` · ${t.minutes} 分钟` : ""}
                  </p>
                );
              })}
            </div>
          )}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                className="overflow-hidden"
                variants={expandedContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="pt-3 space-y-3 border-t mt-2">
                  {block.content.notes && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{block.content.notes}</ReactMarkdown>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created: {format(block.content.createdAt, "MMM d, yyyy")}
                    {block.content.updatedAt > block.content.createdAt && (
                      <>
                        {" "}
                        · Updated:{" "}
                        {format(block.content.updatedAt, "MMM d, yyyy")}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <TimeBlockDialog
        block={block}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />
    </>
  );
}
