import type { Recommendation, VendorStatus, Confidence } from "@/lib/mawthuq-data";
import type { Lang } from "@/lib/mawthuq-i18n";
import { tr } from "@/lib/mawthuq-i18n";

export function StatusPill({ status, lang }: { status: VendorStatus; lang: Lang }) {
  const map: Record<VendorStatus, { label: string; cls: string; dot?: string }> = {
    awaiting_docs: { label: tr("awaitingDocs", lang), cls: "bg-muted text-muted-foreground border-border" },
    processing: { label: tr("processingStatus", lang), cls: "bg-info/10 text-info border-info/30", dot: "bg-info animate-pulse" },
    ready_for_review: { label: tr("readyForReview", lang), cls: "bg-warning/15 text-warning-foreground border-warning/40" },
    approved: { label: tr("approved", lang), cls: "bg-success/15 text-success border-success/40" },
    conditional: { label: tr("conditional", lang), cls: "bg-warning/15 text-warning-foreground border-warning/40" },
    rejected: { label: tr("rejected", lang), cls: "bg-destructive/10 text-destructive border-destructive/40" },
  };
  const s = map[status];
  return (
    <span className={`status-pill ${s.cls}`}>
      {s.dot && <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
      {s.label}
    </span>
  );
}

export function RecBadge({ rec, lang }: { rec: Recommendation; lang: Lang }) {
  const map: Record<Recommendation, { label: string; cls: string }> = {
    PASS: { label: lang === "ar" ? "ناجح" : "PASS", cls: "bg-success text-success-foreground" },
    CONDITIONAL: { label: lang === "ar" ? "مشروط" : "CONDITIONAL", cls: "bg-warning text-warning-foreground" },
    FAIL: { label: lang === "ar" ? "غير مؤهل" : "FAIL", cls: "bg-destructive text-destructive-foreground" },
    PENDING: { label: lang === "ar" ? "قيد المراجعة" : "PENDING", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[rec];
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function ConfidencePill({ c }: { c: Confidence }) {
  const map: Record<Confidence, string> = {
    High: "bg-success/15 text-success border-success/30",
    Med: "bg-info/10 text-info border-info/30",
    Low: "bg-warning/20 text-warning-foreground border-warning/40",
  };
  return (
    <span className={`status-pill ${map[c]}`}>
      {c}
    </span>
  );
}

export function LangTag({ l }: { l: "ar" | "en" | "mixed" }) {
  const map = { ar: "AR", en: "EN", mixed: "AR+EN" };
  return <span className="chip uppercase">{map[l]}</span>;
}
