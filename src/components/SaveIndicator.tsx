"use client";

import { Loader2 } from "lucide-react";
import { useIsSaving, useLastSavedAt } from "@/lib/store";

export function SaveIndicator() {
  const isSaving = useIsSaving();
  const lastSavedAt = useLastSavedAt();

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        正在保存…
      </div>
    );
  }

  if (!lastSavedAt) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground">
      已保存： {lastSavedAt.toLocaleTimeString()}
    </div>
  );
}
