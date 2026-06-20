import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, Award, Briefcase,
  Building2, Calendar, Check, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Copy, FileText, FolderOpen, Mail, MapPin, Plus,
  RefreshCw, Search, Send, Settings, Shield, Star, Users, X,
} from "lucide-react";
import { toast } from "sonner";
import { tradeCategories } from "@/data/seed";
import { getReadinessStatus, type PackageVendorLink, type PkgAppStatus, type PkgQualStatus, type PkgReadinessStatus } from "@/data/package-applications";
import { vmVendors, vmDocuments, vmFindings, vmReviews, vmActivity, type VMVendor, type VendorGlobalStatus } from "@/data/vendor-master-seed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApplications } from "@/hooks/use-applications";
import { useInvitations } from "@/hooks/use-invitations";
import { useProjectPackages } from "@/hooks/use-project-packages";
import { useProjects } from "@/hooks/use-projects";
import {
  mapApplicationToPackageLink,
  mapBackendInvitationWithContext,
} from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import type { InvitationStatus, Project, ProjectStatus, VendorInvitation } from "@/types";

/* ── Style maps ──────────────────────────────────────────────────────────── */

const projectStatusCls: Record<ProjectStatus, string> = {
  Active:    "bg-success/15 text-success border-success/40",
  Tendering: "bg-info/10 text-info border-info/30",
  Planning:  "bg-muted text-muted-foreground border-border",
  Closed:    "bg-destructive/10 text-destructive border-destructive/40",
};

const globalStatusCls: Record<VendorGlobalStatus, string> = {
  "Active":       "bg-success/15 text-success border-success/40",
  "Under Review": "bg-warning/15 text-warning-foreground border-warning/40",
  "Suspended":    "bg-orange-500/10 text-orange-700 border-orange-400/40",
  "Blacklisted":  "bg-destructive/10 text-destructive border-destructive/40",
  "Inactive":     "bg-muted text-muted-foreground border-border",
};

const pkgAppStatusCls: Record<PkgAppStatus, string> = {
  "Invited":               "bg-info/10 text-info border-info/30",
  "Opened":                "bg-info/15 text-info border-info/40",
  "In Progress":           "bg-warning/15 text-warning-foreground border-warning/40",
  "Submitted":             "bg-warning/15 text-warning-foreground border-warning/40",
  "In Review":             "bg-purple-500/10 text-purple-700 border-purple-400/40",
  "Clarification Requested": "bg-orange-500/10 text-orange-700 border-orange-400/40",
  "Review Complete":       "bg-success/15 text-success border-success/40",
  "Withdrawn":             "bg-muted text-muted-foreground border-border",
};

const pkgQualStatusCls: Record<PkgQualStatus, string> = {
  "Not Started":          "bg-muted text-muted-foreground border-border",
  "Pending Review":       "bg-info/10 text-info border-info/30",
  "Qualified":            "bg-success/15 text-success border-success/40",
  "Conditionally Qualified": "bg-warning/15 text-warning-foreground border-warning/40",
  "Rejected":             "bg-destructive/10 text-destructive border-destructive/40",
  "Shortlisted":          "bg-accent/20 text-accent-foreground border-accent/40",
  "Awarded":              "bg-success text-success-foreground border-success",
};

const docStatusCls: Record<string, string> = {
  "Healthy":       "bg-success/15 text-success border-success/40",
  "Valid":         "bg-success/15 text-success border-success/40",
  "Expiring Soon": "bg-warning/15 text-warning-foreground border-warning/40",
  "Expired":       "bg-destructive/10 text-destructive border-destructive/40",
  "Missing":       "bg-muted text-muted-foreground border-border",
};

const findingSeverityCls: Record<string, string> = {
  "Low":      "bg-success/15 text-success border-success/40",
  "Medium":   "bg-warning/15 text-warning-foreground border-warning/40",
  "High":     "bg-orange-500/10 text-orange-700 border-orange-400/40",
  "Critical": "bg-destructive/10 text-destructive border-destructive/40",
};

const findingStatusCls: Record<string, string> = {
  "Open":       "bg-destructive/10 text-destructive border-destructive/40",
  "Monitoring": "bg-warning/15 text-warning-foreground border-warning/40",
  "Resolved":   "bg-success/15 text-success border-success/40",
};

const invitationStatusConfig: Record<InvitationStatus, { label: string; cls: string; dot?: string }> = {
  invited:   { label: "Invited",     cls: "bg-info/10 text-info border-info/30",                     dot: "bg-info" },
  opened:    { label: "Opened",      cls: "bg-info/15 text-info border-info/40",                     dot: "bg-info" },
  started:   { label: "In Progress", cls: "bg-warning/15 text-warning-foreground border-warning/40", dot: "bg-warning animate-pulse" },
  submitted: { label: "Submitted",   cls: "bg-success/15 text-success border-success/40",            dot: "bg-success" },
  expired:   { label: "Expired",     cls: "bg-muted text-muted-foreground border-border" },
  bounced:   { label: "Bounced",     cls: "bg-destructive/10 text-destructive border-destructive/30" },
  declined:  { label: "Declined",    cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

const readinessCls: Record<PkgReadinessStatus, string> = {
  "Not Started":          "bg-muted text-muted-foreground border-border",
  "Sourcing Vendors":     "bg-info/10 text-info border-info/30",
  "Awaiting Submissions": "bg-warning/15 text-warning-foreground border-warning/40",
  "Under Review":         "bg-purple-500/10 text-purple-700 border-purple-400/40",
  "Vendor Gap":           "bg-orange-500/10 text-orange-700 border-orange-400/40",
  "Ready for Shortlist":  "bg-success/15 text-success border-success/40",
  "Ready for Tender":     "bg-success text-success-foreground border-success",
};

const dimensionBarCls: Record<string, string> = {
  Compliance:   "bg-info",
  Financial:    "bg-success",
  Technical:    "bg-accent",
  HSE:          "bg-warning",
  Localization: "bg-primary",
};

const SECTION_TO_DIM: Record<string, string> = {
  "Regulatory Compliance": "Compliance",
  "Financial Standing":    "Financial",
  "Technical Capability":  "Technical",
  "HSE Record":            "HSE",
};

/* ── Types ───────────────────────────────────────────────────────────────── */

type ProjectTab = "applicants" | "invitations" | "shortlist" | "settings";
type VendorTab  = "evaluation" | "documents" | "reviews" | "findings" | "history";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function generateToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `MWQ-${seg(3)}${seg(3)}`;
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function scoreCircleCls(score: number): string {
  if (score >= 80) return "bg-success/15 text-success";
  if (score >= 60) return "bg-warning/15 text-warning-foreground";
  return "bg-destructive/10 text-destructive";
}

function scoreCls(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning-foreground";
  return "text-destructive";
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export function VendorIntakePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { primaryPackage } = useProjectPackages(projectId);
  const { applications, createApplication, updateApplication } = useApplications({
    packageId: primaryPackage?.id,
  });
  const {
    invitations: backendInvitations,
    createInvitation,
    updateInvitation,
  } = useInvitations({
    projectId,
    packageId: primaryPackage?.id,
  });

  const [projectTab, setProjectTab]     = useState<ProjectTab>("applicants");
  const [selectedLinkId, setSelected]   = useState<string | null>(null);
  const [selectedCat, setSelectedCat]   = useState("");
  const [activeVendorTab, setVendorTab] = useState<VendorTab>("evaluation");
  const [addOpen, setAddOpen]           = useState(false);
  const [rationaleOpen, setRationaleOpen]   = useState(false);
  const [rationaleText, setRationaleText]   = useState("");
  const [pendingQual, setPendingQual]       = useState<PkgQualStatus | null>(null);

  const selectedProject = projects.find(p => p.id === projectId) ?? null;

  /* Reset everything when project changes */
  useEffect(() => {
    setProjectTab("applicants");
    setSelected(null);
    setSelectedCat("");
    setVendorTab("evaluation");
    setAddOpen(false);
    setRationaleOpen(false);
    setRationaleText("");
    setPendingQual(null);
  }, [projectId]);

  if (!selectedProject) return <Navigate to="/projects" replace />;
  const project = selectedProject;

  const pkgLinks = useMemo(
    () => applications.map(mapApplicationToPackageLink),
    [applications],
  );
  const invitations = useMemo(
    () =>
      backendInvitations.map((invitation) =>
        mapBackendInvitationWithContext(invitation, undefined, primaryPackage),
      ),
    [backendInvitations, primaryPackage],
  );

  /* ── Computed ── */
  const linkedEntries = useMemo(() => pkgLinks.map(link => ({
    link,
    vendor: vmVendors.find(v => v.id === link.vendorId),
  })).filter((x): x is { link: PackageVendorLink; vendor: VMVendor } => x.vendor !== undefined),
  [pkgLinks]);

  const categories = useMemo(
    () => [...new Set(linkedEntries.flatMap(({vendor}) => vendor.tradeCategories))].sort(),
    [linkedEntries],
  );

  const effectiveCat = categories.includes(selectedCat) ? selectedCat : (categories[0] ?? "");

  const catEntries = effectiveCat
    ? linkedEntries.filter(({vendor}) => vendor.tradeCategories.includes(effectiveCat))
    : linkedEntries;

  const selectedEntry  = linkedEntries.find(({link}) => link.id === selectedLinkId) ?? null;
  const selectedLink   = selectedEntry?.link   ?? null;
  const selectedVendor = selectedEntry?.vendor ?? null;

  const vendorDocs     = selectedVendor ? vmDocuments.filter(d => d.vendorId === selectedVendor.id) : [];
  const vendorFindings = selectedVendor ? vmFindings.filter(f => f.vendorId === selectedVendor.id)  : [];
  const vendorActivity = selectedVendor ? vmActivity.filter(a => a.vendorId === selectedVendor.id)  : [];
  const vendorReviews  = selectedVendor ? vmReviews.filter(r => r.vendorId === selectedVendor.id)   : [];

  const readinessStatus = getReadinessStatus(pkgLinks);
  const readinessCounts = {
    total:       pkgLinks.length,
    invited:     pkgLinks.filter(l => l.appStatus === "Invited").length,
    submitted:   pkgLinks.filter(l => ["Submitted","In Review","Clarification Requested","Review Complete"].includes(l.appStatus)).length,
    inReview:    pkgLinks.filter(l => ["In Review","Review Complete"].includes(l.appStatus)).length,
    qualified:   pkgLinks.filter(l => ["Qualified","Conditionally Qualified"].includes(l.qualStatus)).length,
    shortlisted: pkgLinks.filter(l => l.qualStatus === "Shortlisted").length,
    blockers:    pkgLinks.filter(l => (l.blockers?.length ?? 0) > 0).length,
  };

  /* ── Actions ── */
  async function applyQualStatus(linkId: string, status: PkgQualStatus, rationale?: string) {
    await updateApplication(linkId, {
      qualificationStatus: status,
      rationale,
    });
  }

  function handleQualAction(linkId: string, status: PkgQualStatus) {
    const link = pkgLinks.find(l => l.id === linkId);
    if (!link) return;
    const hasBlockers = (link.blockers?.length ?? 0) > 0;
    const needsRationale = hasBlockers || status === "Rejected" || status === "Conditionally Qualified";
    if (needsRationale) {
      setPendingQual(status);
      setRationaleOpen(true);
      return;
    }
    void applyQualStatus(linkId, status).then(() => {
      if (status === "Shortlisted") toast.success(`${selectedVendor?.name} moved to shortlist`);
      else if (status === "Qualified") toast.success(`${selectedVendor?.name} marked as Qualified`);
    });
  }

  function confirmQualAction() {
    if (!selectedLink || !pendingQual) return;
    void applyQualStatus(selectedLink.id, pendingQual, rationaleText.trim() || undefined);
    const vendorName = selectedVendor?.name ?? "Vendor";
    if (pendingQual === "Shortlisted") toast.success(`${vendorName} shortlisted`);
    else if (pendingQual === "Rejected") toast.error(`${vendorName} application rejected`);
    else if (pendingQual === "Conditionally Qualified") toast.success(`${vendorName} conditionally qualified`);
    setRationaleOpen(false);
    setRationaleText("");
    setPendingQual(null);
  }

  function undoQualStatus(linkId: string) {
    void applyQualStatus(linkId, "Pending Review");
    toast.info("Decision undone — moved back to Pending Review");
  }

  async function addVendorsToPackage(newLinks: PackageVendorLink[]) {
    if (!primaryPackage) return;
    await Promise.all(
      newLinks.map((link) =>
        createApplication({
          id: link.id,
          vendorId: link.vendorId,
          projectId: project.id,
          packageId: primaryPackage.id,
          applicationStatus: link.appStatus,
          qualificationStatus: link.qualStatus,
          source: link.source,
        }),
      ),
    );
    toast.success(`${newLinks.length} vendor${newLinks.length !== 1 ? "s" : ""} added to package`);
  }

  function selectCat(cat: string) {
    setSelectedCat(cat);
    setSelected(null);
    setVendorTab("evaluation");
  }

  function selectVendor(linkId: string) {
    setSelected(linkId);
    setVendorTab("evaluation");
    setRationaleOpen(false);
    setRationaleText("");
    setPendingQual(null);
  }

  /* ── Readiness CTA ── */
  function readinessCta(): { label: string; onClick: () => void } {
    if (pkgLinks.length === 0) return { label: "+ Add Vendors to Package", onClick: () => setAddOpen(true) };
    if (readinessCounts.submitted === 0) return { label: "Send Reminders", onClick: () => toast.info("Reminders sent to all invited vendors") };
    if (readinessCounts.inReview > 0) return { label: "Open Review Queue", onClick: () => setVendorTab("evaluation") };
    if (readinessStatus === "Ready for Shortlist" || readinessStatus === "Ready for Tender") return { label: "Build Shortlist", onClick: () => setProjectTab("shortlist") };
    return { label: "+ Add Vendors to Package", onClick: () => setAddOpen(true) };
  }

  const cta = readinessCta();

  /* ── Render ── */
  return (
    <div className="space-y-5">

      {/* Project banner */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Projects
        </button>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Project</p>
            <p className="text-sm font-semibold text-foreground">{project.name}</p>
            <p className="text-[11px] text-muted-foreground">{selectedProject.arabicName}</p>
          </div>
          <BannerDivider />
          <BannerField label="Package"    value={project.packageName} />
          <BannerDivider />
          <BannerField label="Value Band" value={selectedProject.packageValueBand} />
          <BannerDivider />
          <BannerField label="Category"   value={selectedProject.workCategory} />
          <div className="ml-auto">
            <span className={`status-pill ${projectStatusCls[selectedProject.status]}`}>
              {selectedProject.status}
            </span>
          </div>
        </div>
      </div>

      {/* Project-level tab bar */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "applicants"  as ProjectTab, label: "Applicants",  icon: Users    },
          { id: "invitations" as ProjectTab, label: "Invitations", icon: Mail     },
          { id: "shortlist"   as ProjectTab, label: "Shortlist",   icon: Star     },
          { id: "settings"    as ProjectTab, label: "Settings",    icon: Settings },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setProjectTab(id)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              projectTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Settings ── */}
      {projectTab === "settings" && <ProjectSettingsPanel project={selectedProject} />}

      {/* ── Shortlist ── */}
      {projectTab === "shortlist" && (
        <ShortlistPanel entries={linkedEntries} onUndoShortlist={id => undoQualStatus(id)} />
      )}

      {/* ── Invitations ── */}
      {projectTab === "invitations" && (
        <InvitationsPanel
          invitations={invitations}
          projectName={project.name}
          packageName={project.packageName}
          onCreateInvitation={async (invitation) => {
            if (!primaryPackage) return;
            await createInvitation({
              id: invitation.id,
              projectId: project.id,
              packageId: primaryPackage.id,
              companyName: invitation.companyName,
              contactName: invitation.contactPerson,
              contactEmail: invitation.email,
              category: invitation.tradeCategory,
              invitedAt: invitation.invitedAt,
              expiresAt: invitation.expiresAt,
              status: "Invited",
            });
          }}
          onResendInvitation={async (invitationId) => {
            await updateInvitation(invitationId, {
              status: "Invited",
              invitedAt: today(),
              expiresAt: addDays(new Date(), 30),
            });
          }}
        />
      )}

      {/* ── Applicants ── */}
      {projectTab === "applicants" && (
        <div className="space-y-4">

          {/* Readiness summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`status-pill font-semibold ${readinessCls[readinessStatus]}`}>
                {readinessStatus}
              </span>
              {[
                { label: "Total",       value: readinessCounts.total },
                { label: "Submitted",   value: readinessCounts.submitted },
                { label: "In Review",   value: readinessCounts.inReview },
                { label: "Qualified",   value: readinessCounts.qualified },
                { label: "Shortlisted", value: readinessCounts.shortlisted },
              ].map(({ label, value }) => (
                <span key={label} className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{value}</span> {label}
                </span>
              ))}
              {readinessCounts.blockers > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {readinessCounts.blockers} blocker{readinessCounts.blockers !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cta.onClick}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                {cta.label}
              </button>
            </div>
          </div>

          {/* Two-panel layout */}
          <div className="flex gap-5">

            {/* Left panel */}
            <aside className="w-64 shrink-0 space-y-4">

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Trade Categories
                  </p>
                  <div className="flex flex-col gap-1">
                    {categories.map(cat => {
                      const count = linkedEntries.filter(({vendor}) => vendor.tradeCategories.includes(cat)).length;
                      const active = effectiveCat === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => selectCat(cat)}
                          className={cn(
                            "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                            active
                              ? "border-primary/30 bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground hover:bg-muted/40",
                          )}
                        >
                          <span className="truncate">{cat}</span>
                          <span className={cn(
                            "ml-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                            active ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Applicant list */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Applicants ({catEntries.length})
                </p>
                <div className="flex flex-col gap-2">
                  {catEntries.length === 0 ? (
                    <div className="space-y-3 rounded-xl border border-dashed border-border p-4 text-center">
                      <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">
                        No vendors linked to this package yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Vendors to Package
                      </button>
                    </div>
                  ) : (
                    catEntries.map(({link, vendor}) => (
                      <ApplicantCard
                        key={link.id}
                        link={link}
                        vendor={vendor}
                        active={link.id === selectedLinkId}
                        onClick={() => selectVendor(link.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </aside>

            {/* Right panel */}
            <div className="min-w-0 flex-1">
              {!selectedVendor || !selectedLink ? (
                <div className="flex min-h-[32rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 text-center">
                  <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Select an applicant</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Choose a vendor from the left panel to review their application.
                    </p>
                  </div>
                </div>
              ) : (
                <VendorDetailPanel
                  link={selectedLink}
                  vendor={selectedVendor}
                  docs={vendorDocs}
                  findings={vendorFindings}
                  activity={vendorActivity}
                  reviews={vendorReviews}
                  activeTab={activeVendorTab}
                  onTabChange={setVendorTab}
                  rationaleOpen={rationaleOpen}
                  rationaleText={rationaleText}
                  pendingQual={pendingQual}
                  onSetRationaleText={setRationaleText}
                  onQualAction={handleQualAction}
                  onConfirmQual={confirmQualAction}
                  onCancelQual={() => { setRationaleOpen(false); setRationaleText(""); setPendingQual(null); }}
                  onUndo={undoQualStatus}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Vendors modal */}
      {addOpen && (
        <AddVendorsModal
          projectId={project.id}
          projectName={project.name}
          existingVendorIds={new Set(pkgLinks.map(l => l.vendorId))}
          onAdd={(links) => { void addVendorsToPackage(links); }}
          onInvite={(inv, link) => {
            if (!primaryPackage) return;
            void Promise.all([
              createInvitation({
                id: inv.id,
                projectId: project.id,
                packageId: primaryPackage.id,
                companyName: inv.companyName,
                contactName: inv.contactPerson,
                contactEmail: inv.email,
                category: inv.tradeCategory,
                invitedAt: inv.invitedAt,
                expiresAt: inv.expiresAt,
                status: "Invited",
              }),
              createApplication({
                id: link.id,
                vendorId: link.vendorId,
                projectId: project.id,
                packageId: primaryPackage.id,
                applicationStatus: "Invited",
                qualificationStatus: "Not Started",
                source: link.source,
              }),
            ]).then(() => {
              toast.success(`Invitation sent to ${inv.companyName}`);
            });
          }}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Applicant Card ──────────────────────────────────────────────────────── */

function ApplicantCard({
  link, vendor, active, onClick,
}: {
  link: PackageVendorLink;
  vendor: VMVendor;
  active: boolean;
  onClick: () => void;
}) {
  const hasBlockers = (link.blockers?.length ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20"
          : "border-border bg-card hover:border-primary/20 hover:bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-foreground">{vendor.name}</p>
        {link.score !== undefined && (
          <span className={cn("shrink-0 text-base font-bold tabular-nums", scoreCls(link.score))}>
            {link.score}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <span className={`status-pill text-[10px] ${globalStatusCls[vendor.globalStatus]}`}>
          {vendor.globalStatus}
        </span>
        <span className={`status-pill text-[10px] ${pkgQualStatusCls[link.qualStatus]}`}>
          {link.qualStatus}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{vendor.city}</span>
        {hasBlockers && (
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-destructive">
            <AlertCircle className="h-3 w-3" />
            {link.blockers!.length} blocker{link.blockers!.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}

/* ── Vendor Detail Panel ─────────────────────────────────────────────────── */

function VendorDetailPanel({
  link, vendor, docs, findings, activity, reviews,
  activeTab, onTabChange,
  rationaleOpen, rationaleText, pendingQual,
  onSetRationaleText, onQualAction, onConfirmQual, onCancelQual, onUndo,
}: {
  link: PackageVendorLink;
  vendor: VMVendor;
  docs: ReturnType<typeof vmDocuments.filter>;
  findings: ReturnType<typeof vmFindings.filter>;
  activity: ReturnType<typeof vmActivity.filter>;
  reviews: ReturnType<typeof vmReviews.filter>;
  activeTab: VendorTab;
  onTabChange: (t: VendorTab) => void;
  rationaleOpen: boolean;
  rationaleText: string;
  pendingQual: PkgQualStatus | null;
  onSetRationaleText: (v: string) => void;
  onQualAction: (linkId: string, status: PkgQualStatus) => void;
  onConfirmQual: () => void;
  onCancelQual: () => void;
  onUndo: (linkId: string) => void;
}) {
  const openFindings = findings.filter(f => f.status !== "Resolved");

  return (
    <div className="space-y-4">
      {/* Vendor header */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">{vendor.name}</h2>
              <span className={`status-pill ${globalStatusCls[vendor.globalStatus]}`}>
                {vendor.globalStatus}
              </span>
              <span className={`status-pill ${pkgQualStatusCls[link.qualStatus]}`}>
                {link.qualStatus}
              </span>
              <span className={`status-pill ${pkgAppStatusCls[link.appStatus]}`}>
                {link.appStatus}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {vendor.arabicName}&ensp;·&ensp;{vendor.city}&ensp;·&ensp;Added {relativeDate(link.addedDate)}
            </p>
          </div>
          {link.score !== undefined && (
            <div className="flex items-center gap-3">
              <div className={cn("flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold", scoreCircleCls(link.score))}>
                {link.score}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Package Score</p>
                <p className="text-xs text-muted-foreground">{vendor.riskLevel} risk</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "evaluation" as VendorTab, label: "Evaluation Summary" },
          { id: "documents"  as VendorTab, label: `Submitted Documents (${docs.length})` },
          { id: "reviews"    as VendorTab, label: `Reviews (${reviews.length})` },
          { id: "findings"   as VendorTab, label: `Risks & Findings (${openFindings.length})` },
          { id: "history"    as VendorTab, label: "Application History" },
        ]).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Evaluation Summary ── */}
      {activeTab === "evaluation" && (
        <EvaluationTab
          link={link}
          vendor={vendor}
          reviews={reviews}
          openFindings={openFindings}
          rationaleOpen={rationaleOpen}
          rationaleText={rationaleText}
          pendingQual={pendingQual}
          onSetRationaleText={onSetRationaleText}
          onQualAction={onQualAction}
          onConfirmQual={onConfirmQual}
          onCancelQual={onCancelQual}
          onUndo={onUndo}
        />
      )}

      {/* ── Submitted Documents ── */}
      {activeTab === "documents" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {docs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No documents on record for this vendor.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5 text-start font-medium">Document</th>
                  <th className="px-3 py-2.5 text-start font-medium">Status</th>
                  <th className="px-3 py-2.5 text-start font-medium">Issue Date</th>
                  <th className="px-5 py-2.5 text-start font-medium">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{doc.docType}</p>
                      {doc.fileName && <p className="text-[11px] text-muted-foreground">{doc.fileName}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`status-pill text-[10px] ${docStatusCls[doc.status]}`}>{doc.status}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">
                      {doc.issueDate ? fmtDate(doc.issueDate) : "—"}
                    </td>
                    <td className={cn("px-5 py-3 text-sm", doc.status === "Expired" ? "text-destructive font-medium" : doc.status === "Expiring Soon" ? "text-warning-foreground font-medium" : "text-muted-foreground")}>
                      {doc.expiryDate ? fmtDate(doc.expiryDate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Reviews ── */}
      {activeTab === "reviews" && (
        <ReviewsTab reviews={reviews} />
      )}

      {/* ── Risks & Findings ── */}
      {activeTab === "findings" && (
        <div className="space-y-3">
          {findings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center rounded-xl border border-dashed border-border">
              <Shield className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No findings on record.</p>
            </div>
          ) : (
            findings.map(f => (
              <div key={f.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`status-pill text-[10px] ${findingSeverityCls[f.severity]}`}>{f.severity}</span>
                    <span className={`status-pill text-[10px] ${findingStatusCls[f.status]}`}>{f.status}</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Raised {fmtDate(f.raisedDate)} · {f.raisedBy}
                  {f.resolvedDate && ` · Resolved ${fmtDate(f.resolvedDate)}`}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Application History ── */}
      {activeTab === "history" && (
        <div className="space-y-1 rounded-xl border border-border bg-card p-5">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            </div>
          ) : (
            [...activity]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((item, i, arr) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                      <Activity className="h-3 w-3" />
                    </div>
                    {i < arr.length - 1 && <div className="mt-1 flex-1 border-l border-dashed border-border" />}
                  </div>
                  <div className={cn("pb-4 pt-1", i === arr.length - 1 && "pb-0")}>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{fmtDate(item.date)}</span>
                      {item.actor && <><span>·</span><span>{item.actor}</span></>}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Reviews Tab ─────────────────────────────────────────────────────────── */

const reviewStatusCls: Record<string, string> = {
  "Pass":        "bg-success/15 text-success border-success/40",
  "Fail":        "bg-destructive/10 text-destructive border-destructive/40",
  "Conditional": "bg-warning/15 text-warning-foreground border-warning/40",
  "Pending":     "bg-muted text-muted-foreground border-border",
};

const REVIEW_SECTIONS = [
  { key: "Regulatory Compliance", discipline: "Legal / Compliance" },
  { key: "Financial Standing",    discipline: "Finance / Commercial" },
  { key: "Technical Capability",  discipline: "Technical" },
  { key: "HSE Record",            discipline: "HSE / Quality" },
];

function ReviewsTab({ reviews }: { reviews: ReturnType<typeof vmReviews.filter> }) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-semibold text-foreground">No reviews recorded</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Reviews will appear here once sections are evaluated by the panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <p className="text-sm font-semibold text-foreground">Section Reviews</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Panel-level review outcomes per evaluation section</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-2.5 text-start font-medium">Section</th>
            <th className="px-3 py-2.5 text-start font-medium">Discipline</th>
            <th className="px-3 py-2.5 text-start font-medium">Status</th>
            <th className="px-3 py-2.5 text-start font-medium">Score</th>
            <th className="px-3 py-2.5 text-start font-medium">Reviewer</th>
            <th className="px-5 py-2.5 text-start font-medium">Comment</th>
          </tr>
        </thead>
        <tbody>
          {REVIEW_SECTIONS.map(({ key, discipline }) => {
            const rev = reviews.find(r => r.section === key);
            return (
              <tr key={key} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-foreground">{key}</p>
                </td>
                <td className="px-3 py-3.5 text-sm text-muted-foreground">{discipline}</td>
                <td className="px-3 py-3.5">
                  {rev ? (
                    <span className={`status-pill text-[10px] ${reviewStatusCls[rev.status]}`}>{rev.status}</span>
                  ) : (
                    <span className="status-pill text-[10px] bg-muted text-muted-foreground border-border">Pending</span>
                  )}
                </td>
                <td className="px-3 py-3.5">
                  {rev?.score !== undefined ? (
                    <span className={cn("font-semibold tabular-nums text-sm", scoreCls(rev.score))}>{rev.score}</span>
                  ) : "—"}
                </td>
                <td className="px-3 py-3.5 text-sm text-muted-foreground">
                  {rev ? (
                    <div>
                      <p className="text-foreground font-medium">{rev.reviewerName}</p>
                      <p className="text-[11px]">{fmtDate(rev.reviewDate)}</p>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-5 py-3.5 max-w-[200px]">
                  {rev?.comment ? (
                    <p className="text-xs text-muted-foreground line-clamp-2" title={rev.comment}>{rev.comment}</p>
                  ) : "—"}
                </td>
              </tr>
            );
          })}
          {/* Any extra review sections not in the predefined list */}
          {reviews
            .filter(r => !REVIEW_SECTIONS.some(s => s.key === r.section))
            .map(rev => (
              <tr key={rev.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-foreground">{rev.section}</p>
                </td>
                <td className="px-3 py-3.5 text-sm text-muted-foreground">—</td>
                <td className="px-3 py-3.5">
                  <span className={`status-pill text-[10px] ${reviewStatusCls[rev.status]}`}>{rev.status}</span>
                </td>
                <td className="px-3 py-3.5">
                  {rev.score !== undefined ? (
                    <span className={cn("font-semibold tabular-nums text-sm", scoreCls(rev.score))}>{rev.score}</span>
                  ) : "—"}
                </td>
                <td className="px-3 py-3.5 text-sm text-muted-foreground">
                  <div>
                    <p className="text-foreground font-medium">{rev.reviewerName}</p>
                    <p className="text-[11px]">{fmtDate(rev.reviewDate)}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5 max-w-[200px]">
                  {rev.comment ? (
                    <p className="text-xs text-muted-foreground line-clamp-2" title={rev.comment}>{rev.comment}</p>
                  ) : "—"}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Evaluation Tab ──────────────────────────────────────────────────────── */

function EvaluationTab({
  link, vendor, reviews, openFindings,
  rationaleOpen, rationaleText, pendingQual,
  onSetRationaleText, onQualAction, onConfirmQual, onCancelQual, onUndo,
}: {
  link: PackageVendorLink;
  vendor: VMVendor;
  reviews: ReturnType<typeof vmReviews.filter>;
  openFindings: ReturnType<typeof vmFindings.filter>;
  rationaleOpen: boolean;
  rationaleText: string;
  pendingQual: PkgQualStatus | null;
  onSetRationaleText: (v: string) => void;
  onQualAction: (linkId: string, status: PkgQualStatus) => void;
  onConfirmQual: () => void;
  onCancelQual: () => void;
  onUndo: (linkId: string) => void;
}) {
  const hasBlockers = (link.blockers?.length ?? 0) > 0;
  const isDecided = link.qualStatus === "Shortlisted" || link.qualStatus === "Rejected" || link.qualStatus === "Awarded";

  const dimScores = ["Compliance", "Financial", "Technical", "HSE", "Localization"].map(dim => {
    const section = Object.entries(SECTION_TO_DIM).find(([, d]) => d === dim)?.[0];
    const review = section ? reviews.find(r => r.section === section) : undefined;
    return { dim, score: review?.score, status: review?.status };
  });

  const inputCls = "w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Dimension scores */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">Dimension Scores</p>
          <div className="space-y-4">
            {dimScores.map(({ dim, score, status }) => (
              <div key={dim}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{dim}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {score !== undefined ? `${score} / 100` : "—"}
                    {status && <span className={cn("ml-1.5", status === "Pass" ? "text-success" : status === "Fail" ? "text-destructive" : "text-warning-foreground")}>· {status}</span>}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={cn("h-full rounded-full", dimensionBarCls[dim] ?? "bg-primary")}
                    style={{ width: score !== undefined ? `${score}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + blockers */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">Package Summary</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Global status</span>
              <span className={`status-pill text-[10px] ${globalStatusCls[vendor.globalStatus]}`}>{vendor.globalStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Document health</span>
              <span className={`status-pill text-[10px] ${docStatusCls[vendor.docHealth] ?? "bg-muted text-muted-foreground"}`}>{vendor.docHealth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Risk level</span>
              <span className="font-medium text-foreground">{vendor.riskLevel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Overall AI score</span>
              <span className={cn("font-semibold tabular-nums", scoreCls(vendor.aiScore))}>{vendor.aiScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Open findings</span>
              <span className={cn("font-semibold", openFindings.length > 0 ? "text-destructive" : "text-foreground")}>
                {openFindings.length}
              </span>
            </div>
          </div>

          {/* Blockers */}
          {hasBlockers && (
            <div className="space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">Blockers</p>
              {link.blockers!.map((b, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Package qualification actions */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">Package Qualification</p>

        {link.qualStatus === "Shortlisted" ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-sm font-semibold text-success">
              <Check className="h-4 w-4" /> Shortlisted for this package
            </span>
            <button type="button" onClick={() => onUndo(link.id)} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              Remove from shortlist
            </button>
          </div>
        ) : link.qualStatus === "Rejected" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-semibold text-destructive">
                Application rejected
              </span>
              <button type="button" onClick={() => onUndo(link.id)} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                Undo rejection
              </button>
            </div>
            {link.rationale && (
              <p className="text-xs italic text-muted-foreground">Rationale: {link.rationale}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => onQualAction(link.id, "Shortlisted")}
              className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:bg-success/90 transition-colors">
              <Star className="h-4 w-4" /> Move to Shortlist
            </button>
            <button type="button" onClick={() => onQualAction(link.id, "Qualified")}
              className="inline-flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm font-semibold text-success hover:bg-success/15 transition-colors">
              <CheckCircle2 className="h-4 w-4" /> Mark Qualified
            </button>
            <button type="button" onClick={() => onQualAction(link.id, "Conditionally Qualified")}
              className="inline-flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2 text-sm font-semibold text-warning-foreground hover:bg-warning/15 transition-colors">
              Mark Conditional
            </button>
            <button type="button" onClick={() => onQualAction(link.id, "Rejected")}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors">
              Reject Application
            </button>
          </div>
        )}

        {/* Inline rationale */}
        {rationaleOpen && !isDecided && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground">
              {pendingQual === "Shortlisted" && hasBlockers
                ? "This vendor has open blockers. Provide a rationale for this shortlist decision."
                : pendingQual === "Rejected"
                ? "Please provide a rationale for rejecting this application."
                : "Please provide a rationale for this conditional decision."}
            </p>
            <textarea
              value={rationaleText}
              onChange={e => onSetRationaleText(e.target.value)}
              rows={2}
              placeholder="Enter decision rationale…"
              className={inputCls}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onConfirmQual} disabled={!rationaleText.trim()}>Confirm</Button>
              <Button size="sm" variant="ghost" onClick={onCancelQual}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shortlist Panel ─────────────────────────────────────────────────────── */

function ShortlistPanel({
  entries, onUndoShortlist,
}: {
  entries: { link: PackageVendorLink; vendor: VMVendor }[];
  onUndoShortlist: (linkId: string) => void;
}) {
  const shortlisted = entries.filter(({link}) =>
    link.qualStatus === "Shortlisted" || link.qualStatus === "Conditionally Qualified"
  );

  if (shortlisted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <Star className="h-10 w-10 text-muted-foreground/25" />
        <div>
          <p className="text-sm font-semibold text-foreground">No vendors shortlisted yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Review applicants and use "Move to Shortlist" in the Evaluation Summary to build your shortlist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <p className="text-sm font-semibold text-foreground">
          Shortlisted Vendors
          <span className="ml-2 rounded bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
            {shortlisted.length}
          </span>
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-2.5 text-start font-medium">Company</th>
            <th className="px-3 py-2.5 text-start font-medium">Trade Categories</th>
            <th className="px-3 py-2.5 text-start font-medium">Package Score</th>
            <th className="px-3 py-2.5 text-start font-medium">Qualification</th>
            <th className="px-3 py-2.5 text-start font-medium">City</th>
            <th className="px-5 py-2.5 text-end font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {shortlisted.map(({link, vendor}) => (
            <tr key={link.id} className="border-t border-border hover:bg-muted/20 transition-colors">
              <td className="px-5 py-3.5">
                <p className="font-semibold text-foreground">{vendor.name}</p>
                <p className="text-[11px] text-muted-foreground">{vendor.arabicName}</p>
              </td>
              <td className="px-3 py-3.5">
                <div className="flex flex-wrap gap-1">
                  {vendor.tradeCategories.slice(0, 2).map(c => (
                    <span key={c} className="chip text-[10px]">{c}</span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-3.5">
                {link.score !== undefined ? (
                  <span className={cn("text-lg font-bold tabular-nums", scoreCls(link.score))}>
                    {link.score}
                  </span>
                ) : "—"}
              </td>
              <td className="px-3 py-3.5">
                <span className={`status-pill text-[10px] ${pkgQualStatusCls[link.qualStatus]}`}>
                  {link.qualStatus}
                </span>
              </td>
              <td className="px-3 py-3.5 text-sm text-muted-foreground">{vendor.city}</td>
              <td className="px-5 py-3.5 text-end">
                <button
                  type="button"
                  onClick={() => onUndoShortlist(link.id)}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Add Vendors Modal ───────────────────────────────────────────────────── */

function AddVendorsModal({
  projectId, projectName, existingVendorIds, onAdd, onInvite, onClose,
}: {
  projectId: string;
  projectName: string;
  existingVendorIds: Set<string>;
  onAdd: (links: PackageVendorLink[]) => void;
  onInvite: (inv: VendorInvitation, link: PackageVendorLink) => void;
  onClose: () => void;
}) {
  const [modalTab, setModalTab] = useState<"vm" | "invite">("vm");
  const [search, setSearch]     = useState("");
  const [catFilter, setCat]     = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({ companyName: "", contactPerson: "", email: "", tradeCategory: "", message: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const allCategories = [...new Set(vmVendors.flatMap(v => v.tradeCategories))].sort();

  const available = vmVendors.filter(v => {
    if (existingVendorIds.has(v.id)) return false;
    const q = search.toLowerCase();
    if (q && !v.name.toLowerCase().includes(q) && !v.city.toLowerCase().includes(q)) return false;
    if (catFilter !== "All" && !v.tradeCategories.includes(catFilter)) return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleAddSelected() {
    const now = today();
    const newLinks: PackageVendorLink[] = [...selectedIds].map(vendorId => ({
      id: `pvl-${Date.now()}-${vendorId}`,
      vendorId,
      projectId,
      appStatus: "Invited" as PkgAppStatus,
      qualStatus: "Not Started" as PkgQualStatus,
      addedDate: now,
      lastUpdated: now,
      source: "added_from_vm" as const,
    }));
    onAdd(newLinks);
    onClose();
  }

  const possibleDuplicate = form.email.includes("@")
    ? vmVendors.find(v => v.contactEmail.toLowerCase() === form.email.toLowerCase())
    : null;

  function handleInviteSend() {
    if (!form.companyName.trim() || !form.contactPerson.trim() || !form.email.trim() || !form.tradeCategory) {
      setFormError("Company name, contact person, email, and trade category are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    const token = generateToken();
    const now = new Date();
    const inv: VendorInvitation = {
      id: `inv-${Date.now()}`,
      token,
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim(),
      email: form.email.trim(),
      tradeCategory: form.tradeCategory,
      projectContext: projectName,
      status: "invited",
      invitedAt: today(),
      expiresAt: addDays(now, 30),
      invitedBy: "FA",
      registrationLink: `https://portal.mawthuq.app/register/${token}`,
    };
    const link: PackageVendorLink = {
      id: `pvl-${Date.now()}`,
      vendorId: `vmv-new-${Date.now()}`,
      projectId,
      appStatus: "Invited",
      qualStatus: "Not Started",
      addedDate: today(),
      lastUpdated: today(),
      source: "invited",
    };
    onInvite(inv, link);
    onClose();
  }

  const selectCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl" style={{ maxHeight: "90vh" }}>
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Add Vendors to Package</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{projectName}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal tab bar */}
        <div className="flex border-b border-border px-6 shrink-0">
          {([
            { id: "vm" as const, label: "Select from Vendor Master", icon: Building2 },
            { id: "invite" as const, label: "Invite New Vendor", icon: Mail },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setModalTab(id)}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                modalTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {modalTab === "vm" ? (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor…" className={cn(inputCls, "pl-9")} />
                </div>
                <select value={catFilter} onChange={e => setCat(e.target.value)} className={selectCls}>
                  <option value="All">All Categories</option>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Vendor list */}
              <div className="space-y-1.5">
                {available.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No vendors available to add.</p>
                ) : available.map(vendor => {
                  const isSelected = selectedIds.has(vendor.id);
                  const isSuspended = vendor.globalStatus === "Suspended" || vendor.globalStatus === "Blacklisted";
                  const hasDocIssue = vendor.docHealth === "Expired" || vendor.docHealth === "Missing";
                  return (
                    <div
                      key={vendor.id}
                      onClick={() => !isSuspended && toggleSelect(vendor.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                        isSuspended
                          ? "border-border opacity-50 cursor-not-allowed bg-muted/10"
                          : isSelected
                          ? "border-primary/40 bg-primary/[0.03] cursor-pointer"
                          : "border-border bg-card hover:border-primary/20 cursor-pointer",
                      )}
                    >
                      <div className="mt-0.5">
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                          isSuspended && "opacity-40",
                        )}>
                          {isSelected && <Check className="h-2.5 w-2.5" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                          <span className={`status-pill text-[10px] ${globalStatusCls[vendor.globalStatus]}`}>
                            {vendor.globalStatus}
                          </span>
                          {hasDocIssue && !isSuspended && (
                            <span className="flex items-center gap-0.5 text-[10px] font-medium text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              {vendor.docHealth} docs
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{vendor.city} · {vendor.tradeCategories.slice(0, 2).join(", ")}</p>
                        {isSuspended && (
                          <p className="mt-0.5 text-[10px] text-destructive">Cannot add — vendor is {vendor.globalStatus.toLowerCase()}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Invite new vendor form */
            <div className="space-y-4">
              {possibleDuplicate && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-warning-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>A vendor with this email may already exist in Vendor Master: <strong>{possibleDuplicate.name}</strong>. Consider adding them from the Vendor Master tab instead.</span>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <InviteField label="Company Name" required>
                  <input type="text" placeholder="e.g. Al-Rajhi Contracting Co." value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className={inputCls} />
                </InviteField>
                <InviteField label="Contact Person" required>
                  <input type="text" placeholder="e.g. Khalid Al-Otaibi" value={form.contactPerson}
                    onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} className={inputCls} />
                </InviteField>
                <InviteField label="Email Address" required>
                  <input type="email" placeholder="e.g. contact@company.sa" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                </InviteField>
                <InviteField label="Trade Category" required>
                  <select value={form.tradeCategory} onChange={e => setForm(f => ({ ...f, tradeCategory: e.target.value }))} className={inputCls}>
                    <option value="">Select a category…</option>
                    {tradeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </InviteField>
                <InviteField label="Message to Vendor" className="sm:col-span-2">
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={2} placeholder="Optional message for the invitation email…" className={cn(inputCls, "resize-none")} />
                </InviteField>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          {modalTab === "vm" ? (
            <Button size="sm" disabled={selectedIds.size === 0} onClick={handleAddSelected} className="gap-2">
              <Plus className="h-4 w-4" />
              Add {selectedIds.size > 0 ? `${selectedIds.size} Vendor${selectedIds.size !== 1 ? "s" : ""}` : "Selected"}
            </Button>
          ) : (
            <Button size="sm" onClick={handleInviteSend} className="gap-2">
              <Send className="h-4 w-4" />
              Send Package Invitation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Invitations Panel ───────────────────────────────────────────────────── */

function InvitationsPanel({
  invitations,
  projectName,
  packageName,
  onCreateInvitation,
  onResendInvitation,
}: {
  invitations: VendorInvitation[];
  projectName: string;
  packageName: string;
  onCreateInvitation: (invitation: VendorInvitation) => Promise<void>;
  onResendInvitation: (invitationId: string) => Promise<void>;
}) {
  const [showForm, setShowForm]     = useState(false);
  const [copiedId, setCopiedId]     = useState<string | null>(null);
  const [statusFilter, setFilter]   = useState<InvitationStatus | "all">("all");
  const [searchQuery, setSearch]    = useState("");
  const [form, setForm] = useState({ companyName: "", contactPerson: "", email: "", tradeCategory: "", projectContext: "" });
  const [formError, setFormError]   = useState<string | null>(null);

  const q = searchQuery.toLowerCase().trim();
  const visible = invitations
    .filter(i => statusFilter === "all" || i.status === statusFilter)
    .filter(i => !q || i.companyName.toLowerCase().includes(q) || i.contactPerson.toLowerCase().includes(q) || i.email.toLowerCase().includes(q));

  async function handleSend() {
    if (!form.companyName.trim() || !form.contactPerson.trim() || !form.email.trim() || !form.tradeCategory) {
      setFormError("Company name, contact person, email, and trade category are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    const token = generateToken();
    const inv: VendorInvitation = {
      id: `inv-${Date.now()}`,
      token,
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim(),
      email: form.email.trim(),
      tradeCategory: form.tradeCategory,
      projectContext: form.projectContext.trim() || `${projectName} — ${packageName}`,
      status: "invited",
      invitedAt: today(),
      expiresAt: addDays(new Date(), 30),
      invitedBy: "FA",
      registrationLink: `https://portal.mawthuq.app/register/${token}`,
    };
    try {
      await onCreateInvitation(inv);
      setForm({ companyName: "", contactPerson: "", email: "", tradeCategory: "", projectContext: "" });
      setFormError(null);
      toast.success(`Invitation sent to ${inv.email}`, { description: `${inv.companyName} · expires in 30 days` });
      setShowForm(false);
    } catch {
      setFormError("Could not send invitation right now.");
    }
  }

  function copyLink(inv: VendorInvitation) {
    void navigator.clipboard.writeText(inv.registrationLink);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function resend(id: string) {
    const inv = invitations.find(i => i.id === id);
    try {
      await onResendInvitation(id);
      if (inv) toast.success(`Invitation resent to ${inv.email}`);
    } catch {
      toast.error("Could not resend invitation.");
    }
  }

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Vendor Invitations</p>
        <button type="button" onClick={() => { setShowForm(v => !v); setFormError(null); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Invite Vendor"}
        </button>
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-4 w-4 text-accent" />New vendor invitation</CardTitle>
            <CardDescription>A unique registration link will be generated and sent to the vendor's contact.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-2">
              <InviteField label="Company Name" required>
                <input type="text" placeholder="e.g. Al-Rajhi Contracting Co." value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className={inputCls} />
              </InviteField>
              <InviteField label="Contact Person" required>
                <input type="text" placeholder="e.g. Khalid Al-Otaibi" value={form.contactPerson}
                  onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} className={inputCls} />
              </InviteField>
              <InviteField label="Email Address" required>
                <input type="email" placeholder="e.g. contact@company.sa" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
              </InviteField>
              <InviteField label="Trade Category" required>
                <select value={form.tradeCategory} onChange={e => setForm(f => ({ ...f, tradeCategory: e.target.value }))} className={inputCls}>
                  <option value="">Select a category…</option>
                  {tradeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </InviteField>
              <InviteField label="Package Context" className="sm:col-span-2">
                <input type="text" value={form.projectContext}
                  onChange={e => setForm(f => ({ ...f, projectContext: e.target.value }))}
                  placeholder={`${projectName} — ${packageName}`}
                  className={inputCls} />
              </InviteField>
            </div>
            {formError && <p className="mt-4 text-sm text-destructive">{formError}</p>}
            <div className="mt-6 flex items-center gap-3">
              <Button onClick={handleSend} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Send className="h-4 w-4" /> Send Invitation
              </Button>
              <p className="text-xs text-muted-foreground">Link expires in <span className="font-semibold">30 days</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "invited", "opened", "started", "submitted", "expired", "bounced", "declined"] as const).map(s => {
          const count = s === "all" ? invitations.length : invitations.filter(i => i.status === s).length;
          const cfg = s === "all" ? null : invitationStatusConfig[s];
          return (
            <button key={s} type="button" onClick={() => setFilter(s)}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                statusFilter === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
              {cfg?.dot && <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />}
              {s === "all" ? "All" : invitationStatusConfig[s].label}
              <span className={cn("ml-0.5 rounded px-1 py-0.5 text-[10px] font-semibold", statusFilter === s ? "bg-white/20" : "bg-muted")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <div className="border-b border-border px-4 py-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search by company, contact or email…" value={searchQuery}
              onChange={e => setSearch(e.target.value)} className={cn(inputCls, "pl-9")} />
          </div>
        </div>
        <CardContent className="overflow-x-auto px-0 pb-0">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{q ? `No invitations match "${searchQuery}".` : "No invitations match this filter."}</p>
            </div>
          ) : (
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5 text-start font-medium">Company</th>
                  <th className="px-3 py-2.5 text-start font-medium">Contact</th>
                  <th className="px-3 py-2.5 text-start font-medium">Category</th>
                  <th className="px-3 py-2.5 text-start font-medium">Status</th>
                  <th className="px-3 py-2.5 text-start font-medium">Invited</th>
                  <th className="px-3 py-2.5 text-start font-medium">Expires</th>
                  <th className="px-5 py-2.5 text-end font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(inv => (
                  <InvitationRow key={inv.id} inv={inv} copied={copiedId === inv.id}
                    onCopy={() => copyLink(inv)} onResend={() => resend(inv.id)} />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Invitation Row ──────────────────────────────────────────────────────── */

function InvitationRow({ inv, copied, onCopy, onResend }: { inv: VendorInvitation; copied: boolean; onCopy: () => void; onResend: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = invitationStatusConfig[inv.status];
  const isExpired = inv.status === "expired";

  return (
    <>
      <tr className="cursor-pointer border-t border-border transition-colors hover:bg-muted/20" onClick={() => setExpanded(v => !v)}>
        <td className="px-5 py-3.5">
          <div className="font-semibold leading-snug text-foreground">{inv.companyName}</div>
          {inv.projectContext && <div className="mt-0.5 text-[11px] text-muted-foreground">{inv.projectContext}</div>}
        </td>
        <td className="px-3 py-3.5">
          <div className="text-sm text-foreground">{inv.contactPerson}</div>
          <div className="text-[11px] text-muted-foreground">{inv.email}</div>
        </td>
        <td className="px-3 py-3.5"><span className="chip">{inv.tradeCategory}</span></td>
        <td className="px-3 py-3.5">
          <span className={`status-pill ${cfg.cls}`}>
            {cfg.dot && <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />}
            {cfg.label}
          </span>
        </td>
        <td className="px-3 py-3.5 tabular-nums text-sm text-muted-foreground">{inv.invitedAt}</td>
        <td className="px-3 py-3.5">
          <span className={cn("tabular-nums text-sm", isExpired ? "text-destructive line-through" : "text-muted-foreground")}>
            {inv.expiresAt}
          </span>
        </td>
        <td className="px-5 py-3.5 text-end" onClick={e => e.stopPropagation()}>
          <div className="inline-flex items-center gap-1">
            <button type="button" onClick={onCopy} title="Copy registration link"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {isExpired && (
              <button type="button" onClick={onResend}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10">
                <RefreshCw className="h-3 w-3" /> Resend
              </button>
            )}
            <button type="button" onClick={() => setExpanded(v => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-border bg-muted/20">
          <td colSpan={7} className="px-5 py-4">
            <div className="flex flex-wrap items-start gap-6">
              <TimelinePoint label="Invited"   value={inv.invitedAt}   done />
              <TimelinePoint label="Opened"    value={inv.openedAt}    done={!!inv.openedAt} />
              <TimelinePoint label="Started"   value={inv.startedAt}   done={!!inv.startedAt} />
              <TimelinePoint label="Submitted" value={inv.submittedAt} done={!!inv.submittedAt} />
              <div className="ml-auto text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Registration link</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <code className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">{inv.registrationLink}</code>
                  <button type="button" onClick={onCopy} className="text-muted-foreground transition-colors hover:text-accent">
                    {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Project Settings Panel ──────────────────────────────────────────────── */

const dimensionBarCls2: Record<string, string> = {
  Compliance: "bg-info", Financial: "bg-success", Technical: "bg-accent", HSE: "bg-warning", Localization: "bg-primary",
};

function ProjectSettingsPanel({ project }: { project: Project }) {
  const config = project.config;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Project Configuration</p>
        <Link to={`/project-setup?id=${project.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
          <Settings className="h-3.5 w-3.5" /> Edit Settings
        </Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">Project Details</p>
          <dl className="space-y-3">
            <SettingsRow label="Package"        value={project.packageName} />
            <SettingsRow label="Trade Category" value={project.workCategory} />
            <SettingsRow label="Estimated Value" value={project.packageValueBand} />
            <SettingsRow label="Location"><span className="flex items-center gap-1 text-sm text-foreground"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{project.location}</span></SettingsRow>
            {project.timeline && <SettingsRow label="Timeline"><span className="flex items-center gap-1 text-sm text-foreground"><Clock className="h-3.5 w-3.5 text-muted-foreground" />{project.timeline}</span></SettingsRow>}
            {project.registrationDeadline && (
              <SettingsRow label="Reg. Deadline">
                <span className="flex items-center gap-1 text-sm text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {new Date(project.registrationDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </SettingsRow>
            )}
          </dl>
          {project.scope && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Scope</p>
              <p className="text-xs leading-5 text-muted-foreground">{project.scope}</p>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />Reviewers</p>
          {project.reviewers && project.reviewers.length > 0 ? (
            <div className="flex flex-wrap gap-2">{project.reviewers.map(r => <span key={r} className="chip">{r}</span>)}</div>
          ) : <p className="text-xs text-muted-foreground">No reviewers assigned.</p>}
          {project.requiredExperience && project.requiredExperience.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Briefcase className="h-4 w-4 text-muted-foreground" />Required Experience</p>
              <ul className="space-y-1.5">
                {project.requiredExperience.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />{item}</li>
                ))}
              </ul>
            </div>
          )}
          {project.requiredCertifications && project.requiredCertifications.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Award className="h-4 w-4 text-muted-foreground" />Required Certifications</p>
              <ul className="space-y-1.5">
                {project.requiredCertifications.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {!config ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
          <Settings className="h-8 w-8 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-semibold text-foreground">No scoring config yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Set up categories, scoring weights, and hard gate rules for this project.</p>
          </div>
          <Link to={`/project-setup?id=${project.id}`}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Configure now →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-4 text-sm font-semibold text-foreground">Categories & Documents</p>
            {config.categories.length === 0 ? <p className="text-xs text-muted-foreground">No categories configured.</p> : (
              <div className="space-y-4">
                {config.categories.map(cat => (
                  <div key={cat.name}>
                    <p className="text-xs font-semibold text-foreground">{cat.name}</p>
                    {cat.subCategories.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{cat.subCategories.map(s => <span key={s} className="chip text-[10px]">{s}</span>)}</div>}
                    {cat.requiredDocuments.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{cat.requiredDocuments.map(d => <span key={d} className="rounded border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{d}</span>)}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-semibold text-foreground">AI Scoring Weights</p>
              <div className="space-y-3">
                {(["Compliance", "Financial", "Technical", "HSE", "Localization"] as const).map(dim => {
                  const key = dim.toLowerCase() as keyof typeof config.scoringWeights;
                  const weight = config.scoringWeights[key];
                  return (
                    <div key={dim}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{dim}</span>
                        <span className="tabular-nums text-muted-foreground">{weight}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                        <div className={cn("h-full rounded-full", dimensionBarCls2[dim] ?? "bg-primary")} style={{ width: `${weight}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {config.hardGateRules.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold text-foreground">Hard Gate Rules</p>
                <ul className="space-y-2">
                  {config.hardGateRules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-destructive" />{rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Utility components ──────────────────────────────────────────────────── */

function TimelinePoint({ label, value, done }: { label: string; value?: string; done: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]", done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground ring-1 ring-border")}>
        {done && <Check className="h-2.5 w-2.5" />}
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function SettingsRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm text-foreground">{children ?? value ?? "—"}</dd>
    </div>
  );
}

function InviteField({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function BannerField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function BannerDivider() {
  return <div className="hidden h-8 w-px bg-border sm:block" />;
}
