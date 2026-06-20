import type {
  AuditRecord,
  BackendInvitation,
  BackendPackage,
  BackendProject,
  CommandCenterSummary,
  ExtractionDebugInfo,
  FieldReviewState,
  PackageSetupConfig,
  ReportPreview,
  RuleReviewState,
  VendorPackageApplication,
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

  getProjects: () => request<BackendProject[]>("/api/projects"),
  getProject: (projectId: string) => request<BackendProject>(`/api/projects/${projectId}`),
  createProject: (project: Partial<BackendProject>) =>
    request<BackendProject>("/api/projects", {
      method: "POST",
      body: JSON.stringify(project),
    }),
  updateProject: (projectId: string, updates: Partial<BackendProject>) =>
    request<BackendProject>(`/api/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  deleteProject: (projectId: string) =>
    request<void>(`/api/projects/${projectId}`, {
      method: "DELETE",
    }),

  getProjectPackages: (projectId: string) =>
    request<BackendPackage[]>(`/api/projects/${projectId}/packages`),
  getPackage: (packageId: string) => request<BackendPackage>(`/api/packages/${packageId}`),
  createPackage: (projectId: string, pkg: Partial<BackendPackage>) =>
    request<BackendPackage>(`/api/projects/${projectId}/packages`, {
      method: "POST",
      body: JSON.stringify(pkg),
    }),
  updatePackage: (packageId: string, updates: Partial<BackendPackage>) =>
    request<BackendPackage>(`/api/packages/${packageId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  deletePackage: (packageId: string) =>
    request<void>(`/api/packages/${packageId}`, {
      method: "DELETE",
    }),

  getApplications: () => request<VendorPackageApplication[]>("/api/applications"),
  getPackageApplications: (packageId: string) =>
    request<VendorPackageApplication[]>(`/api/packages/${packageId}/applications`),
  getVendorApplications: (vendorId: string) =>
    request<VendorPackageApplication[]>(`/api/vendors/${vendorId}/applications`),
  createApplication: (application: Partial<VendorPackageApplication>) =>
    request<VendorPackageApplication>("/api/applications", {
      method: "POST",
      body: JSON.stringify(application),
    }),
  updateApplication: (applicationId: string, updates: Partial<VendorPackageApplication>) =>
    request<VendorPackageApplication>(`/api/applications/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  deleteApplication: (applicationId: string) =>
    request<void>(`/api/applications/${applicationId}`, {
      method: "DELETE",
    }),

  getInvitations: () => request<BackendInvitation[]>("/api/invitations"),
  createInvitation: (invitation: Partial<BackendInvitation>) =>
    request<BackendInvitation>("/api/invitations", {
      method: "POST",
      body: JSON.stringify(invitation),
    }),
  updateInvitation: (invitationId: string, updates: Partial<BackendInvitation>) =>
    request<BackendInvitation>(`/api/invitations/${invitationId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  deleteInvitation: (invitationId: string) =>
    request<void>(`/api/invitations/${invitationId}`, {
      method: "DELETE",
    }),

  getCommandCenterSummary: () =>
    request<CommandCenterSummary>("/api/command-center/summary"),
};

export type ApiClient = typeof api;
