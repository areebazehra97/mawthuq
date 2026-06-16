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
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
              <th className="pb-4 pr-4 font-semibold">Vendor</th>
              <th className="pb-4 pr-4 font-semibold">Discipline</th>
              <th className="pb-4 pr-4 font-semibold">Classification</th>
              <th className="pb-4 pr-4 font-semibold">Score</th>
              <th className="pb-4 pr-4 font-semibold">Issues</th>
              <th className="pb-4 pr-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr
                key={vendor.id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="py-5 pr-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{vendor.name}</p>
                    <p className="text-sm text-slate-500">{vendor.arabicName}</p>
                  </div>
                </td>
                <td className="py-5 pr-4 text-sm text-slate-600">
                  {vendor.primaryDiscipline}
                </td>
                <td className="py-5 pr-4 text-sm text-slate-600">
                  {vendor.classification}
                </td>
                <td className="py-5 pr-4 text-sm font-semibold text-slate-900">
                  {vendor.score}
                </td>
                <td className="py-5 pr-4 text-sm text-slate-600">
                  {vendor.openIssues}
                </td>
                <td className="py-5 pr-4">
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
