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
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {label}
          </p>
          <p className="text-3xl font-semibold text-slate-900">{value}</p>
          <p className="text-sm leading-6 text-slate-500">{supporting}</p>
        </div>
        {icon ? (
          <div className="rounded-2xl bg-slate-900 p-3 text-primary">{icon}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
