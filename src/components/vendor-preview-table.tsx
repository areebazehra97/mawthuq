import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Project, ReviewStage, VendorRecord, VendorStatus } from "@/types";

interface VendorPreviewTableProps {
  vendors: VendorRecord[];
  projects?: Project[];
}

export function VendorPreviewTable({ vendors, projects = [] }: VendorPreviewTableProps) {
  const sorted = [...vendors].sort((a, b) => urgencyOrder(a) - urgencyOrder(b));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0 pt-5 px-5 sm:pt-6 sm:px-6">
        <h3 className="text-base font-semibold text-foreground">
          Vendors{" "}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            ({vendors.length})
          </span>
        </h3>
        <span className="text-xs text-muted-foreground select-none">
          Recommendation ↑
        </span>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-0">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-2.5 text-start font-medium sm:px-6">Vendor</th>
              <th className="px-3 py-2.5 text-start font-medium">Status</th>
              <th className="px-3 py-2.5 text-start font-medium">Project</th>
              <th className="px-3 py-2.5 text-end font-medium">Score</th>
              <th className="px-3 py-2.5 text-end font-medium">Open Flags</th>
              <th className="px-3 py-2.5 text-start font-medium">Recommendation</th>
              <th className="px-5 py-2.5 sm:px-6" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((vendor) => (
              <VendorRow key={vendor.id} vendor={vendor} projects={projects} />
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function VendorRow({ vendor, projects }: { vendor: VendorRecord; projects: Project[] }) {
  const status = stageToStatus(vendor.reviewStage);
  const rec = toRecommendation(vendor);
  const project = vendor.projectId ? projects.find((p) => p.id === vendor.projectId) : null;

  return (
    <tr className="border-t border-border hover:bg-surface/60 transition-colors">
      {/* Vendor */}
      <td className="px-5 py-3.5 sm:px-6">
        <div className="font-semibold text-foreground leading-snug">{vendor.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5" dir="rtl">
          {vendor.arabicName}
        </div>
      </td>

      {/* Status pill */}
      <td className="px-3 py-3.5">
        <span className={`status-pill ${status.cls}`}>
          {status.dot && (
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          )}
          {status.label}
        </span>
      </td>

      {/* Project */}
      <td className="px-3 py-3.5">
        {project ? (
          <span className="chip max-w-[180px] truncate">{project.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Score */}
      <td className="px-3 py-3.5 text-end tabular-nums font-semibold text-foreground">
        {vendor.score > 0 ? vendor.score : <span className="text-muted-foreground font-normal">—</span>}
      </td>

      {/* Open flags */}
      <td className="px-3 py-3.5 text-end tabular-nums">
        {vendor.openIssues > 0 ? (
          <span className="inline-flex items-center justify-center min-w-[1.4rem] px-1.5 py-0.5 rounded bg-warning/20 text-warning-foreground text-xs font-semibold">
            {vendor.openIssues}
          </span>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>

      {/* Recommendation badge */}
      <td className="px-3 py-3.5">
        <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${rec.cls}`}>
          {rec.label}
        </span>
      </td>

      {/* Open link */}
      <td className="px-5 py-3.5 text-end sm:px-6">
        <Link
          to="/vendor-intake"
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium"
        >
          Open
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
}

/* ─── Helpers ─── */

const stageMap: Record<ReviewStage, { label: string; cls: string; dot?: string }> = {
  Uploaded: {
    label: "Awaiting docs",
    cls: "bg-muted text-muted-foreground border-border",
  },
  Extracted: {
    label: "Processing",
    cls: "bg-info/10 text-info border-info/30",
    dot: "bg-info animate-pulse",
  },
  Scored: {
    label: "Ready for review",
    cls: "bg-warning/15 text-warning-foreground border-warning/40",
  },
  "In Review": {
    label: "Ready for review",
    cls: "bg-warning/15 text-warning-foreground border-warning/40",
  },
  Approved: {
    label: "Approved",
    cls: "bg-success/15 text-success border-success/40",
  },
  Rejected: {
    label: "Rejected",
    cls: "bg-destructive/10 text-destructive border-destructive/40",
  },
};

function stageToStatus(stage: ReviewStage) {
  return stageMap[stage] ?? stageMap["Uploaded"];
}

const recMap: Record<VendorStatus, { label: string; cls: string }> = {
  PASS: { label: "PASS", cls: "bg-success text-success-foreground" },
  CONDITIONAL: { label: "CONDITIONAL", cls: "bg-warning text-warning-foreground" },
  FAIL: { label: "FAIL", cls: "bg-destructive text-destructive-foreground" },
};

const pendingRec = { label: "PENDING", cls: "bg-muted text-muted-foreground border border-border" };

function toRecommendation(vendor: VendorRecord) {
  if (vendor.score === 0 || vendor.reviewStage === "Uploaded" || vendor.reviewStage === "Extracted") {
    return pendingRec;
  }
  return recMap[vendor.status] ?? pendingRec;
}

const urgencyScore: Record<VendorStatus, number> = { FAIL: 0, CONDITIONAL: 1, PASS: 3 };
const stageUrgency: Record<ReviewStage, number> = {
  Rejected: 0,
  "In Review": 1,
  Scored: 1,
  Extracted: 2,
  Uploaded: 2,
  Approved: 3,
};

function urgencyOrder(v: VendorRecord) {
  if (v.score === 0 || v.reviewStage === "Uploaded" || v.reviewStage === "Extracted") {
    return stageUrgency[v.reviewStage] ?? 2;
  }
  return urgencyScore[v.status] ?? 2;
}
