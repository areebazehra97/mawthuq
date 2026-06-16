import { useMemo, useState } from "react";
import { Eye, FilePlus2, Trash2, UploadCloud } from "lucide-react";
import { seededVendorDocuments, supportedDocumentTypes } from "@/data/seed";
import { DocumentStatusBadge } from "@/components/document-status-badge";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoVendors } from "@/hooks/use-demo-vendors";
import { useVendorDocuments } from "@/hooks/use-vendor-documents";
import type { DocumentLanguage, DocumentStatus, VendorDocument } from "@/types";

export function VendorIntakePage() {
  const { vendors } = useDemoVendors();
  const { documents, setDocuments } = useVendorDocuments();
  const [activeVendorId, setActiveVendorId] = useState<string>(vendors[0]?.id ?? "");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const activeVendor = vendors.find((vendor) => vendor.id === activeVendorId) ?? vendors[0];
  const vendorDocuments = useMemo(
    () => documents.filter((document) => document.vendorId === activeVendorId),
    [documents, activeVendorId],
  );
  const selectedDocument =
    vendorDocuments.find((document) => document.id === selectedDocumentId) ??
    vendorDocuments[0] ??
    null;

  function upsertUploadedFiles(fileList: FileList | File[]) {
    if (!activeVendor) {
      return;
    }

    const files = Array.from(fileList);
    const uploadedDocuments: VendorDocument[] = files.map((file, index) => ({
      id: `${activeVendor.id}-${Date.now()}-${index}`,
      vendorId: activeVendor.id,
      name: file.name,
      documentType: inferDocumentType(file.name),
      uploadDate: formatDate(new Date()),
      language: inferLanguage(file.name),
      expiryDate: "Pending review",
      status: "Ambiguous",
      confidenceScore: 72,
      sizeLabel: formatFileSize(file.size),
      source: "Manual Upload",
    }));

    setDocuments((current) => [...uploadedDocuments, ...current]);
    if (uploadedDocuments[0]) {
      setSelectedDocumentId(uploadedDocuments[0].id);
    }
  }

  function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      upsertUploadedFiles(event.target.files);
    }
    event.target.value = "";
  }

  function loadDemoPack(vendorId: string) {
    const seededForVendor = seededVendorDocuments.filter((document) => document.vendorId === vendorId);
    setDocuments((current) => [
      ...seededForVendor,
      ...current.filter(
        (document) =>
          document.vendorId !== vendorId || document.source === "Manual Upload",
      ),
    ]);
    setActiveVendorId(vendorId);
    setSelectedDocumentId(seededForVendor[0]?.id ?? null);
  }

  function removeDocument(documentId: string) {
    setDocuments((current) => current.filter((document) => document.id !== documentId));
    if (selectedDocumentId === documentId) {
      const nextDocument = vendorDocuments.find((document) => document.id !== documentId);
      setSelectedDocumentId(nextDocument?.id ?? null);
    }
  }

  const intakeSummary = summarizeStatuses(vendorDocuments);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Intake"
        title="Vendor Intake"
        description="Upload, review, and manage contractor prequalification packs before extraction begins. The intake layer captures package structure and document confidence without performing AI analysis yet."
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Vendor queue</CardTitle>
            <CardDescription>
              Select a seeded vendor and load a mock prequalification pack into the intake workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendors.map((vendor) => {
              const docCount = documents.filter((document) => document.vendorId === vendor.id).length;
              const isActive = vendor.id === activeVendorId;

              return (
                <div
                  key={vendor.id}
                  className={`rounded-3xl border p-4 transition ${
                    isActive
                      ? "border-primary/40 bg-primary/10"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() => {
                        setActiveVendorId(vendor.id);
                        setSelectedDocumentId(null);
                      }}
                    >
                      <p className="font-semibold text-slate-900">{vendor.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{vendor.arabicName}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Submitted</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{vendor.submittedAt}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Docs in intake</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{docCount}</p>
                        </div>
                      </div>
                    </button>
                    <StatusBadge status={vendor.status} />
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadDemoPack(vendor.id)}
                    >
                      Load Demo Vendor Pack
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{activeVendor?.name ?? "Vendor Intake"}</CardTitle>
              <CardDescription>
                Drag files into the dropzone or add them manually. Supported mock documents mirror Saudi prequalification requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`rounded-3xl border-2 border-dashed p-6 text-center transition ${
                  dragActive
                    ? "border-primary bg-primary/10"
                    : "border-slate-300 bg-slate-50"
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  if (event.dataTransfer.files.length) {
                    upsertUploadedFiles(event.dataTransfer.files);
                  }
                }}
              >
                <UploadCloud className="mx-auto h-10 w-10 text-slate-500" />
                <p className="mt-4 text-lg font-semibold text-slate-900">
                  Drag and drop vendor files here
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Upload contractor prequalification documents for {activeVendor?.name}. Files are stored in localStorage as mock intake records only.
                </p>
                <div className="mt-5">
                  <label>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <span className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                      <FilePlus2 className="h-4 w-4" />
                      Upload Files
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Valid</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{intakeSummary.Valid}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Missing / Expired</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {intakeSummary.Missing + intakeSummary.Expired}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ambiguous</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{intakeSummary.Ambiguous}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">Supported mock documents</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {supportedDocumentTypes.map((documentType) => (
                    <div
                      key={documentType}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {documentType}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Document inventory</CardTitle>
                <CardDescription>
                  Every uploaded or demo-loaded file is tracked as a document card with language, status, expiry, and confidence metadata.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendorDocuments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                    No documents loaded for this vendor yet. Use a demo pack or upload files to populate the intake list.
                  </div>
                ) : (
                  vendorDocuments.map((document) => (
                    <div
                      key={document.id}
                      className={`rounded-3xl border p-4 transition ${
                        selectedDocument?.id === document.id
                          ? "border-primary/40 bg-primary/10"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <button
                          type="button"
                          className="flex-1 text-left"
                          onClick={() => setSelectedDocumentId(document.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{document.documentType}</p>
                              <p className="mt-1 text-sm text-slate-500">{document.name}</p>
                            </div>
                            <DocumentStatusBadge status={document.status} />
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Metadata label="Upload Date" value={document.uploadDate} />
                            <Metadata label="Language" value={document.language} />
                            <Metadata label="Expiry Date" value={document.expiryDate} />
                            <Metadata
                              label="Confidence Score"
                              value={`${document.confidenceScore}%`}
                            />
                          </div>
                        </button>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDocumentId(document.id)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(document.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document details</CardTitle>
                <CardDescription>
                  Analysts can inspect file metadata before sending the pack downstream for extraction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDocument ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">File Name</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{selectedDocument.name}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <MetadataCard label="Document Type" value={selectedDocument.documentType} />
                      <MetadataCard label="Upload Date" value={selectedDocument.uploadDate} />
                      <MetadataCard label="Language" value={selectedDocument.language} />
                      <MetadataCard label="Expiry Date" value={selectedDocument.expiryDate} />
                      <MetadataCard label="Status" value={selectedDocument.status} />
                      <MetadataCard
                        label="Confidence Score"
                        value={`${selectedDocument.confidenceScore}%`}
                      />
                      <MetadataCard label="Source" value={selectedDocument.source} />
                      <MetadataCard label="File Size" value={selectedDocument.sizeLabel} />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                    Select a document card to inspect its details.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MetadataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
}

function inferLanguage(fileName: string): DocumentLanguage {
  const normalized = fileName.toLowerCase();
  if (normalized.includes("arabic")) {
    return "Arabic";
  }
  if (normalized.includes("bilingual") || normalized.includes("zatca")) {
    return "Bilingual";
  }
  return "English";
}

function inferDocumentType(fileName: string) {
  const normalized = fileName.toLowerCase();
  const lookup: Array<[string, string]> = [
    ["registration", "Commercial Registration"],
    ["classification", "Contractor Classification"],
    ["zatca", "ZATCA Certificate"],
    ["saudization", "Saudization Evidence"],
    ["financial", "Audited Financial Statements"],
    ["iso", "ISO Certificates"],
    ["hse", "HSE Reports"],
    ["reference", "Project References"],
    ["local", "Local Content Documents"],
  ];

  return lookup.find(([fragment]) => normalized.includes(fragment))?.[1] ?? "Project References";
}

function summarizeStatuses(documents: VendorDocument[]): Record<DocumentStatus, number> {
  return documents.reduce<Record<DocumentStatus, number>>(
    (summary, document) => {
      summary[document.status] += 1;
      return summary;
    },
    {
      Valid: 0,
      Missing: 0,
      Expired: 0,
      Ambiguous: 0,
    },
  );
}
