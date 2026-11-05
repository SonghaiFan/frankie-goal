"use client";

import { useMemo, useState, useCallback } from "react";
import { TimeBlock as TimeBlockComponent } from "./TimeBlock";
import { ViewMode, DateRange, EditableTimeBlock } from "@/types/time";
import { useMetadata } from "@/lib/store";
import {
  generateTimeBlocks,
  calculateBlockProgress,
  areBlocksRelated,
} from "@/lib/time-utils";
import { generateBlockId } from "@/lib/block-utils";
import { cn } from "@/lib/utils";
import { useTime } from "@/hooks/useTime";
import { ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

const VIEWS: ViewMode[] = ["season", "month", "week", "day"];
const VIEW_NAMES = {season:"季度",month:"月",week:"周",day:"日"};

interface TimeBlockViewProps {
  dateRange: DateRange;
}

function MasonryGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3",
        "[&>*]:mb-3 [&>*]:break-inside-avoid-column"
      )}
    >
      {children}
    </div>
  );
}

export function TimeBlockView({ dateRange }: TimeBlockViewProps) {
  const metadata = useMetadata();
  const views = VIEWS;
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [collapsedViews, setCollapsedViews] = useState<ViewMode[]>([]);
  const currentTime = useTime();

  const toggleView = useCallback((view: ViewMode) => {
    setCollapsedViews((prev) =>
      prev.includes(view) ? prev.filter((v) => v !== view) : [...prev, view]
    );
  }, []);

  const blocks = useMemo(() => {
    return views.map((view) => ({
      view,
      blocks: generateTimeBlocks({
        start: dateRange.from,
        end: dateRange.to,
        view,
      }).map((block) => {
        const blockId = generateBlockId({
          level: view,
          date: block.date,
          indices: {
            seasonIndex: block.seasonIndex,
            monthIndex: block.monthIndex,
            weekIndex: block.weekIndex,
            dayIndex: block.dayIndex,
          },
        });

        const storedMetadata = metadata[blockId];

        if (storedMetadata) {
          return {
            ...block,
            id: blockId,
            content: storedMetadata,
          } as EditableTimeBlock;
        }

        return {
          ...block,
          id: blockId,
          content: {
            id: blockId,
            title: "",
            notes: "",
            tags: [],
            status: "todo",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        } as EditableTimeBlock;
      }),
    }));
  }, [dateRange, views, metadata]);

  const relatedBlocks = useMemo(() => {
    const targetBlockId = selectedBlockId || hoveredBlockId;
    if (!targetBlockId) return [];

    const targetBlock = blocks
      .flatMap(({ blocks }) => blocks)
      .find((block) => block.id === targetBlockId);

    if (!targetBlock) return [];

    return blocks
      .flatMap(({ blocks }) => blocks)
      .filter(
        (block) =>
          block.id !== targetBlockId && areBlocksRelated(targetBlock, block)
      )
      .map((block) => block.id);
  }, [blocks, hoveredBlockId, selectedBlockId]);

  return (
    <div className="space-y-8">
      {blocks.map(({ view, blocks }) => {
        const isCollapsed = collapsedViews.includes(view);

        return (
          <motion.section
            key={VIEW_NAMES[view]}
            className={cn(
              "rounded-xl border shadow-sm bg-card overflow-hidden will-change-[height]",
              "transition-colors duration-200",
              isCollapsed ? "border-muted/40" : "border-border"
            )}
            initial={false}
            layout
          >
            <Button
              variant="ghost"
              className={cn(
                "w-full flex items-center justify-between px-6 h-14",
                "hover:bg-accent/50 active:bg-accent/70",
                "border-b border-border/50",
                isCollapsed && "border-transparent"
              )}
              onClick={() => toggleView(view)}
            >
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold capitalize tracking-tight">
                  {VIEW_NAMES[view]}
                </h2>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    <span className="text-muted-foreground font-medium">
                      共
                    </span>
                    <span className="font-semibold text-foreground">
                      {blocks.length}
                    </span>
                  </span>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  !isCollapsed && "rotate-180"
                )}
              />
            </Button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-3">
                    <MasonryGrid>
                      {blocks.map((block) => (
                        <TimeBlockComponent
                          key={block.id}
                          block={block}
                          view={view}
                          progress={calculateBlockProgress(block, currentTime)}
                          relatedBlocks={relatedBlocks}
                          onHover={setHoveredBlockId}
                          onSelect={setSelectedBlockId}
                          selectedBlockId={selectedBlockId}
                        />
                      ))}
                    </MasonryGrid>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        );
      })}
    </div>
  );
}
