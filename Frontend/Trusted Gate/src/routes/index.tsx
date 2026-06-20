import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { buildSeedPackage, type Package, type Vendor } from "@/lib/mawthuq-data";
import type { Lang } from "@/lib/mawthuq-i18n";
import { tr } from "@/lib/mawthuq-i18n";
import { Dashboard } from "@/components/mawthuq/Dashboard";
import { VendorDetail } from "@/components/mawthuq/VendorDetail";
import { RubricView } from "@/components/mawthuq/RubricView";
import { ReportView } from "@/components/mawthuq/ReportView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mawthūq — Vendor Prequalification | WhiteHelmet" },
      { name: "description", content: "Defensible PASS/CONDITIONAL/FAIL vendor prequalification for KSA giga-projects. Every finding cites its source." },
    ],
  }),
  component: Index,
});

type View = "dashboard" | "vendor" | "rubric";

function Index() {
  const [lang, setLang] = useState<Lang>("en");
  const [pkg, setPkg] = useState<Package>(() => buildSeedPackage());
  const [view, setView] = useState<View>("dashboard");
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [reportVendor, setReportVendor] = useState<Vendor | null>(null);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const activeVendor = useMemo(
    () => pkg.vendors.find((v) => v.id === activeVendorId) ?? null,
    [pkg, activeVendorId],
  );

  const updateVendor = (next: Vendor) => {
    setPkg((p) => ({ ...p, vendors: p.vendors.map((v) => (v.id === next.id ? next : v)) }));
  };

  const openVendor = (id: string) => {
    setActiveVendorId(id);
    setView("vendor");
  };

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-background text-foreground">
      <Header
        lang={lang}
        onLang={setLang}
        view={view}
        onNav={(v) => { setView(v); if (v !== "vendor") setActiveVendorId(null); }}
      />

      <main className="flex-1 pb-24">
        {view === "dashboard" && (
          <Dashboard pkg={pkg} lang={lang} onOpenVendor={openVendor} />
        )}
        {view === "vendor" && activeVendor && (
          <VendorDetail
            pkg={pkg}
            vendor={activeVendor}
            lang={lang}
            onBack={() => { setView("dashboard"); setActiveVendorId(null); }}
            onUpdate={updateVendor}
            onOpenReport={() => setReportVendor(activeVendor)}
          />
        )}
        {view === "rubric" && <RubricView lang={lang} />}
      </main>

      <Footer lang={lang} />

      {reportVendor && (
        <ReportView pkg={pkg} vendor={pkg.vendors.find(v => v.id === reportVendor.id) ?? reportVendor} lang={lang} onClose={() => setReportVendor(null)} />
      )}
    </div>
  );
}

function Header({
  lang, onLang, view, onNav,
}: { lang: Lang; onLang: (l: Lang) => void; view: View; onNav: (v: View) => void }) {
  return (
    <header className="bg-primary text-primary-foreground border-b border-primary">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="font-semibold text-base tracking-tight">
              {tr("appName", lang)} <span className="text-primary-foreground/60 font-normal">· {tr("tagline", lang)}</span>
            </div>
            <div className="text-[11px] text-primary-foreground/60">{tr("byWh", lang)}</div>
          </div>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink active={view === "dashboard"} onClick={() => onNav("dashboard")}>{tr("dashboard", lang)}</NavLink>
          <NavLink active={view === "rubric"} onClick={() => onNav("rubric")}>{tr("rubric", lang)}</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded border border-primary-foreground/20 overflow-hidden text-xs">
            <button
              onClick={() => onLang("en")}
              className={`px-2.5 py-1 ${lang === "en" ? "bg-accent text-accent-foreground" : "text-primary-foreground/70 hover:bg-primary-foreground/10"}`}
            >EN</button>
            <button
              onClick={() => onLang("ar")}
              className={`px-2.5 py-1 ${lang === "ar" ? "bg-accent text-accent-foreground" : "text-primary-foreground/70 hover:bg-primary-foreground/10"}`}
              style={{ fontFamily: '"Noto Sans Arabic", sans-serif' }}
            >ع</button>
          </div>
          <div className="h-7 w-7 rounded-full bg-accent text-accent-foreground grid place-items-center text-[11px] font-semibold">FA</div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-sm ${active ? "bg-primary-foreground/10 text-primary-foreground" : "text-primary-foreground/70 hover:bg-primary-foreground/5"}`}
    >
      {children}
    </button>
  );
}

function Logo() {
  return (
    <div className="h-8 w-8 rounded-md bg-accent text-accent-foreground grid place-items-center font-bold text-sm shadow-sm">
      M
    </div>
  );
}

function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur text-xs z-30">
      <div className="max-w-[1400px] mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {tr("footerTrust", lang)}
        </div>
        <div className="chip bg-accent/10 text-accent border-accent/30">
          🇸🇦 {tr("residency", lang)}
        </div>
      </div>
    </footer>
  );
}
