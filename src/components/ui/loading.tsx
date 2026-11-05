"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Loading({ className, size = "md", fullScreen }: LoadingProps) {
  const content = (
    <Loader2 className={cn("animate-spin", sizeMap[size], className)} />
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-4">{content}</div>;
}

export function LoadingFallback() {
  return <Loading fullScreen size="lg" />;
}

export function LoadingInline() {
  return <Loading size="sm" />;
}

export function LoadingBlock() {
  return <Loading size="md" />;
}
