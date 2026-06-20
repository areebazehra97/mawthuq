import { useEffect, useMemo, useState } from "react";
import { DatabaseZap, FileText, Send } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoVendors } from "@/hooks/use-demo-vendors";
import { useHumanReview } from "@/hooks/use-human-review";
import { usePackageConfig } from "@/hooks/use-package-config";
import { useVendorDocuments } from "@/hooks/use-vendor-documents";
import { useVendorExtractions } from "@/hooks/use-vendor-extractions";
import { api } from "@/lib/api";
import { buildVendorScorecard } from "@/lib/scorecard";
import type { ReportPreview, VendorRecord } from "@/types";

type ModalState =
  | {
      kind: "bid-analysis";
      vendor: VendorRecord;
      message: string;
    }
  | {
      kind: "cde";
      vendor: VendorRecord;
      message: string;
    }
  | {
      kind: "report";
      vendor: VendorRecord;
    }
  | null;

export function ApprovedVendorListPage() {
  const { vendors } = useDemoVendors();
  const { documents } = useVendorDocuments();
  const { config } = usePackageConfig();
  const { extractions } = useVendorExtractions();
  const { auditRecords, setAuditRecords } = useHumanReview();
  const [modalState, setModalState] = useState<ModalState>(null);

  const approved = useMemo(() => {
    return vendors
      .map((vendor) => {
        const vendorDocuments = documents.filter((document) => document.vendorId === vendor.id);
        const vendorExtraction =
          extractions.find((extraction) => extraction.vendorId === vendor.id)?.fields ?? [];
        const scorecard = buildVendorScorecard(vendor, vendorDocuments, config, vendorExtraction);
        const gradeField = vendorExtraction.find(
          (field) => field.label === "Contractor Classification Grade",
        );

        return {
          vendor,
          scorecard,
          grade: gradeField?.value ?? vendor.classification,
        };
      })
      .filter((record) => record.scorecard.decision === "PASS");
  }, [vendors, documents, config, extractions]);

  function appendAudit(vendorId: string, title: string, detail: string) {
    setAuditRecords((current) => [
      {
        id: `${vendorId}-${Date.now()}-${current.length}`,
        vendorId,
        timestamp: new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        actor: "System",
        title,
        detail,
      },
      ...current,
    ]);
  }

  function sendToBidAnalysis(vendor: VendorRecord) {
    appendAudit(
      vendor.id,
      "Vendor sent to WhiteHelmet AI Bid Analysis.",
      "Vendor profile, evidence package, and risk tags were handed off to downstream bid evaluation.",
    );
    setModalState({
      kind: "bid-analysis",
      vendor,
      message:
        "Vendor profile, evidence package, and risk tags sent to WhiteHelmet AI Bid Analysis.",
    });
  }

  function saveToCde(vendor: VendorRecord) {
    appendAudit(
      vendor.id,
      "Vendor pack saved to Common Data Environment.",
      "Vendor pack, scorecard, and audit trail were archived to the controlled project record.",
    );
    setModalState({
      kind: "cde",
      vendor,
      message:
        "Vendor pack, scorecard, and audit trail saved to Common Data Environment.",
    });
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Tender Ready"
        title="Approved Vendor List"
        description="Only PASS vendors move forward into tender release. This module packages the qualified contractor profile, supporting evidence, and governance trail for downstream systems."
      />

      <Card>
        <CardHeader>
          <CardTitle>Approved vendors</CardTitle>
          <CardDescription>
            Tender-ready contractors cleared by Mawthūq for downstream release.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <th className="pb-4 pr-4 font-semibold">Vendor</th>
                <th className="pb-4 pr-4 font-semibold">Decision</th>
                <th className="pb-4 pr-4 font-semibold">Contractor Grade</th>
                <th className="pb-4 pr-4 font-semibold">Work Category</th>
                <th className="pb-4 pr-4 font-semibold">Risk Level</th>
                <th className="pb-4 pr-4 font-semibold">Expiry Watch</th>
                <th className="pb-4 pr-4 font-semibold">Next Review Date</th>
                <th className="pb-4 pr-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {approved.map(({ vendor, scorecard, grade }) => (
                <tr key={vendor.id} className="border-b border-border/60 last:border-b-0 align-top">
                  <td className="py-5 pr-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">{vendor.arabicName}</p>
                    </div>
                  </td>
                  <td className="py-5 pr-4">
                    <StatusBadge status={scorecard.decision} />
                  </td>
                  <td className="py-5 pr-4 text-sm font-semibold text-foreground">{grade}</td>
                  <td className="py-5 pr-4 text-sm text-muted-foreground">{vendor.primaryDiscipline}</td>
                  <td className="py-5 pr-4">
                    <RiskBadge riskLevel={scorecard.riskLevel} />
                  </td>
                  <td className="py-5 pr-4 text-sm text-muted-foreground">{vendor.expiryRisk}</td>
                  <td className="py-5 pr-4 text-sm text-muted-foreground">
                    {nextReviewDate(vendor.expiryRisk)}
                  </td>
                  <td className="py-5 pr-4">
                    <div className="flex min-w-[320px] flex-wrap gap-2">
                      <Button size="sm" onClick={() => sendToBidAnalysis(vendor)}>
                        <Send className="h-4 w-4" />
                        Send to Bid Analysis
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => saveToCde(vendor)}>
                        <DatabaseZap className="h-4 w-4" />
                        Save to CDE
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setModalState({ kind: "report", vendor })}
                      >
                        <FileText className="h-4 w-4" />
                        Generate Report
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {modalState ? (
        <ActionModal
          modalState={modalState}
          onClose={() => setModalState(null)}
          documents={documents}
          config={config}
          auditRecords={auditRecords}
          extractions={extractions}
        />
      ) : null}
    </div>
  );
}

function RiskBadge({ riskLevel }: { riskLevel: string }) {
  const variant =
    riskLevel === "Low" ? "success" : riskLevel === "Medium" ? "warning" : "danger";
  return <Badge variant={variant}>{riskLevel} Risk</Badge>;
}

function nextReviewDate(expiryRisk: string) {
  if (expiryRisk === "Low") {
    return "15 Sep 2026";
  }
  if (expiryRisk === "Medium") {
    return "15 Aug 2026";
  }
  return "15 Jul 2026";
}

function ActionModal({
  modalState,
  onClose,
  documents,
  config,
  auditRecords,
  extractions,
}: {
  modalState: Exclude<ModalState, null>;
  onClose: () => void;
  documents: ReturnType<typeof useVendorDocuments>["documents"];
  config: ReturnType<typeof usePackageConfig>["config"];
  auditRecords: ReturnType<typeof useHumanReview>["auditRecords"];
  extractions: ReturnType<typeof useVendorExtractions>["extractions"];
}) {
  const [report, setReport] = useState<ReportPreview | null>(null);
  const vendorDocuments = documents.filter((document) => document.vendorId === modalState.vendor.id);
  const extractionFields =
    extractions.find((record) => record.vendorId === modalState.vendor.id)?.fields ?? [];
  const scorecard = buildVendorScorecard(
    modalState.vendor,
    vendorDocuments,
    config,
    extractionFields,
  );
  const vendorAudit = auditRecords
    .filter((record) => record.vendorId === modalState.vendor.id)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  useEffect(() => {
    if (modalState.kind !== "report") {
      setReport(null);
      return;
    }
    void api.generateVendorReport(modalState.vendor.id).then(setReport).catch(() => {
      setReport({
        vendor: modalState.vendor.name,
        decision: scorecard.decision,
        score: scorecard.overallScore,
        findings: scorecard.findings,
        citations: extractionFields,
        auditTrail: vendorAudit,
      });
    });
  }, [modalState, scorecard, extractionFields, vendorAudit]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 p-4">
      <div className="mx-auto my-4 max-w-5xl rounded-[32px] border border-white/10 bg-white p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:my-8 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {modalState.kind === "report" ? "Report Preview" : "Success"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {modalState.vendor.name}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {modalState.kind === "report" ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <PreviewMetric label="Vendor" value={report?.vendor ?? modalState.vendor.name} />
              <PreviewMetric label="Decision" value={report?.decision ?? scorecard.decision} />
              <PreviewMetric label="Score" value={String(report?.score ?? scorecard.overallScore)} />
            </div>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Findings</CardTitle>
                <CardDescription>
                  Deterministic rule outcomes prepared for executive and procurement review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(report?.findings ?? scorecard.findings).map((finding) => (
                  <div key={finding.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{finding.ruleName}</p>
                      <Badge
                        variant={
                          finding.result === "Pass"
                            ? "success"
                            : finding.result === "Review"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {finding.result}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{finding.explanation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Citations</CardTitle>
                  <CardDescription>
                    Evidence references included in the vendor release package.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(report?.citations ?? extractionFields).map((field) => (
                    <div key={field.label} className="rounded-lg bg-surface p-4">
                      <p className="font-semibold text-foreground">{field.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {field.sourceDocument} · p.{field.pageNumber}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {field.evidenceSnippet}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Audit Trail</CardTitle>
                  <CardDescription>
                    Chronological release log included in the report preview.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(report?.auditTrail ?? vendorAudit).map((record) => (
                    <div key={record.id} className="rounded-lg bg-surface p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">{record.title}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {record.timestamp}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{record.detail}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-lg font-semibold text-emerald-900">{modalState.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
