import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { tradeCategories } from "@/data/seed";
import { cn } from "@/lib/utils";

const API = "http://localhost:8787";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface Invitation {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  category?: string;
  note?: string;
  expiresAt?: string;
}

interface UploadedFile {
  file: File;
  docType: string;
  base64: string;
}

interface Profile {
  name: string;
  arabicName: string;
  crNumber: string;
  vatNumber: string;
  city: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  selectedCategories: string[];
}

/* ── Document type config ────────────────────────────────────────────────── */

const DOC_TYPES: { key: string; label: string; required: boolean; hint: string }[] = [
  { key: "Commercial Registration",          label: "Commercial Registration (CR)",       required: true,  hint: "Ministry of Commerce CR certificate" },
  { key: "Contractor Classification",        label: "Contractor Classification Certificate", required: true,  hint: "MOMRA or relevant authority grade" },
  { key: "ZATCA Certificate",                label: "ZATCA Tax Certificate",              required: true,  hint: "Zakat, Tax and Customs Authority certificate" },
  { key: "Audited Financial Statements",     label: "Audited Financial Statements",       required: false, hint: "Last 2 years of audited financials" },
  { key: "ISO Certificates",                 label: "ISO Certificates",                   required: false, hint: "ISO 9001 / 14001 / 45001 if applicable" },
  { key: "Project References",               label: "Project References",                 required: false, hint: "List of similar completed projects" },
];

/* ── Step indicator ──────────────────────────────────────────────────────── */

function StepIndicator({ step, total }: { step: number; total: number }) {
  const labels = ["Company Profile", "Documents", "Review & Submit"];
  return (
    <div className="mb-8 flex items-center gap-0">
      {labels.map((label, i) => {
        const num = i + 1;
        const done = num < step;
        const active = num === step;
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                done   ? "bg-success text-white"
                : active ? "bg-primary text-white"
                : "bg-muted text-muted-foreground",
              )}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : num}
              </div>
              <span className={cn(
                "text-sm font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}>
                {label}
              </span>
            </div>
            {i < total - 1 && <div className="mx-4 h-px w-12 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

/* ── File drop zone ──────────────────────────────────────────────────────── */

function FileDropZone({
  docType,
  label,
  required,
  hint,
  file,
  onFile,
  onRemove,
}: {
  docType: string;
  label: string;
  required: boolean;
  hint: string;
  file: UploadedFile | undefined;
  onFile: (f: UploadedFile) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function readFile(raw: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      onFile({ file: raw, docType, base64 });
    };
    reader.readAsDataURL(raw);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) readFile(f);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) readFile(f);
    e.target.value = "";
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/5 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{file.file.name}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30",
      )}
    >
      <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleInput} />
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

export function VendorRegistrationPage() {
  const { token } = useParams<{ token: string }>();

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile>({
    name: "",
    arabicName: "",
    crNumber: "",
    vatNumber: "",
    city: "",
    country: "Saudi Arabia",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    selectedCategories: [],
  });

  const [uploads, setUploads] = useState<Map<string, UploadedFile>>(new Map());

  /* Load invitation on mount */
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/invitations/token/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Invalid link");
        return data as Invitation;
      })
      .then((inv) => {
        setInvitation(inv);
        setProfile((p) => ({
          ...p,
          name: inv.companyName,
          contactName: inv.contactName,
          contactEmail: inv.contactEmail,
        }));
      })
      .catch((e: Error) => setInviteError(e.message))
      .finally(() => setLoadingInvite(false));
  }, [token]);

  /* ── Profile field helper ── */
  function setField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function toggleCategory(cat: string) {
    setProfile((p) => ({
      ...p,
      selectedCategories: p.selectedCategories.includes(cat)
        ? p.selectedCategories.filter((c) => c !== cat)
        : [...p.selectedCategories, cat],
    }));
  }

  function setUpload(docType: string, f: UploadedFile) {
    setUploads((prev) => new Map(prev).set(docType, f));
  }

  function removeUpload(docType: string) {
    setUploads((prev) => {
      const next = new Map(prev);
      next.delete(docType);
      return next;
    });
  }

  /* ── Step 1 validation ── */
  const step1Valid =
    profile.name.trim() &&
    profile.city.trim() &&
    profile.contactName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.contactEmail);

  /* ── Step 2 validation ── */
  const requiredDocs = DOC_TYPES.filter((d) => d.required).map((d) => d.key);
  const step2Valid = requiredDocs.every((key) => uploads.has(key));

  /* ── Submit ── */
  async function handleSubmit() {
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const documents = Array.from(uploads.values()).map((u) => ({
        fileName: u.file.name,
        mimeType: u.file.type || "application/octet-stream",
        size: u.file.size,
        base64: u.base64,
        suggestedDocumentType: u.docType,
      }));

      const res = await fetch(`${API}/api/registrations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            name: profile.name,
            arabicName: profile.arabicName || undefined,
            crNumber: profile.crNumber || undefined,
            vatNumber: profile.vatNumber || undefined,
            city: profile.city,
            country: profile.country,
            contactName: profile.contactName,
            contactEmail: profile.contactEmail,
            contactPhone: profile.contactPhone || undefined,
            tradeCategories: profile.selectedCategories.length ? profile.selectedCategories : undefined,
          },
          documents,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Loading / error states ── */

  if (loadingInvite) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Validating your invitation…</p>
      </div>
    );
  }

  if (inviteError || !invitation) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive/70" />
        <h1 className="text-lg font-semibold text-foreground">Invalid or expired link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {inviteError ?? "This registration link is no longer valid."}
          {" "}Please contact the procurement team for a new invitation.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success" />
        <h1 className="text-2xl font-bold text-foreground">Registration Submitted</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          Thank you, <strong>{profile.contactName}</strong>. Your pre-qualification package for
          {" "}<strong>{profile.name}</strong> has been received and is under review. You will be
          contacted once the assessment is complete.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          {uploads.size} document{uploads.size !== 1 ? "s" : ""} submitted
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Pre-Qualification Registration
        </p>
        <h1 className="mt-1 text-xl font-bold text-foreground">{invitation.companyName}</h1>
        {(invitation.note ?? invitation.category) && (
          <p className="mt-1 text-sm text-muted-foreground">
            Package: <span className="font-medium text-foreground">{invitation.note ?? invitation.category}</span>
          </p>
        )}
        {invitation.expiresAt && (
          <p className="mt-1 text-xs text-muted-foreground">Link expires: {invitation.expiresAt}</p>
        )}
      </div>

      <StepIndicator step={step} total={3} />

      {/* ── Step 1: Company Profile ── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Company Information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Company Name (English) <span className="text-destructive">*</span>
                </label>
                <input className={inputCls} value={profile.name} onChange={e => setField("name", e.target.value)} placeholder="e.g. Al-Rashid Contracting Co." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Company Name (Arabic)</label>
                <input className={inputCls} dir="rtl" value={profile.arabicName} onChange={e => setField("arabicName", e.target.value)} placeholder="اسم الشركة بالعربية" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">CR Number</label>
                <input className={inputCls} value={profile.crNumber} onChange={e => setField("crNumber", e.target.value)} placeholder="1010XXXXXXX" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">VAT / ZATCA Number</label>
                <input className={inputCls} value={profile.vatNumber} onChange={e => setField("vatNumber", e.target.value)} placeholder="3XXXXXXXXXXXXXXX3" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  City <span className="text-destructive">*</span>
                </label>
                <input className={inputCls} value={profile.city} onChange={e => setField("city", e.target.value)} placeholder="e.g. Riyadh" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Country</label>
                <input className={inputCls} value={profile.country} onChange={e => setField("country", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Contact Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Contact Name <span className="text-destructive">*</span>
                </label>
                <input className={inputCls} value={profile.contactName} onChange={e => setField("contactName", e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Email <span className="text-destructive">*</span>
                </label>
                <input className={inputCls} type="email" value={profile.contactEmail} onChange={e => setField("contactEmail", e.target.value)} placeholder="email@company.com" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Phone</label>
                <input className={inputCls} type="tel" value={profile.contactPhone} onChange={e => setField("contactPhone", e.target.value)} placeholder="+966 5X XXX XXXX" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Trade Categories</h2>
            <p className="text-xs text-muted-foreground">Select all that apply to your company's scope of work.</p>
            <div className="flex flex-wrap gap-2">
              {tradeCategories.map((cat) => {
                const active = profile.selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Documents <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Document Upload ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Upload Documents</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Accepted formats: PDF, DOC, DOCX, PNG, JPG. Fields marked <span className="text-destructive">*</span> are required.
              </p>
            </div>
            <div className="space-y-2">
              {DOC_TYPES.map((dt) => (
                <FileDropZone
                  key={dt.key}
                  docType={dt.key}
                  label={dt.label}
                  required={dt.required}
                  hint={dt.hint}
                  file={uploads.get(dt.key)}
                  onFile={(f) => setUpload(dt.key, f)}
                  onRemove={() => removeUpload(dt.key)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
            <button
              type="button"
              disabled={!step2Valid}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Review & Submit <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Submit ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Review Your Submission</h2>

            <div className="grid gap-2 text-sm">
              {[
                ["Company",   profile.name],
                ["City",      profile.city],
                ["Country",   profile.country],
                ["CR Number", profile.crNumber || "—"],
                ["VAT Number",profile.vatNumber || "—"],
                ["Contact",   profile.contactName],
                ["Email",     profile.contactEmail],
                ["Phone",     profile.contactPhone || "—"],
              ].map(([label, val]) => (
                <div key={label} className="flex gap-3">
                  <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{val}</span>
                </div>
              ))}
              {profile.selectedCategories.length > 0 && (
                <div className="flex gap-3">
                  <span className="w-28 shrink-0 text-muted-foreground">Categories</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.selectedCategories.map(c => (
                      <span key={c} className="chip text-[10px]">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">Documents</h2>
            <div className="space-y-1.5">
              {DOC_TYPES.map((dt) => {
                const up = uploads.get(dt.key);
                return (
                  <div key={dt.key} className="flex items-center gap-3 text-sm">
                    {up
                      ? <CheckCircle2 className="h-4 w-4 text-success" />
                      : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    }
                    <span className={up ? "text-foreground" : "text-muted-foreground"}>
                      {dt.label}
                      {dt.required && !up && <span className="ml-1 text-destructive text-xs">Required</span>}
                    </span>
                    {up && (
                      <span className="ml-auto text-xs text-muted-foreground truncate max-w-[180px]">
                        {up.file.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={() => setStep(2)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              ) : (
                <><FileText className="h-4 w-4" /> Submit Registration</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
