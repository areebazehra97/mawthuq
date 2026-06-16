import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, FileSearch, Languages, Play, Quote, ShieldAlert } from "lucide-react";
import { aiProgressStages, seededAiExtractions } from "@/data/seed";
import { DocumentStatusBadge } from "@/components/document-status-badge";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoVendors } from "@/hooks/use-demo-vendors";
import { useVendorDocuments } from "@/hooks/use-vendor-documents";

export function AiExtractionPage() {
  const { vendors } = useDemoVendors();
  const { documents } = useVendorDocuments();
  const [activeVendorId, setActiveVendorId] = useState<string>(vendors[0]?.id ?? "");
  const [runningVendorId, setRunningVendorId] = useState<string | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const [completedVendorIds, setCompletedVendorIds] = useState<Record<string, boolean>>({});

  const activeVendor = vendors.find((vendor) => vendor.id === activeVendorId) ?? vendors[0];
  const activeDocuments = useMemo(
    () => documents.filter((document) => document.vendorId === activeVendorId),
    [documents, activeVendorId],
  );
  const extractionFields = seededAiExtractions[activeVendorId] ?? [];

  useEffect(() => {
    if (!runningVendorId) {
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    aiProgressStages.forEach((_, index) => {
      const timer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }
        setActiveStageIndex(index);
        if (index === aiProgressStages.length - 1) {
          window.setTimeout(() => {
            if (cancelled) {
              return;
            }
            setCompletedVendorIds((current) => ({
              ...current,
              [runningVendorId]: true,
            }));
            setRunningVendorId(null);
            setActiveStageIndex(-1);
          }, 750);
        }
      }, index * 800);
      timers.push(timer);
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [runningVendorId]);

  function runAnalysis(vendorId: string) {
    setActiveVendorId(vendorId);
    setCompletedVendorIds((current) => ({
      ...current,
      [vendorId]: false,
    }));
    setRunningVendorId(vendorId);
    setActiveStageIndex(0);
  }

  const isRunningForActiveVendor = runningVendorId === activeVendorId;
  const hasCompletedForActiveVendor = completedVendorIds[activeVendorId] ?? false;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Evidence Layer"
        title="AI Extraction"
        description="This demo AI system simulates bilingual document analysis, field extraction, citation generation, and review handoff. Every extracted value is shown with supporting evidence so the experience stays aligned with Mawthūq’s evidence-first operating model."
        action={<Badge variant="accent">Demo AI Mode</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <CardHeader>
            <CardTitle>Analysis queue</CardTitle>
            <CardDescription>
              Select a vendor pack and run the staged demo workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendors.map((vendor) => {
              const vendorDocuments = documents.filter((document) => document.vendorId === vendor.id);
              const extractedCount = seededAiExtractions[vendor.id]?.length ?? 0;
              const isActive = vendor.id === activeVendorId;
              const isRunning = vendor.id === runningVendorId;
              const isDone = completedVendorIds[vendor.id] ?? false;

              return (
                <div
                  key={vendor.id}
                  className={`rounded-3xl border p-4 transition ${
                    isActive ? "border-primary/40 bg-primary/10" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() => setActiveVendorId(vendor.id)}
                    >
                      <p className="font-semibold text-slate-900">{vendor.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{vendor.arabicName}</p>
                    </button>
                    <StatusBadge status={vendor.status} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Metric label="Documents" value={String(vendorDocuments.length)} />
                    <Metric label="Fields Ready" value={String(extractedCount)} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {isRunning ? "Running" : isDone ? "Ready for review" : "Awaiting analysis"}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => runAnalysis(vendor.id)}
                      disabled={Boolean(runningVendorId)}
                    >
                      <Play className="h-4 w-4" />
                      Run AI Analysis
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{activeVendor?.name ?? "AI Extraction"}</CardTitle>
                  <CardDescription>
                    Evidence-first demo extraction for the selected contractor package.
                  </CardDescription>
                </div>
                {activeVendor ? <StatusBadge status={activeVendor.status} /> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-3xl border border-primary/30 bg-primary/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-slate-900" />
                  <div>
                    <p className="font-semibold text-slate-900">No citation = no extraction</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      This demo only shows extracted values when they include a source document, page number, confidence score, and evidence snippet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <SignalCard
                  icon={<FileSearch className="h-5 w-5" />}
                  label="Documents in Pack"
                  value={String(activeDocuments.length)}
                />
                <SignalCard
                  icon={<Languages className="h-5 w-5" />}
                  label="Language Mix"
                  value={summarizeLanguages(activeDocuments)}
                />
                <SignalCard
                  icon={<Quote className="h-5 w-5" />}
                  label="Citation-Backed Fields"
                  value={String(extractionFields.length)}
                />
                <SignalCard
                  icon={<Bot className="h-5 w-5" />}
                  label="Review Queue"
                  value={hasCompletedForActiveVendor ? "Prepared" : "Pending"}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                <Card className="border-slate-200 shadow-none">
                  <CardHeader>
                    <CardTitle>Analysis progress</CardTitle>
                    <CardDescription>
                      A staged demo sequence that mimics a realistic document intelligence pipeline.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiProgressStages.map((stage, index) => {
                      const isComplete =
                        hasCompletedForActiveVendor ||
                        (isRunningForActiveVendor && activeStageIndex > index);
                      const isCurrent = isRunningForActiveVendor && activeStageIndex === index;

                      return (
                        <div
                          key={stage}
                          className={`rounded-2xl border p-4 transition ${
                            isCurrent
                              ? "border-primary/40 bg-primary/10"
                              : isComplete
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">{stage}</p>
                            {isComplete ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <div
                                className={`h-3 w-3 rounded-full ${
                                  isCurrent ? "bg-primary" : "bg-slate-300"
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none">
                  <CardHeader>
                    <CardTitle>Source documents in scope</CardTitle>
                    <CardDescription>
                      Documents available to the demo analysis flow for the selected vendor.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activeDocuments.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                        No intake documents are currently loaded for this vendor.
                      </div>
                    ) : (
                      activeDocuments.map((document) => (
                        <div
                          key={document.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-slate-900">{document.documentType}</p>
                              <p className="mt-1 text-sm text-slate-500">{document.name}</p>
                            </div>
                            <DocumentStatusBadge status={document.status} />
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <MiniMeta label="Language" value={document.language} />
                            <MiniMeta label="Upload Date" value={document.uploadDate} />
                            <MiniMeta label="Confidence" value={`${document.confidenceScore}%`} />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extracted fields</CardTitle>
              <CardDescription>
                Citation-backed fields appear after the analysis sequence completes for the selected vendor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasCompletedForActiveVendor ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-sm leading-6 text-slate-500">
                  Run AI Analysis to populate the review queue with extracted, citation-backed fields for {activeVendor?.name}.
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {extractionFields.map((field) => (
                    <div
                      key={field.label}
                      className="rounded-3xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {field.label}
                          </p>
                          <p className="mt-3 text-xl font-semibold text-slate-900">{field.value}</p>
                        </div>
                        <Badge variant="neutral">{field.confidence}% confidence</Badge>
                      </div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <MiniMeta label="Source" value={field.sourceDocument} />
                        <MiniMeta label="Page" value={String(field.pageNumber)} />
                      </div>
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Evidence Snippet
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {field.evidenceSnippet}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SignalCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function summarizeLanguages(documents: Array<{ language: string }>) {
  const uniqueLanguages = Array.from(new Set(documents.map((document) => document.language)));
  return uniqueLanguages.length > 0 ? uniqueLanguages.join(" / ") : "None";
}
