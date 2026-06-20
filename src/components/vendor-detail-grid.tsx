import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { VendorRecord } from "@/types";

const metricToneMap = {
  neutral: "neutral",
  success: "success",
  warning: "warning",
  danger: "danger",
} as const;

const metricToneLabelMap = {
  neutral: "Stable",
  success: "Strong",
  warning: "Watch",
  danger: "Risk",
} as const;

const reviewStateMap = {
  Complete: "success",
  Pending: "warning",
  Flagged: "danger",
  Missing: "danger",
} as const;

export function VendorDetailGrid({ vendors }: { vendors: VendorRecord[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
      {vendors.map((vendor) => (
        <Card key={vendor.id} className="h-full">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <CardTitle>{vendor.name}</CardTitle>
                <CardDescription>{vendor.arabicName}</CardDescription>
              </div>
              <StatusBadge status={vendor.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface p-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Score</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{vendor.score}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Stage</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{vendor.reviewStage}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {vendor.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{metric.label}</p>
                    <p className="text-sm text-muted-foreground">{metric.value}</p>
                  </div>
                  <Badge variant={metricToneMap[metric.tone ?? "neutral"]}>
                    {metricToneLabelMap[metric.tone ?? "neutral"]}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Review checklist
              </p>
              {vendor.reviewItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg bg-surface p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <Badge variant={reviewStateMap[item.state]}>{item.state}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.evidence}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
