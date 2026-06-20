import type { Vendor } from "@/lib/mawthuq-data";
import type { Lang } from "@/lib/mawthuq-i18n";
import { tr } from "@/lib/mawthuq-i18n";
import { RecBadge } from "./Pills";

export function AuditModal({ vendor, lang, onClose, onExport }: { vendor: Vendor; lang: Lang; onClose: () => void; onExport: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-foreground/40">
      <div className="bg-card w-full max-w-2xl max-h-[85vh] rounded-lg border border-border shadow-2xl flex flex-col">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{tr("auditTrail", lang)}</div>
            <div className="text-sm font-semibold">{lang === "ar" ? vendor.nameAr : vendor.name}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onExport} className="text-xs px-3 py-1.5 rounded border border-border bg-primary text-primary-foreground hover:opacity-90">
              {tr("exportReport", lang)}
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-5">
          <ol className="relative border-s border-border ps-5 space-y-4">
            {vendor.auditLog.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -start-[7px] top-1.5 h-3 w-3 rounded-full bg-accent border-2 border-card" />
                <div className="text-[11px] text-muted-foreground tabular">{e.timestamp} · {e.user}</div>
                <div className="text-sm font-medium mt-0.5">{e.action}</div>
                <div className="text-sm text-muted-foreground">{e.detail}</div>
                {e.reason && (
                  <div className="text-xs mt-1 rounded bg-muted px-2 py-1 border border-border">
                    <span className="font-medium">Reason:</span> {e.reason}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
        <footer className="px-5 py-3 border-t border-border flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{tr("decision", lang)}:</span>
            <RecBadge rec={vendor.decision} lang={lang} />
          </div>
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted">{tr("close", lang)}</button>
        </footer>
      </div>
    </div>
  );
}
