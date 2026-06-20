// Mawthuq mock data + types. In-memory only.

export type VendorStatus =
  | "awaiting_docs"
  | "processing"
  | "ready_for_review"
  | "approved"
  | "conditional"
  | "rejected";

export type Recommendation = "PASS" | "CONDITIONAL" | "FAIL" | "PENDING";

export type Confidence = "High" | "Med" | "Low";

export interface Document {
  id: string;
  type: string;
  typeAr?: string;
  language: "ar" | "en" | "mixed";
  pages: number;
  status: "present" | "missing" | "expired";
}

export interface ExtractedField {
  key: string;
  label: string;
  labelAr?: string;
  value: string;
  valueAr?: string;
  sourceDoc: string;
  sourcePage: number;
  confidence: Confidence;
  originalSnippet: string;
  originalSnippetAr?: string;
  overridden?: boolean;
}

export interface RuleResult {
  id: string;
  dimension: string;
  label: string;
  labelAr?: string;
  threshold: string;
  actual: string;
  pass: boolean;
  severity: "info" | "warn" | "fail";
  isHardGate: boolean;
  sourceDoc?: string;
  sourcePage?: number;
  overridden?: boolean;
}

export interface DimensionScore {
  name: string;
  nameAr: string;
  score: number; // 0-100
  weight: number; // percent
}

export interface Scorecard {
  dimensions: DimensionScore[];
  total: number;
  recommendation: Recommendation;
  hardGateHit: boolean;
  rationale: string;
}

export interface AuditEntry {
  id: string;
  user: string;
  timestamp: string;
  action: string;
  detail: string;
  reason?: string;
}

export interface Vendor {
  id: string;
  name: string;
  nameAr: string;
  status: VendorStatus;
  documents: Document[];
  extractedFields: ExtractedField[];
  ruleResults: RuleResult[];
  scorecard: Scorecard;
  decision: Recommendation;
  conditions?: string[];
  auditLog: AuditEntry[];
}

export interface Package {
  id: string;
  name: string;
  nameAr: string;
  asset: string;
  assetAr: string;
  scopeCode: string;
  valueBand: string;
  rubricId: string;
  vendors: Vendor[];
}

// ---------- Rubric ----------
export const KSA_RUBRIC = {
  id: "KSA-Standard",
  name: "KSA Standard — Construction",
  nameAr: "المعيار السعودي — الإنشاءات",
  version: "v1.3",
  dimensions: [
    { name: "Legal & Registration", nameAr: "السجل والترخيص", weight: 20 },
    { name: "Localization & Compliance", nameAr: "التوطين والامتثال", weight: 20 },
    { name: "Financial", nameAr: "المالية", weight: 20 },
    { name: "Technical & Experience", nameAr: "الخبرة الفنية", weight: 20 },
    { name: "HSE & Quality", nameAr: "الصحة والسلامة والجودة", weight: 10 },
    { name: "Legal Standing", nameAr: "الوضع القانوني", weight: 10 },
  ],
  requiredDocs: [
    "Commercial Registration (CR)",
    "SCA Classification Certificate",
    "Chamber of Commerce Membership",
    "Saudization / Nitaqat Certificate",
    "GOSI Certificate",
    "Zakat & Tax (ZATCA) Certificate",
    "National Address",
    "Audited Financials (3 yrs)",
    "Bank Reference Letter",
    "ISO 9001 / 14001 / 45001 Certificates",
    "Past Project Profiles",
  ],
  hardGates: [
    "Expired Commercial Registration",
    "Nitaqat band Red or Yellow",
    "SCA grade below required for package value",
    "Active debarment / blacklist listing",
  ],
  scaGradeForValueBand: "Grade 1 or 2 (package value SAR 50–150M)",
};

// ---------- Vendors ----------

function al_rajhi(): Vendor {
  const docs: Document[] = [
    { id: "d1", type: "Commercial Registration", typeAr: "السجل التجاري", language: "en", pages: 4, status: "present" },
    { id: "d2", type: "SCA Classification Certificate", typeAr: "شهادة تصنيف المقاولين", language: "ar", pages: 6, status: "present" },
    { id: "d3", type: "Saudization / Nitaqat Certificate", typeAr: "شهادة نطاقات", language: "ar", pages: 2, status: "present" },
    { id: "d4", type: "Zakat & Tax (ZATCA) Certificate", typeAr: "شهادة الزكاة والضريبة", language: "en", pages: 2, status: "present" },
    { id: "d5", type: "Audited Financials 2024", typeAr: "القوائم المالية المدققة 2024", language: "mixed", pages: 48, status: "present" },
    { id: "d6", type: "ISO 9001 / 14001 / 45001", typeAr: "شهادات الأيزو", language: "en", pages: 6, status: "present" },
    { id: "d7", type: "Past Project — KAFD Tower MEP", language: "mixed", pages: 14, status: "present" },
    { id: "d8", type: "Past Project — NEOM Site Utilities", language: "mixed", pages: 11, status: "present" },
    { id: "d9", type: "Past Project — Riyadh Metro Stations", language: "mixed", pages: 9, status: "present" },
    { id: "d10", type: "Bank Reference Letter", typeAr: "خطاب مرجعية بنكية", language: "en", pages: 0, status: "missing" },
  ];
  const fields: ExtractedField[] = [
    {
      key: "cr_number", label: "Commercial Registration No.", labelAr: "رقم السجل التجاري",
      value: "1010234567 — valid to 14 Mar 2027",
      sourceDoc: "Commercial Registration", sourcePage: 1, confidence: "High",
      originalSnippet: "Commercial Registration No. 1010234567 — Issued 15-Mar-2017 — Valid until 14-Mar-2027.",
    },
    {
      key: "sca_grade", label: "SCA Classification", labelAr: "تصنيف المقاولين",
      value: "Grade 2 — MEP (Mechanical / Electrical)",
      valueAr: "الدرجة الثانية — كهروميكانيكية",
      sourceDoc: "SCA Classification Certificate", sourcePage: 3, confidence: "High",
      originalSnippet: "Contractor classification: Grade 2 in Mechanical & Electrical works.",
      originalSnippetAr: "تصنيف المقاول: الدرجة الثانية في الأعمال الكهروميكانيكية.",
    },
    {
      key: "nitaqat", label: "Nitaqat Band", labelAr: "نطاق نطاقات",
      value: "Green",
      valueAr: "أخضر",
      sourceDoc: "Saudization / Nitaqat Certificate", sourcePage: 1, confidence: "High",
      originalSnippet: "Establishment Nitaqat band: GREEN — Saudization 31.4%.",
      originalSnippetAr: "نطاق المنشأة: أخضر — نسبة السعودة 31.4%.",
    },
    {
      key: "zatca", label: "Zakat / ZATCA Certificate", labelAr: "شهادة الزكاة والضريبة",
      value: "Valid to 30 Jun 2026",
      sourceDoc: "Zakat & Tax (ZATCA) Certificate", sourcePage: 1, confidence: "High",
      originalSnippet: "Zakat clearance certificate valid until 30/06/2026.",
    },
    {
      key: "turnover", label: "Turnover 2024", labelAr: "إيرادات 2024",
      value: "SAR 320,000,000",
      sourceDoc: "Audited Financials 2024", sourcePage: 8, confidence: "High",
      originalSnippet: "Total revenue for FY2024: SAR 320,142,880.",
    },
    {
      key: "current_ratio", label: "Current Ratio (2024)", labelAr: "نسبة التداول 2024",
      value: "0.9",
      sourceDoc: "Audited Financials 2024", sourcePage: 12, confidence: "Low",
      originalSnippet: "Current assets / current liabilities ≈ 0.9 (scanned Arabic ledger, low OCR confidence).",
      originalSnippetAr: "الأصول المتداولة ÷ الالتزامات المتداولة ≈ ٠٫٩",
    },
    {
      key: "iso", label: "ISO 9001 / 14001 / 45001", labelAr: "شهادات الأيزو",
      value: "All three present, valid",
      sourceDoc: "ISO 9001 / 14001 / 45001", sourcePage: 2, confidence: "High",
      originalSnippet: "Certificates ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 — issued by TÜV.",
    },
    {
      key: "ltifr", label: "LTIFR (12-mo)", labelAr: "معدل إصابات العمل",
      value: "0.4 per 200k hrs",
      sourceDoc: "Audited Financials 2024", sourcePage: 41, confidence: "Med",
      originalSnippet: "Lost-time injury frequency rate 0.4 per 200,000 man-hours (HSE annex).",
    },
    {
      key: "past_projects", label: "Relevant MEP Projects (last 5y)", labelAr: "مشاريع كهروميكانيكية",
      value: "3 projects, SAR 60M – 180M",
      sourceDoc: "Past Project — KAFD Tower MEP", sourcePage: 2, confidence: "High",
      originalSnippet: "KAFD Tower 12 MEP fit-out — SAR 178M, completed 2023.",
    },
  ];
  const rules: RuleResult[] = [
    { id: "r1", dimension: "Legal & Registration", label: "CR valid & activity matches", threshold: "Valid + MEP activity", actual: "Valid to 2027, MEP listed", pass: true, severity: "info", isHardGate: true, sourceDoc: "Commercial Registration", sourcePage: 1 },
    { id: "r2", dimension: "Legal & Registration", label: "SCA Grade ≥ required (Grade 2)", threshold: "≥ Grade 2", actual: "Grade 2", pass: true, severity: "info", isHardGate: true, sourceDoc: "SCA Classification Certificate", sourcePage: 3 },
    { id: "r3", dimension: "Localization & Compliance", label: "Nitaqat band Green or Platinum", threshold: "Green / Platinum", actual: "Green", pass: true, severity: "info", isHardGate: true, sourceDoc: "Saudization / Nitaqat Certificate", sourcePage: 1 },
    { id: "r4", dimension: "Localization & Compliance", label: "ZATCA certificate valid", threshold: "Valid", actual: "Valid to 2026", pass: true, severity: "info", isHardGate: false, sourceDoc: "Zakat & Tax (ZATCA) Certificate", sourcePage: 1 },
    { id: "r5", dimension: "Financial", label: "3-yr avg turnover ≥ SAR 150M", threshold: "≥ 150M", actual: "≈ 295M avg", pass: true, severity: "info", isHardGate: false, sourceDoc: "Audited Financials 2024", sourcePage: 8 },
    { id: "r6", dimension: "Financial", label: "Current ratio ≥ 1.0", threshold: "≥ 1.0", actual: "0.9", pass: false, severity: "warn", isHardGate: false, sourceDoc: "Audited Financials 2024", sourcePage: 12 },
    { id: "r7", dimension: "Technical & Experience", label: "≥ 2 relevant projects in scope", threshold: "≥ 2 MEP projects", actual: "3 projects", pass: true, severity: "info", isHardGate: false, sourceDoc: "Past Project — KAFD Tower MEP", sourcePage: 2 },
    { id: "r8", dimension: "HSE & Quality", label: "ISO 9001/14001/45001 valid", threshold: "All three valid", actual: "All present", pass: true, severity: "info", isHardGate: false, sourceDoc: "ISO 9001 / 14001 / 45001", sourcePage: 2 },
    { id: "r9", dimension: "HSE & Quality", label: "LTIFR ≤ 1.0", threshold: "≤ 1.0", actual: "0.4", pass: true, severity: "info", isHardGate: false, sourceDoc: "Audited Financials 2024", sourcePage: 41 },
    { id: "r10", dimension: "Legal Standing", label: "Not on debarment / blacklist", threshold: "Clean", actual: "Clean (Etimad lookup — stub)", pass: true, severity: "info", isHardGate: true },
  ];
  return {
    id: "v1",
    name: "Al-Rajhi Contracting",
    nameAr: "شركة الراجحي للمقاولات",
    status: "ready_for_review",
    documents: docs,
    extractedFields: fields,
    ruleResults: rules,
    scorecard: scorecardFor(rules, [
      { name: "Legal & Registration", nameAr: "السجل والترخيص", score: 95, weight: 20 },
      { name: "Localization & Compliance", nameAr: "التوطين والامتثال", score: 90, weight: 20 },
      { name: "Financial", nameAr: "المالية", score: 60, weight: 20 },
      { name: "Technical & Experience", nameAr: "الخبرة الفنية", score: 88, weight: 20 },
      { name: "HSE & Quality", nameAr: "الصحة والسلامة والجودة", score: 92, weight: 10 },
      { name: "Legal Standing", nameAr: "الوضع القانوني", score: 100, weight: 10 },
    ]),
    decision: "PENDING",
    auditLog: [
      { id: "a1", user: "system", timestamp: "2026-06-14 09:12", action: "Documents uploaded", detail: "9 of 10 required documents received." },
      { id: "a2", user: "asif.ai", timestamp: "2026-06-14 09:14", action: "AI extraction complete", detail: "9 fields extracted across 9 source documents." },
      { id: "a3", user: "system", timestamp: "2026-06-14 09:14", action: "Deterministic validation run", detail: "10 rules evaluated. 1 non-gate rule failed (Current ratio)." },
      { id: "a4", user: "system", timestamp: "2026-06-14 09:14", action: "Status changed", detail: "→ Ready for review" },
    ],
  };
}

function nesma(): Vendor {
  const docs: Document[] = [
    { id: "d1", type: "Commercial Registration", language: "en", pages: 4, status: "present" },
    { id: "d2", type: "SCA Classification Certificate", language: "ar", pages: 6, status: "present" },
    { id: "d3", type: "Saudization / Nitaqat Certificate", language: "ar", pages: 2, status: "present" },
    { id: "d4", type: "Zakat & Tax (ZATCA) Certificate", language: "en", pages: 2, status: "present" },
    { id: "d5", type: "Audited Financials 2024", language: "mixed", pages: 52, status: "present" },
    { id: "d6", type: "ISO 9001 / 14001 / 45001", language: "en", pages: 6, status: "present" },
    { id: "d7", type: "Bank Reference Letter", language: "en", pages: 1, status: "present" },
    { id: "d8", type: "Past Project Profiles (5)", language: "mixed", pages: 38, status: "present" },
  ];
  const fields: ExtractedField[] = [
    { key: "cr_number", label: "Commercial Registration No.", value: "1010098765 — valid to 2028", sourceDoc: "Commercial Registration", sourcePage: 1, confidence: "High", originalSnippet: "CR 1010098765 valid until 09-Jan-2028." },
    { key: "sca_grade", label: "SCA Classification", value: "Grade 1 — MEP", sourceDoc: "SCA Classification Certificate", sourcePage: 3, confidence: "High", originalSnippet: "Grade 1, Mechanical & Electrical." },
    { key: "nitaqat", label: "Nitaqat Band", value: "Platinum", sourceDoc: "Saudization / Nitaqat Certificate", sourcePage: 1, confidence: "High", originalSnippet: "Nitaqat band: PLATINUM — Saudization 42%." },
    { key: "turnover", label: "Turnover 2024", value: "SAR 1.2B", sourceDoc: "Audited Financials 2024", sourcePage: 7, confidence: "High", originalSnippet: "FY2024 revenue: SAR 1,201M." },
    { key: "current_ratio", label: "Current Ratio (2024)", value: "1.6", sourceDoc: "Audited Financials 2024", sourcePage: 11, confidence: "High", originalSnippet: "Current ratio = 1.6." },
    { key: "iso", label: "ISO 9001/14001/45001", value: "All valid", sourceDoc: "ISO 9001 / 14001 / 45001", sourcePage: 2, confidence: "High", originalSnippet: "All three certificates current." },
    { key: "past_projects", label: "Relevant MEP Projects", value: "5 projects, SAR 80M – 600M", sourceDoc: "Past Project Profiles (5)", sourcePage: 1, confidence: "High", originalSnippet: "Includes Red Sea Development, KAFD, PIF HQ." },
  ];
  const rules: RuleResult[] = [
    { id: "r1", dimension: "Legal & Registration", label: "CR valid & activity matches", threshold: "Valid + MEP", actual: "Valid to 2028", pass: true, severity: "info", isHardGate: true, sourceDoc: "Commercial Registration", sourcePage: 1 },
    { id: "r2", dimension: "Legal & Registration", label: "SCA Grade ≥ required (Grade 2)", threshold: "≥ Grade 2", actual: "Grade 1", pass: true, severity: "info", isHardGate: true, sourceDoc: "SCA Classification Certificate", sourcePage: 3 },
    { id: "r3", dimension: "Localization & Compliance", label: "Nitaqat band Green or Platinum", threshold: "Green / Platinum", actual: "Platinum", pass: true, severity: "info", isHardGate: true, sourceDoc: "Saudization / Nitaqat Certificate", sourcePage: 1 },
    { id: "r5", dimension: "Financial", label: "3-yr avg turnover ≥ SAR 150M", threshold: "≥ 150M", actual: "≈ 1.1B avg", pass: true, severity: "info", isHardGate: false, sourceDoc: "Audited Financials 2024", sourcePage: 7 },
    { id: "r6", dimension: "Financial", label: "Current ratio ≥ 1.0", threshold: "≥ 1.0", actual: "1.6", pass: true, severity: "info", isHardGate: false, sourceDoc: "Audited Financials 2024", sourcePage: 11 },
    { id: "r7", dimension: "Technical & Experience", label: "≥ 2 relevant projects", threshold: "≥ 2", actual: "5 projects", pass: true, severity: "info", isHardGate: false, sourceDoc: "Past Project Profiles (5)", sourcePage: 1 },
    { id: "r8", dimension: "HSE & Quality", label: "ISO trio valid", threshold: "All three", actual: "All valid", pass: true, severity: "info", isHardGate: false, sourceDoc: "ISO 9001 / 14001 / 45001", sourcePage: 2 },
    { id: "r10", dimension: "Legal Standing", label: "Not on debarment / blacklist", threshold: "Clean", actual: "Clean", pass: true, severity: "info", isHardGate: true },
  ];
  return {
    id: "v2",
    name: "Nesma & Partners",
    nameAr: "نسما وشركاه",
    status: "approved",
    documents: docs,
    extractedFields: fields,
    ruleResults: rules,
    scorecard: scorecardFor(rules, [
      { name: "Legal & Registration", nameAr: "السجل والترخيص", score: 98, weight: 20 },
      { name: "Localization & Compliance", nameAr: "التوطين والامتثال", score: 96, weight: 20 },
      { name: "Financial", nameAr: "المالية", score: 94, weight: 20 },
      { name: "Technical & Experience", nameAr: "الخبرة الفنية", score: 96, weight: 20 },
      { name: "HSE & Quality", nameAr: "الصحة والسلامة والجودة", score: 95, weight: 10 },
      { name: "Legal Standing", nameAr: "الوضع القانوني", score: 100, weight: 10 },
    ]),
    decision: "PASS",
    auditLog: [
      { id: "a1", user: "system", timestamp: "2026-06-12 11:02", action: "Documents uploaded", detail: "8 of 8 documents received." },
      { id: "a2", user: "asif.ai", timestamp: "2026-06-12 11:04", action: "AI extraction complete", detail: "7 fields extracted." },
      { id: "a3", user: "system", timestamp: "2026-06-12 11:04", action: "Deterministic validation run", detail: "All rules passed." },
      { id: "a4", user: "f.alharbi", timestamp: "2026-06-12 14:31", action: "Decision: APPROVED", detail: "PASS — all dimensions ≥ 94.", reason: "Strong financials, Platinum Nitaqat, Grade 1 SCA." },
    ],
  };
}

function gulf_mep(): Vendor {
  return {
    id: "v3",
    name: "Gulf MEP Solutions",
    nameAr: "حلول الخليج الكهروميكانيكية",
    status: "processing",
    documents: [
      { id: "d1", type: "Commercial Registration", language: "en", pages: 3, status: "present" },
      { id: "d2", type: "SCA Classification Certificate", language: "ar", pages: 5, status: "present" },
      { id: "d3", type: "Saudization / Nitaqat Certificate", language: "ar", pages: 2, status: "present" },
      { id: "d4", type: "Audited Financials 2024", language: "mixed", pages: 30, status: "present" },
      { id: "d5", type: "ISO 9001 / 14001 / 45001", language: "en", pages: 4, status: "present" },
      { id: "d6", type: "Bank Reference Letter", language: "en", pages: 0, status: "missing" },
    ],
    extractedFields: [],
    ruleResults: [],
    scorecard: emptyScorecard(),
    decision: "PENDING",
    auditLog: [
      { id: "a1", user: "system", timestamp: "2026-06-15 08:55", action: "Documents uploaded", detail: "5 of 6 documents received." },
    ],
  };
}

function desert_build(): Vendor {
  return {
    id: "v4",
    name: "Desert Build LLC",
    nameAr: "شركة صحراء البناء",
    status: "awaiting_docs",
    documents: [
      { id: "d1", type: "Commercial Registration", language: "en", pages: 3, status: "present" },
      { id: "d2", type: "SCA Classification Certificate", language: "ar", pages: 4, status: "present" },
      { id: "d3", type: "Saudization / Nitaqat Certificate", language: "ar", pages: 2, status: "present" },
      { id: "d4", type: "Audited Financials 2024", language: "mixed", pages: 28, status: "present" },
      { id: "d5", type: "ISO 9001 / 14001 / 45001", language: "en", pages: 0, status: "missing" },
      { id: "d6", type: "Bank Reference Letter", language: "en", pages: 1, status: "present" },
    ],
    extractedFields: [],
    ruleResults: [],
    scorecard: emptyScorecard(),
    decision: "PENDING",
    auditLog: [
      { id: "a1", user: "system", timestamp: "2026-06-15 13:21", action: "Documents uploaded", detail: "5 of 6 documents received." },
    ],
  };
}

// Mock extraction payload Desert Build will reveal — triggers Nitaqat Red hard gate.
export const DESERT_BUILD_EXTRACTED: Pick<Vendor, "extractedFields" | "ruleResults" | "scorecard"> = {
  extractedFields: [
    { key: "cr_number", label: "Commercial Registration No.", value: "1010881122 — valid to 2027", sourceDoc: "Commercial Registration", sourcePage: 1, confidence: "High", originalSnippet: "CR 1010881122 valid until 04-Aug-2027." },
    { key: "sca_grade", label: "SCA Classification", value: "Grade 2 — MEP", sourceDoc: "SCA Classification Certificate", sourcePage: 3, confidence: "High", originalSnippet: "Grade 2 — Mechanical & Electrical works." },
    { key: "nitaqat", label: "Nitaqat Band", value: "Red", valueAr: "أحمر", sourceDoc: "Saudization / Nitaqat Certificate", sourcePage: 1, confidence: "High", originalSnippet: "Nitaqat band: RED — Saudization 9.2%.", originalSnippetAr: "نطاق المنشأة: أحمر — نسبة السعودة ٩٫٢٪." },
    { key: "turnover", label: "Turnover 2024", value: "SAR 210M", sourceDoc: "Audited Financials 2024", sourcePage: 7, confidence: "High", originalSnippet: "FY2024 revenue: SAR 210M." },
    { key: "current_ratio", label: "Current Ratio (2024)", value: "1.3", sourceDoc: "Audited Financials 2024", sourcePage: 11, confidence: "High", originalSnippet: "Current ratio 1.3." },
  ],
  ruleResults: [
    { id: "r1", dimension: "Legal & Registration", label: "CR valid & activity matches", threshold: "Valid + MEP", actual: "Valid to 2027", pass: true, severity: "info", isHardGate: true, sourceDoc: "Commercial Registration", sourcePage: 1 },
    { id: "r2", dimension: "Legal & Registration", label: "SCA Grade ≥ required (Grade 2)", threshold: "≥ Grade 2", actual: "Grade 2", pass: true, severity: "info", isHardGate: true, sourceDoc: "SCA Classification Certificate", sourcePage: 3 },
    { id: "r3", dimension: "Localization & Compliance", label: "Nitaqat band Green or Platinum", threshold: "Green / Platinum", actual: "Red", pass: false, severity: "fail", isHardGate: true, sourceDoc: "Saudization / Nitaqat Certificate", sourcePage: 1 },
    { id: "r5", dimension: "Financial", label: "3-yr avg turnover ≥ SAR 150M", threshold: "≥ 150M", actual: "≈ 195M", pass: true, severity: "info", isHardGate: false, sourceDoc: "Audited Financials 2024", sourcePage: 7 },
    { id: "r6", dimension: "Financial", label: "Current ratio ≥ 1.0", threshold: "≥ 1.0", actual: "1.3", pass: true, severity: "info", isHardGate: false, sourceDoc: "Audited Financials 2024", sourcePage: 11 },
    { id: "r10", dimension: "Legal Standing", label: "Not on debarment / blacklist", threshold: "Clean", actual: "Clean", pass: true, severity: "info", isHardGate: true },
  ],
  scorecard: {
    dimensions: [
      { name: "Legal & Registration", nameAr: "السجل والترخيص", score: 92, weight: 20 },
      { name: "Localization & Compliance", nameAr: "التوطين والامتثال", score: 25, weight: 20 },
      { name: "Financial", nameAr: "المالية", score: 80, weight: 20 },
      { name: "Technical & Experience", nameAr: "الخبرة الفنية", score: 70, weight: 20 },
      { name: "HSE & Quality", nameAr: "الصحة والسلامة والجودة", score: 60, weight: 10 },
      { name: "Legal Standing", nameAr: "الوضع القانوني", score: 100, weight: 10 },
    ],
    total: 66,
    recommendation: "FAIL",
    hardGateHit: true,
    rationale: "Hard gate: Nitaqat band Red — package requires Green or Platinum. Weighted score is overridden.",
  },
};

export const GULF_MEP_EXTRACTED: Pick<Vendor, "extractedFields" | "ruleResults" | "scorecard"> = {
  extractedFields: [
    { key: "cr_number", label: "Commercial Registration No.", value: "1010554433 — valid to 2027", sourceDoc: "Commercial Registration", sourcePage: 1, confidence: "High", originalSnippet: "CR 1010554433 valid until 22-Nov-2027." },
    { key: "sca_grade", label: "SCA Classification", value: "Grade 2 — MEP", sourceDoc: "SCA Classification Certificate", sourcePage: 3, confidence: "High", originalSnippet: "Grade 2 in Mechanical & Electrical." },
    { key: "nitaqat", label: "Nitaqat Band", value: "Green", sourceDoc: "Saudization / Nitaqat Certificate", sourcePage: 1, confidence: "High", originalSnippet: "Nitaqat band: GREEN — Saudization 26%." },
    { key: "turnover", label: "Turnover 2024", value: "SAR 180M", sourceDoc: "Audited Financials 2024", sourcePage: 6, confidence: "Med", originalSnippet: "Revenue 2024 ≈ SAR 180M." },
    { key: "current_ratio", label: "Current Ratio (2024)", value: "1.1", sourceDoc: "Audited Financials 2024", sourcePage: 10, confidence: "Med", originalSnippet: "Current ratio 1.1." },
  ],
  ruleResults: [
    { id: "r1", dimension: "Legal & Registration", label: "CR valid & activity matches", threshold: "Valid + MEP", actual: "Valid", pass: true, severity: "info", isHardGate: true, sourceDoc: "Commercial Registration", sourcePage: 1 },
    { id: "r2", dimension: "Legal & Registration", label: "SCA Grade ≥ required (Grade 2)", threshold: "≥ Grade 2", actual: "Grade 2", pass: true, severity: "info", isHardGate: true, sourceDoc: "SCA Classification Certificate", sourcePage: 3 },
    { id: "r3", dimension: "Localization & Compliance", label: "Nitaqat band Green or Platinum", threshold: "Green / Platinum", actual: "Green", pass: true, severity: "info", isHardGate: true, sourceDoc: "Saudization / Nitaqat Certificate", sourcePage: 1 },
    { id: "r5", dimension: "Financial", label: "3-yr avg turnover ≥ SAR 150M", threshold: "≥ 150M", actual: "≈ 165M", pass: true, severity: "info", isHardGate: false, sourceDoc: "Audited Financials 2024", sourcePage: 6 },
    { id: "r6", dimension: "Financial", label: "Current ratio ≥ 1.0", threshold: "≥ 1.0", actual: "1.1", pass: true, severity: "info", isHardGate: false, sourceDoc: "Audited Financials 2024", sourcePage: 10 },
  ],
  scorecard: {
    dimensions: [
      { name: "Legal & Registration", nameAr: "السجل والترخيص", score: 90, weight: 20 },
      { name: "Localization & Compliance", nameAr: "التوطين والامتثال", score: 82, weight: 20 },
      { name: "Financial", nameAr: "المالية", score: 78, weight: 20 },
      { name: "Technical & Experience", nameAr: "الخبرة الفنية", score: 72, weight: 20 },
      { name: "HSE & Quality", nameAr: "الصحة والسلامة والجودة", score: 70, weight: 10 },
      { name: "Legal Standing", nameAr: "الوضع القانوني", score: 95, weight: 10 },
    ],
    total: 81,
    recommendation: "PASS",
    hardGateHit: false,
    rationale: "All hard gates clear. Weighted score 81 above PASS threshold (≥ 80).",
  },
};

function emptyScorecard(): Scorecard {
  return {
    dimensions: [
      { name: "Legal & Registration", nameAr: "السجل والترخيص", score: 0, weight: 20 },
      { name: "Localization & Compliance", nameAr: "التوطين والامتثال", score: 0, weight: 20 },
      { name: "Financial", nameAr: "المالية", score: 0, weight: 20 },
      { name: "Technical & Experience", nameAr: "الخبرة الفنية", score: 0, weight: 20 },
      { name: "HSE & Quality", nameAr: "الصحة والسلامة والجودة", score: 0, weight: 10 },
      { name: "Legal Standing", nameAr: "الوضع القانوني", score: 0, weight: 10 },
    ],
    total: 0,
    recommendation: "PENDING",
    hardGateHit: false,
    rationale: "Awaiting AI extraction.",
  };
}

export function scorecardFor(rules: RuleResult[], dims: DimensionScore[]): Scorecard {
  const hardGateHit = rules.some((r) => r.isHardGate && !r.pass);
  const total = Math.round(
    dims.reduce((acc, d) => acc + (d.score * d.weight) / 100, 0),
  );
  let recommendation: Recommendation = "PASS";
  let rationale = "";
  if (hardGateHit) {
    recommendation = "FAIL";
    rationale = "Hard gate triggered — overrides weighted score.";
  } else if (total >= 80 && rules.every((r) => r.pass)) {
    recommendation = "PASS";
    rationale = `Weighted score ${total}. All rules satisfied.`;
  } else if (total >= 70) {
    recommendation = "CONDITIONAL";
    const failed = rules.filter((r) => !r.pass).map((r) => r.label).join("; ");
    rationale = `Weighted score ${total}. Non-gate failures: ${failed || "none"}. Conditions recommended.`;
  } else {
    recommendation = "FAIL";
    rationale = `Weighted score ${total} below threshold.`;
  }
  return { dimensions: dims, total, recommendation, hardGateHit, rationale };
}

export function buildSeedPackage(): Package {
  return {
    id: "pkg1",
    name: "Diriyah — MEP Subcontractors",
    nameAr: "حزمة الدرعية — مقاولو الكهروميكانيكية",
    asset: "Diriyah Gate",
    assetAr: "بوابة الدرعية",
    scopeCode: "MEP-SUB",
    valueBand: "SAR 50–150M",
    rubricId: "KSA-Standard",
    vendors: [al_rajhi(), nesma(), gulf_mep(), desert_build()],
  };
}

// ---------- Single-function extraction stub (drop a real LLM call here in v2) ----------
export async function runExtraction(vendorId: string): Promise<
  Pick<Vendor, "extractedFields" | "ruleResults" | "scorecard">
> {
  // Simulate ASIF / LLM latency. In v2 replace body with real API call.
  await new Promise((r) => setTimeout(r, 2400));
  if (vendorId === "v4") return DESERT_BUILD_EXTRACTED;
  if (vendorId === "v3") return GULF_MEP_EXTRACTED;
  throw new Error("No mocked extraction for vendor " + vendorId);
}
