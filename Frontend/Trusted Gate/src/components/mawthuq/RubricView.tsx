import { KSA_RUBRIC } from "@/lib/mawthuq-data";
import type { Lang } from "@/lib/mawthuq-i18n";
import { tr } from "@/lib/mawthuq-i18n";

export function RubricView({ lang }: { lang: Lang }) {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="rounded-lg border border-border bg-card p-5 shadow-sm flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">{tr("rubric", lang)}</div>
          <h1 className="text-2xl font-semibold mt-1">{lang === "ar" ? KSA_RUBRIC.nameAr : KSA_RUBRIC.name}</h1>
          <div className="text-sm text-muted-foreground mt-1 tabular">{KSA_RUBRIC.id} · {KSA_RUBRIC.version}</div>
        </div>
        <button disabled className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground cursor-not-allowed bg-muted">
          {tr("newRubric", lang)} <span className="ms-1 chip">{tr("v2Stub", lang)}</span>
        </button>
      </header>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">{tr("weights", lang)}</h2>
        <ul className="space-y-2">
          {KSA_RUBRIC.dimensions.map((d) => (
            <li key={d.name} className="flex items-center gap-3">
              <div className="w-64 text-sm">
                <div>{d.name}</div>
                <div className="text-xs text-muted-foreground" dir="rtl">{d.nameAr}</div>
              </div>
              <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${d.weight * 4}%`, maxWidth: "100%" }} />
              </div>
              <div className="w-12 text-end tabular text-sm font-medium">{d.weight}%</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">{tr("requiredDocs", lang)}</h2>
          <ul className="space-y-1.5 text-sm">
            {KSA_RUBRIC.requiredDocs.map((d) => (
              <li key={d} className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive mb-3">{tr("hardGates", lang)}</h2>
          <ul className="space-y-1.5 text-sm">
            {KSA_RUBRIC.hardGates.map((g) => (
              <li key={g} className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">■</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs text-muted-foreground">
            {tr("scaMapping", lang)}: <span className="text-foreground">{KSA_RUBRIC.scaGradeForValueBand}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
