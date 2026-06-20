import { useState } from "react";
import { RotateCcw, Wrench } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoVendors } from "@/hooks/use-demo-vendors";
import { useHumanReview } from "@/hooks/use-human-review";
import { useVendorDocuments } from "@/hooks/use-vendor-documents";
import { useVendorExtractions } from "@/hooks/use-vendor-extractions";
import { api } from "@/lib/api";

export function DemoOpsPage() {
  const { vendors, refresh: refreshVendors } = useDemoVendors();
  const { documents, refresh: refreshDocuments } = useVendorDocuments();
  const { extractions, refresh: refreshExtractions } = useVendorExtractions();
  const { refresh: refreshReview } = useHumanReview();
  const [resetting, setResetting] = useState(false);

  async function resetDemo() {
    setResetting(true);
    try {
      await api.resetDemo();
      await Promise.all([
        refreshVendors(),
        refreshDocuments(),
        refreshExtractions(),
        refreshReview(),
      ]);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Hidden Route"
        title="Demo Ops"
        description="Operational tools for rehearsing the executive demo, resetting seeded data, and confirming that the working AI pipeline is in a known state."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Demo controls</CardTitle>
            <CardDescription>
              Use this route before or after a walkthrough to restore the seeded Mawthūq story.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => void resetDemo()} disabled={resetting}>
              <RotateCcw className="h-4 w-4" />
              {resetting ? "Resetting..." : "Reset Demo State"}
            </Button>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold text-foreground">Reset outcome</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Vendors, documents, extractions, reports, and audit records return to the seeded executive demo baseline.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Wrench className="mt-1 h-5 w-5 text-primary" />
              <div>
                <CardTitle>Current state snapshot</CardTitle>
                <CardDescription>
                  A lightweight check that the app has enough working data to demonstrate the full flow.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <SnapshotCard label="Vendors" value={String(vendors.length)} />
            <SnapshotCard label="Documents" value={String(documents.length)} />
            <SnapshotCard label="Extractions" value={String(extractions.length)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SnapshotCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
