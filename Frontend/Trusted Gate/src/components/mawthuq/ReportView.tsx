import type { Package, Vendor } from "@/lib/mawthuq-data";
import type { Lang } from "@/lib/mawthuq-i18n";
import { tr } from "@/lib/mawthuq-i18n";
import { RecBadge } from "./Pills";

export function ReportView({ pkg, vendor, lang, onClose }: { pkg: Package; vendor: Vendor; lang: Lang; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto print:static print:overflow-visible">
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="text-sm text-muted-foreground">Printable prequalification report</div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground">{tr("print", lang)}</button>
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-border">{tr("close", lang)}</button>
          </div>
        </div>

        <header className="border-b-2 border-primary pb-4 mb-6">
          <div className="text-xs uppercase tracking-widest text-accent font-semibold">Mawthūq · WhiteHelmet</div>
          <h1 className="text-2xl font-bold mt-1">Prequalification Report</h1>
          <div className="text-sm text-muted-foreground mt-2 tabular">
            {pkg.name} · {pkg.scopeCode} · {pkg.valueBand} · Rubric {pkg.rubricId}
          </div>
        </header>

        <section className="mb-6">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-xl font-semibold">{vendor.name}</h2>
              <div className="text-muted-foreground" dir="rtl">{vendor.nameAr}</div>
            </div>
            <RecBadge rec={vendor.decision === "PENDING" ? vendor.scorecard.recommendation : vendor.decision} lang={lang} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{tr("weightedScore", lang)}</div>
              <div className="text-2xl font-bold tabular">{vendor.scorecard.total}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{tr("rationale", lang)}</div>
              <div>{vendor.scorecard.rationale}</div>
            </div>
          </div>
          {vendor.conditions && vendor.conditions.length > 0 && (
            <div className="mt-3 text-sm">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{tr("conditions", lang)}</div>
              <ul className="list-disc ms-5 mt-1">
                {vendor.conditions.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-2">Extracted evidence</h3>
          <table className="w-full text-sm border border-border">
            <thead className="bg-surface-2">
              <tr className="text-start">
                <th className="text-start p-2">Field</th>
                <th className="text-start p-2">Value</th>
                <th className="text-start p-2">Source</th>
                <th className="text-start p-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {vendor.extractedFields.map((f) => (
                <tr key={f.key} className="border-t border-border align-top">
                  <td className="p-2 font-medium">{f.label}</td>
                  <td className="p-2 tabular">{f.value}{f.overridden && <span className="ms-2 text-xs text-warning">(overridden)</span>}</td>
                  <td className="p-2 text-muted-foreground">{f.sourceDoc}, p.{f.sourcePage}</td>
                  <td className="p-2">{f.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-2">Deterministic validation</h3>
          <table className="w-full text-sm border border-border">
            <thead className="bg-surface-2">
              <tr>
                <th className="text-start p-2">Rule</th>
                <th className="text-start p-2">Threshold</th>
                <th className="text-start p-2">Actual</th>
                <th className="text-start p-2">Result</th>
                <th className="text-start p-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {vendor.ruleResults.map((r) => (
                <tr key={r.id} className={`border-t border-border ${r.isHardGate && !r.pass ? "bg-destructive/10" : ""}`}>
                  <td className="p-2">
                    {r.label}
                    {r.isHardGate && <span className="ms-2 text-[10px] font-semibold text-destructive">[HARD GATE]</span>}
                  </td>
                  <td className="p-2 tabular">{r.threshold}</td>
                  <td className="p-2 tabular">{r.actual}</td>
                  <td className={`p-2 font-semibold ${r.pass ? "text-success" : "text-destructive"}`}>{r.pass ? "PASS" : "FAIL"}</td>
                  <td className="p-2 text-muted-foreground">{r.sourceDoc ? `${r.sourceDoc}, p.${r.sourcePage}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-2">Audit trail</h3>
          <ul className="text-sm space-y-1">
            {vendor.auditLog.map((e) => (
              <li key={e.id} className="tabular border-b border-border py-1">
                <span className="text-muted-foreground">{e.timestamp}</span> · {e.user} · <span className="font-medium">{e.action}</span> — {e.detail}
                {e.reason && <span className="ms-2 italic text-muted-foreground">({e.reason})</span>}
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-10 pt-4 border-t border-border text-[11px] text-muted-foreground">
          {tr("footerTrust", lang)} · {tr("residency", lang)} · Report generated {new Date().toISOString().slice(0, 16).replace("T", " ")}
        </footer>
      </div>
    </div>
  );
}
