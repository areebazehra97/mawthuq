import { AlertTriangle, Award, Layers, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { SimpleChartCard } from "@/components/simple-chart-card";
import { useDemoVendors } from "@/hooks/use-demo-vendors";
import { useCommandCenterSummary } from "@/hooks/use-command-center-summary";

export function AnalyticsPage() {
  const { vendors } = useDemoVendors();
  const { summary } = useCommandCenterSummary();

  const passCount = vendors.filter((vendor) => vendor.status === "PASS").length;
  const conditionalCount = vendors.filter((vendor) => vendor.status === "CONDITIONAL").length;
  const failCount = vendors.filter((vendor) => vendor.status === "FAIL").length;

  const decisionDistribution = [
    { label: "PASS", value: passCount, color: "bg-emerald-500" },
    { label: "CONDITIONAL", value: conditionalCount, color: "bg-amber-400" },
    { label: "FAIL", value: failCount, color: "bg-rose-500" },
  ];

  const riskCategories = [
    { label: "Regulatory", value: 4, color: "bg-rose-500" },
    { label: "Financial", value: 3, color: "bg-orange-400" },
    { label: "Documentation", value: 5, color: "bg-sky-500" },
    { label: "HSE", value: 2, color: "bg-lime-500" },
  ];

  const reviewStatus = [
    {
      label: "Approved",
      value: vendors.filter((vendor) => vendor.reviewStage === "Approved").length,
      color: "bg-emerald-500",
    },
    {
      label: "In Review",
      value: vendors.filter((vendor) => vendor.reviewStage === "In Review").length,
      color: "bg-amber-400",
    },
    {
      label: "Rejected",
      value: vendors.filter((vendor) => vendor.reviewStage === "Rejected").length,
      color: "bg-rose-500",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Portfolio Intelligence"
        title="Analytics"
        description="Track decision mix, review velocity, and package pressure points across the portfolio."
        action={
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Back to Dashboard
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Packages"
          value={String(summary?.kpis.totalPackages ?? 0)}
          supporting={`Across ${summary?.kpis.activeProjects ?? 0} active projects`}
          icon={<Layers className="h-5 w-5" />}
        />
        <MetricCard
          label="Vendors in Pipeline"
          value={String(
            summary
              ? summary.kpis.totalInvitations + summary.kpis.submittedApplications
              : 0,
          )}
          supporting="Invited across all packages"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          label="Packages Needing Action"
          value={String(summary?.kpis.packagesNeedingAttention ?? 0)}
          supporting="Blocked, gap, or overdue"
          icon={<AlertTriangle className="h-5 w-5" />}
          className="border-warning/30"
        />
        <MetricCard
          label="Ready for Tender"
          value={String(
            summary?.packagesNeedingAttention.filter(
              (pkg) => pkg.readinessStatus === "Ready for Tender",
            ).length ?? 0,
          )}
          supporting="Shortlist complete"
          icon={<Award className="h-5 w-5" />}
          className="border-success/30"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SimpleChartCard
          title="Decision Distribution"
          description="Current recommendation mix across reviewed contractors."
          data={decisionDistribution}
        />
        <SimpleChartCard
          title="Risk Categories"
          description="Illustrative risk clustering across seeded package findings."
          data={riskCategories}
        />
        <SimpleChartCard
          title="Review Status"
          description="How far packages have progressed through the review workflow."
          data={reviewStatus}
        />
      </div>
    </div>
  );
}
