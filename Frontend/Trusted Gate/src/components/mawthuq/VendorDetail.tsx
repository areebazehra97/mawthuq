import { useState } from "react";
import type { Package, Vendor, ExtractedField, RuleResult, Recommendation } from "@/lib/mawthuq-data";
import { runExtraction, scorecardFor } from "@/lib/mawthuq-data";
import type { Lang } from "@/lib/mawthuq-i18n";
import { tr } from "@/lib/mawthuq-i18n";
import { StatusPill, RecBadge, ConfidencePill, LangTag } from "./Pills";
import { CitationDrawer } from "./CitationDrawer";
import { AuditModal } from "./AuditModal";

type Tab = "extraction" | "validation" | "scorecard" | "gaps";

export function VendorDetail({
  pkg,
  vendor,
  lang,
  onBack,
  onUpdate,
  onOpenReport,
}: {
  pkg: Package;
  vendor: Vendor;
  lang: Lang;
  onBack: () => void;
  onUpdate: (v: Vendor) => void;
  onOpenReport: () => void;
}) {
  const [tab, setTab] = useState<Tab>("extraction");
  const [citation, setCitation] = useState<ExtractedField | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [requestModal, setRequestModal] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  };

  const append = (action: string, detail: string, reason?: string) => {
    const next: Vendor = {
      ...vendor,
      auditLog: [
        ...vendor.auditLog,
        {
          id: `a${vendor.auditLog.length + 1}`,
          user: "f.alharbi",
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          action,
          detail,
          reason,
        },
      ],
    };
    onUpdate(next);
    return next;
  };

  const doRunExtraction = async () => {
    setRunning(true);
    const updatedStart: Vendor = { ...vendor, status: "processing" };
    onUpdate(updatedStart);
    try {
      const result = await runExtraction(vendor.id);
      const finalV: Vendor = {
        ...updatedStart,
        ...result,
        status: result.scorecard.hardGateHit ? "rejected" : "ready_for_review",
        decision: result.scorecard.hardGateHit ? "FAIL" : "PENDING",
        auditLog: [
          ...vendor.auditLog,
          { id: `a${vendor.auditLog.length + 1}`, user: "asif.ai", timestamp: new Date().toISOString().slice(0, 16).replace("T", " "), action: "AI extraction complete", detail: `${result.extractedFields.length} fields extracted.` },
          { id: `a${vendor.auditLog.length + 2}`, user: "system", timestamp: new Date().toISOString().slice(0, 16).replace("T", " "), action: "Deterministic validation run", detail: result.scorecard.hardGateHit ? "Hard gate triggered." : `${result.ruleResults.filter(r => !r.pass).length} non-gate failures.` },
        ],
      };
      onUpdate(finalV);
      setRunning(false);
    } catch (e) {
      setRunning(false);
      showToast("Extraction failed");
    }
  };

  const editField = (f: ExtractedField) => {
    const newValue = window.prompt(tr("newValuePrompt", lang), f.value);
    if (!newValue || newValue === f.value) return;
    const reason = window.prompt(tr("overrideReasonPrompt", lang), "");
    if (!reason) return;
    const fields = vendor.extractedFields.map((x) =>
      x.key === f.key ? { ...x, value: newValue, overridden: true, confidence: "High" as const } : x,
    );
    // re-derive current_ratio rule if applicable
    const rules = vendor.ruleResults.map((r) => {
      if (f.key === "current_ratio" && r.id === "r6") {
        const num = parseFloat(newValue);
        const pass = !isNaN(num) && num >= 1.0;
        return { ...r, actual: newValue, pass, severity: pass ? "info" as const : "warn" as const };
      }
      return r;
    });
    // Rebuild scorecard if current_ratio changed
    let scorecard = vendor.scorecard;
    if (f.key === "current_ratio") {
      const dims = vendor.scorecard.dimensions.map((d) => {
        if (d.name === "Financial") {
          const num = parseFloat(newValue);
          const newScore = !isNaN(num) && num >= 1.0 ? 85 : 60;
          return { ...d, score: newScore };
        }
        return d;
      });
      scorecard = scorecardFor(rules, dims);
    }
    const next: Vendor = { ...vendor, extractedFields: fields, ruleResults: rules, scorecard };
    onUpdate(next);
    append("Field override", `${f.label}: "${f.value}" → "${newValue}"`, reason);
  };

  const toggleRule = (r: RuleResult) => {
    const reason = window.prompt(tr("overrideReasonPrompt", lang), "");
    if (!reason) return;
    const rules = vendor.ruleResults.map((x) => (x.id === r.id ? { ...x, pass: !x.pass, overridden: true } : x));
    const scorecard = scorecardFor(rules, vendor.scorecard.dimensions);
    onUpdate({ ...vendor, ruleResults: rules, scorecard });
    append("Rule override", `${r.label}: ${r.pass ? "PASS" : "FAIL"} → ${!r.pass ? "PASS" : "FAIL"}`, reason);
  };

  const setDecision = (rec: Recommendation) => {
    if (rec === "CONDITIONAL") {
      const cond = window.prompt(tr("conditionsPrompt", lang), "Parent-company guarantee covering liquidity shortfall.");
      if (!cond) return;
      const conditions = cond.split("\n").map((s) => s.trim()).filter(Boolean);
      const next: Vendor = { ...vendor, decision: "CONDITIONAL", status: "conditional", conditions };
      onUpdate(next);
      append("Decision: CONDITIONAL", `Conditions: ${conditions.join("; ")}`);
      return;
    }
    if (rec === "FAIL") {
      const reason = window.prompt(tr("rejectReasonPrompt", lang), "");
      if (!reason) return;
      onUpdate({ ...vendor, decision: "FAIL", status: "rejected" });
      append("Decision: REJECTED", reason, reason);
      return;
    }
    if (rec === "PASS") {
      onUpdate({ ...vendor, decision: "PASS", status: "approved" });
      append("Decision: APPROVED", `Weighted score ${vendor.scorecard.total}.`);
    }
  };

  const completeness = Math.round(
    (vendor.documents.filter((d) => d.status === "present").length / vendor.documents.length) * 100,
  );

  const hasExtraction = vendor.extractedFields.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-accent hover:underline">{tr("back", lang)}</button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAudit(true)} className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted">
            {tr("auditTrail", lang)}
          </button>
          <button onClick={onOpenReport} className="text-xs px-3 py-1.5 rounded border border-border bg-primary text-primary-foreground hover:opacity-90">
            {tr("exportReport", lang)}
          </button>
          <button
            onClick={() => showToast(lang === "ar" ? "تم الإرسال لتحليل العطاءات" : "Sent to Bid Analysis")}
            className="text-xs px-3 py-1.5 rounded border border-border bg-card hover:bg-muted"
            title="v2 — stub"
          >
            {tr("sendToBid", lang)} <span className="ms-1 chip">{tr("v2Stub", lang)}</span>
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">{tr("vendor", lang)}</div>
            <h1 className="text-2xl font-semibold mt-1">{vendor.name}</h1>
            <div className="text-base text-muted-foreground" dir="rtl">{vendor.nameAr}</div>
            <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              <StatusPill status={vendor.status} lang={lang} />
              <span>·</span>
              <span>{pkg.name}</span>
              <span>·</span>
              <span className="tabular">{pkg.valueBand}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-end">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{tr("weightedScore", lang)}</div>
              <div className="text-3xl font-bold tabular">{vendor.scorecard.total || "—"}</div>
            </div>
            <div className="text-end">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{tr("recommendation", lang)}</div>
              <div className="mt-1"><RecBadge rec={vendor.decision !== "PENDING" ? vendor.decision : vendor.scorecard.recommendation} lang={lang} /></div>
            </div>
          </div>
        </div>

        {vendor.scorecard.hardGateHit && (
          <div className="mt-4 rounded border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 text-sm font-medium flex items-center gap-2">
            <span className="font-bold">■ {tr("hardGate", lang)}</span>
            <span>·</span>
            <span>{tr("hardGateBanner", lang)}</span>
          </div>
        )}
      </section>

      {/* 3-column layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: documents */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">{tr("documents", lang)}</h3>
              <span className="text-xs text-muted-foreground tabular">{vendor.documents.filter(d => d.status === "present").length}/{vendor.documents.length}</span>
            </header>
            <ul className="divide-y divide-border">
              {vendor.documents.map((d) => (
                <li key={d.id} className="px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm">
                      <div className={d.status === "missing" ? "text-muted-foreground line-through" : ""}>{d.type}</div>
                      {d.typeAr && <div className="text-[11px] text-muted-foreground" dir="rtl">{d.typeAr}</div>}
                    </div>
                    <DocStatus status={d.status} lang={lang} />
                  </div>
                  {d.status === "present" && (
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <LangTag l={d.language} />
                      <span className="tabular">{d.pages} {tr("pages", lang)}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 border-t border-border bg-surface-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{tr("completeness", lang)}</span>
                <span className="tabular font-semibold">{completeness}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${completeness}%` }} />
              </div>
              <button
                onClick={() => setRequestModal(true)}
                className="mt-3 w-full text-xs px-3 py-1.5 rounded border border-border bg-card hover:bg-muted"
              >
                {tr("requestMissing", lang)}
              </button>
            </div>
          </div>

          {!hasExtraction && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-medium">{tr("extraction", lang)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {lang === "ar" ? "لم يتم تشغيل الاستخراج بعد." : "Extraction has not been run yet."}
              </p>
              <button
                onClick={doRunExtraction}
                disabled={running}
                className="mt-3 w-full text-sm px-3 py-2 rounded bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-60"
              >
                {running ? tr("processing", lang) : tr("runExtraction", lang)}
              </button>
              {running && (
                <div className="mt-2 h-1 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-info animate-pulse w-1/2" />
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Center: tabs */}
        <main className="col-span-12 lg:col-span-6">
          <div className="rounded-lg border border-border bg-card">
            <nav className="flex border-b border-border text-sm">
              {(["extraction", "validation", "scorecard", "gaps"] as Tab[]).map((tk) => (
                <button
                  key={tk}
                  onClick={() => setTab(tk)}
                  className={`px-4 py-3 -mb-px border-b-2 ${tab === tk ? "border-accent text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  {tr(tk === "extraction" ? "extraction" : tk === "validation" ? "validation" : tk === "scorecard" ? "scorecard" : "gaps", lang)}
                </button>
              ))}
            </nav>
            <div className="p-5">
              {!hasExtraction ? (
                <div className="text-sm text-muted-foreground py-10 text-center">
                  {lang === "ar" ? "شغّل الاستخراج لرؤية الأدلة والقواعد والنتيجة." : "Run extraction to populate evidence, rules and score."}
                </div>
              ) : (
                <>
                  {tab === "extraction" && (
                    <ExtractionTab v={vendor} lang={lang} onCite={setCitation} onEdit={editField} />
                  )}
                  {tab === "validation" && (
                    <ValidationTab v={vendor} lang={lang} onOverride={toggleRule} />
                  )}
                  {tab === "scorecard" && (
                    <ScorecardTab v={vendor} lang={lang} />
                  )}
                  {tab === "gaps" && (
                    <GapsTab v={vendor} lang={lang} onCite={setCitation} />
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        {/* Right: decision panel */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-1">{tr("decision", lang)}</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {lang === "ar" ? "القرار النهائي للمراجع البشري." : "Final call rests with the human reviewer."}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setDecision("PASS")}
                disabled={!hasExtraction || vendor.scorecard.hardGateHit}
                className="w-full text-sm px-3 py-2 rounded bg-success text-success-foreground hover:opacity-90 disabled:opacity-40"
              >
                {tr("approve", lang)}
              </button>
              <button
                onClick={() => setDecision("CONDITIONAL")}
                disabled={!hasExtraction || vendor.scorecard.hardGateHit}
                className="w-full text-sm px-3 py-2 rounded bg-warning text-warning-foreground hover:opacity-90 disabled:opacity-40"
              >
                {tr("conditional", lang)}
              </button>
              <button
                onClick={() => setDecision("FAIL")}
                disabled={!hasExtraction}
                className="w-full text-sm px-3 py-2 rounded bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-40"
              >
                {tr("reject", lang)}
              </button>
            </div>
            {vendor.decision !== "PENDING" && (
              <div className="mt-4 text-xs">
                <div className="text-muted-foreground">Current decision</div>
                <div className="mt-1"><RecBadge rec={vendor.decision} lang={lang} /></div>
                {vendor.conditions && vendor.conditions.length > 0 && (
                  <ul className="mt-2 list-disc ms-4 space-y-0.5 text-muted-foreground">
                    {vendor.conditions.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Drawer + modals */}
      <CitationDrawer field={citation} lang={lang} onClose={() => setCitation(null)} />
      {showAudit && (
        <AuditModal vendor={vendor} lang={lang} onClose={() => setShowAudit(false)} onExport={() => { setShowAudit(false); onOpenReport(); }} />
      )}
      {requestModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setRequestModal(false)}>
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-sm mb-2">{tr("requestMissing", lang)}</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {lang === "ar" ? "سيتم إرسال طلب رسمي للمورد بالمستندات الناقصة:" : "A formal request will be sent to the vendor for the missing documents:"}
            </p>
            <ul className="text-sm list-disc ms-5 mb-4">
              {vendor.documents.filter(d => d.status !== "present").map((d) => (
                <li key={d.id}>{d.type}</li>
              ))}
              {vendor.documents.every(d => d.status === "present") && <li className="list-none text-muted-foreground">None — file complete.</li>}
            </ul>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRequestModal(false)} className="text-xs px-3 py-1.5 rounded border border-border">{tr("close", lang)}</button>
              <button
                onClick={() => { setRequestModal(false); showToast(lang === "ar" ? "تم إرسال الطلب" : "Request sent"); append("Requested missing docs", vendor.documents.filter(d => d.status !== "present").map(d => d.type).join(", ")); }}
                className="text-xs px-3 py-1.5 rounded bg-accent text-accent-foreground"
              >
                {lang === "ar" ? "إرسال" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground text-sm px-4 py-2 rounded shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function DocStatus({ status, lang }: { status: "present" | "missing" | "expired"; lang: Lang }) {
  if (status === "present") return <span className="chip bg-success/10 text-success border-success/30">{tr("present", lang)}</span>;
  if (status === "expired") return <span className="chip bg-destructive/10 text-destructive border-destructive/30">{tr("expired", lang)}</span>;
  return <span className="chip bg-destructive/10 text-destructive border-destructive/30">{tr("missing", lang)}</span>;
}

function ExtractionTab({ v, lang, onCite, onEdit }: { v: Vendor; lang: Lang; onCite: (f: ExtractedField) => void; onEdit: (f: ExtractedField) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">
        {lang === "ar"
          ? "كل قيمة مستخرجة بواسطة الذكاء الاصطناعي مع رابط للمصدر ومستوى ثقة."
          : "Every value below was extracted by the AI from a specific document page and shows its confidence."}
      </p>
      <ul className="divide-y divide-border border border-border rounded-md overflow-hidden">
        {v.extractedFields.map((f) => (
          <li key={f.key} className={`p-3 ${f.confidence === "Low" ? "bg-warning/5" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {lang === "ar" && f.labelAr ? f.labelAr : f.label}
                </div>
                <div className="text-sm font-medium tabular mt-0.5">
                  {lang === "ar" && f.valueAr ? f.valueAr : f.value}
                  {f.overridden && <span className="ms-2 text-[10px] text-warning">overridden</span>}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <button onClick={() => onCite(f)} className="text-info hover:underline">
                    {tr("viewSource", lang)} · {f.sourceDoc}, p.{f.sourcePage}
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <ConfidencePill c={f.confidence} />
                {f.confidence === "Low" && (
                  <span className="chip bg-warning/20 text-warning-foreground border-warning/40">{tr("reviewSuggested", lang)}</span>
                )}
                <button onClick={() => onEdit(f)} className="text-[11px] text-muted-foreground hover:text-foreground hover:underline">
                  {tr("override", lang)}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ValidationTab({ v, lang, onOverride }: { v: Vendor; lang: Lang; onOverride: (r: RuleResult) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">
          {lang === "ar"
            ? "قواعد حتمية تُقارن القيم المستخرجة بالحدود المطلوبة. ليست استدلال ذكاء اصطناعي."
            : "Deterministic rules compare extracted values to thresholds. No AI reasoning involved."}
        </p>
        <span className="chip bg-info/10 text-info border-info/30">{tr("deterministic", lang)}</span>
      </div>
      <table className="w-full text-sm border border-border rounded-md overflow-hidden">
        <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-start p-2 font-medium">Rule</th>
            <th className="text-start p-2 font-medium">{tr("threshold", lang)}</th>
            <th className="text-start p-2 font-medium">{tr("actual", lang)}</th>
            <th className="text-end p-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {v.ruleResults.map((r) => (
            <tr key={r.id} className={`border-t border-border ${r.isHardGate && !r.pass ? "bg-destructive/10" : ""}`}>
              <td className="p-2">
                <div>{r.label}</div>
                <div className="text-[11px] text-muted-foreground">{r.dimension}</div>
                {r.isHardGate && (
                  <span className="mt-1 inline-block chip bg-destructive/15 text-destructive border-destructive/40 font-semibold">
                    {tr("hardGate", lang)}
                  </span>
                )}
              </td>
              <td className="p-2 tabular text-muted-foreground">{r.threshold}</td>
              <td className="p-2 tabular">{r.actual}</td>
              <td className="p-2 text-end">
                <div className="flex flex-col items-end gap-1">
                  <span className={`status-pill ${r.pass ? "bg-success/15 text-success border-success/40" : "bg-destructive/10 text-destructive border-destructive/40"}`}>
                    {r.pass ? tr("pass", lang) : tr("fail", lang)}
                  </span>
                  {r.sourceDoc && <span className="text-[10px] text-muted-foreground">{r.sourceDoc}, p.{r.sourcePage}</span>}
                  <button onClick={() => onOverride(r)} className="text-[10px] text-muted-foreground hover:underline">{tr("override", lang)}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScorecardTab({ v, lang }: { v: Vendor; lang: Lang }) {
  return (
    <div className="space-y-4">
      {v.scorecard.hardGateHit && (
        <div className="rounded border border-destructive/50 bg-destructive/10 text-destructive px-3 py-2 text-sm font-medium">
          ■ {tr("hardGateBanner", lang)}
        </div>
      )}
      <ul className="space-y-3">
        {v.scorecard.dimensions.map((d) => (
          <li key={d.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <div>
                <div className="font-medium">{lang === "ar" ? d.nameAr : d.name}</div>
                <div className="text-[11px] text-muted-foreground">weight {d.weight}%</div>
              </div>
              <div className="tabular font-semibold">{d.score}</div>
            </div>
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div className={`h-full ${d.score >= 80 ? "bg-success" : d.score >= 60 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${d.score}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="rounded-md border border-border bg-surface-2 p-4">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-sm font-semibold">{tr("weightedScore", lang)}</div>
          <div className="text-2xl font-bold tabular">{v.scorecard.total}</div>
        </div>
        <RecBadge rec={v.scorecard.recommendation} lang={lang} />
        <p className="text-sm mt-3 text-muted-foreground">{v.scorecard.rationale}</p>
      </div>
    </div>
  );
}

function GapsTab({ v, lang, onCite }: { v: Vendor; lang: Lang; onCite: (f: ExtractedField) => void }) {
  const items: { severity: "fail" | "warn" | "info"; title: string; detail: string; field?: ExtractedField }[] = [];
  v.ruleResults.filter((r) => !r.pass).forEach((r) => {
    items.push({
      severity: r.isHardGate ? "fail" : "warn",
      title: `${r.label} — ${r.actual} (need ${r.threshold})`,
      detail: r.sourceDoc ? `${r.dimension} · cited from ${r.sourceDoc}, p.${r.sourcePage}` : r.dimension,
    });
  });
  v.documents.filter((d) => d.status !== "present").forEach((d) => {
    items.push({ severity: "warn", title: `Missing document — ${d.type}`, detail: "Required by KSA-Standard rubric." });
  });
  v.extractedFields.filter((f) => f.confidence === "Low").forEach((f) => {
    items.push({ severity: "warn", title: `Low confidence — ${f.label}`, detail: `Cited ${f.sourceDoc}, p.${f.sourcePage}. Review snippet before relying on value.`, field: f });
  });
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No open gaps or risks.</p>;
  const order = { fail: 0, warn: 1, info: 2 };
  items.sort((a, b) => order[a.severity] - order[b.severity]);
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className={`rounded border p-3 text-sm ${it.severity === "fail" ? "bg-destructive/10 border-destructive/40" : "bg-warning/10 border-warning/40"}`}>
          <div className="font-medium">{it.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{it.detail}</div>
          {it.field && (
            <button onClick={() => onCite(it.field!)} className="mt-1 text-xs text-info hover:underline">{tr("viewSource", lang)}</button>
          )}
        </li>
      ))}
    </ul>
  );
}
