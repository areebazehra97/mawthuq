import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Activity, AlertCircle, AlertTriangle, Building2, ChevronDown, ChevronUp,
  Eye, Mail, Package, Plus, Search, Shield, Users, X, XCircle,
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { useApplications } from "@/hooks/use-applications";
import { useInvitations } from "@/hooks/use-invitations";
import { useProjectPackages } from "@/hooks/use-project-packages";
import { useProjects } from "@/hooks/use-projects";
import { cn } from "@/lib/utils";
import {
  vmVendors,
  type VMVendor,
  type VendorGlobalStatus,
  type DocHealth,
  type ApplicationStatus,
  type PackageQualStatus,
} from "@/data/vendor-master-seed";
import type { BackendPackage, BackendProject, VendorPackageApplication } from "@/types";

// ── Status style maps ─────────────────────────────────────────────────────────

const globalStatusCls: Record<VendorGlobalStatus, string> = {
  "Active":       "bg-success/15 text-success border-success/40",
  "Under Review": "bg-warning/15 text-warning-foreground border-warning/40",
  "Suspended":    "bg-orange-500/10 text-orange-700 border-orange-400/40",
  "Blacklisted":  "bg-destructive/10 text-destructive border-destructive/40",
  "Inactive":     "bg-muted text-muted-foreground border-border",
};

const docHealthCls: Record<DocHealth, string> = {
  "Healthy":       "bg-success/15 text-success border-success/40",
  "Expiring Soon": "bg-warning/15 text-warning-foreground border-warning/40",
  "Expired":       "bg-destructive/10 text-destructive border-destructive/40",
  "Missing":       "bg-muted text-muted-foreground border-border",
};

const riskCls: Record<string, string> = {
  "Low":      "bg-success/15 text-success border-success/40",
  "Medium":   "bg-warning/15 text-warning-foreground border-warning/40",
  "High":     "bg-orange-500/10 text-orange-700 border-orange-400/40",
  "Critical": "bg-destructive/10 text-destructive border-destructive/40",
};

const qualCls: Record<string, string> = {
  "Qualified":     "bg-success/15 text-success border-success/40",
  "Pending":       "bg-info/10 text-info border-info/30",
  "Not Qualified": "bg-destructive/10 text-destructive border-destructive/40",
  "Expired":       "bg-muted text-muted-foreground border-border",
};

const appStatusCls: Record<ApplicationStatus, string> = {
  "Invited":      "bg-info/10 text-info border-info/30",
  "Registered":   "bg-purple-500/10 text-purple-700 border-purple-400/40",
  "Under Review": "bg-warning/15 text-warning-foreground border-warning/40",
  "Qualified":    "bg-success/15 text-success border-success/40",
  "Rejected":     "bg-destructive/10 text-destructive border-destructive/40",
  "Shortlisted":  "bg-accent/20 text-accent-foreground border-accent/40",
};

// ── Helper ────────────────────────────────────────────────────────────────────

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

type InviteForm = { projectId: string; packageId: string; note: string };

function InviteModal({
  vendor,
  projects,
  packages,
  applications,
  onClose,
  onSend,
}: {
  vendor: VMVendor;
  projects: BackendProject[];
  packages: BackendPackage[];
  applications: VendorPackageApplication[];
  onClose: () => void;
  onSend: (vendor: VMVendor, projectId: string, packageId: string, note: string) => void;
}) {
  const [form, setForm] = useState<InviteForm>({ projectId: "", packageId: "", note: "" });

  const openProjects = projects.filter(p => p.status === "Active" || p.status === "Tendering");
  const pkgsForProject = packages.filter(
    pkg => pkg.projectId === form.projectId && pkg.status !== "Awarded" && pkg.status !== "Closed",
  );
  const selectedPkg = packages.find(p => p.id === form.packageId);

  const alreadyApplied = form.packageId !== "" && applications.some(
    a => a.vendorId === vendor.id && a.packageId === form.packageId,
  );
  const categoryMismatch =
    selectedPkg !== undefined &&
    !vendor.tradeCategories.includes(selectedPkg.category);
  const isBlocked  = vendor.globalStatus === "Suspended" || vendor.globalStatus === "Blacklisted";
  const hasDocIssue = vendor.docHealth === "Expired" || vendor.docHealth === "Missing";
  const canSend = form.projectId !== "" && form.packageId !== "" && !isBlocked && !alreadyApplied;

  const selectCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Invite Vendor to Package</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{vendor.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Vendor chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`status-pill ${globalStatusCls[vendor.globalStatus]}`}>
              {vendor.globalStatus}
            </span>
            {vendor.tradeCategories.slice(0, 3).map(c => (
              <span key={c} className="chip text-[10px]">{c}</span>
            ))}
          </div>

          {/* Blocked banner */}
          {isBlocked && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This vendor is <strong>{vendor.globalStatus.toLowerCase()}</strong> and cannot be invited.
              </span>
            </div>
          )}

          {/* Project */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Project</label>
            <select
              value={form.projectId}
              onChange={e => setForm(f => ({ ...f, projectId: e.target.value, packageId: "" }))}
              className={selectCls}
            >
              <option value="">Select a project…</option>
              {openProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Package */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Package</label>
            <select
              value={form.packageId}
              onChange={e => setForm(f => ({ ...f, packageId: e.target.value }))}
              disabled={form.projectId === "" || pkgsForProject.length === 0}
              className={selectCls}
            >
              <option value="">
                {form.projectId === ""
                  ? "Select a project first…"
                  : pkgsForProject.length === 0
                  ? "No open packages for this project"
                  : "Select a package…"}
              </option>
              {pkgsForProject.map(p => (
                <option key={p.id} value={p.id}>{p.name} · {p.valueBand}</option>
              ))}
            </select>
          </div>

          {/* Eligibility warnings */}
          {alreadyApplied && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-warning-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>This vendor already has an application for the selected package.</span>
            </div>
          )}
          {!alreadyApplied && categoryMismatch && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-warning-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Vendor trade categories don't match this package's scope. Proceed with caution.</span>
            </div>
          )}
          {!isBlocked && hasDocIssue && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-warning-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Vendor has <strong>{vendor.docHealth.toLowerCase()}</strong> documents — they must resolve this before qualifying.
              </span>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Message <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              rows={3}
              placeholder="Add a note for the vendor invitation email…"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!canSend} onClick={() => onSend(vendor, form.projectId, form.packageId, form.note)} className="gap-2">
            <Mail className="h-4 w-4" />
            Send Invitation
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Row ────────────────────────────────────────────────────────────────

const COL = "grid items-center gap-2 px-4" as const;
const COL_TEMPLATE = "grid-cols-[220px_110px_160px_72px_72px_120px_110px_80px_110px_150px]" as const;

function VendorRow({
  vendor,
  applications,
  projects,
  packages,
  isExpanded,
  onToggle,
  onInvite,
}: {
  vendor: VMVendor;
  applications: VendorPackageApplication[];
  projects: BackendProject[];
  packages: BackendPackage[];
  isExpanded: boolean;
  onToggle: () => void;
  onInvite: () => void;
}) {
  const apps = applications.filter(a => a.vendorId === vendor.id);
  const initials = vendor.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="border-b border-border last:border-0">
      <div
        className={cn(COL, COL_TEMPLATE, "min-w-max py-3 cursor-pointer hover:bg-muted/30 transition-colors", isExpanded && "bg-muted/20")}
        onClick={onToggle}
      >
        {/* Vendor name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-xs font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{vendor.name}</p>
            <p className="text-[11px] text-muted-foreground">{vendor.city}</p>
          </div>
        </div>

        {/* Global status */}
        <div>
          <span className={`status-pill text-[10px] ${globalStatusCls[vendor.globalStatus]}`}>
            {vendor.globalStatus}
          </span>
        </div>

        {/* Trade categories */}
        <div className="flex flex-wrap gap-1">
          {vendor.tradeCategories.slice(0, 2).map(c => (
            <span key={c} className="chip text-[10px]">{c}</span>
          ))}
          {vendor.tradeCategories.length > 2 && (
            <span className="chip text-[10px] bg-muted/60 text-muted-foreground">+{vendor.tradeCategories.length - 2}</span>
          )}
        </div>

        {/* Projects count */}
        <div className="text-center text-sm font-semibold text-foreground">
          {vendor.linkedProjectCount}
        </div>

        {/* Packages count */}
        <div className="text-center text-sm font-semibold text-foreground">
          {vendor.linkedPackageCount}
        </div>

        {/* Qualification */}
        <div>
          <span className={`status-pill text-[10px] ${qualCls[vendor.packageQualStatus]}`}>
            {vendor.packageQualStatus}
          </span>
        </div>

        {/* Doc health */}
        <div>
          <span className={`status-pill text-[10px] ${docHealthCls[vendor.docHealth]}`}>
            {vendor.docHealth}
          </span>
        </div>

        {/* Risk */}
        <div>
          <span className={`status-pill text-[10px] ${riskCls[vendor.riskLevel]}`}>
            {vendor.riskLevel}
          </span>
        </div>

        {/* Last activity */}
        <div className="text-xs text-muted-foreground">{relativeDate(vendor.lastActivity)}</div>

        {/* Actions */}
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <Link
            to={`/vendors/${vendor.id}`}
            className="flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Profile
          </Link>
          <button
            onClick={onInvite}
            className="flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Invite
          </button>
          <button
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded: applications sub-table */}
      {isExpanded && (
        <div className="border-t border-dashed border-border bg-muted/15 px-6 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Applications · {apps.length}
          </p>
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications on record.</p>
          ) : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[1fr_1fr_120px_60px_100px] items-center gap-2 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Package</span>
                <span>Project</span>
                <span>Status</span>
                <span className="text-center">Score</span>
                <span>Applied</span>
              </div>
              {apps.map(app => {
                const pkg  = packages.find(p => p.id === app.packageId);
                const proj = projects.find(p => p.id === app.projectId);
                const appStatus = app.qualificationStatus === "Shortlisted"
                  ? "Shortlisted"
                  : app.qualificationStatus === "Qualified" ||
                      app.qualificationStatus === "Conditionally Qualified"
                    ? "Qualified"
                    : app.qualificationStatus === "Rejected"
                      ? "Rejected"
                      : app.applicationStatus === "Opened" || app.applicationStatus === "In Progress"
                        ? "Registered"
                        : app.applicationStatus === "In Review" ||
                            app.applicationStatus === "Clarification Requested" ||
                            app.applicationStatus === "Review Complete"
                          ? "Under Review"
                          : "Invited";
                return (
                  <div key={app.id} className="grid grid-cols-[1fr_1fr_120px_60px_100px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                    <span className="truncate text-sm font-medium text-foreground">{pkg?.name ?? app.packageId}</span>
                    <span className="truncate text-xs text-muted-foreground">{proj?.name ?? app.projectId}</span>
                    <span className={`status-pill text-[10px] ${appStatusCls[appStatus]}`}>{appStatus}</span>
                    <span className="text-center text-xs font-medium text-foreground">{app.score ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{relativeDate(app.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const allCategories = Array.from(new Set(vmVendors.flatMap(v => v.tradeCategories))).sort();

export function VendorMasterPage() {
  const { backendProjects } = useProjects();
  const { packages } = useProjectPackages();
  const { applications, createApplication } = useApplications();
  const { createInvitation } = useInvitations();
  const [search,       setSearch]  = useState("");
  const [statusFilter, setStatus]  = useState<VendorGlobalStatus | "All">("All");
  const [catFilter,    setCat]     = useState("All");
  const [riskFilter,   setRisk]    = useState("All");
  const [docFilter,    setDoc]     = useState<DocHealth | "All">("All");
  const [expandedId,   setExpand]  = useState<string | null>(null);
  const [inviteVendor, setInvite]  = useState<VMVendor | null>(null);

  const enrichedVendors = useMemo(() => vmVendors.map((vendor) => {
    const vendorApps = applications.filter((app) => app.vendorId === vendor.id);
    const projectIds = new Set(vendorApps.map((app) => app.projectId));
    const packageIds = new Set(vendorApps.map((app) => app.packageId));
    const latestApp = [...vendorApps].sort(
      (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
    )[0];

    const packageQualStatus: PackageQualStatus = latestApp
      ? latestApp.qualificationStatus === "Pending Review"
        ? "Pending"
        : latestApp.qualificationStatus === "Rejected"
          ? "Not Qualified"
          : latestApp.qualificationStatus === "Qualified" ||
              latestApp.qualificationStatus === "Conditionally Qualified" ||
              latestApp.qualificationStatus === "Shortlisted" ||
              latestApp.qualificationStatus === "Awarded"
            ? "Qualified"
            : "Pending"
      : vendor.packageQualStatus;

    return {
      ...vendor,
      linkedProjectCount: projectIds.size,
      linkedPackageCount: packageIds.size,
      packageQualStatus,
      lastActivity: latestApp?.lastActivityAt ?? vendor.lastActivity,
    };
  }), [applications]);

  const filtered = useMemo(() => enrichedVendors.filter(v => {
    const q = search.toLowerCase();
    if (q && !v.name.toLowerCase().includes(q) && !v.city.toLowerCase().includes(q)) return false;
    if (statusFilter !== "All" && v.globalStatus !== statusFilter) return false;
    if (catFilter !== "All" && !v.tradeCategories.includes(catFilter)) return false;
    if (riskFilter !== "All" && v.riskLevel !== riskFilter) return false;
    if (docFilter !== "All" && v.docHealth !== docFilter) return false;
    return true;
  }), [catFilter, docFilter, enrichedVendors, riskFilter, search, statusFilter]);

  const total       = enrichedVendors.length;
  const activeCount = enrichedVendors.filter(v => v.globalStatus === "Active").length;
  const reviewCount = enrichedVendors.filter(v => v.globalStatus === "Under Review").length;
  const qualCount   = enrichedVendors.filter(v => v.packageQualStatus === "Qualified").length;
  const docIssues   = enrichedVendors.filter(v => v.docHealth === "Expired" || v.docHealth === "Missing").length;
  const highRisk    = enrichedVendors.filter(v => v.riskLevel === "High" || v.riskLevel === "Critical").length;

  function handleSend(vendor: VMVendor, projectId: string, packageId: string) {
    const pkg = packages.find(p => p.id === packageId);
    void Promise.all([
      createInvitation({
        vendorId: vendor.id,
        projectId,
        packageId,
        companyName: vendor.name,
        contactName: vendor.contactName,
        contactEmail: vendor.contactEmail,
        category: pkg?.category ?? vendor.tradeCategories[0],
        status: "Invited",
      }),
      createApplication({
        vendorId: vendor.id,
        projectId,
        packageId,
        applicationStatus: "Invited",
        qualificationStatus: "Not Started",
        source: "invited",
      }),
    ]).then(() => {
      toast.success(`Invitation sent to ${vendor.name}`, { description: `Package: ${pkg?.name}` });
      setInvite(null);
    });
  }

  const sel = "rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Vendor Master</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Global Vendor Registry</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Qualification status, document health, and package eligibility across all projects.
          </p>
        </div>
        <button
          onClick={() => setInvite(enrichedVendors[0] ?? null)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Invite Vendor
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Total Vendors"     value={String(total)}       supporting={`${total} registered in the master`}   icon={<Building2 className="h-5 w-5" />} />
        <MetricCard label="Active"            value={String(activeCount)} supporting="currently pre-qualified vendors"        icon={<Users className="h-5 w-5" />} className="border-success/30" />
        <MetricCard label="Pending Review"    value={String(reviewCount)} supporting="awaiting assessment decision"           icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Package-Qualified" value={String(qualCount)}   supporting="qualified for one or more packages"     icon={<Package className="h-5 w-5" />} className="border-success/30" />
        <MetricCard label="Doc Issues"        value={String(docIssues)}   supporting="expired or missing critical documents"  icon={<AlertCircle className="h-5 w-5" />} className={docIssues > 0 ? "border-destructive/30" : ""} />
        <MetricCard label="High Risk"         value={String(highRisk)}    supporting="flagged by compliance review"           icon={<Shield className="h-5 w-5" />} className={highRisk > 0 ? "border-destructive/30" : ""} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or city…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value as VendorGlobalStatus | "All")} className={sel}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Under Review">Under Review</option>
          <option value="Suspended">Suspended</option>
          <option value="Blacklisted">Blacklisted</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select value={catFilter} onChange={e => setCat(e.target.value)} className={sel}>
          <option value="All">All Categories</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={riskFilter} onChange={e => setRisk(e.target.value)} className={sel}>
          <option value="All">All Risk Levels</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <select value={docFilter} onChange={e => setDoc(e.target.value as DocHealth | "All")} className={sel}>
          <option value="All">All Doc Health</option>
          <option value="Healthy">Healthy</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
          <option value="Missing">Missing</option>
        </select>
      </div>

      {/* Vendor table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        {/* Header */}
        <div className={cn(COL, COL_TEMPLATE, "min-w-max border-b border-border bg-muted/30 py-2.5")}>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Trade Categories</span>
          <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Proj.</span>
          <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pkg.</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Qualification</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Doc Health</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risk</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last Activity</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Search className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No vendors match your filters</p>
            <button
              onClick={() => { setSearch(""); setStatus("All"); setCat("All"); setRisk("All"); setDoc("All"); }}
              className="text-xs text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map(vendor => (
            <VendorRow
              key={vendor.id}
              vendor={vendor}
              applications={applications}
              projects={backendProjects}
              packages={packages}
              isExpanded={expandedId === vendor.id}
              onToggle={() => setExpand(p => p === vendor.id ? null : vendor.id)}
              onInvite={() => setInvite(vendor)}
            />
          ))
        )}

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          Showing {filtered.length} of {total} vendors
        </div>
      </div>

      {/* Invite modal */}
      {inviteVendor && (
        <InviteModal
          vendor={inviteVendor}
          projects={backendProjects}
          packages={packages}
          applications={applications}
          onClose={() => setInvite(null)}
          onSend={handleSend}
        />
      )}
    </div>
  );
}
