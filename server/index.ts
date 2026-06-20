import cors from "cors";
import express from "express";
import { createExtractionRun } from "./extraction";
import { clearStoredUploads, saveUpload } from "./file-storage";
import { readState, resetState, writeState } from "./store";
import { buildVendorScorecard } from "../src/lib/scorecard";
import { seededBackendState } from "../src/data/seed";
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
const PORT = Number(process.env.MAWTHUQ_API_PORT ?? 8787);

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
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
