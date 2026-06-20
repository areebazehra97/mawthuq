import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Mail,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { useInvitations } from "@/hooks/use-invitations";
import { useProjectPackages } from "@/hooks/use-project-packages";
import { useProjects } from "@/hooks/use-projects";
import { mapBackendInvitationWithContext } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import type { InvitationStatus, VendorInvitation } from "@/types";

/* ── Status display config ──────────────────────────────── */

const statusConfig: Record<
  InvitationStatus,
  { label: string; cls: string; dot?: string }
> = {
  invited:   { label: "Invited",    cls: "bg-info/10 text-info border-info/30",              dot: "bg-info" },
  opened:    { label: "Opened",     cls: "bg-info/15 text-info border-info/40",              dot: "bg-info" },
  started:   { label: "In Progress",cls: "bg-warning/15 text-warning-foreground border-warning/40", dot: "bg-warning animate-pulse" },
  submitted: { label: "Submitted",  cls: "bg-success/15 text-success border-success/40",    dot: "bg-success" },
  expired:   { label: "Expired",    cls: "bg-muted text-muted-foreground border-border" },
  bounced:   { label: "Bounced",    cls: "bg-destructive/10 text-destructive border-destructive/30" },
  declined:  { label: "Declined",   cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

/* ── Helpers ────────────────────────────────────────────── */

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function today() {
  const d = new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── Page ───────────────────────────────────────────────── */

export function VendorInvitationsPage() {
  const { backendProjects } = useProjects();
  const { packages } = useProjectPackages();
  const { invitations, updateInvitation } = useInvitations();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  /* Stats */
  const invitationCards = useMemo<VendorInvitation[]>(
    () =>
      invitations.map((invitation) =>
        mapBackendInvitationWithContext(
          invitation,
          backendProjects.find((project) => project.id === invitation.projectId),
          packages.find((pkg) => pkg.id === invitation.packageId),
        ),
      ),
    [backendProjects, invitations, packages],
  );

  const total = invitationCards.length;

  /* Filtered list */
  const q = searchQuery.toLowerCase().trim();
  const visible = invitationCards
    .filter((i) => statusFilter === "all" || i.status === statusFilter)
    .filter((i) =>
      !q ||
      i.companyName.toLowerCase().includes(q) ||
      i.contactPerson.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q),
    );

  function copyLink(inv: VendorInvitation) {
    void navigator.clipboard.writeText(inv.registrationLink);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function resend(id: string) {
    const inv = invitationCards.find((item) => item.id === id);
    try {
      await updateInvitation(id, {
        status: "Invited",
        invitedAt: today(),
        expiresAt: addDays(new Date(), 30),
      });
      if (inv) {
        toast.success(`Invitation resent to ${inv.email}`, {
          description: `${inv.companyName} · new link expires in 30 days`,
        });
      }
    } catch {
      toast.error("Could not resend invitation.");
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Vendor Pipeline"
        title="Vendor Invitations"
        description="Track package-linked vendor invitations, resend expired links, and monitor registration progress."
        action={
          <Link
            to="/vendors?invite=1"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" />
            Invite from Vendor Master
          </Link>
        }
      />

      {/* ── Status filter tabs ── */}
      <div className="flex flex-wrap gap-2">
        {(["all", "invited", "opened", "started", "submitted", "expired", "bounced", "declined"] as const).map((s) => {
          const count = s === "all" ? total : invitationCards.filter((i) => i.status === s).length;
          const cfg   = s === "all" ? null : statusConfig[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize",
                statusFilter === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {cfg && <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot ?? "bg-muted-foreground/50")} />}
              {s === "all" ? "All" : statusConfig[s].label}
              <span className={cn(
                "ml-0.5 rounded px-1 py-0.5 text-[10px] font-semibold",
                statusFilter === s ? "bg-white/20" : "bg-muted",
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Invitations table ── */}
      <Card>
        {/* Search bar */}
        <div className="border-b border-border px-4 py-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by company, contact or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>
        <CardContent className="overflow-x-auto px-0 pb-0">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {q ? `No invitations match "${searchQuery}".` : "No invitations match this filter."}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-[11px] uppercase tracking-wider text-muted-foreground">
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
                {visible.map((inv) => (
                  <InvitationRow
                    key={inv.id}
                    inv={inv}
                    copied={copiedId === inv.id}
                    onCopy={() => copyLink(inv)}
                    onResend={() => resend(inv.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

/* ── Table row ──────────────────────────────────────────── */

function InvitationRow({
  inv,
  copied,
  onCopy,
  onResend,
}: {
  inv: VendorInvitation;
  copied: boolean;
  onCopy: () => void;
  onResend: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[inv.status];
  const isExpired = inv.status === "expired";

  return (
    <>
      <tr
        className="border-t border-border hover:bg-surface/50 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Company */}
        <td className="px-5 py-3.5">
          <div className="font-semibold text-foreground leading-snug">{inv.companyName}</div>
          {inv.projectContext && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">{inv.projectContext}</div>
          )}
        </td>

        {/* Contact */}
        <td className="px-3 py-3.5">
          <div className="text-sm text-foreground">{inv.contactPerson}</div>
          <div className="text-[11px] text-muted-foreground">{inv.email}</div>
        </td>

        {/* Category */}
        <td className="px-3 py-3.5">
          <span className="chip">{inv.tradeCategory}</span>
        </td>

        {/* Status */}
        <td className="px-3 py-3.5">
          <span className={`status-pill ${cfg.cls}`}>
            {cfg.dot && <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />}
            {cfg.label}
          </span>
        </td>

        {/* Invited */}
        <td className="px-3 py-3.5 text-sm text-muted-foreground tabular-nums">
          {inv.invitedAt}
        </td>

        {/* Expires */}
        <td className="px-3 py-3.5">
          <span className={cn("text-sm tabular-nums", isExpired ? "text-destructive line-through" : "text-muted-foreground")}>
            {inv.expiresAt}
          </span>
        </td>

        {/* Actions */}
        <td className="px-5 py-3.5 text-end" onClick={(e) => e.stopPropagation()}>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={onCopy}
              title="Copy registration link"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {isExpired && (
              <button
                type="button"
                onClick={onResend}
                title="Resend invitation"
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <RefreshCw className="h-3 w-3" />
                Resend
              </button>
            )}
            <button
              type="button"
              title={expanded ? "Collapse" : "View timeline"}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded timeline */}
      {expanded && (
        <tr className="border-t border-border bg-surface/40">
          <td colSpan={7} className="px-5 py-4">
            <div className="flex flex-wrap items-start gap-6">
              <TimelinePoint label="Invited"   value={inv.invitedAt}   done />
              <TimelinePoint label="Opened"    value={inv.openedAt}    done={!!inv.openedAt} />
              <TimelinePoint label="Started"   value={inv.startedAt}   done={!!inv.startedAt} />
              <TimelinePoint label="Submitted" value={inv.submittedAt} done={!!inv.submittedAt} />
              <div className="ml-auto text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Registration link</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <code className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-mono text-foreground">
                    {inv.registrationLink}
                  </code>
                  <button type="button" onClick={onCopy} className="text-muted-foreground hover:text-accent transition-colors">
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

function TimelinePoint({ label, value, done }: { label: string; value?: string; done: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <div className={cn(
        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]",
        done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground ring-1 ring-border",
      )}>
        {done && <Check className="h-2.5 w-2.5" />}
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{value ?? "—"}</p>
      </div>
    </div>
  );
}
