import type {
  ExtractedField,
  PackageSetupConfig,
  ScorecardDimensionScore,
  ScorecardFinding,
  VendorDocument,
  VendorRecord,
  VendorScorecard,
  VendorStatus,
} from "@/types";

const REVIEW_DATE = new Date("2026-06-16T00:00:00Z");

export const CRITICAL_DOC_TYPES = [
  "Commercial Registration",
  "ZATCA Certificate",
  "Contractor Classification",
] as const;

type DimensionName = ScorecardDimensionScore["dimension"];

const DIMENSION_LABELS: DimensionName[] = [
  "Compliance",
  "Financial",
  "Technical",
  "HSE",
  "Localization",
];

export function buildVendorScorecard(
  vendor: VendorRecord,
  documents: VendorDocument[],
  config: PackageSetupConfig,
  extractions: ExtractedField[],
): VendorScorecard {
  const findings: ScorecardFinding[] = [
    evaluateCrValidity(vendor.id, documents, extractions),
    evaluateZatcaValidity(vendor.id, documents, extractions),
    evaluateFinancialStatements(vendor.id, documents, extractions),
    evaluateContractorGrade(vendor.id, extractions),
    evaluateSevereHse(vendor.id, extractions),
    evaluateCurrentRatio(vendor.id, extractions),
    evaluateRevenueScale(vendor.id, extractions),
    evaluateRelevantProjects(vendor.id, extractions),
    evaluateIsoCoverage(vendor.id, extractions),
    evaluateNitaqat(vendor.id, extractions),
    evaluateLocalContent(vendor.id, extractions),
  ];

  const dimensions = buildDimensionScores(findings, config);
  const weightedScore = calculateWeightedScore(dimensions);
  const hardGateFailures = findings.filter((finding) => finding.hardGate && finding.result === "Fail").length;
  const currentDocs = documents.filter((d) => d.isCurrentVersion !== false);
  const missingDocuments = currentDocs.filter((document) => document.status === "Missing").length;
  const expiredDocuments = currentDocs.filter((document) => document.status === "Expired").length;
  const criticalDocExpired = currentDocs.some(
    (d) => d.status === "Expired" && (CRITICAL_DOC_TYPES as readonly string[]).includes(d.documentType),
  );
  const decision = deriveDecision(weightedScore, hardGateFailures, config);
  const riskLevel = deriveRiskLevel(weightedScore, hardGateFailures);

  return {
    vendorId: vendor.id,
    overallScore: weightedScore,
    decision,
    riskLevel,
    missingDocuments,
    expiredDocuments,
    hardGateFailures,
    criticalDocExpired,
    dimensions,
    findings,
  };
}

function buildDimensionScores(
  findings: ScorecardFinding[],
  config: PackageSetupConfig,
): ScorecardDimensionScore[] {
  const weightMap: Record<DimensionName, number> = {
    Compliance: config.scoringWeights.compliance,
    Financial: config.scoringWeights.financial,
    Technical: config.scoringWeights.technical,
    HSE: config.scoringWeights.hse,
    Localization: config.scoringWeights.localization,
  };

  return DIMENSION_LABELS.map((dimension) => {
    const dimensionFindings = findings.filter((finding) => finding.dimension === dimension);
    const average =
      dimensionFindings.reduce((sum, finding) => sum + resultScore(finding.result), 0) /
        Math.max(dimensionFindings.length, 1) || 0;

    return {
      dimension,
      score: Math.round(average),
      weight: weightMap[dimension],
    };
  });
}

function calculateWeightedScore(dimensions: ScorecardDimensionScore[]) {
  const totalWeight = dimensions.reduce((sum, dimension) => sum + dimension.weight, 0);
  if (totalWeight === 0) {
    return 0;
  }

  const weighted = dimensions.reduce(
    (sum, dimension) => sum + dimension.score * (dimension.weight / totalWeight),
    0,
  );
  return Math.round(weighted);
}

function deriveDecision(
  weightedScore: number,
  hardGateFailures: number,
  config: PackageSetupConfig,
): VendorStatus {
  if (hardGateFailures > 0) {
    return "FAIL";
  }
  if (weightedScore >= config.decisionThresholds.pass) {
    return "PASS";
  }
  if (
    weightedScore >= config.decisionThresholds.conditionalMin &&
    weightedScore <= config.decisionThresholds.conditionalMax
  ) {
    return "CONDITIONAL";
  }
  return "FAIL";
}

function deriveRiskLevel(weightedScore: number, hardGateFailures: number) {
  if (hardGateFailures > 0 || weightedScore < 60) {
    return "High";
  }
  if (weightedScore < 80) {
    return "Medium";
  }
  return "Low";
}

function resultScore(result: ScorecardFinding["result"]) {
  switch (result) {
    case "Pass":
      return 100;
    case "Review":
      return 72;
    case "Fail":
      return 35;
  }
}

function evaluateCrValidity(
  vendorId: string,
  documents: VendorDocument[],
  extractions: ExtractedField[],
): ScorecardFinding {
  const field = findField(extractions, "CR Expiry");
  const crDocument = documents.find((document) => document.documentType === "Commercial Registration");
  const expired = field ? isExpired(field.value) : crDocument?.status === "Expired";
  return {
    id: `${vendorId}-cr-validity`,
    dimension: "Compliance",
    ruleName: "Commercial Registration Validity",
    inputValue: field?.value ?? "Not evidenced",
    result: expired ? "Fail" : "Pass",
    riskLevel: expired ? "High" : "Low",
    sourceCitation: citation(field, "Commercial Registration"),
    explanation: expired
      ? "Commercial Registration is expired against the review date and fails a core eligibility gate."
      : "Commercial Registration remains valid for the procurement review window.",
    hardGate: true,
  };
}

function evaluateZatcaValidity(
  vendorId: string,
  documents: VendorDocument[],
  extractions: ExtractedField[],
): ScorecardFinding {
  const field = findField(extractions, "ZATCA Validity");
  const document = documents.find((item) => item.documentType === "ZATCA Certificate");
  const invalid =
    !field ||
    field.value.toLowerCase().includes("no valid") ||
    document?.status === "Expired" ||
    document?.status === "Missing";

  return {
    id: `${vendorId}-zatca-validity`,
    dimension: "Compliance",
    ruleName: "ZATCA Certificate Validity",
    inputValue: field?.value ?? "Not evidenced",
    result: invalid ? "Fail" : "Pass",
    riskLevel: invalid ? "High" : "Low",
    sourceCitation: citation(field, "ZATCA Certificate"),
    explanation: invalid
      ? "A valid ZATCA certificate is mandatory before the vendor can be released to tender."
      : "ZATCA compliance is current and satisfies the tender release gate.",
    hardGate: true,
  };
}

function evaluateFinancialStatements(
  vendorId: string,
  documents: VendorDocument[],
  extractions: ExtractedField[],
): ScorecardFinding {
  const field = findField(extractions, "Revenue");
  const document = documents.find((item) => item.documentType === "Audited Financial Statements");
  const missing =
    !document ||
    document.status === "Missing" ||
    field?.value.toLowerCase().includes("management accounts only") ||
    field?.value.toLowerCase().includes("not evidenced");

  return {
    id: `${vendorId}-financial-statements`,
    dimension: "Financial",
    ruleName: "Audited Financial Statements Present",
    inputValue: field?.value ?? document?.status ?? "Not evidenced",
    result: missing ? "Fail" : document?.status === "Ambiguous" ? "Review" : "Pass",
    riskLevel: missing ? "High" : document?.status === "Ambiguous" ? "Medium" : "Low",
    sourceCitation: citation(field, document?.name ?? "Financial Statements"),
    explanation: missing
      ? "Audited financial statements are missing or unsupported, which blocks a clean financial assessment."
      : document?.status === "Ambiguous"
        ? "Financial statements are present but require reviewer confirmation due to limited assurance."
        : "Audited financial statements are present and usable for deterministic scoring.",
    hardGate: true,
  };
}

function evaluateContractorGrade(vendorId: string, extractions: ExtractedField[]): ScorecardFinding {
  const field = findField(extractions, "Contractor Classification Grade");
  const grade = extractRomanGrade(field?.value ?? "");
  const belowThreshold = grade > 2 || grade === Number.POSITIVE_INFINITY;

  return {
    id: `${vendorId}-contractor-grade`,
    dimension: "Technical",
    ruleName: "Contractor Classification Grade Threshold",
    inputValue: field?.value ?? "Not evidenced",
    result: belowThreshold ? "Fail" : grade === 2 ? "Review" : "Pass",
    riskLevel: belowThreshold ? "High" : grade === 2 ? "Medium" : "Low",
    sourceCitation: citation(field, "Classification Certificate"),
    explanation: belowThreshold
      ? "The contractor classification grade falls below the package threshold for main works prequalification."
      : grade === 2
        ? "The grade meets the minimum threshold but should be reviewed against package complexity."
        : "The contractor grade is comfortably above the package minimum.",
    hardGate: true,
  };
}

function evaluateSevereHse(vendorId: string, extractions: ExtractedField[]): ScorecardFinding {
  const field = findField(extractions, "HSE Record");
  const severe =
    !field ||
    field.value.toLowerCase().includes("3 incidents") ||
    field.value.toLowerCase().includes("fatal");
  const moderate = field?.value.toLowerCase().includes("2 recordables");

  return {
    id: `${vendorId}-severe-hse`,
    dimension: "HSE",
    ruleName: "Severe HSE Issue Screen",
    inputValue: field?.value ?? "Not evidenced",
    result: severe ? "Fail" : moderate ? "Review" : "Pass",
    riskLevel: severe ? "High" : moderate ? "Medium" : "Low",
    sourceCitation: citation(field, "HSE Reports"),
    explanation: severe
      ? "The HSE record indicates a severe risk posture requiring rejection or executive exception handling."
      : moderate
        ? "The HSE record is usable but should be reviewed against project safety tolerance."
        : "The HSE record does not show a severe safety blocker.",
    hardGate: true,
  };
}

function evaluateCurrentRatio(vendorId: string, extractions: ExtractedField[]): ScorecardFinding {
  const field = findField(extractions, "Current Ratio");
  const ratio = Number.parseFloat(field?.value ?? "");
  const result = ratio >= 1.3 ? "Pass" : ratio >= 1 ? "Review" : "Fail";

  return {
    id: `${vendorId}-current-ratio`,
    dimension: "Financial",
    ruleName: "Liquidity Coverage Ratio",
    inputValue: field?.value ?? "Not evidenced",
    result,
    riskLevel: result === "Pass" ? "Low" : result === "Review" ? "Medium" : "High",
    sourceCitation: citation(field, "Audited Financial Statements"),
    explanation:
      result === "Pass"
        ? "Current ratio is strong enough for near-term obligations."
        : result === "Review"
          ? "Liquidity is acceptable but should be reviewed for working capital resilience."
          : "Liquidity falls below the expected threshold for this package value band.",
    hardGate: false,
  };
}

function evaluateRevenueScale(vendorId: string, extractions: ExtractedField[]): ScorecardFinding {
  const field = findField(extractions, "Revenue");
  const revenue = parseSarValue(field?.value ?? "");
  const result = revenue >= 500 ? "Pass" : revenue >= 250 ? "Review" : "Fail";

  return {
    id: `${vendorId}-revenue-scale`,
    dimension: "Financial",
    ruleName: "Revenue Capacity Alignment",
    inputValue: field?.value ?? "Not evidenced",
    result,
    riskLevel: result === "Pass" ? "Low" : result === "Review" ? "Medium" : "High",
    sourceCitation: citation(field, "Audited Financial Statements"),
    explanation:
      result === "Pass"
        ? "Revenue scale aligns well with a major Saudi main works package."
        : result === "Review"
          ? "Revenue is adequate but may require further package-to-capacity review."
          : "Revenue scale appears weak or insufficient for the expected tender band.",
    hardGate: false,
  };
}

function evaluateRelevantProjects(vendorId: string, extractions: ExtractedField[]): ScorecardFinding {
  const field = findField(extractions, "Relevant Projects");
  const count = parseLeadingNumber(field?.value ?? "");
  const result = count >= 5 ? "Pass" : count >= 3 ? "Review" : "Fail";

  return {
    id: `${vendorId}-relevant-projects`,
    dimension: "Technical",
    ruleName: "Comparable Project Track Record",
    inputValue: field?.value ?? "Not evidenced",
    result,
    riskLevel: result === "Pass" ? "Low" : result === "Review" ? "Medium" : "High",
    sourceCitation: citation(field, "Project References"),
    explanation:
      result === "Pass"
        ? "The package demonstrates a strong portfolio of comparable completed projects."
        : result === "Review"
          ? "Project track record is partially adequate but needs reviewer judgement on relevance."
          : "Project references are too limited or weakly evidenced for comfortable release.",
    hardGate: false,
  };
}

function evaluateIsoCoverage(vendorId: string, extractions: ExtractedField[]): ScorecardFinding {
  const field9001 = findField(extractions, "ISO 9001");
  const field14001 = findField(extractions, "ISO 14001");
  const field45001 = findField(extractions, "ISO 45001");
  const values = [field9001?.value, field14001?.value, field45001?.value].filter(Boolean).join(" | ");
  const hasFailure = [field9001, field14001, field45001].some(
    (field) => !field || field.value.toLowerCase().includes("not evidenced"),
  );
  const hasReview = field45001?.value.toLowerCase().includes("renewal");
  const result = hasFailure ? "Fail" : hasReview ? "Review" : "Pass";

  return {
    id: `${vendorId}-iso-coverage`,
    dimension: "HSE",
    ruleName: "ISO Coverage Completeness",
    inputValue: values || "Not evidenced",
    result,
    riskLevel: result === "Pass" ? "Low" : result === "Review" ? "Medium" : "High",
    sourceCitation: citation(field45001 ?? field9001 ?? field14001, "ISO Certificates"),
    explanation:
      result === "Pass"
        ? "ISO quality, environmental, and safety certifications are evidenced and current."
        : result === "Review"
          ? "Core ISO coverage is mostly present but one certificate remains under renewal."
          : "One or more required ISO certifications are not sufficiently evidenced.",
    hardGate: false,
  };
}

function evaluateNitaqat(vendorId: string, extractions: ExtractedField[]): ScorecardFinding {
  const field = findField(extractions, "Nitaqat Category");
  const value = field?.value.toLowerCase() ?? "";
  const result = value.includes("green") ? "Pass" : value.includes("yellow") ? "Fail" : "Review";

  return {
    id: `${vendorId}-nitaqat`,
    dimension: "Compliance",
    ruleName: "Saudization / Nitaqat Standing",
    inputValue: field?.value ?? "Not evidenced",
    result,
    riskLevel: result === "Pass" ? "Low" : result === "Review" ? "Medium" : "High",
    sourceCitation: citation(field, "Saudization Evidence"),
    explanation:
      result === "Pass"
        ? "Nitaqat standing supports procurement eligibility."
        : result === "Review"
          ? "Nitaqat standing is borderline and requires analyst confirmation."
          : "Nitaqat standing is below the expected procurement comfort level.",
    hardGate: false,
  };
}

function evaluateLocalContent(vendorId: string, extractions: ExtractedField[]): ScorecardFinding {
  const field = findField(extractions, "Local Content Status");
  const value = field?.value.toLowerCase() ?? "";
  const result = value.includes("documented")
    ? "Review"
    : value.includes("partially")
      ? "Review"
      : value.includes("insufficient")
        ? "Fail"
        : "Pass";

  return {
    id: `${vendorId}-local-content`,
    dimension: "Localization",
    ruleName: "Local Content Evidence Sufficiency",
    inputValue: field?.value ?? "Not evidenced",
    result,
    riskLevel: result === "Pass" ? "Low" : result === "Review" ? "Medium" : "High",
    sourceCitation: citation(field, "Local Content Documents"),
    explanation:
      result === "Pass"
        ? "Local content evidence is sufficient for release."
        : result === "Review"
          ? "Local content evidence is present but still needs reviewer interpretation."
          : "Local content support is insufficient for confident qualification.",
    hardGate: false,
  };
}

function findField(extractions: ExtractedField[], label: string) {
  return extractions.find((field) => field.label === label);
}

function citation(field: ExtractedField | undefined, fallback: string) {
  if (!field) {
    return `${fallback} · citation unavailable`;
  }
  return `${field.sourceDocument} · p.${field.pageNumber}`;
}

function isExpired(value: string) {
  const date = parseDate(value);
  return date ? date.getTime() < REVIEW_DATE.getTime() : false;
}

function parseDate(value: string) {
  const cleaned = value.replace("Valid until", "").trim();
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseSarValue(value: string) {
  if (value.includes("1.4B")) {
    return 1400;
  }
  const match = value.match(/SAR\s*([\d.]+)\s*M/i);
  if (match) {
    return Number.parseFloat(match[1]);
  }
  return 0;
}

function parseLeadingNumber(value: string) {
  const match = value.match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function extractRomanGrade(value: string) {
  if (value.includes("Class I")) {
    return 1;
  }
  if (value.includes("Class II")) {
    return 2;
  }
  if (value.includes("Class III")) {
    return 3;
  }
  return Number.POSITIVE_INFINITY;
}
