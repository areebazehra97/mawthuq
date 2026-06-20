import cors from "cors";
import express from "express";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import { createExtractionRun } from "./extraction";
import { clearStoredUploads, saveUpload } from "./file-storage";
import {
  buildApplication,
  buildCommandCenterSummary,
  buildInvitation,
  buildPackage,
  buildProject,
  patchApplication,
  patchInvitation,
  patchPackage,
  patchProject,
  refreshPackageReadiness,
} from "./portfolio";
import { readState, resetState, writeState } from "./store";
import { buildVendorScorecard } from "../src/lib/scorecard";
import { seededBackendState } from "../src/data/seed";
import { serverConfig, hasEmailConfig } from "./config";
import type {
  AuditRecord,
  FieldReviewState,
  ReportPreview,
  RuleReviewState,
  VendorDocument,
  VendorExtraction,
  VendorRecord,
} from "../src/types";

const app = express();
const PORT = Number(process.env.PORT ?? process.env.MAWTHUQ_API_PORT ?? 8787);

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/projects", async (_req, res) => {
  const state = await readState();
  res.json(state.projects);
});

app.get("/api/projects/:projectId", async (req, res) => {
  const state = await readState();
  const project = state.projects.find((item) => item.id === req.params.projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

app.post("/api/projects", async (req, res) => {
  try {
    const state = await readState();
    const nextProject = buildProject(req.body as Record<string, unknown>);
    state.projects = [nextProject, ...state.projects];
    await writeState(state);
    res.status(201).json(nextProject);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid project payload" });
  }
});

app.patch("/api/projects/:projectId", async (req, res) => {
  try {
    const state = await readState();
    const project = state.projects.find((item) => item.id === req.params.projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const nextProject = patchProject(project, req.body as Record<string, unknown>);
    state.projects = state.projects.map((item) =>
      item.id === req.params.projectId ? nextProject : item,
    );
    await writeState(state);
    res.json(nextProject);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid project payload" });
  }
});

app.delete("/api/projects/:projectId", async (req, res) => {
  const state = await readState();
  const projectId = req.params.projectId;
  const packageIds = state.packages.filter((item) => item.projectId === projectId).map((item) => item.id);

  state.projects = state.projects.filter((item) => item.id !== projectId);
  state.packages = state.packages.filter((item) => item.projectId !== projectId);
  state.vendorPackageApplications = state.vendorPackageApplications.filter(
    (item) => item.projectId !== projectId && !packageIds.includes(item.packageId),
  );
  state.invitations = state.invitations.filter(
    (item) => item.projectId !== projectId && !(item.packageId && packageIds.includes(item.packageId)),
  );
  await writeState(state);
  res.status(204).send();
});

app.get("/api/projects/:projectId/packages", async (req, res) => {
  const state = await readState();
  refreshPackageReadiness(state);
  res.json(state.packages.filter((item) => item.projectId === req.params.projectId));
});

app.get("/api/packages/:packageId", async (req, res) => {
  const state = await readState();
  const pkg = state.packages.find((item) => item.id === req.params.packageId);
  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }
  res.json(pkg);
});

app.post("/api/projects/:projectId/packages", async (req, res) => {
  try {
    const state = await readState();
    const project = state.projects.find((item) => item.id === req.params.projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const nextPackage = buildPackage(req.params.projectId, req.body as Record<string, unknown>);
    state.packages = [nextPackage, ...state.packages];
    refreshPackageReadiness(state);
    await writeState(state);
    res.status(201).json(nextPackage);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid package payload" });
  }
});

app.patch("/api/packages/:packageId", async (req, res) => {
  try {
    const state = await readState();
    const pkg = state.packages.find((item) => item.id === req.params.packageId);
    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    const nextPackage = patchPackage(pkg, req.body as Record<string, unknown>);
    state.packages = state.packages.map((item) =>
      item.id === req.params.packageId ? nextPackage : item,
    );
    refreshPackageReadiness(state);
    await writeState(state);
    res.json(nextPackage);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid package payload" });
  }
});

app.delete("/api/packages/:packageId", async (req, res) => {
  const state = await readState();
  const packageId = req.params.packageId;
  state.packages = state.packages.filter((item) => item.id !== packageId);
  state.vendorPackageApplications = state.vendorPackageApplications.filter(
    (item) => item.packageId !== packageId,
  );
  state.invitations = state.invitations.filter((item) => item.packageId !== packageId);
  await writeState(state);
  res.status(204).send();
});

app.get("/api/applications", async (_req, res) => {
  const state = await readState();
  refreshPackageReadiness(state);
  res.json(state.vendorPackageApplications);
});

app.get("/api/packages/:packageId/applications", async (req, res) => {
  const state = await readState();
  res.json(state.vendorPackageApplications.filter((item) => item.packageId === req.params.packageId));
});

app.get("/api/vendors/:vendorId/applications", async (req, res) => {
  const state = await readState();
  res.json(state.vendorPackageApplications.filter((item) => item.vendorId === req.params.vendorId));
});

app.post("/api/applications", async (req, res) => {
  try {
    const state = await readState();
    const nextApplication = buildApplication(req.body as Record<string, unknown>);
    const existingApplication = state.vendorPackageApplications.find(
      (item) =>
        item.vendorId === nextApplication.vendorId &&
        item.packageId === nextApplication.packageId,
    );
    if (existingApplication) {
      res.json(existingApplication);
      return;
    }
    state.vendorPackageApplications = [nextApplication, ...state.vendorPackageApplications];
    refreshPackageReadiness(state);
    await writeState(state);
    res.status(201).json(nextApplication);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid application payload" });
  }
});

app.patch("/api/applications/:applicationId", async (req, res) => {
  try {
    const state = await readState();
    const application = state.vendorPackageApplications.find(
      (item) => item.id === req.params.applicationId,
    );
    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    const nextApplication = patchApplication(application, req.body as Record<string, unknown>);
    state.vendorPackageApplications = state.vendorPackageApplications.map((item) =>
      item.id === req.params.applicationId ? nextApplication : item,
    );
    refreshPackageReadiness(state);
    await writeState(state);
    res.json(nextApplication);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid application payload" });
  }
});

app.delete("/api/applications/:applicationId", async (req, res) => {
  const state = await readState();
  const applicationId = req.params.applicationId;
  state.vendorPackageApplications = state.vendorPackageApplications.filter(
    (item) => item.id !== applicationId,
  );
  state.invitations = state.invitations.map((item) =>
    item.applicationId === applicationId ? { ...item, applicationId: undefined } : item,
  );
  refreshPackageReadiness(state);
  await writeState(state);
  res.status(204).send();
});

app.get("/api/invitations", async (_req, res) => {
  const state = await readState();
  res.json(state.invitations);
});

app.post("/api/invitations", async (req, res) => {
  try {
    const state = await readState();
    const nextInvitation = buildInvitation(req.body as Record<string, unknown>);
    const existingInvitation = state.invitations.find((item) => {
      const samePackage = item.packageId !== undefined && item.packageId === nextInvitation.packageId;
      const sameVendor = item.vendorId !== undefined && item.vendorId === nextInvitation.vendorId;
      const sameEmail =
        item.contactEmail.toLowerCase() === nextInvitation.contactEmail.toLowerCase();
      const isActive =
        item.status !== "Expired" &&
        item.status !== "Bounced" &&
        item.status !== "Declined";

      return isActive && samePackage && (sameVendor || sameEmail);
    });
    if (existingInvitation) {
      const mergedInvitation = {
        ...existingInvitation,
        projectId: existingInvitation.projectId ?? nextInvitation.projectId,
        packageId: existingInvitation.packageId ?? nextInvitation.packageId,
        applicationId: existingInvitation.applicationId ?? nextInvitation.applicationId,
        vendorId: existingInvitation.vendorId ?? nextInvitation.vendorId,
        category: existingInvitation.category ?? nextInvitation.category,
        note: nextInvitation.note ?? existingInvitation.note,
        updatedAt: nextInvitation.updatedAt,
        lastActivityAt: nextInvitation.lastActivityAt,
      };
      state.invitations = state.invitations.map((item) =>
        item.id === existingInvitation.id ? mergedInvitation : item,
      );
      await writeState(state);
      res.json(mergedInvitation);
      return;
    }
    state.invitations = [nextInvitation, ...state.invitations];
    await writeState(state);
    res.status(201).json(nextInvitation);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid invitation payload" });
  }
});

app.patch("/api/invitations/:invitationId", async (req, res) => {
  try {
    const state = await readState();
    const invitation = state.invitations.find((item) => item.id === req.params.invitationId);
    if (!invitation) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    const nextInvitation = patchInvitation(invitation, req.body as Record<string, unknown>);
    state.invitations = state.invitations.map((item) =>
      item.id === req.params.invitationId ? nextInvitation : item,
    );
    await writeState(state);
    res.json(nextInvitation);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid invitation payload" });
  }
});

app.delete("/api/invitations/:invitationId", async (req, res) => {
  const state = await readState();
  state.invitations = state.invitations.filter((item) => item.id !== req.params.invitationId);
  await writeState(state);
  res.status(204).send();
});

app.get("/api/command-center/summary", async (_req, res) => {
  const state = await readState();
  const summary = buildCommandCenterSummary(state);
  await writeState(state);
  res.json(summary);
});

app.get("/api/vendors", async (_req, res) => {
  const state = await readState();
  res.json(state.vendors);
});

app.post("/api/vendors", async (req, res) => {
  const state = await readState();
  state.vendors = req.body as VendorRecord[];
  await writeState(state);
  res.json(state.vendors);
});

app.get("/api/documents", async (_req, res) => {
  const state = await readState();
  res.json(state.documents);
});

app.post("/api/documents", async (req, res) => {
  const state = await readState();
  state.documents = req.body as VendorDocument[];
  await writeState(state);
  res.json(state.documents);
});

app.post("/api/vendors/:vendorId/upload", async (req, res) => {
  const state = await readState();
  const vendor = state.vendors.find((record) => record.id === req.params.vendorId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const payload = (req.body.files ?? []) as Array<{
    fileName: string;
    mimeType: string;
    size: number;
    base64: string;
    suggestedDocumentType: string;
    language: VendorDocument["language"];
  }>;

  const createdDocuments: VendorDocument[] = [];
  const createdAudits: AuditRecord[] = [];

  for (const file of payload) {
    const bytes = Buffer.from(file.base64, "base64");
    const stored = await saveUpload(vendor.id, file.fileName, bytes, file.mimeType);
    const nextDocument: VendorDocument = {
      id: `${vendor.id}-${Date.now()}-${createdDocuments.length}`,
      vendorId: vendor.id,
      name: file.fileName,
      documentType: file.suggestedDocumentType,
      uploadDate: humanDate(),
      language: file.language,
      expiryDate: "Pending review",
      status: "Ambiguous",
      confidenceScore: 74,
      sizeLabel: formatSize(file.size),
      source: "Manual Upload",
      version: 1,
      isCurrentVersion: true,
      mimeType: file.mimeType,
      contentPreview: `Uploaded ${file.fileName} for live AI extraction.`,
      uploadedBy: "Procurement Analyst",
      storagePath: stored.storagePath,
      storageProvider: stored.storageProvider,
      documentHash: stored.documentHash,
      supportLevel: "unsupported",
      lastProcessedAt: null,
    };

    createdDocuments.push(nextDocument);
    createdAudits.push({
      id: `${vendor.id}-upload-${Date.now()}-${createdAudits.length}`,
      vendorId: vendor.id,
      timestamp: humanNow(),
      actor: "System",
      title: "Vendor submitted package document.",
      detail: `${file.fileName} was uploaded and stored for AI extraction.`,
    });
  }

  state.documents = [...createdDocuments, ...state.documents];
  state.auditRecords = [...createdAudits, ...state.auditRecords];
  state.vendors = state.vendors.map((record) =>
    record.id === vendor.id
      ? {
          ...record,
          reviewStage: "Uploaded",
          packageHealth: "Uploaded package awaiting AI extraction",
        }
      : record,
  );
  await writeState(state);
  res.json(createdDocuments);
});

app.get("/api/vendors/:vendorId/documents", async (req, res) => {
  const state = await readState();
  res.json(state.documents.filter((document) => document.vendorId === req.params.vendorId));
});

app.post("/api/vendors/:vendorId/documents", async (req, res) => {
  const state = await readState();
  const incoming = req.body as VendorDocument[];
  state.documents = [
    ...state.documents.filter((document) => document.vendorId !== req.params.vendorId),
    ...incoming,
  ];
  await writeState(state);
  res.json(state.documents.filter((document) => document.vendorId === req.params.vendorId));
});

app.get("/api/package-config", async (_req, res) => {
  const state = await readState();
  res.json(state.packageConfig);
});

app.post("/api/package-config", async (req, res) => {
  const state = await readState();
  state.packageConfig = req.body;
  await writeState(state);
  res.json(state.packageConfig);
});

app.get("/api/extractions", async (_req, res) => {
  const state = await readState();
  res.json(state.extractions);
});

app.get("/api/vendors/:vendorId/extractions", async (req, res) => {
  const state = await readState();
  res.json(
    state.extractions.find((extraction) => extraction.vendorId === req.params.vendorId) ?? null,
  );
});

app.post("/api/vendors/:vendorId/extract", async (req, res) => {
  const state = await readState();
  const vendor = state.vendors.find((record) => record.id === req.params.vendorId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const vendorDocuments = state.documents.filter(
    (document) => document.vendorId === req.params.vendorId,
  );
  const existingExtraction =
    state.extractions.find((record) => record.vendorId === req.params.vendorId) ?? null;

  const { extraction, auditRecords, documents } = await createExtractionRun(
    vendor,
    vendorDocuments,
    existingExtraction,
  );

  state.documents = [
    ...state.documents.filter((document) => document.vendorId !== vendor.id),
    ...documents,
  ];
  state.extractions = upsertByVendor(state.extractions, extraction);
  state.auditRecords = [...auditRecords, ...state.auditRecords];
  state.vendors = state.vendors.map((record) =>
    record.id === vendor.id
      ? {
          ...record,
          reviewStage: "Extracted",
          packageHealth:
            extraction.sourceMode === "live"
              ? "Live extraction complete"
              : extraction.sourceMode === "demo_supported"
                ? "Partial live extraction with fallback evidence"
                : "Seeded evidence fallback active",
        }
      : record,
  );

  await writeState(state);
  res.json(extraction);
});

app.get("/api/vendors/:vendorId/debug", async (req, res) => {
  const state = await readState();
  const extraction = state.extractions.find((record) => record.vendorId === req.params.vendorId);
  res.json(extraction?.debug ?? null);
});

app.get("/api/vendors/:vendorId/scorecard", async (req, res) => {
  const state = await readState();
  const vendor = state.vendors.find((record) => record.id === req.params.vendorId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const extraction = state.extractions.find((record) => record.vendorId === vendor.id);
  const scorecard = buildVendorScorecard(
    vendor,
    state.documents.filter((document) => document.vendorId === vendor.id),
    state.packageConfig,
    extraction?.fields ?? [],
  );

  state.auditRecords = [
    {
      id: `${vendor.id}-score-${Date.now()}`,
      vendorId: vendor.id,
      timestamp: humanNow(),
      actor: "System",
      title: "Scorecard generated from cited evidence.",
      detail: `Rules engine generated a ${scorecard.decision} recommendation with score ${scorecard.overallScore}.`,
    },
    ...state.auditRecords,
  ];

  await writeState(state);
  res.json(scorecard);
});

app.get("/api/review-state", async (_req, res) => {
  const state = await readState();
  res.json({
    fieldStates: state.fieldReviewStates,
    ruleStates: state.ruleReviewStates,
  });
});

app.post("/api/review-state", async (req, res) => {
  const state = await readState();
  state.fieldReviewStates = req.body.fieldStates as FieldReviewState[];
  state.ruleReviewStates = req.body.ruleStates as RuleReviewState[];
  await writeState(state);
  res.json({
    fieldStates: state.fieldReviewStates,
    ruleStates: state.ruleReviewStates,
  });
});

app.get("/api/audit-records", async (_req, res) => {
  const state = await readState();
  res.json(state.auditRecords);
});

app.post("/api/audit-records", async (req, res) => {
  const state = await readState();
  state.auditRecords = req.body as AuditRecord[];
  await writeState(state);
  res.json(state.auditRecords);
});

app.get("/api/vendors/:vendorId/audit", async (req, res) => {
  const state = await readState();
  res.json(state.auditRecords.filter((record) => record.vendorId === req.params.vendorId));
});

app.post("/api/vendors/:vendorId/review-actions", async (req, res) => {
  const state = await readState();
  const { fieldStates, ruleStates, auditRecords } = req.body as {
    fieldStates?: FieldReviewState[];
    ruleStates?: RuleReviewState[];
    auditRecords?: AuditRecord[];
  };

  if (fieldStates) {
    state.fieldReviewStates = fieldStates;
  }
  if (ruleStates) {
    state.ruleReviewStates = ruleStates;
  }
  if (auditRecords) {
    state.auditRecords = auditRecords;
  }

  await writeState(state);
  res.json({
    fieldStates: state.fieldReviewStates,
    ruleStates: state.ruleReviewStates,
    auditRecords: state.auditRecords.filter((record) => record.vendorId === req.params.vendorId),
  });
});

app.post("/api/vendors/:vendorId/report", async (req, res) => {
  const state = await readState();
  const vendor = state.vendors.find((record) => record.id === req.params.vendorId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const report = buildReportPayload(state, vendor);

  state.reports = {
    ...(state.reports ?? {}),
    [vendor.id]: report,
  };
  state.auditRecords = [
    {
      id: `${vendor.id}-report-${Date.now()}`,
      vendorId: vendor.id,
      timestamp: humanNow(),
      actor: "System",
      title: "Backend report package generated.",
      detail: "Vendor decision summary, citations, and audit trail were assembled into a persisted report payload.",
    },
    ...state.auditRecords,
  ];

  await writeState(state);
  res.json(report);
});

app.get("/api/vendors/:vendorId/report", async (req, res) => {
  const state = await readState();
  const vendor = state.vendors.find((record) => record.id === req.params.vendorId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }
  const report = state.reports?.[req.params.vendorId] ?? buildReportPayload(state, vendor);
  if (report) {
    res.json(report);
    return;
  }
});

app.post("/api/demo/reset", async (_req, res) => {
  await clearStoredUploads();
  const nextState = await resetState();
  res.json(nextState);
});

app.get("/api/demo/state", async (_req, res) => {
  const state = await readState();
  res.json({
    supportedLiveDocumentTypes: seededBackendState.extractions[0]?.supportedLiveDocumentTypes ?? [],
    vendorCount: state.vendors.length,
    documentCount: state.documents.length,
    extractionCount: state.extractions.length,
  });
});

/* ── Vendor self-registration endpoints ────────────────────────────────────── */

app.get("/api/invitations/token/:token", async (req, res) => {
  const state = await readState();
  const token = req.params.token.toLowerCase();
  const invitation = state.invitations.find((inv) => inv.id.toLowerCase() === token);
  if (!invitation) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }
  if (invitation.status === "Expired") {
    res.status(410).json({ error: "Invitation has expired" });
    return;
  }
  if (invitation.status === "Submitted") {
    res.status(409).json({ error: "This registration has already been submitted" });
    return;
  }
  res.json(invitation);
});

app.post("/api/invitations/:invitationId/send-email", async (req, res) => {
  const state = await readState();
  const invitation = state.invitations.find((inv) => inv.id === req.params.invitationId);
  if (!invitation) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }

  const registrationUrl = `${serverConfig.appUrl}/register/${invitation.id}`;

  if (!hasEmailConfig()) {
    res.status(503).json({ error: "Email service not configured. Set RESEND_API_KEY.", registrationUrl });
    return;
  }

  const resend = new Resend(serverConfig.resendApiKey);
  const { error } = await resend.emails.send({
    from: serverConfig.fromEmail,
    to: [invitation.contactEmail],
    subject: `Invitation to Pre-qualify — ${invitation.category ?? "Contractor Registration"}`,
    html: buildInvitationEmail({
      contactName: invitation.contactName,
      companyName: invitation.companyName,
      projectName: invitation.note ?? invitation.category ?? "the project",
      registrationUrl,
      expiresAt: invitation.expiresAt ?? "",
    }),
  });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  state.invitations = state.invitations.map((inv) =>
    inv.id === invitation.id ? { ...inv, lastActivityAt: humanNow() } : inv,
  );
  await writeState(state);
  res.json({ ok: true, registrationUrl });
});

app.post("/api/registrations/:token", async (req, res) => {
  const state = await readState();
  const token = req.params.token.toLowerCase();
  const invitation = state.invitations.find((inv) => inv.id.toLowerCase() === token);

  if (!invitation) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }
  if (invitation.status === "Submitted") {
    res.status(409).json({ error: "Already submitted" });
    return;
  }

  const { profile, documents } = req.body as {
    profile: {
      name: string;
      arabicName?: string;
      crNumber?: string;
      vatNumber?: string;
      city: string;
      country?: string;
      contactName: string;
      contactEmail: string;
      contactPhone?: string;
      tradeCategories?: string[];
    };
    documents: Array<{
      fileName: string;
      mimeType: string;
      size: number;
      base64: string;
      suggestedDocumentType: string;
    }>;
  };

  const vendorId = `reg-${Date.now()}`;
  const now = humanDate();
  const nowIso = humanNow();

  const newVendor: VendorRecord = {
    id: vendorId,
    name: profile.name,
    arabicName: profile.arabicName ?? "",
    city: profile.city,
    classification: profile.tradeCategories?.[0] ?? "General Contracting",
    primaryDiscipline: profile.tradeCategories?.[0] ?? "General Contracting",
    status: "CONDITIONAL",
    reviewStage: "Uploaded",
    packageHealth: "Awaiting document review",
    score: 0,
    documentsSubmitted: documents.length,
    openIssues: 0,
    expiryRisk: "Unknown",
    submittedAt: now,
    metrics: [],
    reviewItems: [],
    timeline: [],
    summary: `Self-registered via invitation portal on ${now}.`,
    isNewRegistration: true,
    contactName: profile.contactName,
    contactEmail: profile.contactEmail,
    contactPhone: profile.contactPhone,
    country: profile.country ?? "Saudi Arabia",
    crNumber: profile.crNumber,
    vatNumber: profile.vatNumber,
    tradeCategories: profile.tradeCategories,
    registrationToken: invitation.id,
  };

  state.vendors = [newVendor, ...state.vendors];

  // Upload documents
  const createdDocuments: VendorDocument[] = [];
  const createdAudits: AuditRecord[] = [];

  for (const file of documents) {
    const bytes = Buffer.from(file.base64, "base64");
    const stored = await saveUpload(vendorId, file.fileName, bytes, file.mimeType);
    createdDocuments.push({
      id: `${vendorId}-doc-${Date.now()}-${createdDocuments.length}`,
      vendorId,
      name: file.fileName,
      documentType: file.suggestedDocumentType,
      uploadDate: now,
      language: "English",
      expiryDate: "Pending review",
      status: "Ambiguous",
      confidenceScore: 74,
      sizeLabel: formatSize(file.size),
      source: "Manual Upload",
      version: 1,
      isCurrentVersion: true,
      mimeType: file.mimeType,
      contentPreview: `Uploaded via vendor registration portal.`,
      uploadedBy: profile.contactName,
      storagePath: stored.storagePath,
      storageProvider: stored.storageProvider,
      documentHash: stored.documentHash,
      supportLevel: "unsupported",
      lastProcessedAt: null,
    });
  }

  createdAudits.push({
    id: `${vendorId}-register-${Date.now()}`,
    vendorId,
    timestamp: nowIso,
    actor: "System",
    title: `Vendor self-registered via portal (submitted by ${profile.contactName}).`,
    detail: `${profile.name} submitted ${documents.length} document(s) via the vendor registration portal.`,
  });

  state.documents = [...createdDocuments, ...state.documents];
  state.auditRecords = [...createdAudits, ...state.auditRecords];

  // Mark invitation as submitted
  state.invitations = state.invitations.map((inv) =>
    inv.id === invitation.id
      ? { ...inv, status: "Submitted" as const, vendorId, lastActivityAt: nowIso }
      : inv,
  );

  await writeState(state);

  // Trigger AI extraction asynchronously (don't block the response)
  void createExtractionRun(newVendor, createdDocuments, null).then(async (result) => {
    const s = await readState();
    s.documents = [
      ...s.documents.filter((d) => d.vendorId !== vendorId),
      ...result.documents,
    ];
    s.extractions = upsertByVendor(s.extractions, result.extraction);
    s.auditRecords = [...result.auditRecords, ...s.auditRecords];
    s.vendors = s.vendors.map((v) =>
      v.id === vendorId ? { ...v, reviewStage: "Extracted" as const } : v,
    );
    await writeState(s);
  }).catch(() => { /* extraction errors are non-fatal */ });

  res.status(201).json({ ok: true, vendorId });
});

/* ── Email template ─────────────────────────────────────────────────────────── */

function buildInvitationEmail({
  contactName,
  companyName,
  projectName,
  registrationUrl,
  expiresAt,
}: {
  contactName: string;
  companyName: string;
  projectName: string;
  registrationUrl: string;
  expiresAt: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vendor Invitation</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#0f172a;padding:28px 32px;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-.3px;">Mawthuq <span style="color:#818cf8;">·</span> ماوثوق</p>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Vendor Pre-Qualification Platform</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:15px;color:#64748b;">Dear ${contactName},</p>
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
        You've been invited to pre-qualify for a project
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
        <strong>${companyName}</strong> has been invited to submit a pre-qualification package for
        <strong>${projectName}</strong>. Please complete your registration by uploading the required
        documents through the secure link below.
      </p>
      <a href="${registrationUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:.1px;">
        Start Registration →
      </a>
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">
        This link expires on <strong>${expiresAt}</strong>. If you did not expect this email, please ignore it.
      </p>
      <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;word-break:break-all;">${registrationUrl}</p>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">Sent by Mawthuq Prequalification Platform · Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

// Serve Vite build in production
const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "../dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Mawthuq API listening on http://localhost:${PORT}`);
});

function upsertByVendor(
  collection: VendorExtraction[],
  nextRecord: VendorExtraction,
): VendorExtraction[] {
  return [
    ...collection.filter((record) => record.vendorId !== nextRecord.vendorId),
    nextRecord,
  ];
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function humanDate() {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function humanNow() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildReportPayload(
  state: Awaited<ReturnType<typeof readState>>,
  vendor: VendorRecord,
): ReportPreview {
  const extraction = state.extractions.find((record) => record.vendorId === vendor.id);
  const scorecard = buildVendorScorecard(
    vendor,
    state.documents.filter((document) => document.vendorId === vendor.id),
    state.packageConfig,
    extraction?.fields ?? [],
  );

  return {
    vendor: vendor.name,
    decision: scorecard.decision,
    score: scorecard.overallScore,
    findings: scorecard.findings,
    citations: extraction?.fields ?? [],
    auditTrail: state.auditRecords.filter((record) => record.vendorId === vendor.id),
  };
}
