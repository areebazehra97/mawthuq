import { useMemo } from "react";
import {
  AlertTriangle, Award, ChevronRight, Layers, MapPin,
  Package, Plus, Settings, Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { VendorPreviewTable } from "@/components/vendor-preview-table";
import { useDemoVendors } from "@/hooks/use-demo-vendors";
import { useCommandCenterSummary } from "@/hooks/use-command-center-summary";
import { useProjects } from "@/hooks/use-projects";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";

/* ── Static attention data ───────────────────────────────────────────────── */

type ReadinessStatus =
  | "Not Started"
  | "Sourcing Vendors"
  | "Awaiting Submissions"
  | "Under Review"
  | "Vendor Gap"
  | "Ready for Shortlist"
  | "Ready for Tender"
  | "Blocked";

type NextActionType = "add" | "invite" | "remind" | "review" | "shortlist" | "tender";

interface AttentionPackage {
  id: string;
  package: string;
  project: string;
  projectId: string | null;
  category: string;
  readiness: ReadinessStatus;
  invited: number;
  submitted: number;
  qualified: number;
  qualifiedRequired: number;
  mainBlocker: string;
  nextAction: string;
  nextActionType: NextActionType;
}

const READINESS_PRIORITY: Record<ReadinessStatus, number> = {
  "Blocked":              0,
  "Vendor Gap":           1,
  "Under Review":         2,
  "Awaiting Submissions": 3,
  "Not Started":          4,
  "Sourcing Vendors":     5,
  "Ready for Shortlist":  6,
  "Ready for Tender":     7,
};

const ATTENTION_PACKAGES: AttentionPackage[] = ([
  {
    id: "ap-001",
    package: "Main Works Prequalification",
    project: "North Riyadh Integrated Development",
    projectId: "proj-001",
    category: "Building & Civil Works",
    readiness: "Vendor Gap",
    invited: 4, submitted: 3, qualified: 1, qualifiedRequired: 5,
    mainBlocker: "Need 4 more qualified vendors",
    nextAction: "Add vendors",
    nextActionType: "add",
  },
  {
    id: "ap-002",
    package: "Civil Groundworks Prequalification",
    project: "NEOM Linear City — Groundworks",
    projectId: "proj-002",
    category: "Civil & Infrastructure",
    readiness: "Awaiting Submissions",
    invited: 4, submitted: 0, qualified: 0, qualifiedRequired: 4,
    mainBlocker: "No vendors have submitted",
    nextAction: "Send reminders",
    nextActionType: "remind",
  },
  {
    id: "ap-003",
    package: "Hospitality Fit-Out Package",
    project: "Diriyah Gate — Hospitality Zone",
    projectId: "proj-003",
    category: "Fit-Out & Interiors",
    readiness: "Not Started",
    invited: 0, submitted: 0, qualified: 0, qualifiedRequired: 5,
    mainBlocker: "No vendors invited",
    nextAction: "Invite vendors",
    nextActionType: "invite",
  },
  {
    id: "ap-004",
    package: "MEP Subcontractors Package",
    project: "Diriyah Gate — Hospitality Zone",
    projectId: "proj-003",
    category: "MEP",
    readiness: "Under Review",
    invited: 12, submitted: 6, qualified: 2, qualifiedRequired: 5,
    mainBlocker: "4 reviews overdue",
    nextAction: "Open reviews",
    nextActionType: "review",
  },
  {
    id: "ap-005",
    package: "Façade & Cladding Package",
    project: "Jeddah Waterfront Mixed-Use",
    projectId: null,
    category: "Façade & Cladding",
    readiness: "Ready for Shortlist",
    invited: 9, submitted: 7, qualified: 5, qualifiedRequired: 5,
    mainBlocker: "Shortlist not approved",
    nextAction: "Build shortlist",
    nextActionType: "shortlist",
  },
] satisfies AttentionPackage[]).sort((a, b) => READINESS_PRIORITY[a.readiness] - READINESS_PRIORITY[b.readiness]);

/* ── Style maps ──────────────────────────────────────────────────────────── */

const projectStatusCls: Record<ProjectStatus, string> = {
  Active:    "bg-success/15 text-success border-success/40",
  Tendering: "bg-info/10 text-info border-info/30",
  Planning:  "bg-muted text-muted-foreground border-border",
  Closed:    "bg-destructive/10 text-destructive border-destructive/40",
};

const readinessCls: Record<ReadinessStatus, string> = {
  "Not Started":          "bg-muted text-muted-foreground border-border",
  "Sourcing Vendors":     "bg-info/10 text-info border-info/30",
  "Awaiting Submissions": "bg-warning/15 text-warning-foreground border-warning/40",
  "Under Review":         "bg-purple-500/10 text-purple-700 border-purple-400/40",
  "Vendor Gap":           "bg-orange-500/10 text-orange-700 border-orange-400/40",
  "Ready for Shortlist":  "bg-success/15 text-success border-success/40",
  "Ready for Tender":     "bg-success text-success-foreground border-success",
  "Blocked":              "bg-destructive/10 text-destructive border-destructive/40",
};

const readinessRowAccent: Partial<Record<ReadinessStatus, string>> = {
  "Blocked":              "border-l-2 border-l-destructive",
  "Vendor Gap":           "border-l-2 border-l-orange-500",
  "Under Review":         "border-l-2 border-l-purple-500",
  "Awaiting Submissions": "border-l-2 border-l-warning",
};

const nextActionCls: Record<NextActionType, string> = {
  "add":       "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10",
  "invite":    "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10",
  "remind":    "border-warning/50 text-warning-foreground bg-warning/10 hover:bg-warning/15",
  "review":    "border-purple-400/50 text-purple-700 bg-purple-500/5 hover:bg-purple-500/10",
  "shortlist": "border-success/50 text-success bg-success/5 hover:bg-success/10",
  "tender":    "border-success text-success-foreground bg-success hover:bg-success/90",
};

/* ── Page ────────────────────────────────────────────────────────────────── */

export function DashboardPage() {
  const { vendors } = useDemoVendors();
  const { projects } = useProjects();
  const { summary } = useCommandCenterSummary();
  const navigate = useNavigate();

  /* Derived metrics */
  const attentionPackages = useMemo<AttentionPackage[]>(() => {
    if (!summary) return ATTENTION_PACKAGES;
    const toActionType = (action: string): NextActionType => {
      if (action.includes("Add")) return "add";
      if (action.includes("Invite")) return "invite";
      if (action.includes("remind") || action.includes("Reminder") || action.includes("Send")) return "remind";
      if (action.includes("shortlist")) return "shortlist";
      if (action.includes("tender")) return "tender";
      return "review";
    };

    return summary.packagesNeedingAttention.map((pkg) => ({
      id: pkg.packageId,
      package: pkg.packageName,
      project: pkg.projectName,
      projectId: pkg.projectId,
      category: pkg.category,
      readiness: pkg.readinessStatus,
      invited: pkg.invitedCount,
      submitted: pkg.submittedCount,
      qualified: pkg.qualifiedCount,
      qualifiedRequired: pkg.requiredVendorCount,
      mainBlocker: pkg.mainBlocker,
      nextAction: pkg.nextAction,
      nextActionType: toActionType(pkg.nextAction),
    }));
  }, [summary]);

  const attentionCount = attentionPackages.filter(
    p => !["Ready for Shortlist", "Ready for Tender"].includes(p.readiness),
  ).length;

  function handleNextAction(pkg: AttentionPackage) {
    if (pkg.projectId) {
      if (pkg.nextActionType === "remind") {
        toast.info("Reminders sent", { description: `Sent to ${pkg.invited} invited vendors on ${pkg.package}` });
      } else {
        navigate(`/projects/${pkg.projectId}`);
      }
    } else {
      toast.info("Package workspace coming soon", { description: pkg.package });
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Executive View"
        title="Prequalification Command Center"
        description="Monitor contractor readiness, evidence quality, and decision velocity before tender invitation."
        action={
          <Link
            to="/vendor-invitations?new=1"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </Link>
        }
      />

      <div className="space-y-10">
        <section className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Active Packages"
              value={String(summary?.kpis.totalPackages ?? 12)}
              supporting={`Across ${summary?.kpis.activeProjects ?? 3} active projects`}
              icon={<Layers className="h-5 w-5" />}
            />
            <MetricCard
              label="Vendors in Pipeline"
              value={String(
                summary
                  ? summary.kpis.totalInvitations + summary.kpis.submittedApplications
                  : 48,
              )}
              supporting="Invited across all packages"
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard
              label="Packages Needing Action"
              value={String(attentionCount)}
              supporting="Blocked, gap, or overdue"
              icon={<AlertTriangle className="h-5 w-5" />}
              className="border-warning/30"
            />
            <MetricCard
              label="Ready for Tender"
              value={String(
                summary
                  ? summary.packagesNeedingAttention.filter(
                      (pkg) => pkg.readinessStatus === "Ready for Tender",
                    ).length
                  : 2,
              )}
              supporting="Shortlist complete"
              icon={<Award className="h-5 w-5" />}
              className="border-success/30"
            />
          </div>

          <PackagesNeedingAttention
            packages={attentionPackages}
            onNextAction={handleNextAction}
          />
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">Projects</span>
            <div className="h-px flex-1 bg-border" />
            <Link
              to="/project-setup"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <DashboardProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section>
          <VendorPreviewTable vendors={vendors} projects={projects} />
        </section>
      </div>
    </div>
  );
}

/* ── Packages Needing Attention ──────────────────────────────────────────── */

function PackagesNeedingAttention({
  packages, onNextAction,
}: {
  packages: AttentionPackage[];
  onNextAction: (pkg: AttentionPackage) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Section header */}
      <div className="flex items-start justify-between gap-4 border-b border-border bg-muted/20 px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Packages Needing Attention</h2>
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">
              {packages.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Prioritized package pipelines that need sourcing, review, document updates, or shortlist decisions.
          </p>
        </div>
        <Link
          to="/projects"
          className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all →
        </Link>
      </div>

      {packages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <Award className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">All active packages are on track</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Create a new package or review upcoming tender deadlines.
            </p>
          </div>
          <Link
            to="/project-setup"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
            New Package
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 text-start">Package</th>
                <th className="px-3 py-3 text-start">Project</th>
                <th className="px-3 py-3 text-start">Category</th>
                <th className="px-3 py-3 text-start">Readiness</th>
                <th className="px-3 py-3 text-start">Main Blocker</th>
                <th className="px-6 py-3 text-end">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
                const isHighPriority = READINESS_PRIORITY[pkg.readiness] <= 2;
                const accentCls = readinessRowAccent[pkg.readiness] ?? "";
                return (
                  <tr
                    key={pkg.id}
                    className={cn(
                      "group cursor-pointer border-t border-border transition-colors hover:bg-muted/30",
                      isHighPriority && "bg-muted/[0.03]",
                      accentCls,
                    )}
                    onClick={() => pkg.projectId && window.location.assign(`/projects/${pkg.projectId}`)}
                  >
                    {/* Package */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {pkg.package}
                          </p>
                        </div>
                        {isHighPriority && (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                        )}
                      </div>
                    </td>

                    {/* Project */}
                    <td className="px-3 py-4">
                      <p className="max-w-[160px] truncate text-sm text-muted-foreground" title={pkg.project}>
                        {pkg.project}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-4">
                      <span className="chip whitespace-nowrap text-[10px]">{pkg.category}</span>
                    </td>

                    {/* Readiness */}
                    <td className="px-3 py-4">
                      <span className={`status-pill text-[10px] font-semibold ${readinessCls[pkg.readiness]}`}>
                        {pkg.readiness}
                      </span>
                    </td>

                    {/* Main blocker */}
                    <td className="px-3 py-4">
                      <div className="flex max-w-[200px] items-start gap-1.5">
                        {isHighPriority && (
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
                        )}
                        <p className="text-xs text-muted-foreground">{pkg.mainBlocker}</p>
                      </div>
                    </td>

                    {/* Next action */}
                    <td className="px-6 py-4 text-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onNextAction(pkg)}
                        className={cn(
                          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                          nextActionCls[pkg.nextActionType],
                        )}
                      >
                        {pkg.nextAction}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DashboardProjectCard({ project }: { project: Project }) {
  const pct = project.totalInvited > 0
    ? Math.round((project.submittedCount / project.totalInvited) * 100)
    : 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span className={`status-pill ${projectStatusCls[project.status]}`}>{project.status}</span>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.assign(`/project-setup?id=${project.id}`); }}
          title="Project settings"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Name */}
      <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
        {project.name}
      </h3>
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {project.location}
      </p>

      {/* Categories */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.categories.map((cat) => (
          <span key={cat} className="chip text-[10px]">{cat}</span>
        ))}
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Vendor submissions</span>
          <span className="tabular-nums font-medium text-foreground">
            {project.submittedCount} / {project.totalInvited}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct >= 80 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-primary/40",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {project.totalInvited} invited
        </span>
        <span className="text-xs font-medium text-accent transition-colors group-hover:text-accent/80">
          Open workspace →
        </span>
      </div>
    </Link>
  );
}
