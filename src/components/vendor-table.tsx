import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { VendorRecord } from "@/types";

export function VendorTable({
  vendors,
  title = "Vendor portfolio",
  description = "Current prequalification posture across the active pipeline.",
}: {
  vendors: VendorRecord[];
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
          <thead>
            <tr className="border-b border-border bg-surface text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <th className="pb-3 pr-4 pt-3 pl-1 font-semibold">Vendor</th>
              <th className="pb-3 pr-4 font-semibold">Discipline</th>
              <th className="pb-3 pr-4 font-semibold">Classification</th>
              <th className="pb-3 pr-4 font-semibold">Score</th>
              <th className="pb-3 pr-4 font-semibold">Issues</th>
              <th className="pb-3 pr-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr
                key={vendor.id}
                className="border-b border-border last:border-b-0 hover:bg-surface/60 transition-colors"
              >
                <td className="py-4 pr-4 pl-1">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground" dir="rtl">{vendor.arabicName}</p>
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm text-muted-foreground">
                  {vendor.primaryDiscipline}
                </td>
                <td className="py-4 pr-4 text-sm text-muted-foreground">
                  {vendor.classification}
                </td>
                <td className="py-4 pr-4 text-sm font-semibold text-foreground tabular-nums">
                  {vendor.score}
                </td>
                <td className="py-4 pr-4 text-sm text-muted-foreground">
                  {vendor.openIssues}
                </td>
                <td className="py-4 pr-4">
                  <StatusBadge status={vendor.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
