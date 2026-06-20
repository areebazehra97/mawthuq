import { BookOpenText, Landmark, ShieldCheck } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sources = [
  {
    title: "WhiteHelmet",
    sourceType: "Ecosystem Product Context",
    whyItMatters: "Defines the surrounding product landscape Mawthūq needs to fit into.",
    productImplication: "Mawthūq should behave as an upstream qualification engine, not an isolated document tool.",
  },
  {
    title: "AI Compliance Analysis",
    sourceType: "Adjacent Product Capability",
    whyItMatters: "Clarifies where document and compliance intelligence may already exist in the wider ecosystem.",
    productImplication: "Mawthūq should avoid duplicating broad compliance review and instead focus on prequalification evidence and release control.",
  },
  {
    title: "RIBA Plan of Work",
    sourceType: "Process Framework",
    whyItMatters: "Provides a structured way to position vendor readiness against project stages and procurement sequencing.",
    productImplication: "Mawthūq should align its outputs to stage-gate governance and tender readiness checkpoints.",
  },
  {
    title: "Saudi Building Code",
    sourceType: "Regulatory Reference",
    whyItMatters: "Influences technical acceptability, licensing expectations, and project compliance posture.",
    productImplication: "Technical and HSE evaluation logic should anticipate code-linked documentation and contractor capability expectations.",
  },
  {
    title: "Balady",
    sourceType: "Municipal Platform",
    whyItMatters: "Relevant to permit, classification, and municipal evidence verification within Saudi construction workflows.",
    productImplication: "Mawthūq should be able to reference municipal verification pathways in its evidence model and audit trail.",
  },
  {
    title: "Etimad",
    sourceType: "Government Procurement Platform",
    whyItMatters: "Shapes public-sector procurement process expectations and supplier eligibility norms.",
    productImplication: "The platform should feel familiar to public procurement stakeholders and support defensible release records.",
  },
  {
    title: "Contractor Classification",
    sourceType: "Qualification Standard",
    whyItMatters: "Directly affects contractor eligibility, scope alignment, and hard-gate threshold design.",
    productImplication: "Classification grade must remain a first-class field with deterministic threshold logic and citations.",
  },
  {
    title: "LCGPA",
    sourceType: "Procurement Governance",
    whyItMatters: "Local content expectations increasingly influence procurement scoring and qualification posture.",
    productImplication: "Localization should remain a scored dimension with explainable evidence requirements rather than a vague narrative check.",
  },
  {
    title: "IKTVA",
    sourceType: "Localization Program",
    whyItMatters: "Demonstrates how structured local value programs influence supplier evaluation in Saudi industry.",
    productImplication: "Mawthūq should be extensible enough to support project-specific localization frameworks beyond generic local content statements.",
  },
  {
    title: "Nitaqat",
    sourceType: "Labor Compliance Program",
    whyItMatters: "Saudization status can materially affect vendor risk and eligibility.",
    productImplication: "Nitaqat should be captured as a deterministic compliance signal with visible sourcing and clear consequences.",
  },
  {
    title: "CST Cloud Regulations",
    sourceType: "Technology Governance",
    whyItMatters: "Enterprise buyers in Saudi Arabia will care about hosting posture, data handling, and cloud control expectations.",
    productImplication: "Mawthūq should be designed as an enterprise-ready platform with strong data-governance and deployment options.",
  },
] as const;

export function ResearchPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Strategy Appendix"
        title="Research & Sources"
        description="A product strategy appendix for executive stakeholders. These sources frame why Mawthūq should be Saudi-procurement-native, evidence-first, and positioned carefully within the wider WhiteHelmet ecosystem."
      />

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <BookOpenText className="mt-1 h-5 w-5 text-primary" />
              <div>
                <CardTitle>How to read this appendix</CardTitle>
                <CardDescription>
                  These are not just references; they shape product scope, credibility, and go-to-market fit.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-surface p-4">
              <p className="font-semibold text-foreground">Executive use</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Demonstrates that Mawthūq is grounded in procurement reality, ecosystem positioning, and Saudi-specific governance requirements.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="font-semibold text-foreground">Product use</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Helps prioritize what should become configurable rules, evidence requirements, workflow states, or downstream integrations.
              </p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
              <div className="flex items-start gap-3">
                <Landmark className="mt-0.5 h-5 w-5 text-foreground" />
                <div>
                  <p className="font-semibold text-foreground">Strategic takeaway</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    Mawthūq’s differentiation comes from combining explainable AI with Saudi-native procurement logic, not from being a generic vendor portal.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {sources.map((source) => (
            <Card key={source.title} className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{source.title}</CardTitle>
                    <CardDescription>{source.sourceType}</CardDescription>
                  </div>
                  <Badge variant="neutral">Source</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Why It Matters
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {source.whyItMatters}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Product Implication
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {source.productImplication}
                      </p>
                    </div>
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
