import { usePackageConfig } from "@/hooks/use-package-config";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PackageSetupPage() {
  const { config, setConfig } = usePackageConfig();

  function updateField<K extends keyof typeof config>(field: K, value: (typeof config)[K]) {
    setConfig((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateWeight(field: keyof typeof config.scoringWeights, value: number) {
    setConfig((current) => ({
      ...current,
      scoringWeights: {
        ...current.scoringWeights,
        [field]: value,
      },
    }));
  }

  function updateThreshold(
    field: keyof typeof config.decisionThresholds,
    value: number,
  ) {
    setConfig((current) => ({
      ...current,
      decisionThresholds: {
        ...current.decisionThresholds,
        [field]: value,
      },
    }));
  }

  const totalWeight = Object.values(config.scoringWeights).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Configuration"
        title="Package Setup"
        description="Define the qualification package structure, hard gates, scoring weights, and decision thresholds from the UI. This module makes it clear that business rules are configurable and not hardcoded by AI."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Package definition</CardTitle>
            <CardDescription>
              Core package fields can be edited to reflect different procurement packages, disciplines, and value bands.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">Package Name</span>
              <input
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                value={config.packageName}
                onChange={(event) => updateField("packageName", event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">Project Name</span>
              <input
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                value={config.projectName}
                onChange={(event) => updateField("projectName", event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">Work Category</span>
              <input
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                value={config.workCategory}
                onChange={(event) => updateField("workCategory", event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">Package Value Band</span>
              <input
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                value={config.packageValueBand}
                onChange={(event) => updateField("packageValueBand", event.target.value)}
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Required documents and hard gates</CardTitle>
            <CardDescription>
              These lists are shown as business-owned controls, not hidden model prompts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Required Documents</p>
              {config.requiredDocuments.map((document) => (
                <div
                  key={document}
                  className="rounded-lg border border-border p-4 text-sm text-foreground"
                >
                  {document}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Hard Gate Rules</p>
              {config.hardGateRules.map((rule) => (
                <div
                  key={rule}
                  className="rounded-lg bg-surface p-4 text-sm leading-6 text-foreground"
                >
                  {rule}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Scoring weights</CardTitle>
            <CardDescription>
              Default weights are editable from the UI to demonstrate configurable business logic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["compliance", "Compliance"],
              ["financial", "Financial"],
              ["technical", "Technical"],
              ["hse", "HSE"],
              ["localization", "Localization"],
            ].map(([key, label]) => (
              <label key={key} className="block space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-sm text-muted-foreground">
                    {config.scoringWeights[key as keyof typeof config.scoringWeights]}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  className="w-full accent-[hsl(var(--primary))]"
                  value={config.scoringWeights[key as keyof typeof config.scoringWeights]}
                  onChange={(event) =>
                    updateWeight(
                      key as keyof typeof config.scoringWeights,
                      Number(event.target.value),
                    )
                  }
                />
              </label>
            ))}
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm font-semibold text-foreground">Total Weight</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {totalWeight}% configured. Teams can rebalance the model to match project governance.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decision thresholds</CardTitle>
            <CardDescription>
              PASS, CONDITIONAL, and FAIL thresholds are editable here to make deterministic recommendation bands transparent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-foreground">PASS &gt;=</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  value={config.decisionThresholds.pass}
                  onChange={(event) => updateThreshold("pass", Number(event.target.value))}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-foreground">CONDITIONAL Min</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  value={config.decisionThresholds.conditionalMin}
                  onChange={(event) =>
                    updateThreshold("conditionalMin", Number(event.target.value))
                  }
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-foreground">CONDITIONAL Max</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  value={config.decisionThresholds.conditionalMax}
                  onChange={(event) =>
                    updateThreshold("conditionalMax", Number(event.target.value))
                  }
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">PASS</p>
                <p className="mt-2 text-sm leading-6 text-emerald-700">
                  Score {">="} {config.decisionThresholds.pass}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">CONDITIONAL</p>
                <p className="mt-2 text-sm leading-6 text-amber-700">
                  Score {config.decisionThresholds.conditionalMin}-
                  {config.decisionThresholds.conditionalMax}
                </p>
              </div>
              <div className="rounded-lg bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-800">FAIL</p>
                <p className="mt-2 text-sm leading-6 text-rose-700">
                  Score {"<"} {config.decisionThresholds.conditionalMin}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-semibold text-foreground">Why this matters</p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                Decision bands are configured explicitly in the product so reviewers can defend recommendations as business-governed rules, not opaque AI judgments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
