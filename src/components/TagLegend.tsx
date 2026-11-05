import { THEME } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tag } from "lucide-react";

export function TagLegend() {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg border bg-card/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Tag className="h-4 w-4" />
        <span className="text-sm font-medium">Tags</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <TooltipProvider>
          {Object.entries(THEME.tags.colors).map(([key, config]) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 px-2 rounded-md text-xs font-medium transition-all",
                    "hover:scale-105 active:scale-95",
                    config.bg,
                    config.border,
                    config.text
                  )}
                >
                  {config.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                <p>Click to filter by {config.label.toLowerCase()} tags</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
