import { useMemo, useState } from "react";
import { Filter, Scale, ShieldCheck, ShieldX, TriangleAlert } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoVendors } from "@/hooks/use-demo-vendors";
import { usePackageConfig } from "@/hooks/use-package-config";
import { useVendorDocuments } from "@/hooks/use-vendor-documents";
import { useVendorExtractions } from "@/hooks/use-vendor-extractions";
import { buildVendorScorecard } from "@/lib/scorecard";
import type { RiskLevel, ScorecardFinding, VendorStatus } from "@/types";

const filters: Array<"All Findings" | RiskLevel> = [
  "All Findings",
  "High",
  "Medium",
  "Low",
];

export function ScorecardPage() {
  const { vendors } = useDemoVendors();
  const { documents } = useVendorDocuments();
  const { config } = usePackageConfig();
  const { extractions } = useVendorExtractions();
  const [activeVendorId, setActiveVendorId] = useState<string>(vendors[0]?.id ?? "");
  const [riskFilter, setRiskFilter] = useState<"All Findings" | RiskLevel>("All Findings");

  const scorecards = useMemo(() => {
    return vendors.map((vendor) => ({
      vendor,
      scorecard: buildVendorScorecard(
        vendor,
        documents.filter((document) => document.vendorId === vendor.id),
        config,
        extractions.find((extraction) => extraction.vendorId === vendor.id)?.fields ?? [],
      ),
    }));
  }, [vendors, documents, config, extractions]);

  const activeRecord =
    scorecards.find((record) => record.vendor.id === activeVendorId) ?? scorecards[0];

  const filteredFindings =
    riskFilter === "All Findings"
      ? activeRecord?.scorecard.findings ?? []
      : (activeRecord?.scorecard.findings ?? []).filter(
          (finding) => finding.riskLevel === riskFilter,
        );

  if (!activeRecord) {
    return null;
  }

  const { vendor, scorecard } = activeRecord;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Rules Engine"
        title="Scorecard"
        description="This is Mawthūq’s decision core. AI extracts evidence, the rules engine makes a deterministic recommendation, and humans approve. Every finding below is tied back to a citation rather than an opaque model judgment."
      />

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <CardHeader>
            <CardTitle>Vendor decision stack</CardTitle>
            <CardDescription>
              Compare the deterministic posture of each seeded contractor pack.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scorecards.map((record) => (
              <button
                key={record.vendor.id}
                type="button"
                onClick={() => setActiveVendorId(record.vendor.id)}
                className={`block w-full rounded-xl border p-4 text-left transition ${
                  record.vendor.id === activeVendorId
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{record.vendor.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{record.vendor.classification}</p>
                  </div>
                  <StatusBadge status={record.scorecard.decision} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Metric label="Overall Score" value={String(record.scorecard.overallScore)} />
                  <Metric label="Risk Level" value={record.scorecard.riskLevel} />
                  <Metric
                    label="Hard Gates"
                    value={String(record.scorecard.hardGateFailures)}
                  />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 space-y-3">
                  <CardTitle>{vendor.name}</CardTitle>
                  <CardDescription>
                    Deterministic vendor qualification scorecard for {config.projectName}.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="accent">AI extracts evidence</Badge>
                    <Badge variant="neutral">Rules engine decides</Badge>
                    <Badge variant="neutral">Human approval required</Badge>
                  </div>
                </div>
                <LargeDecisionBadge decision={scorecard.decision} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <SummaryCard label="Overall Score" value={String(scorecard.overallScore)} icon={<Scale className="h-5 w-5" />} />
                <SummaryCard label="Decision" value={scorecard.decision} icon={<ShieldCheck className="h-5 w-5" />} />
                <SummaryCard label="Risk Level" value={scorecard.riskLevel} icon={<TriangleAlert className="h-5 w-5" />} />
                <SummaryCard label="Missing Documents" value={String(scorecard.missingDocuments)} icon={<ShieldX className="h-5 w-5" />} />
                <SummaryCard label="Expired Documents" value={String(scorecard.expiredDocuments)} icon={<ShieldX className="h-5 w-5" />} />
                <SummaryCard label="Hard Gate Failures" value={String(scorecard.hardGateFailures)} icon={<ShieldX className="h-5 w-5" />} />
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-sm font-semibold text-foreground">Review completeness</p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {scorecard.missingDocuments > 0
                    ? "Evidence missing"
                    : scorecard.findings.some((finding) => finding.result === "Review")
                      ? "Reviewer action pending"
                      : "Evidence complete"}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  {
                    label: "CR Valid",
                    finding: findHardGate(scorecard.findings, "Commercial Registration Validity"),
                  },
                  {
                    label: "ZATCA Valid",
                    finding: findHardGate(scorecard.findings, "ZATCA Certificate Validity"),
                  },
                  {
                    label: "Financials Present",
                    finding: findHardGate(
                      scorecard.findings,
                      "Audited Financial Statements Present",
                    ),
                  },
                  {
                    label: "Grade Sufficient",
                    finding: findHardGate(
                      scorecard.findings,
                      "Contractor Classification Grade Threshold",
                    ),
                  },
                  {
                    label: "HSE Screen",
                    finding: findHardGate(scorecard.findings, "Severe HSE Issue Screen"),
                  },
                ].map(({ label, finding }) => (
                  <div key={label} className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {finding?.result ?? "Not evaluated"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {scorecard.dimensions.map((dimension) => (
                  <div
                    key={dimension.dimension}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {dimension.dimension}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-foreground">
                      {dimension.score}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Weight {dimension.weight}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Rule findings</CardTitle>
                  <CardDescription>
                    Each rule shows the input value, result, source citation, and deterministic explanation.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={riskFilter === filter ? "default" : "outline"}
                      onClick={() => setRiskFilter(filter)}
                    >
                      <Filter className="h-4 w-4" />
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-surface p-4 text-sm leading-6 text-muted-foreground">
                Confidence scores influence review priority and escalation, not final decision thresholds or hard-gate outcomes.
              </div>
              {filteredFindings.map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3 text-foreground">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function LargeDecisionBadge({ decision }: { decision: VendorStatus }) {
  const styles =
    decision === "PASS"
      ? "bg-emerald-100 text-emerald-800"
      : decision === "CONDITIONAL"
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";

  return (
    <div className={`w-full rounded-[28px] px-6 py-5 text-center lg:w-auto ${styles}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em]">Decision</p>
      <p className="mt-2 text-3xl font-semibold">{decision}</p>
    </div>
  );
}

function FindingCard({ finding }: { finding: ScorecardFinding }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-foreground">{finding.ruleName}</p>
            <Badge variant="neutral">{finding.dimension}</Badge>
            {finding.hardGate ? <Badge variant="danger">Hard Gate</Badge> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{finding.explanation}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ResultBadge result={finding.result} />
          <RiskBadge riskLevel={finding.riskLevel} />
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <DetailBlock label="Input Value" value={finding.inputValue} />
        <DetailBlock label="Result" value={finding.result} />
        <DetailBlock label="Source Citation" value={finding.sourceCitation} />
        <DetailBlock label="Risk Tier" value={finding.riskLevel} />
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ResultBadge({ result }: { result: ScorecardFinding["result"] }) {
  const variant =
    result === "Pass" ? "success" : result === "Review" ? "warning" : "danger";
  return <Badge variant={variant}>{result}</Badge>;
}

function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const variant =
    riskLevel === "Low" ? "success" : riskLevel === "Medium" ? "warning" : "danger";
  return <Badge variant={variant}>{riskLevel} Risk</Badge>;
}

function findHardGate(findings: ScorecardFinding[], ruleName: string) {
  return findings.find((finding) => finding.ruleName === ruleName);
}
