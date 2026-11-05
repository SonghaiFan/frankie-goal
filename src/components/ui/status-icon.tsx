"use client";

import { cn } from "@/lib/utils";
import { TimeBlockContent } from "@/types/time";
import { THEME, IconSize } from "@/lib/settings";

interface StatusIconProps {
  status: TimeBlockContent["status"];
  size?: IconSize;
  className?: string;
}

export function StatusIcon({
  status,
  size = "md",
  className,
}: StatusIconProps) {
  const sizeClass = THEME.sizes.icon[size];
  const { color, icon: Icon } = THEME.status[status];

  return (
    <span className={cn("inline-flex", className)}>
      <Icon className={cn(sizeClass, color)} />
    </span>
  );
}
