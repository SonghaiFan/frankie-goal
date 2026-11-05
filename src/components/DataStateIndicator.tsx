"use client";

import { useIsSaving, useLastSavedAt } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatLastSaved(date: Date | null): string {
  if (!date) return "not saved";

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function DataStateIndicator() {
  const lastSavedAt = useLastSavedAt();
  const isSaving = useIsSaving();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isSaving && "bg-blue-500 animate-pulse",
                !isSaving && lastSavedAt && "bg-green-500",
                !isSaving && !lastSavedAt && "bg-yellow-500"
              )}
            />
            {isSaving ? (
              <span className="text-blue-500">Saving...</span>
            ) : (
              formatLastSaved(lastSavedAt)
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isSaving ? (
            <p>Auto-saving your changes</p>
          ) : lastSavedAt ? (
            <p>Last saved: {lastSavedAt.toLocaleTimeString()}</p>
          ) : (
            <p>Changes not saved</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
