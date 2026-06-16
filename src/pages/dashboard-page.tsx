import {
  Activity,
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Clock3,
  FileWarning,
  ShieldAlert,
} from "lucide-react";
import { seededActivityFeed } from "@/data/seed";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { SimpleChartCard } from "@/components/simple-chart-card";
import { VendorTable } from "@/components/vendor-table";
import { useDemoVendors } from "@/hooks/use-demo-vendors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

export function DashboardPage() {
  const { vendors } = useDemoVendors();
  const passCount = vendors.filter((vendor) => vendor.status === "PASS").length;
  const conditionalCount = vendors.filter((vendor) => vendor.status === "CONDITIONAL").length;
  const failCount = vendors.filter((vendor) => vendor.status === "FAIL").length;
  const vendorsReviewed = vendors.length;
  const missingDocuments = vendors.reduce((sum, vendor) => {
    return sum + vendor.reviewItems.filter((item) => item.state === "Missing").length;
  }, 0);
  const highRiskVendors = vendors.filter(
    (vendor) => vendor.expiryRisk === "High" || vendor.status === "FAIL",
  ).length;
  const reviewTimeSavedHours = vendors.reduce(
    (sum, vendor) => sum + Math.max(6, Math.round(vendor.documentsSubmitted * 0.75)),
    0,
  );

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
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Executive View"
        title="Prequalification Command Center"
        description="Monitor contractor readiness, evidence quality, and decision velocity before tender invitation. Mawthūq is designed to feel defensible in front of procurement leaders, finance, PMO, and project governance."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <MetricCard
          label="Vendors Reviewed"
          value={String(vendorsReviewed)}
          supporting="Seeded contractor packages assessed in the current cycle."
          icon={<Building2 className="h-5 w-5" />}
        />
        <MetricCard
          label="PASS Count"
          value={String(passCount)}
          supporting="Ready for approved vendor listing and tender release."
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <MetricCard
          label="CONDITIONAL Count"
          value={String(conditionalCount)}
          supporting="Requires manager judgment, waivers, or updated evidence."
          icon={<Activity className="h-5 w-5" />}
        />
        <MetricCard
          label="FAIL Count"
          value={String(failCount)}
          supporting="Regulatory, financial, or HSE blockers prevent invitation."
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <MetricCard
          label="Review Time Saved"
          value={`${reviewTimeSavedHours}h`}
          supporting="Estimated hours avoided versus manual spreadsheet review."
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Missing Documents"
          value={String(missingDocuments)}
          supporting="Evidence gaps still blocking clean package completion."
          icon={<FileWarning className="h-5 w-5" />}
        />
        <MetricCard
          label="High Risk Vendors"
          value={String(highRiskVendors)}
          supporting="Vendors requiring escalation due to risk or rejection posture."
          icon={<AlertTriangle className="h-5 w-5" />}
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

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <VendorTable vendors={vendors} />

        <Card>
          <CardHeader>
            <CardTitle>Decision posture</CardTitle>
            <CardDescription>
              A compact view of why each seeded vendor landed in its current outcome band.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{vendor.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{vendor.summary}</p>
                  </div>
                  <StatusBadge status={vendor.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Live-style operational events designed to demonstrate auditability and workflow momentum.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {seededActivityFeed.map((activityItem) => (
            <div
              key={activityItem.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{activityItem.title}</p>
                <p className="text-sm leading-6 text-slate-500">{activityItem.detail}</p>
              </div>
              <div className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {activityItem.when}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
