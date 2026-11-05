"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function AppNavigation() {
  const path = usePathname();
  return (
    <nav aria-label="主导航" className="border-b bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-semibold tracking-tight text-xl">
          franklin-goal
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            让目标有时间落地
          </span>
        </Link>
        <div className="flex gap-5 text-sm">
          <Link
            href="/"
            aria-current={path === "/" ? "page" : undefined}
            className={path === "/" ? "font-bold" : "text-muted-foreground"}
          >
            目标与行动
          </Link>
          <Link
            href="/plan"
            aria-current={path === "/plan" ? "page" : undefined}
            className={path === "/plan" ? "font-bold" : "text-muted-foreground"}
          >
            时间规划
          </Link>
        </div>
      </div>
    </nav>
  );
}
