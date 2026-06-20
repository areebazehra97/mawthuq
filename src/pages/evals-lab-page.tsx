import { CheckCircle2, ShieldAlert, TestTube2 } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const evals = [
  {
    title: "Extraction Accuracy",
    description:
      "Measure whether contractor facts are extracted correctly across Arabic, English, and bilingual submission packs.",
    methodology:
      "Compare field outputs against reviewer-labelled ground truth across commercial, financial, HSE, and classification documents.",
    status: "PASS",
    detail: "Demo benchmark assumes stable performance on structured certificates and moderate variability on narrative evidence.",
  },
  {
    title: "Citation Accuracy",
    description:
      "Confirm that every surfaced value points back to the right document, page, and supporting snippet.",
    methodology:
      "Check source-document alignment, page correctness, and evidence snippet fidelity against auditor review samples.",
    status: "PASS",
    detail: "Critical because Mawthūq’s trust model requires citation-backed extraction before rule evaluation.",
  },
  {
    title: "Hallucination Tests",
    description:
      "Stress the system against missing, low-quality, or contradictory packages to ensure it does not invent facts.",
    methodology:
      "Run null-document, duplicate-document, and conflicting-document scenarios and verify unresolved output behavior.",
    status: "PASS",
    detail: "Target behavior is conservative: unresolved fields stay unresolved rather than being guessed.",
  },
  {
    title: "Rules Engine Tests",
    description:
      "Validate that decisioning stays deterministic and aligned with package thresholds, hard gates, and review logic.",
    methodology:
      "Replay vendor cases with known outcomes and verify score, hard-gate, and recommendation consistency.",
    status: "PASS",
    detail: "Ensures recommendation shifts come from configured business rules rather than model drift.",
  },
  {
    title: "Edge Cases",
    description:
      "Cover unusual contractor packages such as mixed-language scans, missing expiry dates, and partial reference sets.",
    methodology:
      "Curate exception libraries and confirm routing into analyst review rather than silent acceptance.",
    status: "FAIL",
    detail: "Current demo assumption: long-tail exception handling needs more structured scenario coverage before production confidence.",
  },
] as const;

export function EvalsLabPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Model Quality"
        title="Evals Lab"
        description="A product-quality evaluation layer for Mawthūq’s evidence system. This page demonstrates how extraction, citations, and rules behavior can be measured in a controlled and executive-readable way."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evaluation methodology</CardTitle>
            <CardDescription>
              Mawthūq should be evaluated as an evidence system, not just a UI workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Extraction Accuracy",
              "Citation Accuracy",
              "Hallucination Tests",
              "Rules Engine Tests",
              "Edge Cases",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-surface p-4">
                <p className="font-medium text-foreground">{item}</p>
              </div>
            ))}
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
              <div className="flex items-start gap-3">
                <TestTube2 className="mt-0.5 h-5 w-5 text-foreground" />
                <div>
                  <p className="font-semibold text-foreground">Evaluation principle</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    Mawthūq should only be trusted when extraction quality, citation quality, and deterministic rule consistency are independently measurable.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          {evals.map((evaluation) => (
            <Card key={evaluation.title}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{evaluation.title}</CardTitle>
                    <CardDescription>{evaluation.description}</CardDescription>
                  </div>
                  <Badge variant={evaluation.status === "PASS" ? "success" : "danger"}>
                    {evaluation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Methodology
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {evaluation.methodology}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    {evaluation.status === "PASS" ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="mt-0.5 h-5 w-5 text-rose-600" />
                    )}
                    <p className="text-sm leading-6 text-muted-foreground">{evaluation.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
