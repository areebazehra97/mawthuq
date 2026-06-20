import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  supporting: string;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  supporting,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-semibold text-foreground">{value}</p>
          <p className="text-sm leading-5 text-muted-foreground">{supporting}</p>
        </div>
        {icon ? (
          <div className="self-start rounded-lg bg-primary/8 p-2.5 text-accent ring-1 ring-border">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
