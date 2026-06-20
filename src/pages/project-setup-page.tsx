import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { reviewerRoles, supportedDocumentTypes } from "@/data/seed";
import { useProjects } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectCategory, ProjectConfig, ProjectStatus, ReviewerRole } from "@/types";

/* ── Types ─────────────────────────────────────────── */

interface FormState {
  name: string;
  arabicName: string;
  location: string;
  packageName: string;
  workCategory: string;
  packageValueBand: string;
  status: ProjectStatus;
  scope: string;
  timeline: string;
  registrationDeadline: string;
  reviewers: ReviewerRole[];
  requiredExperience: string[];
  requiredCertifications: string[];
  categories: ProjectCategory[];
  scoringWeights: { compliance: number; financial: number; technical: number; hse: number; localization: number };
  decisionThresholds: { pass: number; conditionalMin: number; conditionalMax: number };
  hardGateRules: string[];
}

type Tab = "basics" | "categories" | "requirements" | "scoring";

const VALUE_BANDS = ["SAR 50M – SAR 100M", "SAR 100M – SAR 250M", "SAR 250M – SAR 1B", "SAR 1B+"];
const STATUSES: ProjectStatus[] = ["Active", "Tendering", "Planning", "Closed"];
const DIMENSIONS = ["compliance", "financial", "technical", "hse", "localization"] as const;
const DIMENSION_LABELS: Record<typeof DIMENSIONS[number], string> = {
  compliance: "Compliance", financial: "Financial", technical: "Technical",
  hse: "HSE", localization: "Localization",
};

const DEFAULT_FORM: FormState = {
  name: "", arabicName: "", location: "", packageName: "",
  workCategory: "", packageValueBand: "SAR 250M – SAR 1B", status: "Planning",
  scope: "", timeline: "", registrationDeadline: "",
  reviewers: [], requiredExperience: [], requiredCertifications: [],
  categories: [],
  scoringWeights: { compliance: 35, financial: 25, technical: 20, hse: 10, localization: 10 },
  decisionThresholds: { pass: 80, conditionalMin: 60, conditionalMax: 79 },
  hardGateRules: ["Commercial Registration must be valid on review date"],
};

/* ── Page ───────────────────────────────────────────── */

export function ProjectSetupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projects, addProject, updateProject } = useProjects();

  const editId = searchParams.get("id");
  const editProject = editId ? projects.find((p) => p.id === editId) : null;
  const isEdit = !!editProject;

  const [activeTab, setActiveTab] = useState<Tab>("basics");
  const [form, setForm] = useState<FormState>(() => {
    if (editProject) {
      return {
        name: editProject.name,
        arabicName: editProject.arabicName,
        location: editProject.location,
        packageName: editProject.packageName,
        workCategory: editProject.workCategory,
        packageValueBand: editProject.packageValueBand,
        status: editProject.status,
        scope: editProject.scope ?? "",
        timeline: editProject.timeline ?? "",
        registrationDeadline: editProject.registrationDeadline ?? "",
        reviewers: editProject.reviewers ?? [],
        requiredExperience: editProject.requiredExperience ?? [],
        requiredCertifications: editProject.requiredCertifications ?? [],
        categories: editProject.config?.categories ?? [],
        scoringWeights: editProject.config?.scoringWeights ?? DEFAULT_FORM.scoringWeights,
        decisionThresholds: editProject.config?.decisionThresholds ?? DEFAULT_FORM.decisionThresholds,
        hardGateRules: editProject.config?.hardGateRules ?? DEFAULT_FORM.hardGateRules,
      };
    }
    return { ...DEFAULT_FORM };
  });
  const [newRule, setNewRule] = useState("");
  const [newExperience, setNewExperience] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    setForm((f) => ({
      ...f,
      categories: f.categories.length > 0 ? f.categories : [],
    }));
  }, []);

  const weightsTotal = Object.values(form.scoringWeights).reduce((s, v) => s + v, 0);

  /* ── Category helpers ── */
  function addCategory() {
    setForm((f) => ({
      ...f,
      categories: [...f.categories, { name: "", subCategories: [], requiredDocuments: [] }],
    }));
  }

  function removeCategory(idx: number) {
    setForm((f) => ({ ...f, categories: f.categories.filter((_, i) => i !== idx) }));
  }

  function updateCategory(idx: number, patch: Partial<ProjectCategory>) {
    setForm((f) => ({
      ...f,
      categories: f.categories.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  }

  function toggleDocument(catIdx: number, doc: string) {
    const cat = form.categories[catIdx];
    const has = cat.requiredDocuments.includes(doc);
    updateCategory(catIdx, {
      requiredDocuments: has
        ? cat.requiredDocuments.filter((d) => d !== doc)
        : [...cat.requiredDocuments, doc],
    });
  }

  /* ── Reviewer helpers ── */
  function toggleReviewer(role: ReviewerRole) {
    setForm((f) => ({
      ...f,
      reviewers: f.reviewers.includes(role)
        ? f.reviewers.filter((r) => r !== role)
        : [...f.reviewers, role],
    }));
  }

  /* ── Dynamic list helpers ── */
  function addExperience() {
    if (!newExperience.trim()) return;
    setForm((f) => ({ ...f, requiredExperience: [...f.requiredExperience, newExperience.trim()] }));
    setNewExperience("");
  }

  function removeExperience(idx: number) {
    setForm((f) => ({ ...f, requiredExperience: f.requiredExperience.filter((_, i) => i !== idx) }));
  }

  function addCertification() {
    if (!newCertification.trim()) return;
    setForm((f) => ({ ...f, requiredCertifications: [...f.requiredCertifications, newCertification.trim()] }));
    setNewCertification("");
  }

  function removeCertification(idx: number) {
    setForm((f) => ({ ...f, requiredCertifications: f.requiredCertifications.filter((_, i) => i !== idx) }));
  }

  /* ── Scoring helpers ── */
  function setWeight(dim: typeof DIMENSIONS[number], val: number) {
    setForm((f) => ({ ...f, scoringWeights: { ...f.scoringWeights, [dim]: val } }));
  }

  /* ── Hard gate helpers ── */
  function addRule() {
    if (!newRule.trim()) return;
    setForm((f) => ({ ...f, hardGateRules: [...f.hardGateRules, newRule.trim()] }));
    setNewRule("");
  }

  function removeRule(idx: number) {
    setForm((f) => ({ ...f, hardGateRules: f.hardGateRules.filter((_, i) => i !== idx) }));
  }

  /* ── Save ── */
  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "Project name is required.";
    if (!form.packageName.trim()) errs.packageName = "Package name is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) { setActiveTab("basics"); return; }

    const config: ProjectConfig = {
      categories: form.categories,
      scoringWeights: form.scoringWeights,
      decisionThresholds: form.decisionThresholds,
      hardGateRules: form.hardGateRules,
    };

    const sharedFields = {
      name: form.name,
      arabicName: form.arabicName,
      location: form.location,
      packageName: form.packageName,
      workCategory: form.workCategory,
      packageValueBand: form.packageValueBand,
      status: form.status,
      scope: form.scope || undefined,
      timeline: form.timeline || undefined,
      registrationDeadline: form.registrationDeadline || undefined,
      reviewers: form.reviewers.length > 0 ? form.reviewers : undefined,
      requiredExperience: form.requiredExperience.length > 0 ? form.requiredExperience : undefined,
      requiredCertifications: form.requiredCertifications.length > 0 ? form.requiredCertifications : undefined,
      categories: form.categories.map((c) => c.name).filter(Boolean),
      config,
    };

    if (isEdit && editId) {
      updateProject(editId, sharedFields);
      toast.success(`Project updated: ${form.name}`);
    } else {
      addProject({
        id: `proj-${Date.now()}`,
        ...sharedFields,
        submittedCount: 0,
        totalInvited: 0,
      });
      toast.success(`Project created: ${form.name}`);
    }
    void navigate("/vendor-intake");
  }

  /* ── Render ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <h1 className="text-2xl font-semibold text-foreground">
          {isEdit ? "Edit Project" : "New Project"}
        </h1>
        {isEdit && (
          <p className="mt-0.5 text-sm text-muted-foreground">{editProject?.name}</p>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(["basics", "categories", "requirements", "scoring"] as Tab[]).map((tab) => {
          const labels: Record<Tab, string> = {
            basics: "Basics",
            categories: `Categories & Documents${form.categories.length > 0 ? ` (${form.categories.length})` : ""}`,
            requirements: "Requirements",
            scoring: "Scoring Criteria",
          };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Basics tab ── */}
      {activeTab === "basics" && (
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Project Name" required error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. North Riyadh Integrated Development"
                  className={inputCls(!!errors.name)}
                />
              </Field>

              <Field label="Arabic Name">
                <input
                  type="text"
                  value={form.arabicName}
                  onChange={(e) => setForm((f) => ({ ...f, arabicName: e.target.value }))}
                  placeholder="اسم المشروع بالعربية"
                  dir="rtl"
                  className={inputCls()}
                  style={{ fontFamily: '"Noto Sans Arabic", sans-serif' }}
                />
              </Field>

              <Field label="Location">
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Riyadh, KSA"
                  className={inputCls()}
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
                  className={inputCls()}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Package Name" required error={errors.packageName} className="sm:col-span-2">
                <input
                  type="text"
                  value={form.packageName}
                  onChange={(e) => setForm((f) => ({ ...f, packageName: e.target.value }))}
                  placeholder="e.g. Main Works Prequalification Package"
                  className={inputCls(!!errors.packageName)}
                />
              </Field>

              <Field label="Trade Category">
                <input
                  type="text"
                  value={form.workCategory}
                  onChange={(e) => setForm((f) => ({ ...f, workCategory: e.target.value }))}
                  placeholder="e.g. Building & Civil Works"
                  className={inputCls()}
                />
              </Field>

              <Field label="Estimated Value">
                <select
                  value={form.packageValueBand}
                  onChange={(e) => setForm((f) => ({ ...f, packageValueBand: e.target.value }))}
                  className={inputCls()}
                >
                  {VALUE_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>

              <Field label="Scope" className="sm:col-span-2">
                <textarea
                  value={form.scope}
                  onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                  placeholder="Describe the project scope — works included, site boundaries, key deliverables…"
                  rows={3}
                  className={cn(inputCls(), "resize-none")}
                />
              </Field>

              <Field label="Timeline">
                <input
                  type="text"
                  value={form.timeline}
                  onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                  placeholder="e.g. Q4 2026 – Q3 2028"
                  className={inputCls()}
                />
              </Field>

              <Field label="Registration Deadline">
                <input
                  type="date"
                  value={form.registrationDeadline}
                  onChange={(e) => setForm((f) => ({ ...f, registrationDeadline: e.target.value }))}
                  className={inputCls()}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Categories & Documents tab ── */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          {form.categories.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-12 text-center">
              <p className="text-sm text-muted-foreground">No categories yet. Add a trade category to get started.</p>
            </div>
          )}

          {form.categories.map((cat, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => updateCategory(idx, { name: e.target.value })}
                    placeholder="Category name (e.g. General Contracting)"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(idx)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Sub-categories">
                  <input
                    type="text"
                    value={cat.subCategories.join(", ")}
                    onChange={(e) =>
                      updateCategory(idx, {
                        subCategories: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Comma-separated, e.g. Civil Works, Building Construction"
                    className={inputCls()}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Separate with commas</p>
                </Field>

                <Field label="Required Documents">
                  <div className="mt-1 flex flex-wrap gap-2">
                    {supportedDocumentTypes.map((doc) => {
                      const selected = cat.requiredDocuments.includes(doc);
                      return (
                        <button
                          key={doc}
                          type="button"
                          onClick={() => toggleDocument(idx, doc)}
                          className={cn(
                            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          )}
                        >
                          {doc}
                        </button>
                      );
                    })}
                  </div>
                  {cat.requiredDocuments.length > 0 && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {cat.requiredDocuments.length} document type{cat.requiredDocuments.length !== 1 ? "s" : ""} required
                    </p>
                  )}
                </Field>
              </CardContent>
            </Card>
          ))}

          <button
            type="button"
            onClick={addCategory}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/[0.03] px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/[0.06]"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      )}

      {/* ── Requirements tab ── */}
      {activeTab === "requirements" && (
        <div className="space-y-5">
          {/* Reviewers */}
          <Card>
            <CardHeader>
              <CardTitle>Reviewers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Select the reviewer roles assigned to evaluate vendor applications for this project.
              </p>
              <div className="flex flex-wrap gap-2">
                {reviewerRoles.map((role) => {
                  const selected = form.reviewers.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleReviewer(role)}
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
              {form.reviewers.length > 0 && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {form.reviewers.length} reviewer{form.reviewers.length !== 1 ? "s" : ""} assigned
                </p>
              )}
            </CardContent>
          </Card>

          {/* Required Experience */}
          <Card>
            <CardHeader>
              <CardTitle>Required Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Define the minimum experience criteria vendors must meet to qualify.
              </p>
              {form.requiredExperience.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3">
                  <p className="flex-1 text-xs leading-5 text-foreground">{item}</p>
                  <button
                    type="button"
                    onClick={() => removeExperience(idx)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExperience}
                  onChange={(e) => setNewExperience(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addExperience()}
                  placeholder="e.g. Minimum 10 years in KSA construction market…"
                  className={cn(inputCls(), "flex-1")}
                />
                <Button type="button" onClick={addExperience} variant="outline" className="shrink-0">
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Required Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Required Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                List the mandatory certifications vendors must hold to be considered.
              </p>
              {form.requiredCertifications.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3">
                  <p className="flex-1 text-xs leading-5 text-foreground">{item}</p>
                  <button
                    type="button"
                    onClick={() => removeCertification(idx)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCertification()}
                  placeholder="e.g. ISO 9001:2015 Quality Management System…"
                  className={cn(inputCls(), "flex-1")}
                />
                <Button type="button" onClick={addCertification} variant="outline" className="shrink-0">
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Scoring Criteria tab ── */}
      {activeTab === "scoring" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Dimension weights */}
          <Card>
            <CardHeader>
              <CardTitle>AI Scoring Weights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Set the relative importance of each evaluation dimension. Weights must total 100%.
              </p>
              {DIMENSIONS.map((dim) => (
                <div key={dim}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <label className="font-medium text-foreground">{DIMENSION_LABELS[dim]}</label>
                    <span className="tabular-nums text-muted-foreground">{form.scoringWeights[dim]}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={form.scoringWeights[dim]}
                    onChange={(e) => setWeight(dim, Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              ))}
              <div className={cn(
                "mt-2 rounded-lg border px-3 py-2 text-xs font-medium",
                weightsTotal === 100
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-warning/40 bg-warning/10 text-warning-foreground",
              )}>
                Total: {weightsTotal}% {weightsTotal !== 100 && "— must equal 100%"}
              </div>
            </CardContent>
          </Card>

          {/* Thresholds + hard gates */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Decision Thresholds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Field label="PASS threshold (≥)">
                    <input
                      type="number"
                      min={0} max={100}
                      value={form.decisionThresholds.pass}
                      onChange={(e) => setForm((f) => ({ ...f, decisionThresholds: { ...f.decisionThresholds, pass: Number(e.target.value) } }))}
                      className={inputCls()}
                    />
                  </Field>
                  <Field label="Conditional min (≥)">
                    <input
                      type="number"
                      min={0} max={100}
                      value={form.decisionThresholds.conditionalMin}
                      onChange={(e) => setForm((f) => ({ ...f, decisionThresholds: { ...f.decisionThresholds, conditionalMin: Number(e.target.value) } }))}
                      className={inputCls()}
                    />
                  </Field>
                  <Field label="Conditional max (<)">
                    <input
                      type="number"
                      min={0} max={100}
                      value={form.decisionThresholds.conditionalMax}
                      onChange={(e) => setForm((f) => ({ ...f, decisionThresholds: { ...f.decisionThresholds, conditionalMax: Number(e.target.value) } }))}
                      className={inputCls()}
                    />
                  </Field>
                </div>

                {/* Live preview */}
                <div className="mt-4 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Decision bands</p>
                  <div className="flex h-5 w-full overflow-hidden rounded-full">
                    <div className="bg-destructive/70 flex items-center justify-center text-[10px] text-white font-medium" style={{ width: `${form.decisionThresholds.conditionalMin}%` }}>
                      {form.decisionThresholds.conditionalMin > 12 ? "FAIL" : ""}
                    </div>
                    <div className="bg-warning flex items-center justify-center text-[10px] text-white font-medium" style={{ width: `${form.decisionThresholds.pass - form.decisionThresholds.conditionalMin}%` }}>
                      {(form.decisionThresholds.pass - form.decisionThresholds.conditionalMin) > 12 ? "COND." : ""}
                    </div>
                    <div className="flex-1 bg-success flex items-center justify-center text-[10px] text-white font-medium">
                      PASS
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                    <span>0</span>
                    <span>{form.decisionThresholds.conditionalMin}</span>
                    <span>{form.decisionThresholds.pass}</span>
                    <span>100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hard Gate Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Rules that automatically disqualify a vendor regardless of score.
                </p>
                {form.hardGateRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3">
                    <p className="flex-1 text-xs leading-5 text-foreground">{rule}</p>
                    <button
                      type="button"
                      onClick={() => removeRule(idx)}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRule()}
                    placeholder="Add a hard gate rule…"
                    className={cn(inputCls(), "flex-1")}
                  />
                  <Button type="button" onClick={addRule} variant="outline" className="shrink-0">
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          Cancel
        </button>
        <Button
          type="button"
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isEdit ? "Save Changes" : "Create Project"}
        </Button>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────── */

function Field({
  label, required, error, children, className,
}: {
  label: string; required?: boolean; error?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputCls = (hasError = false) =>
  cn(
    "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring/20",
    hasError ? "border-destructive focus:border-destructive" : "border-border focus:border-ring",
  );
