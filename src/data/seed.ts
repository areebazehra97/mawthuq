import type {
  AuditRecord,
  BackendInvitation,
  BackendPackage,
  BackendProject,
  BackendState,
  ActivityFeedItem,
  DocumentStatus,
  ExtractionSourceMode,
  ExtractedField,
  NavigationItem,
  PackageSetupConfig,
  Project,
  ProjectConfig,
  ReviewerRole,
  VendorPackageApplication,
  VendorExtraction,
  VendorDocument,
  VendorInvitation,
  VendorRecord,
} from "@/types";
import { seededPkgLinks } from "@/data/package-applications";

export const vendorStorageKey = "mawthuq-demo-vendors";
export const packageConfigStorageKey = "mawthuq-package-config";
export const vendorDocumentsStorageKey = "mawthuq-vendor-documents";
export const auditRecordsStorageKey = "mawthuq-audit-records";
export const fieldReviewStorageKey = "mawthuq-field-review-state";
export const ruleReviewStorageKey = "mawthuq-rule-review-state";
export const reviewerRoles: ReviewerRole[] = [
  "Procurement Analyst",
  "Procurement Manager",
  "Finance Reviewer",
  "HSE Reviewer",
  "PMO Director",
];
export const supportedDocumentTypes = [
  "Commercial Registration",
  "Contractor Classification",
  "ZATCA Certificate",
  "Saudization Evidence",
  "Audited Financial Statements",
  "ISO Certificates",
  "HSE Reports",
  "Project References",
  "Local Content Documents",
] as const;
export const aiProgressStages = [
  "Classifying Documents",
  "Detecting Arabic / English Content",
  "Extracting Fields",
  "Generating Citations",
  "Running Cross-Document Validation",
  "Preparing Review Queue",
] as const;

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/",
    description: "Executive portfolio health and review velocity.",
  },
  {
    label: "Projects",
    path: "/projects",
    description: "Manage packages, review applicants, and build shortlists.",
  },
  {
    label: "Vendor Master",
    path: "/vendors",
    description: "Global registry of qualified vendors, doc health, and risk status.",
  },
];

const proj001Config: ProjectConfig = {
  categories: [
    {
      name: "General Contracting",
      subCategories: ["Civil Works", "Building Construction", "Demolition"],
      requiredDocuments: [
        "Commercial Registration", "Contractor Classification", "ZATCA Certificate",
        "Audited Financial Statements", "Project References", "ISO Certificates",
        "HSE Reports", "Local Content Documents",
      ],
    },
    {
      name: "MEP",
      subCategories: ["Mechanical", "Electrical", "Plumbing"],
      requiredDocuments: [
        "Commercial Registration", "ZATCA Certificate", "ISO Certificates",
        "Saudization Evidence", "Project References", "HSE Reports",
      ],
    },
    {
      name: "Civil & Trading",
      subCategories: ["Earthworks", "Road Works", "Trading"],
      requiredDocuments: [
        "Commercial Registration", "Contractor Classification",
        "ZATCA Certificate", "Audited Financial Statements",
      ],
    },
  ],
  scoringWeights: { compliance: 35, financial: 25, technical: 20, hse: 10, localization: 10 },
  decisionThresholds: { pass: 80, conditionalMin: 60, conditionalMax: 79 },
  hardGateRules: [
    "Commercial Registration must be valid on review date",
    "ZATCA certificate is mandatory for tender release",
    "At least 3 relevant project references must be evidenced",
    "Any expired core certification triggers manual exception review",
  ],
  expiryReminderDays: [30, 60, 90],
};

export const seededProjects: Project[] = [
  {
    id: "proj-001",
    name: "North Riyadh Integrated Development",
    arabicName: "مشروع شمال الرياض المتكامل",
    location: "Riyadh, KSA",
    packageName: "Main Works Prequalification Package",
    workCategory: "Building & Civil Works",
    packageValueBand: "SAR 250M – SAR 1B",
    status: "Active",
    categories: ["General Contracting", "MEP", "Civil & Trading"],
    submittedCount: 3,
    totalInvited: 7,
    scope: "Integrated residential and commercial development — main civil, structural, MEP, and fit-out works across 4 towers and ground-floor podium retail.",
    timeline: "Q4 2026 – Q3 2028",
    registrationDeadline: "2026-08-15",
    reviewers: ["Procurement Manager", "Finance Reviewer", "HSE Reviewer"],
    requiredExperience: [
      "Minimum 10 years operating in the KSA construction market",
      "Completed ≥ 3 comparable projects (SAR 250M+) within the last 7 years",
      "Demonstrated experience in residential high-rise construction",
    ],
    requiredCertifications: [
      "ISO 9001:2015 Quality Management System",
      "ISO 45001 Occupational Health & Safety",
      "ZATCA active tax compliance certificate",
      "Saudi Contractors Authority — Class I or II",
    ],
    config: proj001Config,
  },
  {
    id: "proj-002",
    name: "NEOM Linear City — Groundworks",
    arabicName: "نيوم — المدينة الخطية: أعمال الأساسات",
    location: "Tabuk, KSA",
    packageName: "Civil Groundworks Prequalification",
    workCategory: "Civil & Infrastructure",
    packageValueBand: "SAR 1B+",
    status: "Tendering",
    categories: ["Civil & Infrastructure", "Structural Steel", "HVAC"],
    submittedCount: 0,
    totalInvited: 4,
  },
  {
    id: "proj-003",
    name: "Diriyah Gate — Hospitality Zone",
    arabicName: "بوابة الدرعية — المنطقة الفندقية",
    location: "Diriyah, Riyadh",
    packageName: "Hospitality Fit-Out Prequalification",
    workCategory: "Fit-Out & Interiors",
    packageValueBand: "SAR 100M – SAR 250M",
    status: "Planning",
    categories: ["Facade & Cladding", "MEP", "Fire Protection"],
    submittedCount: 0,
    totalInvited: 0,
  },
];

export const seededVendors: VendorRecord[] = [
  {
    id: "vendor-001",
    name: "Al Bina Al Saudi Contracting",
    arabicName: "البناء السعودي للمقاولات",
    city: "Riyadh",
    classification: "Class I Building & Civil Works",
    primaryDiscipline: "General Contracting",
    projectId: "proj-001",
    status: "PASS",
    reviewStage: "Approved",
    packageHealth: "Fully evidenced",
    score: 92,
    documentsSubmitted: 24,
    openIssues: 1,
    expiryRisk: "Low",
    submittedAt: "12 Jun 2026",
    summary:
      "Strong commercial standing, current certificates, and well-supported project references suitable for immediate tender invitation.",
    metrics: [
      { label: "Commercial Registration", value: "Valid until Mar 2027", tone: "success" },
      { label: "Saudization", value: "Above target band", tone: "success" },
      { label: "Revenue Capacity", value: "SAR 1.4B trailing", tone: "success" },
      { label: "HSE Record", value: "1 observation", tone: "neutral" },
    ],
    reviewItems: [
      { label: "ZATCA Certificate", state: "Complete", evidence: "Certificate dated 28 May 2026" },
      { label: "Classification Verification", state: "Complete", evidence: "Municipal portal extract attached" },
      { label: "Local Content Evidence", state: "Pending", evidence: "Narrative uploaded; final reviewer note pending" },
    ],
    timeline: [
      { title: "Package submitted", detail: "24 files uploaded by vendor portal", when: "12 Jun 2026" },
      { title: "Finance review cleared", detail: "Liquidity and backlog within threshold", when: "13 Jun 2026" },
      { title: "Manager approved", detail: "Passed to approved vendor list", when: "15 Jun 2026" },
    ],
  },
  {
    id: "vendor-002",
    name: "Najd MEP Contractors",
    arabicName: "مقاولو نجد للأعمال الميكانيكية والكهربائية",
    city: "Dammam",
    classification: "Class II Electro-Mechanical",
    primaryDiscipline: "MEP",
    projectId: "proj-001",
    status: "CONDITIONAL",
    reviewStage: "In Review",
    packageHealth: "Material gaps tracked",
    score: 74,
    documentsSubmitted: 19,
    openIssues: 4,
    expiryRisk: "Medium",
    submittedAt: "10 Jun 2026",
    summary:
      "Technically capable but awaiting clarification on expiring ISO coverage and one incomplete reference package before release to tender.",
    metrics: [
      { label: "Commercial Registration", value: "Valid until Nov 2026", tone: "success" },
      { label: "Saudization", value: "Borderline target band", tone: "warning" },
      { label: "Revenue Capacity", value: "SAR 420M trailing", tone: "neutral" },
      { label: "ISO 45001", value: "Expires in 42 days", tone: "warning" },
    ],
    reviewItems: [
      { label: "Financial Statements", state: "Complete", evidence: "FY2025 audited statements uploaded" },
      { label: "Project Reference No. 3", state: "Flagged", evidence: "Completion certificate missing signature page" },
      { label: "ISO Renewal", state: "Pending", evidence: "Renewal letter uploaded without final certificate" },
    ],
    timeline: [
      { title: "Package submitted", detail: "19 files uploaded by vendor coordinator", when: "10 Jun 2026" },
      { title: "AI extraction completed", detail: "2 low-confidence fields routed to analyst", when: "11 Jun 2026" },
      { title: "Conditional recommendation", detail: "Awaiting management exception decision", when: "15 Jun 2026" },
    ],
  },
  {
    id: "vendor-003",
    name: "Red Sands Trading & Contracting",
    arabicName: "الرمال الحمراء للتجارة والمقاولات",
    city: "Jeddah",
    classification: "Class III Mixed Services",
    primaryDiscipline: "Civil & Trading",
    projectId: "proj-001",
    status: "FAIL",
    reviewStage: "Rejected",
    packageHealth: "Critical evidence missing",
    score: 48,
    documentsSubmitted: 13,
    openIssues: 7,
    expiryRisk: "High",
    submittedAt: "08 Jun 2026",
    summary:
      "Key regulatory and financial evidence is either missing or expired, creating an unacceptably weak basis for tender invitation.",
    metrics: [
      { label: "Commercial Registration", value: "Expired in Apr 2026", tone: "danger" },
      { label: "Saudization", value: "Below target band", tone: "danger" },
      { label: "Revenue Capacity", value: "Incomplete statements", tone: "warning" },
      { label: "HSE Record", value: "3 incidents disclosed", tone: "danger" },
    ],
    reviewItems: [
      { label: "ZATCA Certificate", state: "Missing", evidence: "No valid certificate found in package" },
      { label: "Financial Statements", state: "Flagged", evidence: "Unsigned management accounts only" },
      { label: "Project References", state: "Missing", evidence: "No owner letters or completion records attached" },
    ],
    timeline: [
      { title: "Package submitted", detail: "13 files uploaded via email intake", when: "08 Jun 2026" },
      { title: "Compliance gap detected", detail: "Regulatory expiry cluster triggered analyst review", when: "09 Jun 2026" },
      { title: "Rejected", detail: "Manager declined release to tender pool", when: "14 Jun 2026" },
    ],
  },
];

export const seededActivityFeed: ActivityFeedItem[] = [
  {
    id: "activity-001",
    title: "Vendor submitted package",
    detail:
      "Al Bina Al Saudi Contracting uploaded a complete prequalification package with 24 supporting files.",
    when: "16 Jun 2026, 09:10",
    tone: "neutral",
  },
  {
    id: "activity-002",
    title: "AI extraction completed",
    detail:
      "Najd MEP Contractors package was parsed and two low-confidence fields were routed to analyst validation.",
    when: "16 Jun 2026, 10:25",
    tone: "neutral",
  },
  {
    id: "activity-003",
    title: "Human review approved",
    detail:
      "Finance and procurement sign-off completed for Al Bina Al Saudi Contracting with a PASS recommendation.",
    when: "16 Jun 2026, 12:05",
    tone: "success",
  },
  {
    id: "activity-004",
    title: "Vendor sent to Bid Analysis",
    detail:
      "Approved vendor record for Al Bina Al Saudi Contracting was pushed downstream to the bid readiness workflow.",
    when: "16 Jun 2026, 13:40",
    tone: "success",
  },
];

export const seededPackageConfig: PackageSetupConfig = {
  packageName: "Main Works Prequalification Package",
  projectName: "North Riyadh Integrated Development",
  workCategory: "Building & Civil Works",
  packageValueBand: "SAR 250M - SAR 1B",
  requiredDocuments: [
    "Commercial Registration",
    "Contractor Classification",
    "ZATCA Certificate",
    "Saudization Evidence",
    "Audited Financial Statements",
    "ISO 9001 / ISO 45001",
    "HSE Incident Record",
    "Project References",
    "Local Content Evidence",
  ],
  hardGateRules: [
    "Commercial Registration must be valid on review date",
    "ZATCA certificate is mandatory for tender release",
    "At least 3 relevant project references must be evidenced",
    "Any expired core certification triggers manual exception review",
  ],
  scoringWeights: {
    compliance: 35,
    financial: 25,
    technical: 20,
    hse: 10,
    localization: 10,
  },
  decisionThresholds: {
    pass: 80,
    conditionalMin: 60,
    conditionalMax: 79,
  },
};

function buildDocument(
  id: string,
  vendorId: string,
  name: string,
  documentType: string,
  uploadDate: string,
  language: VendorDocument["language"],
  expiryDate: string,
  status: DocumentStatus,
  confidenceScore: number,
  sizeLabel: string,
  source: VendorDocument["source"],
  extras: Partial<VendorDocument> = {},
): VendorDocument {
  return {
    id,
    vendorId,
    name,
    documentType,
    uploadDate,
    language,
    expiryDate,
    status,
    confidenceScore,
    sizeLabel,
    source,
    version: 1,
    isCurrentVersion: true,
    ...extras,
  };
}

export const seededVendorDocuments: VendorDocument[] = [
  // ── vendor-001: Al Bina Al Saudi Contracting ──────────────────────────────
  buildDocument(
    "doc-001", "vendor-001", "ABS_Commercial_Registration_2026.pdf",
    "Commercial Registration", "12 Jun 2026", "Arabic", "2027-03-15",
    "Valid", 98, "2.1 MB", "Demo Pack",
    { issueDate: "2025-03-15", issuingAuthority: "Ministry of Commerce" },
  ),
  buildDocument(
    "doc-002", "vendor-001", "ABS_Classification_Class_I.pdf",
    "Contractor Classification", "12 Jun 2026", "Arabic", "2026-12-31",
    "Valid", 96, "1.4 MB", "Demo Pack",
    { issueDate: "2026-01-01", issuingAuthority: "Saudi Contractors Authority" },
  ),
  buildDocument(
    "doc-003", "vendor-001", "ABS_ZATCA_Certificate.pdf",
    "ZATCA Certificate", "12 Jun 2026", "Bilingual", "2027-05-28",
    "Valid", 97, "860 KB", "Demo Pack",
    { issueDate: "2026-05-28", issuingAuthority: "Zakat, Tax and Customs Authority" },
  ),
  buildDocument(
    "doc-004", "vendor-001", "ABS_Audited_Financials_FY2025.pdf",
    "Audited Financial Statements", "12 Jun 2026", "English", "2026-12-31",
    "Valid", 95, "4.6 MB", "Demo Pack",
    { issueDate: "2026-02-15", issuingAuthority: "KPMG Al Fozan & Partners" },
  ),
  buildDocument(
    "doc-005", "vendor-001", "ABS_ISO_Certificates.pdf",
    "ISO Certificates", "12 Jun 2026", "English", "2027-01-30",
    "Valid", 94, "1.8 MB", "Demo Pack",
    { issueDate: "2026-01-30", issuingAuthority: "Bureau Veritas" },
  ),
  buildDocument(
    "doc-006", "vendor-001", "ABS_Local_Content_Statement.pdf",
    "Local Content Documents", "12 Jun 2026", "Bilingual", "N/A",
    "Ambiguous", 78, "1.1 MB", "Demo Pack",
    {
      issueDate: "2026-06-10",
      issuingAuthority: "IKTVA Portal",
      reviewerComments: "Supporting schedules incomplete — follow-up required before final approval",
    },
  ),

  // ── vendor-002: Najd MEP Contractors ────────────────────────────────────
  buildDocument(
    "doc-101", "vendor-002", "Najd_CR_2026.pdf",
    "Commercial Registration", "10 Jun 2026", "Arabic", "2026-11-18",
    "Valid", 96, "1.9 MB", "Demo Pack",
    { issueDate: "2025-11-18", issuingAuthority: "Ministry of Commerce" },
  ),
  buildDocument(
    "doc-102", "vendor-002", "Najd_ZATCA.pdf",
    "ZATCA Certificate", "10 Jun 2026", "Bilingual", "2026-10-20",
    "Valid", 92, "770 KB", "Demo Pack",
    { issueDate: "2025-10-20", issuingAuthority: "Zakat, Tax and Customs Authority" },
  ),
  buildDocument(
    "doc-103", "vendor-002", "Najd_ISO_45001_Renewal_Letter.pdf",
    "ISO Certificates", "10 Jun 2026", "English", "2026-07-28",
    "Ambiguous", 71, "910 KB", "Demo Pack",
    {
      issueDate: "2026-06-10",
      issuingAuthority: "Bureau Veritas",
      reviewerComments: "Renewal letter accepted pending final certificate — escalated to Procurement Manager",
    },
  ),
  buildDocument(
    "doc-104", "vendor-002", "Najd_HSE_2025.pdf",
    "HSE Reports", "10 Jun 2026", "English", "2026-12-31",
    "Valid", 89, "1.3 MB", "Demo Pack",
    { issueDate: "2026-01-01", issuingAuthority: "Internal HSE Department" },
  ),
  buildDocument(
    "doc-105", "vendor-002", "Najd_Project_References.pdf",
    "Project References", "10 Jun 2026", "English", "N/A",
    "Ambiguous", 74, "2.7 MB", "Demo Pack",
    {
      issueDate: "2026-06-05",
      issuingAuthority: "Various Project Owners",
      reviewerComments: "Reference 3 lacks signed completion certificate — owner confirmation pending",
    },
  ),
  buildDocument(
    "doc-106", "vendor-002", "Najd_Saudization_Evidence.pdf",
    "Saudization Evidence", "10 Jun 2026", "Arabic", "2026-09-30",
    "Valid", 88, "640 KB", "Demo Pack",
    { issueDate: "2026-04-01", issuingAuthority: "Ministry of Human Resources" },
  ),

  // ── vendor-003: Red Sands (historical v1 + current v2 for CR) ───────────
  {
    id: "doc-201-v1",
    vendorId: "vendor-003",
    name: "RedSands_CR_2025_Expired.pdf",
    documentType: "Commercial Registration",
    uploadDate: "05 Jun 2025",
    issueDate: "2024-04-10",
    issuingAuthority: "Ministry of Commerce",
    language: "Arabic",
    expiryDate: "2025-04-10",
    status: "Expired",
    confidenceScore: 92,
    sizeLabel: "1.1 MB",
    source: "Demo Pack",
    version: 1,
    isCurrentVersion: false,
    supersededBy: "doc-201",
  },
  buildDocument(
    "doc-201", "vendor-003", "RedSands_CR_Expired_2026.pdf",
    "Commercial Registration", "08 Jun 2026", "Arabic", "2026-04-10",
    "Expired", 95, "1.2 MB", "Demo Pack",
    {
      issueDate: "2025-04-10",
      issuingAuthority: "Ministry of Commerce",
      version: 2,
      supersedes: "doc-201-v1",
      reviewerComments: "Both versions expired — replacement mandatory before approval can proceed",
    },
  ),
  buildDocument(
    "doc-202", "vendor-003", "RedSands_Financials_Draft.pdf",
    "Audited Financial Statements", "08 Jun 2026", "English", "2025-12-31",
    "Ambiguous", 63, "3.9 MB", "Demo Pack",
    {
      issueDate: "2026-01-15",
      issuingAuthority: "Unaudited — Management Accounts",
      reviewerComments: "Draft management accounts only — signed audit opinion required",
    },
  ),
  buildDocument(
    "doc-203", "vendor-003", "RedSands_HSE_Incidents.pdf",
    "HSE Reports", "08 Jun 2026", "English", "2025-12-31",
    "Expired", 81, "1.6 MB", "Demo Pack",
    {
      issueDate: "2026-01-01",
      issuingAuthority: "Internal HSE Department",
      reviewerComments: "3 recordable incidents noted — HSE reviewer attention required",
    },
  ),
  buildDocument(
    "doc-204", "vendor-003", "RedSands_Local_Content_Note.pdf",
    "Local Content Documents", "08 Jun 2026", "Bilingual", "N/A",
    "Missing", 45, "220 KB", "Demo Pack",
    { issueDate: "2026-06-08", issuingAuthority: "N/A" },
  ),
];

function extracted(
  label: string,
  value: string,
  confidence: number,
  sourceDocument: string,
  pageNumber: number,
  evidenceSnippet: string,
): ExtractedField {
  return {
    label,
    value,
    confidence,
    sourceDocument,
    pageNumber,
    evidenceSnippet,
  };
}

export const seededAiExtractions: Record<string, ExtractedField[]> = {
  "vendor-001": [
    extracted("Legal Company Name", "Al Bina Al Saudi Contracting", 99, "CR Certificate", 1, "Al Bina Al Saudi Contracting Co. listed as the registered legal entity."),
    extracted("CR Number", "1010123456", 98, "CR Certificate", 2, "Commercial Registration No. 1010123456 appears in the registration header."),
    extracted("CR Expiry", "15 Mar 2027", 97, "CR Certificate", 2, "Registration validity shown through 15/03/2027."),
    extracted("Contractor Classification Grade", "Class I", 96, "Classification Certificate", 1, "Contractor classified under Grade I Building and Civil Works."),
    extracted("Nitaqat Category", "Green - High", 88, "Saudization Evidence", 3, "Entity falls within the Green High compliance band."),
    extracted("ZATCA Validity", "Valid until 28 May 2027", 97, "ZATCA Certificate", 1, "Tax and customs certificate remains valid to 28/05/2027."),
    extracted("Revenue", "SAR 1.4B", 95, "Audited Financial Statements", 14, "Total annual revenue reported at SAR 1,402,000,000."),
    extracted("Current Ratio", "1.82", 92, "Audited Financial Statements", 18, "Current assets divided by current liabilities equals 1.82."),
    extracted("ISO 9001", "Certified", 94, "ISO Certificates", 2, "ISO 9001:2015 certificate active and issued to the contractor."),
    extracted("ISO 14001", "Certified", 91, "ISO Certificates", 4, "ISO 14001 environmental management certificate is current."),
    extracted("ISO 45001", "Certified", 94, "ISO Certificates", 6, "ISO 45001 occupational health and safety certificate is valid."),
    extracted("HSE Record", "1 minor observation, no LTIs", 86, "HSE Reports", 5, "The annual HSE summary notes one observation and zero lost-time incidents."),
    extracted("Relevant Projects", "7 matched projects", 89, "Project References", 9, "Seven completed projects exceed the required scale and scope band."),
    extracted("Local Content Status", "Documented and pending final reviewer confirmation", 78, "Local Content Statement", 3, "Local content declaration submitted with supplier narrative and schedule."),
  ],
  "vendor-002": [
    extracted("Legal Company Name", "Najd MEP Contractors", 98, "CR Certificate", 1, "Najd MEP Contractors shown as the registered trading name."),
    extracted("CR Number", "2051148723", 97, "CR Certificate", 2, "Commercial Registration No. 2051148723 visible in the certificate body."),
    extracted("CR Expiry", "18 Nov 2026", 96, "CR Certificate", 2, "Registration remains valid through 18/11/2026."),
    extracted("Contractor Classification Grade", "Class II", 94, "Classification Certificate", 1, "Electro-mechanical contractor classification listed as Grade II."),
    extracted("Nitaqat Category", "Green", 84, "Saudization Evidence", 2, "Saudization report indicates the entity is in the Green range."),
    extracted("ZATCA Validity", "Valid until 20 Oct 2026", 93, "ZATCA Certificate", 1, "ZATCA compliance certificate expires on 20/10/2026."),
    extracted("Revenue", "SAR 420M", 90, "Audited Financial Statements", 12, "Revenue for the audited period totals SAR 420,000,000."),
    extracted("Current Ratio", "1.19", 88, "Audited Financial Statements", 17, "Current ratio calculated from the balance sheet note is 1.19."),
    extracted("ISO 9001", "Certified", 89, "ISO Certificates", 2, "Quality management certificate remains active."),
    extracted("ISO 14001", "Certified", 86, "ISO Certificates", 4, "Environmental certificate is current at time of review."),
    extracted("ISO 45001", "Renewal in progress", 71, "ISO Renewal Letter", 1, "Renewal letter references the 45001 recertification still under issuance."),
    extracted("HSE Record", "2 recordables, no fatalities", 83, "HSE Reports", 7, "HSE record summary lists two recordable incidents and no fatalities."),
    extracted("Relevant Projects", "4 matched projects, 1 incomplete reference", 76, "Project References", 11, "Four projects align to MEP scope; one reference package lacks final owner sign-off."),
    extracted("Local Content Status", "Partially evidenced", 74, "Local Content Submission", 2, "Local content narrative submitted with limited supporting schedules."),
  ],
  "vendor-003": [
    extracted("Legal Company Name", "Red Sands Trading & Contracting", 97, "CR Certificate", 1, "Red Sands Trading & Contracting appears as the legal company name."),
    extracted("CR Number", "4032237810", 96, "CR Certificate", 2, "Commercial Registration No. 4032237810 displayed on page 2."),
    extracted("CR Expiry", "10 Apr 2026", 97, "CR Certificate", 2, "Registration validity expired on 10/04/2026."),
    extracted("Contractor Classification Grade", "Class III", 90, "Classification Certificate", 1, "Mixed services contractor classification shown as Grade III."),
    extracted("Nitaqat Category", "Yellow", 76, "Saudization Evidence", 2, "Saudization printout places the entity in the Yellow band."),
    extracted("ZATCA Validity", "No valid certificate found", 68, "Tax Compliance Correspondence", 1, "Submitted correspondence references renewal but no active certificate number is shown."),
    extracted("Revenue", "Management accounts only", 64, "Financial Statements Draft", 6, "Draft management accounts included without signed audit opinion."),
    extracted("Current Ratio", "0.91", 61, "Financial Statements Draft", 10, "Working capital note implies a current ratio below 1.0."),
    extracted("ISO 9001", "Not evidenced", 58, "Quality Certificate Index", 1, "Index page references a certificate, but the active certificate copy is absent."),
    extracted("ISO 14001", "Not evidenced", 57, "Quality Certificate Index", 1, "No complete ISO 14001 certificate pages were included in the pack."),
    extracted("ISO 45001", "Not evidenced", 57, "Quality Certificate Index", 1, "The submission does not contain a full ISO 45001 certificate."),
    extracted("HSE Record", "3 incidents disclosed", 84, "HSE Incident Report", 4, "The report records three incidents during the previous review year."),
    extracted("Relevant Projects", "2 weakly matched projects", 66, "Project Reference Summary", 3, "Only two projects are listed and neither includes final owner confirmation."),
    extracted("Local Content Status", "Insufficient evidence", 62, "Local Content Note", 1, "A brief local content note is included without measurable supporting schedules."),
  ],
};

export const liveSupportedDocumentTypes = [
  "Commercial Registration",
  "Contractor Classification",
  "ZATCA Certificate",
  "Audited Financial Statements",
  "ISO Certificates",
  "Project References",
] as const;

export const seededVendorExtractions: VendorExtraction[] = Object.entries(
  seededAiExtractions,
).map(([vendorId, fields]) => ({
  vendorId,
  fields: fields.map((field) => ({
    ...field,
    sourceMode: "seeded" as ExtractionSourceMode,
  })),
  sourceMode: "seeded",
  extractionStatus: "complete",
  lastRunAt: null,
  warning: "Seeded demo evidence loaded.",
  qualityStatus: "Fallback used",
  promptVersion: "seeded-demo-v1",
  completedAt: null,
  supportedLiveDocumentTypes: [...liveSupportedDocumentTypes],
}));

export const seededAuditRecords: AuditRecord[] = [
  {
    id: "audit-001",
    vendorId: "vendor-001",
    timestamp: "16 Jun 2026, 09:22",
    actor: "System",
    title: "AI extracted Contractor Grade.",
    detail: "Classification Certificate cited on p.1 for Grade I determination.",
  },
  {
    id: "audit-002",
    vendorId: "vendor-002",
    timestamp: "16 Jun 2026, 10:42",
    actor: "System",
    title: "Rules engine flagged expiring ISO 45001.",
    detail: "Renewal letter produced a review state for certification continuity.",
  },
  {
    id: "audit-003",
    vendorId: "vendor-003",
    timestamp: "16 Jun 2026, 11:05",
    actor: "System",
    title: "Rules engine flagged expired ZATCA.",
    detail: "Tender release gate failed due to missing active ZATCA certificate evidence.",
  },
  {
    id: "audit-004",
    vendorId: "vendor-001",
    timestamp: "16 Jun 2026, 12:14",
    actor: "Finance Reviewer",
    title: "Finance reviewer accepted revenue value.",
    detail: "SAR 1.4B revenue confirmed against audited statements on p.14.",
  },
  {
    id: "audit-005",
    vendorId: "vendor-002",
    timestamp: "16 Jun 2026, 13:25",
    actor: "Procurement Manager",
    title: "Procurement Manager changed decision from Conditional to Pass.",
    detail: "Manager override recorded pending final ISO issuance evidence.",
  },
  {
    id: "audit-006",
    vendorId: "vendor-001",
    timestamp: "16 Jun 2026, 14:10",
    actor: "System",
    title: "Vendor added to Approved Vendor List.",
    detail: "Vendor record transferred to tender-ready downstream list.",
  },
];

export const tradeCategories = [
  "General Contracting",
  "MEP (Mechanical, Electrical, Plumbing)",
  "Civil & Infrastructure",
  "Fit-out & Finishing",
  "HVAC",
  "Structural Steel",
  "Fire Protection",
  "Landscaping & Exterior Works",
  "Facade & Cladding",
  "IT & Low Voltage Systems",
  "Vertical Transportation",
  "Waterproofing & Insulation",
] as const;

export const seededInvitations: VendorInvitation[] = [
  {
    id: "inv-001",
    token: "MWQ-LB7F2K",
    companyName: "Al-Mamlakah Contracting Co.",
    contactPerson: "Khalid Al-Otaibi",
    email: "k.otaibi@almamlakah.sa",
    tradeCategory: "General Contracting",
    projectContext: "Diriyah Gate — Phase 2 Civil Works",
    status: "submitted",
    invitedAt: "02 Jun 2026",
    expiresAt: "02 Jul 2026",
    openedAt: "03 Jun 2026",
    startedAt: "04 Jun 2026",
    submittedAt: "07 Jun 2026",
    invitedBy: "FA",
    registrationLink: "https://portal.mawthuq.app/register/MWQ-LB7F2K",
  },
  {
    id: "inv-002",
    token: "MWQ-4RX9PQ",
    companyName: "Gulf Electro-Mechanical Ltd.",
    contactPerson: "Sara Al-Harbi",
    email: "s.alharbi@gulfem.sa",
    tradeCategory: "MEP (Mechanical, Electrical, Plumbing)",
    projectContext: "Diriyah Gate — MEP Subcontractors Package",
    status: "started",
    invitedAt: "08 Jun 2026",
    expiresAt: "08 Jul 2026",
    openedAt: "08 Jun 2026",
    startedAt: "10 Jun 2026",
    invitedBy: "FA",
    registrationLink: "https://portal.mawthuq.app/register/MWQ-4RX9PQ",
  },
  {
    id: "inv-003",
    token: "MWQ-9KV3ZM",
    companyName: "Desert Climate Systems",
    contactPerson: "Mohammed Al-Zahrani",
    email: "m.zahrani@desertclimate.sa",
    tradeCategory: "HVAC",
    projectContext: "Diriyah Gate — MEP Subcontractors Package",
    status: "opened",
    invitedAt: "10 Jun 2026",
    expiresAt: "10 Jul 2026",
    openedAt: "11 Jun 2026",
    invitedBy: "FA",
    registrationLink: "https://portal.mawthuq.app/register/MWQ-9KV3ZM",
  },
  {
    id: "inv-004",
    token: "MWQ-2TW6NR",
    companyName: "Arabian Steel Fabricators",
    contactPerson: "Faisal Al-Ghamdi",
    email: "f.ghamdi@arabiansteel.sa",
    tradeCategory: "Structural Steel",
    projectContext: "",
    status: "invited",
    invitedAt: "14 Jun 2026",
    expiresAt: "14 Jul 2026",
    invitedBy: "FA",
    registrationLink: "https://portal.mawthuq.app/register/MWQ-2TW6NR",
  },
  {
    id: "inv-005",
    token: "MWQ-8MQ1YC",
    companyName: "Riyadh Infrastructure Partners",
    contactPerson: "Turki Al-Mutairi",
    email: "turki@rip-contracting.sa",
    tradeCategory: "Civil & Infrastructure",
    projectContext: "NEOM — Linear City Groundworks",
    status: "expired",
    invitedAt: "01 May 2026",
    expiresAt: "01 Jun 2026",
    invitedBy: "FA",
    registrationLink: "https://portal.mawthuq.app/register/MWQ-8MQ1YC",
  },
  {
    id: "inv-006",
    token: "MWQ-5PB4WJ",
    companyName: "SafeGuard Fire Systems",
    contactPerson: "Abdulrahman Nassar",
    email: "a.nassar@safeguardfire.com",
    tradeCategory: "Fire Protection",
    projectContext: "",
    status: "bounced",
    invitedAt: "12 Jun 2026",
    expiresAt: "12 Jul 2026",
    invitedBy: "FA",
    registrationLink: "https://portal.mawthuq.app/register/MWQ-5PB4WJ",
  },
  {
    id: "inv-007",
    token: "MWQ-3CK7HN",
    companyName: "Luban Facade & Cladding",
    contactPerson: "Ibrahim Al-Dosari",
    email: "i.dosari@luban-sa.com",
    tradeCategory: "Facade & Cladding",
    projectContext: "Qiddiya — Entertainment Zone Cladding",
    status: "declined",
    invitedAt: "05 Jun 2026",
    expiresAt: "05 Jul 2026",
    openedAt: "06 Jun 2026",
    invitedBy: "FA",
    registrationLink: "https://portal.mawthuq.app/register/MWQ-3CK7HN",
  },
];

function isoDate(value: string) {
  return new Date(value).toISOString();
}

function toProjectStatus(status: Project["status"]): BackendProject["status"] {
  switch (status) {
    case "Planning":
      return "Planning";
    case "Tendering":
      return "Tendering";
    case "Active":
      return "Active";
    case "Closed":
      return "Archived";
  }
}

function toInvitationStatus(
  status: VendorInvitation["status"],
): BackendInvitation["status"] {
  switch (status) {
    case "invited":
      return "Invited";
    case "opened":
      return "Opened";
    case "started":
      return "In Progress";
    case "submitted":
      return "Submitted";
    case "expired":
      return "Expired";
    case "bounced":
      return "Bounced";
    case "declined":
      return "Declined";
  }
}

function toApplicationStatus(
  status: (typeof seededPkgLinks)[number]["appStatus"],
): VendorPackageApplication["applicationStatus"] {
  switch (status) {
    case "Invited":
      return "Invited";
    case "Opened":
      return "Opened";
    case "In Progress":
      return "In Progress";
    case "Submitted":
      return "Submitted";
    case "In Review":
      return "In Review";
    case "Clarification Requested":
      return "Clarification Requested";
    case "Review Complete":
      return "Review Complete";
    case "Withdrawn":
      return "Withdrawn";
  }
}

function toQualificationStatus(
  status: (typeof seededPkgLinks)[number]["qualStatus"],
): VendorPackageApplication["qualificationStatus"] {
  switch (status) {
    case "Not Started":
      return "Not Started";
    case "Pending Review":
      return "Pending Review";
    case "Qualified":
      return "Qualified";
    case "Conditionally Qualified":
      return "Conditionally Qualified";
    case "Rejected":
      return "Rejected";
    case "Shortlisted":
      return "Shortlisted";
    case "Awarded":
      return "Awarded";
  }
}

function buildPackageReadiness(
  applications: VendorPackageApplication[],
): BackendPackage["readinessStatus"] {
  if (applications.length === 0) return "Not Started";

  const shortlisted = applications.filter((app) => app.qualificationStatus === "Shortlisted").length;
  const qualified = applications.filter((app) =>
    app.qualificationStatus === "Qualified" || app.qualificationStatus === "Conditionally Qualified",
  ).length;
  const inReview = applications.filter((app) =>
    app.applicationStatus === "In Review" || app.applicationStatus === "Review Complete",
  ).length;
  const submitted = applications.filter((app) =>
    ["Submitted", "In Review", "Clarification Requested", "Review Complete"].includes(
      app.applicationStatus,
    ),
  ).length;
  const blocked = applications.filter((app) => (app.openBlockers?.length ?? 0) > 0).length;

  if (blocked > 0 && inReview === 0 && submitted === 0) return "Blocked";
  if (shortlisted >= 3) return "Ready for Tender";
  if (qualified + shortlisted >= 3) return "Ready for Shortlist";
  if (inReview > 0) return "Under Review";
  if (submitted === 0) return "Awaiting Submissions";
  if (qualified + shortlisted < 3) return "Vendor Gap";
  return "Sourcing Vendors";
}

export const seededBackendProjects: BackendProject[] = seededProjects.map((project, index) => ({
  id: project.id,
  name: project.name,
  arabicName: project.arabicName,
  location: project.location,
  status: toProjectStatus(project.status),
  description: project.scope,
  timeline: project.timeline,
  categories: project.categories,
  reviewers: project.reviewers,
  requiredExperience: project.requiredExperience,
  requiredCertifications: project.requiredCertifications,
  config: project.config,
  startDate:
    index === 0 ? "2026-04-01" : index === 1 ? "2026-05-01" : "2026-06-01",
  targetCompletionDate:
    project.timeline ? undefined : index === 0 ? "2028-09-30" : index === 1 ? "2028-12-31" : "2027-09-30",
  createdAt: isoDate(`2026-06-${String(1 + index).padStart(2, "0")}T09:00:00Z`),
  updatedAt: isoDate(`2026-06-${String(10 + index).padStart(2, "0")}T09:00:00Z`),
}));

export const seededBackendPackages: BackendPackage[] = seededProjects.map((project, index) => {
  const packageId = `pkg-${project.id}`;
  const projectApplications = seededPkgLinks
    .filter((link) => link.projectId === project.id)
    .map<VendorPackageApplication>((link) => ({
      id: link.id,
      vendorId: link.vendorId,
      projectId: link.projectId,
      packageId,
      applicationStatus: toApplicationStatus(link.appStatus),
      qualificationStatus: toQualificationStatus(link.qualStatus),
      score: link.score,
      recommendation:
        link.qualStatus === "Qualified" || link.qualStatus === "Shortlisted"
          ? "PASS"
          : link.qualStatus === "Conditionally Qualified"
            ? "CONDITIONAL"
            : link.qualStatus === "Rejected"
              ? "FAIL"
              : undefined,
      openBlockers: link.blockers,
      rationale: link.rationale,
      source: link.source,
      createdAt: isoDate(`${new Date().getFullYear()}-01-01T00:00:00Z`),
      updatedAt: isoDate(`${new Date().getFullYear()}-01-02T00:00:00Z`),
      lastActivityAt: isoDate(`${new Date().getFullYear()}-01-03T00:00:00Z`),
    }));

  return {
    id: packageId,
    projectId: project.id,
    name: project.packageName,
    category: project.workCategory,
    valueBand: project.packageValueBand,
    status:
      project.status === "Closed"
        ? "Closed"
        : project.status === "Tendering"
          ? "Evaluating"
          : "Open",
    readinessStatus: buildPackageReadiness(projectApplications),
    requiredVendorCount: 3,
    deadline: project.registrationDeadline,
    criteria: project.requiredCertifications,
    primaryForProject: true,
    createdAt: isoDate(`2026-06-${String(1 + index).padStart(2, "0")}T09:30:00Z`),
    updatedAt: isoDate(`2026-06-${String(10 + index).padStart(2, "0")}T09:30:00Z`),
  };
});

export const seededBackendApplications: VendorPackageApplication[] = seededPkgLinks.map((link) => ({
  id: link.id,
  vendorId: link.vendorId,
  projectId: link.projectId,
  packageId: `pkg-${link.projectId}`,
  applicationStatus: toApplicationStatus(link.appStatus),
  qualificationStatus: toQualificationStatus(link.qualStatus),
  score: link.score,
  recommendation:
    link.qualStatus === "Qualified" || link.qualStatus === "Shortlisted"
      ? "PASS"
      : link.qualStatus === "Conditionally Qualified"
        ? "CONDITIONAL"
        : link.qualStatus === "Rejected"
          ? "FAIL"
          : undefined,
  openBlockers: link.blockers,
  rationale: link.rationale,
  source: link.source,
  createdAt: isoDate(`2026-06-01T10:00:00Z`),
  updatedAt: isoDate(`2026-06-16T10:00:00Z`),
  lastActivityAt: isoDate(`2026-06-16T10:00:00Z`),
}));

export const seededBackendInvitations: BackendInvitation[] = seededInvitations.map((inv) => {
  const project = seededProjects.find((item) => inv.projectContext?.includes(item.name.split(" — ")[0]));
  const backendPackage = project
    ? seededBackendPackages.find((pkg) => pkg.projectId === project.id && pkg.primaryForProject)
    : undefined;

  return {
    id: inv.id,
    projectId: project?.id,
    packageId: backendPackage?.id,
    companyName: inv.companyName,
    contactName: inv.contactPerson,
    contactEmail: inv.email,
    category: inv.tradeCategory,
    status: toInvitationStatus(inv.status),
    invitedAt: inv.invitedAt,
    expiresAt: inv.expiresAt,
    createdAt: isoDate("2026-06-01T11:00:00Z"),
    updatedAt: isoDate("2026-06-16T11:00:00Z"),
    lastActivityAt: isoDate("2026-06-16T11:00:00Z"),
  };
});

export const seededBackendState: BackendState = {
  vendors: seededVendors.map((vendor) => ({
    ...vendor,
    workCategory: vendor.primaryDiscipline,
  })),
  documents: seededVendorDocuments,
  extractions: seededVendorExtractions,
  auditRecords: seededAuditRecords,
  fieldReviewStates: [],
  ruleReviewStates: [],
  packageConfig: seededPackageConfig,
  projects: seededBackendProjects,
  packages: seededBackendPackages,
  vendorPackageApplications: seededBackendApplications,
  invitations: seededBackendInvitations,
  reports: {},
};
