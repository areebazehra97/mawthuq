import OpenAI from "openai";
import { hasOpenAiConfig, serverConfig } from "./config";
import type { ParsedDocumentPage } from "./document-parser";

const SUPPORTED_DOCUMENT_TYPES = [
  "Commercial Registration",
  "Contractor Classification",
  "ZATCA Certificate",
  "Audited Financial Statements",
  "ISO Certificates",
  "Project References",
] as const;

type SupportedDocumentType = (typeof SUPPORTED_DOCUMENT_TYPES)[number];

interface ExtractedFieldPayload {
  label: string;
  value: string;
  confidence: number;
  pageNumber: number;
  evidenceSnippet: string;
}

interface OpenAiExtractionResult {
  classifiedDocumentType: string;
  fields: ExtractedFieldPayload[];
  fallbackReason?: string;
}

let cachedClient: OpenAI | null = null;

export function getSupportedDocumentTypes() {
  return [...SUPPORTED_DOCUMENT_TYPES];
}

export function isLiveSupportedDocumentType(documentType: string) {
  return SUPPORTED_DOCUMENT_TYPES.includes(documentType as SupportedDocumentType);
}

export async function classifyAndExtractDocument(input: {
  fileName: string;
  suggestedDocumentType: string;
  pages: ParsedDocumentPage[];
}): Promise<OpenAiExtractionResult | null> {
  if (!hasOpenAiConfig()) {
    return null;
  }

  const client =
    cachedClient ??
    (cachedClient = new OpenAI({
      apiKey: serverConfig.openAiApiKey,
    }));

  const pageText = input.pages
    .slice(0, 20)
    .map((page) => `Page ${page.pageNumber}\n${page.text}`)
    .join("\n\n")
    .slice(0, 30000);

  const completion = await client.chat.completions.create({
    model: serverConfig.openAiModel,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "mawthuq_document_extraction",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            classifiedDocumentType: {
              type: "string",
              enum: [...SUPPORTED_DOCUMENT_TYPES, "Unsupported"],
            },
            fallbackReason: {
              type: ["string", "null"],
            },
            fields: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: { type: "string" },
                  value: { type: "string" },
                  confidence: { type: "number" },
                  pageNumber: { type: "integer" },
                  evidenceSnippet: { type: "string" },
                },
                required: [
                  "label",
                  "value",
                  "confidence",
                  "pageNumber",
                  "evidenceSnippet",
                ],
              },
            },
          },
          required: ["classifiedDocumentType", "fallbackReason", "fields"],
        },
      },
    },
    messages: [
      {
        role: "developer",
        content:
          "You extract procurement evidence for Saudi contractor prequalification. Only return fields that are explicitly evidenced in the document text. No citation means no extraction. Confidence must be 0-100. Classify the document first. If unsupported or too weak, return no fields and explain fallbackReason.",
      },
      {
        role: "user",
        content: `File name: ${input.fileName}\nSuggested type: ${input.suggestedDocumentType}\n\nSupported types: ${SUPPORTED_DOCUMENT_TYPES.join(", ")}\n\nDocument text:\n${pageText}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as OpenAiExtractionResult;
}
