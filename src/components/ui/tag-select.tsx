import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { THEME, TagColor } from "@/lib/settings";
import { cn } from "@/lib/utils";

interface TagSelectProps {
  value: TagColor;
  onValueChange: (value: TagColor) => void;
}

export function TagSelect({ value, onValueChange }: TagSelectProps) {
  const tagConfig = THEME.tags.colors[value];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "h-8 w-[120px] transition-all",
          "hover:ring-2 hover:ring-offset-1",
          "data-[state=open]:ring-2 data-[state=open]:ring-offset-1",
          tagConfig.bg,
          tagConfig.border,
          tagConfig.text,
          "hover:ring-offset-background hover:ring-ring",
          "data-[state=open]:ring-offset-background data-[state=open]:ring-ring"
        )}
      >
        <SelectValue>
          <div className="flex items-center gap-2">
            <span>{tagConfig.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(THEME.tags.colors).map(([key, config]) => (
          <SelectItem
            key={key}
            value={key}
            className={cn(
              "flex items-center gap-2 transition-colors",
              config.bg,
              config.border,
              config.text,
              "hover:brightness-95 dark:hover:brightness-125"
            )}
          >
            {config.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
