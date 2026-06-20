import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card sm:p-6 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {action ? <div className="w-full shrink-0 lg:w-auto">{action}</div> : null}
    </div>
  );
}
