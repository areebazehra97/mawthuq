import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, ArrowLeft, Building2, Calendar, CheckCircle2,
  Clock, FileText, Hash, Mail, MapPin, Phone, Shield, Star, Users, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  vmVendors, vmProjects, vmPackages, vmApplications, vmDocuments,
  vmFindings, vmReviews, vmActivity,
  type VMVendor, type VendorGlobalStatus, type DocHealth, type ApplicationStatus,
  type FindingSeverity, type FindingStatus, type ActivityType,
} from "@/data/vendor-master-seed";

// ── Style maps ────────────────────────────────────────────────────────────────

const globalStatusCls: Record<VendorGlobalStatus, string> = {
  "Active":       "bg-success/15 text-success border-success/40",
  "Under Review": "bg-warning/15 text-warning-foreground border-warning/40",
  "Suspended":    "bg-orange-500/10 text-orange-700 border-orange-400/40",
  "Blacklisted":  "bg-destructive/10 text-destructive border-destructive/40",
  "Inactive":     "bg-muted text-muted-foreground border-border",
};

const docStatusCls: Record<string, string> = {
  "Valid":         "bg-success/15 text-success border-success/40",
  "Expiring Soon": "bg-warning/15 text-warning-foreground border-warning/40",
  "Expired":       "bg-destructive/10 text-destructive border-destructive/40",
  "Missing":       "bg-muted text-muted-foreground border-border",
};

const docHealthCls: Record<DocHealth, string> = {
  "Healthy":       "bg-success/15 text-success border-success/40",
  "Expiring Soon": "bg-warning/15 text-warning-foreground border-warning/40",
  "Expired":       "bg-destructive/10 text-destructive border-destructive/40",
  "Missing":       "bg-muted text-muted-foreground border-border",
};

const appStatusCls: Record<ApplicationStatus, string> = {
  "Invited":      "bg-info/10 text-info border-info/30",
  "Registered":   "bg-purple-500/10 text-purple-700 border-purple-400/40",
  "Under Review": "bg-warning/15 text-warning-foreground border-warning/40",
  "Qualified":    "bg-success/15 text-success border-success/40",
  "Rejected":     "bg-destructive/10 text-destructive border-destructive/40",
  "Shortlisted":  "bg-accent/20 text-accent-foreground border-accent/40",
};

const reviewStatusCls: Record<string, string> = {
  "Pass":        "bg-success/15 text-success border-success/40",
  "Fail":        "bg-destructive/10 text-destructive border-destructive/40",
  "Conditional": "bg-warning/15 text-warning-foreground border-warning/40",
  "Pending":     "bg-muted text-muted-foreground border-border",
};

const findingSeverityCls: Record<FindingSeverity, string> = {
  "Low":      "bg-success/15 text-success border-success/40",
  "Medium":   "bg-warning/15 text-warning-foreground border-warning/40",
  "High":     "bg-orange-500/10 text-orange-700 border-orange-400/40",
  "Critical": "bg-destructive/10 text-destructive border-destructive/40",
};

const findingStatusCls: Record<FindingStatus, string> = {
  "Open":       "bg-destructive/10 text-destructive border-destructive/40",
  "Monitoring": "bg-warning/15 text-warning-foreground border-warning/40",
  "Resolved":   "bg-success/15 text-success border-success/40",
};

const activityIconMap: Record<ActivityType, React.ReactNode> = {
  application: <FileText className="h-3.5 w-3.5" />,
  document:    <FileText className="h-3.5 w-3.5" />,
  review:      <CheckCircle2 className="h-3.5 w-3.5" />,
  invitation:  <Mail className="h-3.5 w-3.5" />,
  status:      <Building2 className="h-3.5 w-3.5" />,
  finding:     <AlertTriangle className="h-3.5 w-3.5" />,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function scoreBg(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning-foreground";
  return "text-destructive";
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type ProfileTab = "overview" | "projects" | "documents" | "applications" | "reviews" | "risks" | "activity";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "overview",      label: "Overview" },
  { id: "projects",      label: "Projects & Packages" },
  { id: "documents",     label: "Documents" },
  { id: "applications",  label: "Applications" },
  { id: "reviews",       label: "Reviews" },
  { id: "risks",         label: "Risks & Findings" },
  { id: "activity",      label: "Activity" },
];

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ vendor }: { vendor: VMVendor }) {
  const docs     = vmDocuments.filter(d => d.vendorId === vendor.id);
  const findings = vmFindings.filter(f => f.vendorId === vendor.id && f.status !== "Resolved");
  const apps     = vmApplications.filter(a => a.vendorId === vendor.id);
  const qualApps = apps.filter(a => a.status === "Qualified" || a.status === "Shortlisted");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Left: company details */}
      <div className="space-y-4 lg:col-span-1">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Company Details</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Hash className="h-4 w-4 shrink-0" />
              <span className="text-foreground font-mono">{vendor.crNumber}</span>
              <span className="text-xs">CR</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Hash className="h-4 w-4 shrink-0" />
              <span className="text-foreground font-mono text-xs">{vendor.vatNumber}</span>
              <span className="text-xs">VAT</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="text-foreground">{vendor.city}, {vendor.country}</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="text-foreground">Registered {fmtDate(vendor.registeredDate)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contact</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-foreground">{vendor.contactName}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <a href={`mailto:${vendor.contactEmail}`} className="text-primary hover:underline truncate">
                {vendor.contactEmail}
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-foreground">{vendor.contactPhone}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trade Categories</h3>
          <div className="flex flex-wrap gap-1.5">
            {vendor.tradeCategories.map(c => (
              <span key={c} className="chip text-[11px]">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: stats + warnings */}
      <div className="space-y-4 lg:col-span-2">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{vendor.aiScore}</p>
            <p className={cn("text-sm font-medium", scoreBg(vendor.aiScore))}>AI Score</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{apps.length}</p>
            <p className="text-sm text-muted-foreground">Applications</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-semibold text-success">{qualApps.length}</p>
            <p className="text-sm text-muted-foreground">Qualified</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className={cn("text-2xl font-semibold", findings.length > 0 ? "text-destructive" : "text-foreground")}>
              {findings.length}
            </p>
            <p className="text-sm text-muted-foreground">Open Findings</p>
          </div>
        </div>

        {/* Blockers */}
        {findings.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-destructive">
              Active Findings ({findings.length})
            </p>
            {findings.map(f => (
              <div key={f.id} className="flex items-start gap-2">
                <span className={`status-pill mt-0.5 text-[10px] shrink-0 ${findingSeverityCls[f.severity]}`}>{f.severity}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document health summary */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Document Health</h3>
            <span className={`status-pill text-[10px] ${docHealthCls[vendor.docHealth]}`}>{vendor.docHealth}</span>
          </div>
          <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground">{doc.docType}</span>
                <div className="flex items-center gap-2">
                  {doc.expiryDate && (
                    <span className="text-xs text-muted-foreground">exp. {fmtDate(doc.expiryDate)}</span>
                  )}
                  <span className={`status-pill text-[10px] ${docStatusCls[doc.status]}`}>{doc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {vendor.notes && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Internal Notes</h3>
            <p className="text-sm text-foreground">{vendor.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Projects & Packages tab ───────────────────────────────────────────────────

function ProjectsTab({ vendorId }: { vendorId: string }) {
  const apps = vmApplications.filter(a => a.vendorId === vendorId);

  if (apps.length === 0) {
    return <EmptyState icon={<Building2 className="h-8 w-8" />} label="No project applications on record." />;
  }

  const byProject = vmProjects.map(proj => ({
    proj,
    apps: apps.filter(a => a.projectId === proj.id),
  })).filter(g => g.apps.length > 0);

  return (
    <div className="space-y-5">
      {byProject.map(({ proj, apps: pApps }) => (
        <div key={proj.id} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{proj.name}</p>
              <p className="text-[11px] text-muted-foreground">{proj.city} · {proj.client}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{proj.value}</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {pApps.map(app => {
              const pkg = vmPackages.find(p => p.id === app.packageId);
              return (
                <div key={app.id} className="grid grid-cols-[1fr_120px_60px_120px] items-center gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{pkg?.name ?? app.packageId}</p>
                    <p className="text-xs text-muted-foreground">{pkg?.budget}</p>
                  </div>
                  <span className={`status-pill text-[10px] ${appStatusCls[app.status]}`}>{app.status}</span>
                  <span className="text-sm font-medium text-foreground text-center">{app.aiScore ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(app.lastUpdated)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Documents tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ vendorId }: { vendorId: string }) {
  const docs = vmDocuments.filter(d => d.vendorId === vendorId);

  if (docs.length === 0) {
    return <EmptyState icon={<FileText className="h-8 w-8" />} label="No documents uploaded yet." />;
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <div className="grid grid-cols-[1fr_120px_120px_120px_100px] gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Document</span>
          <span>Issue Date</span>
          <span>Expiry Date</span>
          <span>Uploaded</span>
          <span>Status</span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {docs.map(doc => (
          <div key={doc.id} className="grid grid-cols-[1fr_120px_120px_120px_100px] items-center gap-3 px-5 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{doc.docType}</p>
              {doc.fileName && (
                <p className="text-[11px] text-muted-foreground">{doc.fileName}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{doc.issueDate ? fmtDate(doc.issueDate) : "—"}</span>
            <span className={cn("text-xs", doc.status === "Expiring Soon" ? "text-warning-foreground font-medium" : doc.status === "Expired" ? "text-destructive font-medium" : "text-muted-foreground")}>
              {doc.expiryDate ? fmtDate(doc.expiryDate) : "—"}
            </span>
            <span className="text-xs text-muted-foreground">{fmtDate(doc.uploadedDate)}</span>
            <span className={`status-pill text-[10px] ${docStatusCls[doc.status]}`}>{doc.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Applications tab ──────────────────────────────────────────────────────────

function ApplicationsTab({ vendorId }: { vendorId: string }) {
  const apps = vmApplications.filter(a => a.vendorId === vendorId);

  if (apps.length === 0) {
    return <EmptyState icon={<FileText className="h-8 w-8" />} label="No applications on record." />;
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <div className="grid grid-cols-[1fr_1fr_120px_60px_120px_120px] gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Package</span>
          <span>Project</span>
          <span>Status</span>
          <span className="text-center">Score</span>
          <span>Applied</span>
          <span>Last Updated</span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {apps.map(app => {
          const pkg  = vmPackages.find(p => p.id === app.packageId);
          const proj = vmProjects.find(p => p.id === app.projectId);
          return (
            <div key={app.id} className="grid grid-cols-[1fr_1fr_120px_60px_120px_120px] items-start gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{pkg?.name ?? app.packageId}</p>
                {pkg && <p className="text-xs text-muted-foreground">{pkg.budget}</p>}
              </div>
              <p className="text-sm text-muted-foreground">{proj?.name ?? app.projectId}</p>
              <span className={`status-pill text-[10px] ${appStatusCls[app.status]}`}>{app.status}</span>
              <span className={cn("text-center text-sm font-medium", app.aiScore ? scoreBg(app.aiScore) : "text-muted-foreground")}>
                {app.aiScore ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">{fmtDate(app.appliedDate)}</span>
              <div>
                <span className="text-xs text-muted-foreground">{fmtDate(app.lastUpdated)}</span>
                {app.reviewerNote && (
                  <p className="mt-0.5 text-[11px] italic text-muted-foreground">{app.reviewerNote}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Reviews tab ───────────────────────────────────────────────────────────────

function ReviewsTab({ vendorId }: { vendorId: string }) {
  const reviews = vmReviews.filter(r => r.vendorId === vendorId);

  if (reviews.length === 0) {
    return <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} label="No review records yet." />;
  }

  const byApp = vmApplications
    .filter(a => a.vendorId === vendorId)
    .map(app => ({
      app,
      reviews: reviews.filter(r => r.applicationId === app.id),
    }))
    .filter(g => g.reviews.length > 0);

  return (
    <div className="space-y-5">
      {byApp.map(({ app, reviews: appReviews }) => {
        const pkg  = vmPackages.find(p => p.id === app.packageId);
        const proj = vmProjects.find(p => p.id === app.projectId);
        return (
          <div key={app.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-5 py-3">
              <p className="text-sm font-semibold text-foreground">{pkg?.name}</p>
              <p className="text-[11px] text-muted-foreground">{proj?.name}</p>
            </div>
            <div className="divide-y divide-border">
              {appReviews.map(r => (
                <div key={r.id} className="grid grid-cols-[1fr_120px_60px_140px_1fr] items-start gap-3 px-5 py-3">
                  <p className="text-sm font-medium text-foreground">{r.section}</p>
                  <span className={`status-pill text-[10px] ${reviewStatusCls[r.status]}`}>{r.status}</span>
                  <span className={cn("text-center text-sm font-medium", r.score !== undefined ? scoreBg(r.score) : "text-muted-foreground")}>
                    {r.score ?? "—"}
                  </span>
                  <div>
                    <p className="text-xs text-foreground">{r.reviewerName}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDate(r.reviewDate)}</p>
                  </div>
                  <p className="text-xs italic text-muted-foreground">{r.comment ?? ""}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Risks & Findings tab ──────────────────────────────────────────────────────

function RisksTab({ vendorId }: { vendorId: string }) {
  const findings = vmFindings.filter(f => f.vendorId === vendorId);

  if (findings.length === 0) {
    return <EmptyState icon={<Shield className="h-8 w-8" />} label="No findings on record. Risk profile is clean." />;
  }

  const open       = findings.filter(f => f.status === "Open");
  const monitoring = findings.filter(f => f.status === "Monitoring");
  const resolved   = findings.filter(f => f.status === "Resolved");

  function FindingCard({ f }: { f: typeof findings[0] }) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{f.title}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`status-pill text-[10px] ${findingSeverityCls[f.severity]}`}>{f.severity}</span>
            <span className={`status-pill text-[10px] ${findingStatusCls[f.status]}`}>{f.status}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{f.description}</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>Raised {fmtDate(f.raisedDate)} by {f.raisedBy}</span>
          {f.resolvedDate && <span>· Resolved {fmtDate(f.resolvedDate)}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {open.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-destructive">
            <XCircle className="h-4 w-4" /> Open ({open.length})
          </h3>
          {open.map(f => <FindingCard key={f.id} f={f} />)}
        </section>
      )}
      {monitoring.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-warning-foreground">
            <AlertTriangle className="h-4 w-4" /> Monitoring ({monitoring.length})
          </h3>
          {monitoring.map(f => <FindingCard key={f.id} f={f} />)}
        </section>
      )}
      {resolved.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-success">
            <CheckCircle2 className="h-4 w-4" /> Resolved ({resolved.length})
          </h3>
          {resolved.map(f => <FindingCard key={f.id} f={f} />)}
        </section>
      )}
    </div>
  );
}

// ── Activity tab ──────────────────────────────────────────────────────────────

function ActivityTab({ vendorId }: { vendorId: string }) {
  const items = vmActivity
    .filter(a => a.vendorId === vendorId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (items.length === 0) {
    return <EmptyState icon={<Activity className="h-8 w-8" />} label="No activity recorded yet." />;
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-3">
          {/* Timeline */}
          <div className="flex flex-col items-center">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
              {activityIconMap[item.type]}
            </div>
            {i < items.length - 1 && <div className="mt-1 flex-1 border-l border-dashed border-border" />}
          </div>
          {/* Content */}
          <div className={cn("pb-4 pt-1 min-w-0", i === items.length - 1 && "pb-0")}>
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{fmtDate(item.date)}</span>
              {item.actor && <><span>·</span><span>{item.actor}</span></>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      <div className="opacity-30">{icon}</div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────

export function VendorProfilePage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [tab, setTab] = useState<ProfileTab>("overview");

  const vendor = vmVendors.find(v => v.id === vendorId);
  if (!vendor) return <Navigate to="/vendors" replace />;

  const apps = vmApplications.filter(a => a.vendorId === vendor.id);

  function handleInvite() {
    toast.success("Opening invitation workflow…", { description: "Use the Vendor Master to invite this vendor to a specific package." });
  }

  return (
    <div className="space-y-6">

      {/* Back nav */}
      <Link
        to="/vendors"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Vendor Master
      </Link>

      {/* Vendor header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
              {vendor.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-foreground">{vendor.name}</h1>
                <span className={`status-pill ${globalStatusCls[vendor.globalStatus]}`}>
                  {vendor.globalStatus}
                </span>
              </div>
              <p
                className="text-sm text-muted-foreground"
                style={{ fontFamily: '"Noto Sans Arabic", sans-serif' }}
              >
                {vendor.arabicName}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{vendor.city}</span>
                <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />CR {vendor.crNumber}</span>
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />AI Score: <strong className={cn("ml-0.5", scoreBg(vendor.aiScore))}>{vendor.aiScore}</strong></span>
                <span>{apps.length} application{apps.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${vendor.contactEmail}`} className="gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </a>
            </Button>
            <Button size="sm" onClick={handleInvite} className="gap-2">
              <Mail className="h-4 w-4" />
              Invite to Package
            </Button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === "overview"     && <OverviewTab vendor={vendor} />}
      {tab === "projects"     && <ProjectsTab vendorId={vendor.id} />}
      {tab === "documents"    && <DocumentsTab vendorId={vendor.id} />}
      {tab === "applications" && <ApplicationsTab vendorId={vendor.id} />}
      {tab === "reviews"      && <ReviewsTab vendorId={vendor.id} />}
      {tab === "risks"        && <RisksTab vendorId={vendor.id} />}
      {tab === "activity"     && <ActivityTab vendorId={vendor.id} />}
    </div>
  );
}
