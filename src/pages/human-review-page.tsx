import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Edit3, Flag, ShieldCheck } from "lucide-react";
import { reviewerRoles, seededAiExtractions } from "@/data/seed";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoVendors } from "@/hooks/use-demo-vendors";
import { useHumanReview } from "@/hooks/use-human-review";
import { usePackageConfig } from "@/hooks/use-package-config";
import { useVendorDocuments } from "@/hooks/use-vendor-documents";
import { buildVendorScorecard } from "@/lib/scorecard";
import type {
  FieldReviewAction,
  FieldReviewState,
  ReviewerRole,
  RuleResult,
  RuleReviewState,
} from "@/types";

export function HumanReviewPage() {
  const { vendors } = useDemoVendors();
  const { documents } = useVendorDocuments();
  const { config } = usePackageConfig();
  const {
    auditRecords,
    setAuditRecords,
    fieldStates,
    setFieldStates,
    ruleStates,
    setRuleStates,
  } = useHumanReview();

  const [activeVendorId, setActiveVendorId] = useState<string>(vendors[0]?.id ?? "");
  const [activeRole, setActiveRole] = useState<ReviewerRole>("Procurement Analyst");

  const activeVendor = vendors.find((vendor) => vendor.id === activeVendorId) ?? vendors[0];
  const extractionFields = seededAiExtractions[activeVendorId] ?? [];
  const vendorDocuments = documents.filter((document) => document.vendorId === activeVendorId);
  const scorecard = activeVendor
    ? buildVendorScorecard(activeVendor, vendorDocuments, config)
    : null;

  const vendorAudit = useMemo(() => {
    return auditRecords
      .filter((record) => record.vendorId === activeVendorId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [auditRecords, activeVendorId]);

  function getFieldState(label: string): FieldReviewState | undefined {
    return fieldStates.find(
      (state) => state.vendorId === activeVendorId && state.fieldLabel === label,
    );
  }

  function getRuleState(ruleId: string): RuleReviewState | undefined {
    return ruleStates.find(
      (state) => state.vendorId === activeVendorId && state.ruleId === ruleId,
    );
  }

  function appendAudit(actor: ReviewerRole | "System", title: string, detail: string) {
    setAuditRecords((current) => [
      {
        id: `${activeVendorId}-${Date.now()}-${current.length}`,
        vendorId: activeVendorId,
        timestamp: new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        actor,
        title,
        detail,
      },
      ...current,
    ]);
  }

  function applyFieldAction(fieldLabel: string, currentValue: string, action: FieldReviewAction) {
    const editedValue =
      action === "Edit" ? `${currentValue} (reviewer adjusted)` : currentValue;
    const statusMap = {
      Accept: "Accepted",
      Reject: "Rejected",
      Edit: "Edited",
      Escalate: "Escalated",
    } as const;

    setFieldStates((current) => {
      const nextState: FieldReviewState = {
        vendorId: activeVendorId,
        fieldLabel,
        status: statusMap[action],
        reviewerRole: activeRole,
        currentValue: editedValue,
        notes:
          action === "Escalate"
            ? "Escalated for secondary review."
            : action === "Reject"
              ? "Rejected pending corrected source evidence."
              : action === "Edit"
                ? "Edited by reviewer based on cited evidence."
                : "Accepted as extracted.",
      };
      return [...current.filter((state) => !(state.vendorId === activeVendorId && state.fieldLabel === fieldLabel)), nextState];
    });

    appendAudit(
      activeRole,
      `${activeRole} ${action.toLowerCase()}ed ${fieldLabel}.`,
      `Field review action recorded with current value "${editedValue}".`,
    );
  }

  function overrideRule(ruleId: string, defaultResult: RuleResult) {
    const overrideResult: RuleResult =
      defaultResult === "Pass" ? "Review" : defaultResult === "Review" ? "Pass" : "Review";
    const assignedReviewer = activeRole === "Procurement Analyst" ? "Procurement Manager" : activeRole;

    setRuleStates((current) => {
      const nextState: RuleReviewState = {
        vendorId: activeVendorId,
        ruleId,
        overrideResult,
        reason: "Business exception approved after reviewer challenge.",
        assignedReviewer,
      };
      return [...current.filter((state) => !(state.vendorId === activeVendorId && state.ruleId === ruleId)), nextState];
    });

    appendAudit(
      activeRole,
      `${activeRole} overrode rule decision.`,
      `Rule ${ruleId} changed to ${overrideResult} and assigned to ${assignedReviewer}.`,
    );
  }

  if (!activeVendor || !scorecard) {
    return null;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Reviewer Workflow"
        title="Human Review"
        description="Cross-functional reviewers validate AI outputs, challenge rule outcomes, and create a complete audit trail before final procurement approval. Every action below generates a chronological audit record."
      />

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <CardHeader>
            <CardTitle>Review control panel</CardTitle>
            <CardDescription>
              Select a vendor and reviewer role to simulate governance handoffs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Reviewer Role</p>
              <div className="flex flex-wrap gap-2">
                {reviewerRoles.map((role) => (
                  <Button
                    key={role}
                    size="sm"
                    variant={activeRole === role ? "default" : "outline"}
                    onClick={() => setActiveRole(role)}
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>

            {vendors.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onClick={() => setActiveVendorId(vendor.id)}
                className={`block w-full rounded-3xl border p-4 text-left transition ${
                  vendor.id === activeVendorId
                    ? "border-primary/40 bg-primary/10"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{vendor.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{vendor.summary}</p>
                  </div>
                  <StatusBadge status={vendor.status} />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>{activeVendor.name}</CardTitle>
                  <CardDescription>
                    Reviewer action workspace for extracted fields and deterministic rule outcomes.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="accent">{activeRole}</Badge>
                  <Badge variant="neutral">Auditability by default</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <SummaryMetric label="Fields" value={String(extractionFields.length)} icon={<CheckCircle2 className="h-5 w-5" />} />
              <SummaryMetric label="Rules" value={String(scorecard.findings.length)} icon={<ShieldCheck className="h-5 w-5" />} />
              <SummaryMetric label="Decision" value={scorecard.decision} icon={<Flag className="h-5 w-5" />} />
              <SummaryMetric label="Audit Events" value={String(vendorAudit.length)} icon={<Clock3 className="h-5 w-5" />} />
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <CardHeader>
                <CardTitle>Extracted field validation</CardTitle>
                <CardDescription>
                  Reviewers can accept, reject, edit, or escalate each AI-extracted field.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {extractionFields.map((field) => {
                  const state = getFieldState(field.label);
                  return (
                    <div key={field.label} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{field.label}</p>
                            <Badge variant="neutral">{field.confidence}% confidence</Badge>
                            {state ? <Badge variant="accent">{state.status}</Badge> : null}
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-900">
                            {state?.currentValue ?? field.value}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {field.sourceDocument} · p.{field.pageNumber} · {field.evidenceSnippet}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(["Accept", "Reject", "Edit", "Escalate"] as FieldReviewAction[]).map((action) => (
                            <Button
                              key={action}
                              size="sm"
                              variant={action === "Accept" ? "default" : "outline"}
                              onClick={() => applyFieldAction(field.label, field.value, action)}
                            >
                              {action === "Edit" ? <Edit3 className="h-4 w-4" /> : null}
                              {action}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scorecard rule review</CardTitle>
                <CardDescription>
                  Rules can be overridden with a reason and assigned reviewer while preserving the original evidence trail.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scorecard.findings.map((finding) => {
                  const state = getRuleState(finding.id);
                  return (
                    <div key={finding.id} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{finding.ruleName}</p>
                        <Badge variant="neutral">{finding.dimension}</Badge>
                        {finding.hardGate ? <Badge variant="danger">Hard Gate</Badge> : null}
                        <Badge
                          variant={
                            finding.result === "Pass"
                              ? "success"
                              : finding.result === "Review"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {state?.overrideResult ? `Override: ${state.overrideResult}` : finding.result}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{finding.inputValue}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {finding.sourceCitation} · {finding.explanation}
                      </p>
                      <div className="mt-4 grid gap-3">
                        <Detail label="Assigned Reviewer" value={state?.assignedReviewer ?? activeRole} />
                        <Detail
                          label="Override Reason"
                          value={state?.reason ?? "No override recorded yet."}
                        />
                      </div>
                      <div className="mt-4">
                        <Button size="sm" onClick={() => overrideRule(finding.id, finding.result)}>
                          Override
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audit timeline</CardTitle>
              <CardDescription>
                Every system and reviewer action is recorded chronologically for defensible procurement governance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendorAudit.map((record) => (
                <div key={record.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{record.title}</p>
                        <Badge variant={record.actor === "System" ? "neutral" : "accent"}>
                          {record.actor}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{record.detail}</p>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {record.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3 text-slate-900">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-3 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
