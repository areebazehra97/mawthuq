import type { ExtractedField } from "@/lib/mawthuq-data";
import type { Lang } from "@/lib/mawthuq-i18n";
import { tr } from "@/lib/mawthuq-i18n";

export function CitationDrawer({
  field,
  lang,
  onClose,
}: {
  field: ExtractedField | null;
  lang: Lang;
  onClose: () => void;
}) {
  if (!field) return null;
  const isAr = (field.originalSnippetAr ?? "").length > 0 && (lang === "ar" || /[\u0600-\u06FF]/.test(field.originalSnippet));
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="w-[440px] max-w-[92vw] bg-card border-s border-border shadow-2xl flex flex-col">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{tr("citationDrawer", lang)}</div>
            <div className="text-sm font-semibold mt-0.5">{field.sourceDoc}</div>
            <div className="text-xs text-muted-foreground">{tr("page", lang)} {field.sourcePage}</div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-auto p-5 bg-surface">
          {/* Mock document page */}
          <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-border text-[11px] text-muted-foreground flex justify-between bg-surface-2">
              <span>{field.sourceDoc}</span>
              <span>p. {field.sourcePage}</span>
            </div>
            <div className="p-5 text-[13px] leading-6 text-foreground space-y-3 font-mono">
              <p className="text-muted-foreground">
                ──────────────────────────<br />
                Document header · scanned page
              </p>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a urna sit amet quam mollis viverra.</p>
              <p>
                <mark className="bg-warning/40 text-foreground rounded px-1 py-0.5 not-italic">
                  {field.originalSnippet}
                </mark>
              </p>
              {field.originalSnippetAr && (
                <p dir="rtl" className="text-right">
                  <mark className="bg-warning/40 text-foreground rounded px-1 py-0.5">
                    {field.originalSnippetAr}
                  </mark>
                </p>
              )}
              <p className="text-muted-foreground">… page continues …</p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border bg-card p-4 text-sm">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
              {tr("extraction", lang)}
            </div>
            <div className="font-medium">{lang === "ar" && field.labelAr ? field.labelAr : field.label}</div>
            <div className="tabular mt-0.5">{lang === "ar" && field.valueAr ? field.valueAr : field.value}</div>
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            {isAr ? "Arabic source — original snippet shown." : ""}
          </p>
        </div>
      </aside>
    </div>
  );
}
