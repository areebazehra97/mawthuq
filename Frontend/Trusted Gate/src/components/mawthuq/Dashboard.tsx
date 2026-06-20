import type { Package, Vendor } from "@/lib/mawthuq-data";
import type { Lang } from "@/lib/mawthuq-i18n";
import { tr } from "@/lib/mawthuq-i18n";
import { StatusPill, RecBadge } from "./Pills";

export function Dashboard({
  pkg,
  lang,
  onOpenVendor,
}: {
  pkg: Package;
  lang: Lang;
  onOpenVendor: (id: string) => void;
}) {
  const sorted = [...pkg.vendors].sort((a, b) => recOrder(a) - recOrder(b));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Package header */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">{tr("package", lang)}</div>
            <h1 className="text-2xl font-semibold mt-1">
              {lang === "ar" ? pkg.nameAr : pkg.name}
            </h1>
            <div className="text-sm text-muted-foreground mt-1">
              {tr("asset", lang)}: <span className="text-foreground">{lang === "ar" ? pkg.assetAr : pkg.asset}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <Stat label={tr("scope", lang)} value={pkg.scopeCode} />
            <Stat label={tr("valueBand", lang)} value={pkg.valueBand} mono />
            <Stat label={tr("rubric", lang)} value={pkg.rubricId} />
          </div>
        </div>
      </section>

      {/* Vendors table */}
      <section className="mt-6 rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        <header className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">{tr("vendors", lang)} <span className="text-muted-foreground tabular">({pkg.vendors.length})</span></h2>
          <span className="text-[11px] text-muted-foreground">{tr("recommendation", lang)} ↑</span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-start font-medium px-5 py-2">{tr("vendor", lang)}</th>
                <th className="text-start font-medium px-3 py-2">{tr("status", lang)}</th>
                <th className="text-end font-medium px-3 py-2">{tr("score", lang)}</th>
                <th className="text-end font-medium px-3 py-2">{tr("flags", lang)}</th>
                <th className="text-start font-medium px-3 py-2">{tr("recommendation", lang)}</th>
                <th className="px-5 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => (
                <Row key={v.id} v={v} lang={lang} onOpen={() => onOpenVendor(v.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function recOrder(v: Vendor): number {
  const r = effectiveRec(v);
  return { FAIL: 0, CONDITIONAL: 1, PENDING: 2, PASS: 3 }[r];
}

function effectiveRec(v: Vendor) {
  return v.decision !== "PENDING" ? v.decision : v.scorecard.recommendation;
}

function Row({ v, lang, onOpen }: { v: Vendor; lang: Lang; onOpen: () => void }) {
  const rec = effectiveRec(v);
  const flagCount =
    v.ruleResults.filter((r) => !r.pass).length +
    v.documents.filter((d) => d.status !== "present").length +
    v.extractedFields.filter((f) => f.confidence === "Low").length;

  return (
    <tr className="border-t border-border hover:bg-muted/40 cursor-pointer" onClick={onOpen}>
      <td className="px-5 py-3">
        <div className="font-medium">{v.name}</div>
        <div className="text-muted-foreground text-xs" dir="rtl">{v.nameAr}</div>
      </td>
      <td className="px-3 py-3"><StatusPill status={v.status} lang={lang} /></td>
      <td className="px-3 py-3 text-end tabular font-semibold">
        {v.scorecard.total > 0 ? v.scorecard.total : "—"}
      </td>
      <td className="px-3 py-3 text-end tabular">
        {flagCount > 0 ? (
          <span className="inline-flex items-center justify-center min-w-5 px-1.5 rounded bg-warning/20 text-warning-foreground text-xs font-medium">{flagCount}</span>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>
      <td className="px-3 py-3">
        <RecBadge rec={rec} lang={lang} />
        {v.scorecard.hardGateHit && (
          <span className="ms-2 text-[10px] font-bold text-destructive">HARD GATE</span>
        )}
      </td>
      <td className="px-5 py-3 text-end">
        <button className="text-xs text-accent hover:underline" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          Open →
        </button>
      </td>
    </tr>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 ${mono ? "tabular" : ""}`}>{value}</div>
    </div>
  );
}
