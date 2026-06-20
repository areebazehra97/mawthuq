import type {
  AuditRecord,
  ExtractionDebugInfo,
  FieldReviewState,
  PackageSetupConfig,
  ReportPreview,
  RuleReviewState,
  VendorDocument,
  VendorExtraction,
  VendorRecord,
  VendorScorecard,
} from "@/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  getVendors: () => request<VendorRecord[]>("/api/vendors"),
  saveVendors: (vendors: VendorRecord[]) =>
    request<VendorRecord[]>("/api/vendors", {
      method: "POST",
      body: JSON.stringify(vendors),
    }),

  getDocuments: () => request<VendorDocument[]>("/api/documents"),
  saveDocuments: (documents: VendorDocument[]) =>
    request<VendorDocument[]>("/api/documents", {
      method: "POST",
      body: JSON.stringify(documents),
    }),
  uploadVendorFiles: (
    vendorId: string,
    files: Array<{
      fileName: string;
      mimeType: string;
      size: number;
      base64: string;
      suggestedDocumentType: string;
      language: VendorDocument["language"];
    }>,
  ) =>
    request<VendorDocument[]>(`/api/vendors/${vendorId}/upload`, {
      method: "POST",
      body: JSON.stringify({ files }),
    }),

  getPackageConfig: () => request<PackageSetupConfig>("/api/package-config"),
  savePackageConfig: (config: PackageSetupConfig) =>
    request<PackageSetupConfig>("/api/package-config", {
      method: "POST",
      body: JSON.stringify(config),
    }),

  getExtractions: () => request<VendorExtraction[]>("/api/extractions"),
  runExtraction: (vendorId: string) =>
    request<VendorExtraction>(`/api/vendors/${vendorId}/extract`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  getExtractionDebug: (vendorId: string) =>
    request<ExtractionDebugInfo | null>(`/api/vendors/${vendorId}/debug`),

  getAuditRecords: () => request<AuditRecord[]>("/api/audit-records"),
  saveAuditRecords: (auditRecords: AuditRecord[]) =>
    request<AuditRecord[]>("/api/audit-records", {
      method: "POST",
      body: JSON.stringify(auditRecords),
    }),

  getReviewState: () =>
    request<{ fieldStates: FieldReviewState[]; ruleStates: RuleReviewState[] }>(
      "/api/review-state",
    ),
  saveReviewState: (fieldStates: FieldReviewState[], ruleStates: RuleReviewState[]) =>
    request<{ fieldStates: FieldReviewState[]; ruleStates: RuleReviewState[] }>(
      "/api/review-state",
      {
        method: "POST",
        body: JSON.stringify({ fieldStates, ruleStates }),
      },
    ),

  getVendorScorecard: (vendorId: string) =>
    request<VendorScorecard>(`/api/vendors/${vendorId}/scorecard`),
  getVendorAudit: (vendorId: string) =>
    request<AuditRecord[]>(`/api/vendors/${vendorId}/audit`),
  generateVendorReport: (vendorId: string) =>
    request<ReportPreview>(`/api/vendors/${vendorId}/report`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  getVendorReport: (vendorId: string) =>
    request<ReportPreview>(`/api/vendors/${vendorId}/report`),
  resetDemo: () =>
    request("/api/demo/reset", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  getDemoState: () => request("/api/demo/state"),
};

export type ApiClient = typeof api;
