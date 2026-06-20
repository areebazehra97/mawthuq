import { Link } from "react-router-dom";
import { seededActivityFeed } from "@/data/seed";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { useCommandCenterSummary } from "@/hooks/use-command-center-summary";
import { useDemoVendors } from "@/hooks/use-demo-vendors";

export function ActivityLogPage() {
  const { summary } = useCommandCenterSummary();
  const { vendors } = useDemoVendors();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Audit Trail"
        title="Activity Log"
        description="Recent package and vendor activity for demo walkthroughs, review traceability, and decision context."
        action={
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Back to Dashboard
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>
              Live-style operational events demonstrating auditability and workflow momentum.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.recentActivity ?? seededActivityFeed).map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
                <div className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {item.when}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decision posture</CardTitle>
            <CardDescription>Why each vendor landed in its current outcome band.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{vendor.name}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{vendor.summary}</p>
                  </div>
                  <StatusBadge status={vendor.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
