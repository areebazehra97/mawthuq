import crypto from "node:crypto";
import { seededAiExtractions } from "../src/data/seed";
import type {
  AuditRecord,
  ExtractedField,
  ExtractionDebugInfo,
  ExtractionDocumentDebug,
  ExtractionSourceMode,
  VendorDocument,
  VendorExtraction,
  VendorRecord,
} from "../src/types";
import { parseDocumentContent } from "./document-parser";
import { readUpload } from "./file-storage";
import {
  classifyAndExtractDocument,
  getSupportedDocumentTypes,
  isLiveSupportedDocumentType,
} from "./openai-extraction";
import { hasOpenAiConfig, serverConfig } from "./config";

const FALLBACK_LABELS_BY_DOCUMENT: Record<string, string[]> = {
  "Commercial Registration": ["Legal Company Name", "CR Number", "CR Expiry"],
  "Contractor Classification": ["Contractor Classification Grade"],
  "ZATCA Certificate": ["ZATCA Validity"],
  "Audited Financial Statements": ["Revenue", "Current Ratio"],
  "ISO Certificates": ["ISO 9001", "ISO 14001", "ISO 45001"],
  "Project References": ["Relevant Projects"],
  "Saudization Evidence": ["Nitaqat Category"],
  "HSE Reports": ["HSE Record"],
  "Local Content Documents": ["Local Content Status"],
};

const ALLOWED_LABELS_BY_DOCUMENT: Record<string, string[]> = {
  "Commercial Registration": ["Legal Company Name", "CR Number", "CR Expiry"],
  "Contractor Classification": ["Contractor Classification Grade"],
  "ZATCA Certificate": ["ZATCA Validity"],
  "Audited Financial Statements": ["Revenue", "Current Ratio"],
  "ISO Certificates": ["ISO 9001", "ISO 14001", "ISO 45001"],
  "Project References": ["Relevant Projects"],
};

export async function createExtractionRun(
  vendor: VendorRecord,
  documents: VendorDocument[],
  previousExtraction?: VendorExtraction | null,
): Promise<{ extraction: VendorExtraction; auditRecords: AuditRecord[]; documents: VendorDocument[] }> {
  const combinedHash = hashDocuments(documents);
  if (
    previousExtraction &&
    previousExtraction.documentHash === combinedHash &&
    previousExtraction.extractionStatus === "complete"
  ) {
    return {
      extraction: {
        ...previousExtraction,
        debug: {
          ...(previousExtraction.debug ?? emptyDebug()),
          cacheHit: true,
        },
      },
      auditRecords: [
        buildAudit(
          vendor.id,
          "AI extraction reused cached result.",
          "Uploaded documents have not changed, so Mawthūq reused the last cited extraction set.",
        ),
      ],
      documents,
    };
  }

  const seededFields = seededAiExtractions[vendor.id] ?? [];
  const extractedFields: ExtractedField[] = [];
  const debugDocuments: ExtractionDocumentDebug[] = [];
  const updatedDocuments: VendorDocument[] = [];
  const auditRecords: AuditRecord[] = [
    buildAudit(
      vendor.id,
      "AI extraction requested.",
      "Vendor package entered classification and extraction workflow.",
    ),
  ];

  let usedLive = false;
  let usedFallback = false;
  let fallbackReason: string | null = null;
  let errorMessage: string | null = null;

  for (const document of documents) {
    const bytes = document.storagePath
      ? await readUpload(document.storagePath, document.storageProvider)
      : null;
    const parsed = await parseDocumentContent(bytes, document.mimeType, document.contentPreview);
    const baseDocumentType = document.documentType;
    let classifiedDocumentType = document.classifiedDocumentType ?? baseDocumentType;
    let usedDocumentFallback = false;

    try {
      const aiResult = await classifyAndExtractDocument({
        fileName: document.name,
        suggestedDocumentType: baseDocumentType,
        pages: parsed.pages,
      });

      if (aiResult?.classifiedDocumentType) {
        classifiedDocumentType = aiResult.classifiedDocumentType;
      }

      const allowedLabels = ALLOWED_LABELS_BY_DOCUMENT[classifiedDocumentType] ?? [];
      const safeFields =
        aiResult?.fields
          .filter(
            (field) =>
              allowedLabels.includes(field.label) &&
              Boolean(field.evidenceSnippet?.trim()) &&
              Boolean(field.pageNumber) &&
              Boolean(field.value?.trim()) &&
              Number.isFinite(field.confidence),
          )
          .map((field) => ({
            label: field.label,
            value: normalizeFieldValue(field.label, field.value),
            confidence: clampConfidence(field.confidence),
            sourceDocument: document.name,
            pageNumber: Math.max(1, field.pageNumber),
            evidenceSnippet: field.evidenceSnippet.trim(),
            sourceMode: "live" as ExtractionSourceMode,
          })) ?? [];

      if (isLiveSupportedDocumentType(classifiedDocumentType) && safeFields.length > 0) {
        extractedFields.push(...safeFields);
        usedLive = true;
      } else {
        const fallbackFields = seededFallbackForDocument(
          seededFields,
          classifiedDocumentType,
          document.name,
          isLiveSupportedDocumentType(classifiedDocumentType) ? "demo_supported" : "seeded",
        );
        if (fallbackFields.length > 0) {
          extractedFields.push(...fallbackFields);
          usedDocumentFallback = true;
          usedFallback = true;
          fallbackReason =
            aiResult?.fallbackReason ??
            `Fallback evidence used for ${classifiedDocumentType}.`;
        }
      }
    } catch (error) {
      usedDocumentFallback = true;
      usedFallback = true;
      errorMessage = error instanceof Error ? error.message : "Unknown extraction error";
      fallbackReason = `Live extraction failed for ${document.name}.`;
      extractedFields.push(
        ...seededFallbackForDocument(
          seededFields,
          classifiedDocumentType,
          document.name,
          isLiveSupportedDocumentType(classifiedDocumentType) ? "demo_supported" : "seeded",
        ),
      );
    }

    const supportLevel = isLiveSupportedDocumentType(classifiedDocumentType)
      ? usedDocumentFallback
        ? "demo_supported"
        : "live"
      : "demo_supported";

    debugDocuments.push({
      documentId: document.id,
      documentName: document.name,
      documentType: baseDocumentType,
      classifiedDocumentType,
      supportLevel,
      textSource: parsed.textSource,
      extractedPages: parsed.pages.length,
      usedFallback: usedDocumentFallback,
    });

    updatedDocuments.push({
      ...document,
      classifiedDocumentType,
      supportLevel,
      lastProcessedAt: isoNow(),
    });
  }

  const uniqueFields = dedupeFields(extractedFields);
  const sourceMode: ExtractionSourceMode = usedLive && !usedFallback ? "live" : usedFallback ? "demo_supported" : "seeded";
  const qualityStatus =
    sourceMode === "live"
      ? "Evidence complete"
      : sourceMode === "demo_supported"
        ? "Partial evidence"
        : "Fallback used";

  if (usedFallback) {
    auditRecords.push(
      buildAudit(
        vendor.id,
        "AI extraction used fallback evidence mode.",
        fallbackReason ?? "At least one document required seeded or demo-supported evidence.",
      ),
    );
  } else {
    auditRecords.push(
      buildAudit(
        vendor.id,
        "AI extraction completed successfully.",
        "Supported contractor documents were classified and converted into citation-backed fields.",
      ),
    );
  }

  const extraction: VendorExtraction = {
    vendorId: vendor.id,
    fields: uniqueFields,
    sourceMode,
    extractionStatus: "complete",
    lastRunAt: isoNow(),
    warning:
      sourceMode === "live"
        ? "Live extraction completed for all supported document types."
        : sourceMode === "demo_supported"
          ? "Some supported or unsupported documents used demo-backed fallback evidence."
          : "OpenAI extraction is unavailable. Seeded evidence fallback is active.",
    qualityStatus,
    supportedLiveDocumentTypes: getSupportedDocumentTypes(),
    modelName: hasOpenAiConfig() ? serverConfig.openAiModel : "seeded-fallback",
    promptVersion: serverConfig.promptVersion,
    documentHash: combinedHash,
    fallbackReason,
    completedAt: isoNow(),
    debug: {
      modelName: hasOpenAiConfig() ? serverConfig.openAiModel : "seeded-fallback",
      promptVersion: serverConfig.promptVersion,
      fallbackReason,
      errorMessage,
      cacheHit: false,
      documentSummaries: debugDocuments,
    },
  };

  return { extraction, auditRecords, documents: updatedDocuments };
}

function seededFallbackForDocument(
  seededFields: ExtractedField[],
  documentType: string,
  sourceDocument: string,
  sourceMode: ExtractionSourceMode,
) {
  const labels = FALLBACK_LABELS_BY_DOCUMENT[documentType] ?? [];
  return seededFields
    .filter((field) => labels.includes(field.label))
    .map((field) => ({
      ...field,
      sourceDocument,
      sourceMode,
    }));
}

function hashDocuments(documents: VendorDocument[]) {
  return crypto
    .createHash("sha256")
    .update(documents.map((document) => `${document.id}:${document.documentHash ?? document.name}`).join("|"))
    .digest("hex");
}

function buildAudit(vendorId: string, title: string, detail: string): AuditRecord {
  return {
    id: `${vendorId}-${Date.now()}-${title.toLowerCase().replace(/\s+/g, "-")}`,
    vendorId,
    timestamp: humanNow(),
    actor: "System",
    title,
    detail,
  };
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

function isoNow() {
  return new Date().toISOString();
}

function dedupeFields(fields: ExtractedField[]) {
  const seen = new Set<string>();
  return fields.filter((field) => {
    if (seen.has(field.label)) {
      return false;
    }
    seen.add(field.label);
    return true;
  });
}

function normalizeFieldValue(label: string, value: string) {
  if (label === "CR Number") {
    return value.replace(/\D/g, "").slice(0, 10);
  }
  if (label === "Current Ratio") {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : value;
  }
  return value.trim();
}

function clampConfidence(confidence: number) {
  return Math.max(1, Math.min(100, Math.round(confidence)));
}

function emptyDebug(): ExtractionDebugInfo {
  return {
    cacheHit: false,
    documentSummaries: [],
  };
}
