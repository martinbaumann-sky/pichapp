"use client";

import { cn } from "@/utils/cn";
import { nivelES } from "@/lib/i18n";

type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

type Props = {
  level: Level;
  className?: string;
  withDot?: boolean;
  size?: "sm" | "md";
};

export default function LevelBadge({ level, className, withDot = true, size = "sm" }: Props) {
  const styles: Record<Level, string> = {
    BEGINNER: "bg-[color:var(--brand-soft)] text-brand-600 border-[color:var(--brand-1)]/20",
    INTERMEDIATE: "bg-amber-50 text-amber-800 border-amber-200",
    ADVANCED: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const dotStyles: Record<Level, string> = {
    BEGINNER: "bg-[color:var(--brand-1)]",
    INTERMEDIATE: "bg-amber-500",
    ADVANCED: "bg-rose-500",
  };

  const paddings = size === "md" ? "px-3 py-1.5 text-[13px]" : "px-2.5 py-1 text-[12px]";

  return (
    <span
      aria-label={`Nivel ${nivelES[level]}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        paddings,
        styles[level],
        className
      )}
    >
      {withDot && <span className={cn("w-2 h-2 rounded-full", dotStyles[level])} />}
      {nivelES[level]}
    </span>
  );
}

