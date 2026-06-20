import { Database, Workflow } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const architectureFlow = [
  "Vendor Pack",
  "AI Extraction",
  "Rules Engine",
  "Human Review",
  "Approved Vendor List",
  "Bid Analysis",
];

export function EcosystemFitPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="WhiteHelmet Context"
        title="Ecosystem Fit"
        description="Mawthūq occupies the upstream vendor-prequalification layer. It turns raw contractor packages into trusted, evidence-backed release decisions that feed downstream WhiteHelmet workflows."
      />

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Workflow className="mt-1 h-5 w-5 text-primary" />
            <div>
              <CardTitle>Reference architecture</CardTitle>
              <CardDescription>
                Mawthūq prepares trusted vendor profiles before bid-stage analysis begins.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {architectureFlow.map((step, index) => (
              <div key={step} className="relative">
                <div className="rounded-xl border border-border bg-white p-5 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Step {index + 1}
                  </p>
                  <p className="mt-3 font-semibold text-foreground">{step}</p>
                </div>
                {index < architectureFlow.length - 1 ? (
                  <div className="hidden xl:flex absolute inset-y-0 -right-3 items-center text-muted-foreground">
                    →
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-primary/25 bg-slate-950 p-6 text-white">
            <div className="flex items-start gap-3">
              <Database className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Storage Layer
                </p>
                <p className="mt-2 text-2xl font-semibold">Common Data Environment (CDE)</p>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground/70">
                  Vendor documents, scorecards, citations, and audit trails are retained underneath the operating flow as the controlled storage and governance layer.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What Mawthūq does</CardTitle>
            <CardDescription>
              It fills a specific upstream procurement gap.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Receives contractor qualification packages before tender invitation.",
              "Extracts evidence with citations across regulatory, financial, HSE, and technical documents.",
              "Applies deterministic business rules to produce defensible recommendations.",
              "Routes findings into human review and downstream release decisions.",
            ].map((item) => (
              <div key={item} className="rounded-lg bg-surface p-4 text-sm leading-6 text-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What Mawthūq does not replace</CardTitle>
            <CardDescription>
              Mawthūq is complementary to other WhiteHelmet intelligence layers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              <p className="font-semibold text-foreground">AI Compliance Analysis</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Compliance analysis can assess broader project and document obligations, while Mawthūq focuses specifically on vendor prequalification before tender invitation.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-semibold text-foreground">AI Bid Analysis</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Bid analysis evaluates tender submissions and commercial positions. Mawthūq feeds trusted, prequalified vendors into that system rather than replacing it.
              </p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="font-semibold text-foreground">Strategic implication</p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                Mawthūq strengthens the full WhiteHelmet ecosystem by improving who enters downstream analysis, not by duplicating downstream intelligence functions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
