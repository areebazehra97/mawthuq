// Vendor Master domain — types and mock data (Saudi/GCC construction context)

export type VendorGlobalStatus = "Active" | "Suspended" | "Under Review" | "Blacklisted" | "Inactive";
export type DocHealth         = "Healthy" | "Expiring Soon" | "Expired" | "Missing";
export type VMRiskLevel       = "Low" | "Medium" | "High" | "Critical";
export type ApplicationStatus = "Invited" | "Registered" | "Under Review" | "Qualified" | "Rejected" | "Shortlisted";
export type PackageQualStatus = "Qualified" | "Pending" | "Not Qualified" | "Expired";
export type VMProjectStatus   = "Active" | "Tendering" | "Planning" | "Closed";
export type VMPackageStatus   = "Open" | "Evaluating" | "Awarded" | "Closed";
export type FindingStatus     = "Open" | "Resolved" | "Monitoring";
export type FindingSeverity   = "Low" | "Medium" | "High" | "Critical";
export type ActivityType      = "application" | "document" | "review" | "invitation" | "status" | "finding";

export interface VMVendor {
  id: string;
  name: string;
  arabicName: string;
  crNumber: string;
  vatNumber: string;
  city: string;
  country: string;
  globalStatus: VendorGlobalStatus;
  tradeCategories: string[];
  aiScore: number;
  riskLevel: VMRiskLevel;
  docHealth: DocHealth;
  linkedProjectCount: number;
  linkedPackageCount: number;
  packageQualStatus: PackageQualStatus;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  registeredDate: string;
  lastActivity: string;
  notes?: string;
}

export interface VMProject {
  id: string;
  name: string;
  arabicName: string;
  status: VMProjectStatus;
  city: string;
  client: string;
  value: string;
  startDate: string;
  endDate: string;
}

export interface VMPackage {
  id: string;
  projectId: string;
  name: string;
  workScope: string;
  tradeCategories: string[];
  status: VMPackageStatus;
  budget: string;
  submissionDeadline: string;
}

export interface VMApplication {
  id: string;
  vendorId: string;
  projectId: string;
  packageId: string;
  status: ApplicationStatus;
  qualStatus: PackageQualStatus;
  appliedDate: string;
  lastUpdated: string;
  aiScore?: number;
  reviewerNote?: string;
}

export interface VMDocument {
  id: string;
  vendorId: string;
  docType: string;
  fileName: string;
  status: "Valid" | "Expiring Soon" | "Expired" | "Missing";
  issueDate?: string;
  expiryDate?: string;
  isGlobal: boolean;
  packageId?: string;
  uploadedDate: string;
}

export interface VMFinding {
  id: string;
  vendorId: string;
  packageId?: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  raisedDate: string;
  resolvedDate?: string;
  raisedBy: string;
}

export interface VMReview {
  id: string;
  vendorId: string;
  applicationId: string;
  section: string;
  status: "Pending" | "Pass" | "Fail" | "Conditional";
  score?: number;
  reviewerName: string;
  reviewDate: string;
  comment?: string;
}

export interface VMActivityItem {
  id: string;
  vendorId: string;
  type: ActivityType;
  title: string;
  detail?: string;
  date: string;
  actor?: string;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export const vmProjects: VMProject[] = [
  {
    id: "vmp-001",
    name: "North Riyadh Integrated Development",
    arabicName: "تطوير شمال الرياض المتكامل",
    status: "Active",
    city: "Riyadh",
    client: "Royal Commission for Riyadh City",
    value: "SAR 4.2B",
    startDate: "2024-03-01",
    endDate: "2027-12-31",
  },
  {
    id: "vmp-002",
    name: "NEOM Linear City — Groundworks",
    arabicName: "نيوم — أعمال التأسيس",
    status: "Active",
    city: "NEOM, Tabuk",
    client: "NEOM Company",
    value: "SAR 8.7B",
    startDate: "2023-09-01",
    endDate: "2028-06-30",
  },
  {
    id: "vmp-003",
    name: "Diriyah Gate — Hospitality Zone",
    arabicName: "بوابة الدرعية — منطقة الضيافة",
    status: "Tendering",
    city: "Diriyah, Riyadh",
    client: "Diriyah Gate Development Authority",
    value: "SAR 2.1B",
    startDate: "2025-01-01",
    endDate: "2027-06-30",
  },
  {
    id: "vmp-004",
    name: "Jeddah Waterfront Mixed-Use",
    arabicName: "كورنيش جدة متعدد الاستخدامات",
    status: "Active",
    city: "Jeddah",
    client: "Jeddah Development Authority",
    value: "SAR 1.8B",
    startDate: "2024-06-01",
    endDate: "2026-12-31",
  },
  {
    id: "vmp-005",
    name: "Qiddiya Entertainment District",
    arabicName: "حي قدية للترفيه",
    status: "Planning",
    city: "Qiddiya, Riyadh",
    client: "Qiddiya Investment Company",
    value: "SAR 3.5B",
    startDate: "2025-06-01",
    endDate: "2029-03-31",
  },
];

// ── Packages ──────────────────────────────────────────────────────────────────

export const vmPackages: VMPackage[] = [
  {
    id: "vmpkg-001",
    projectId: "vmp-001",
    name: "Earthworks & Site Preparation",
    workScope: "Bulk earthworks, grading, dewatering, and site infrastructure",
    tradeCategories: ["Civil Works", "Earthworks"],
    status: "Evaluating",
    budget: "SAR 320M",
    submissionDeadline: "2025-09-30",
  },
  {
    id: "vmpkg-002",
    projectId: "vmp-001",
    name: "MEP Infrastructure — Block A",
    workScope: "Mechanical, electrical, and plumbing installation for residential block A",
    tradeCategories: ["MEP", "Electrical", "Plumbing"],
    status: "Open",
    budget: "SAR 145M",
    submissionDeadline: "2025-11-15",
  },
  {
    id: "vmpkg-003",
    projectId: "vmp-002",
    name: "Foundation Works — Spine Road",
    workScope: "Piling, raft foundations, and retaining structures",
    tradeCategories: ["Civil Works", "Foundation"],
    status: "Evaluating",
    budget: "SAR 680M",
    submissionDeadline: "2025-08-01",
  },
  {
    id: "vmpkg-004",
    projectId: "vmp-002",
    name: "Steel Structural Frame",
    workScope: "Fabrication and erection of primary structural steel frame",
    tradeCategories: ["Steel Fabrication", "Structural"],
    status: "Open",
    budget: "SAR 290M",
    submissionDeadline: "2025-10-01",
  },
  {
    id: "vmpkg-005",
    projectId: "vmp-003",
    name: "Façade & Cladding Works",
    workScope: "Stone cladding, aluminium facade systems, and glazing",
    tradeCategories: ["Façade", "Cladding", "Glazing"],
    status: "Open",
    budget: "SAR 175M",
    submissionDeadline: "2025-12-01",
  },
  {
    id: "vmpkg-006",
    projectId: "vmp-004",
    name: "HVAC & Building Automation",
    workScope: "HVAC systems design-build and BMS integration",
    tradeCategories: ["HVAC", "MEP", "BMS"],
    status: "Evaluating",
    budget: "SAR 88M",
    submissionDeadline: "2025-09-15",
  },
  {
    id: "vmpkg-007",
    projectId: "vmp-004",
    name: "Landscaping & Hardscape",
    workScope: "Public realm landscaping, irrigation, and hardscape",
    tradeCategories: ["Landscaping", "Irrigation"],
    status: "Awarded",
    budget: "SAR 42M",
    submissionDeadline: "2025-07-01",
  },
  {
    id: "vmpkg-008",
    projectId: "vmp-005",
    name: "Integrated MEP — Entertainment Venues",
    workScope: "Full MEP scope for entertainment venue cluster",
    tradeCategories: ["MEP", "Electrical", "Plumbing", "HVAC"],
    status: "Open",
    budget: "SAR 430M",
    submissionDeadline: "2026-02-01",
  },
];

// ── Vendors ───────────────────────────────────────────────────────────────────

export const vmVendors: VMVendor[] = [
  {
    id: "vmv-001",
    name: "Al Bina Al Saudi Contracting",
    arabicName: "البناء السعودي للمقاولات",
    crNumber: "1010234567",
    vatNumber: "300012345600003",
    city: "Riyadh",
    country: "Saudi Arabia",
    globalStatus: "Active",
    tradeCategories: ["Civil Works", "Earthworks", "Foundation"],
    aiScore: 84,
    riskLevel: "Low",
    docHealth: "Healthy",
    linkedProjectCount: 2,
    linkedPackageCount: 3,
    packageQualStatus: "Qualified",
    contactName: "Khalid Al-Mansouri",
    contactEmail: "k.mansouri@albina-saudi.com.sa",
    contactPhone: "+966 11 234 5678",
    registeredDate: "2023-02-15",
    lastActivity: "2025-06-12",
  },
  {
    id: "vmv-002",
    name: "Red Sands Trading & Contracting",
    arabicName: "الرمال الحمراء للتجارة والمقاولات",
    crNumber: "2050198432",
    vatNumber: "300098765400001",
    city: "Jeddah",
    country: "Saudi Arabia",
    globalStatus: "Active",
    tradeCategories: ["Landscaping", "Irrigation", "Hardscape"],
    aiScore: 72,
    riskLevel: "Low",
    docHealth: "Expiring Soon",
    linkedProjectCount: 1,
    linkedPackageCount: 2,
    packageQualStatus: "Qualified",
    contactName: "Rami Al-Zahrani",
    contactEmail: "rami@redsands-contracting.sa",
    contactPhone: "+966 12 456 7890",
    registeredDate: "2023-05-22",
    lastActivity: "2025-06-10",
  },
  {
    id: "vmv-003",
    name: "Gulf Electro-Mechanical Ltd.",
    arabicName: "الخليج الكهروميكانيكية المحدودة",
    crNumber: "1010567890",
    vatNumber: "300056789000002",
    city: "Riyadh",
    country: "Saudi Arabia",
    globalStatus: "Active",
    tradeCategories: ["MEP", "Electrical", "Plumbing", "HVAC"],
    aiScore: 91,
    riskLevel: "Low",
    docHealth: "Healthy",
    linkedProjectCount: 3,
    linkedPackageCount: 4,
    packageQualStatus: "Qualified",
    contactName: "Mohammed Al-Ghamdi",
    contactEmail: "m.ghamdi@gulf-em.com.sa",
    contactPhone: "+966 11 876 5432",
    registeredDate: "2022-11-01",
    lastActivity: "2025-06-15",
  },
  {
    id: "vmv-004",
    name: "Desert Climate Systems",
    arabicName: "أنظمة المناخ الصحراوية",
    crNumber: "3007421983",
    vatNumber: "300074219830004",
    city: "Dammam",
    country: "Saudi Arabia",
    globalStatus: "Under Review",
    tradeCategories: ["HVAC", "BMS", "MEP"],
    aiScore: 65,
    riskLevel: "Medium",
    docHealth: "Expired",
    linkedProjectCount: 1,
    linkedPackageCount: 1,
    packageQualStatus: "Pending",
    contactName: "Abdullah Al-Dossari",
    contactEmail: "a.dossari@desertclimate.sa",
    contactPhone: "+966 13 555 0099",
    registeredDate: "2024-01-10",
    lastActivity: "2025-05-28",
    notes: "ZATCA certificate expired Feb 2025. Awaiting renewal confirmation.",
  },
  {
    id: "vmv-005",
    name: "Arabian Steel Fabricators",
    arabicName: "المصنعون العرب للصلب",
    crNumber: "1010321654",
    vatNumber: "300032165400005",
    city: "Jubail",
    country: "Saudi Arabia",
    globalStatus: "Active",
    tradeCategories: ["Steel Fabrication", "Structural", "Metalwork"],
    aiScore: 88,
    riskLevel: "Low",
    docHealth: "Healthy",
    linkedProjectCount: 2,
    linkedPackageCount: 2,
    packageQualStatus: "Qualified",
    contactName: "Tariq Al-Juhani",
    contactEmail: "tariq@arabian-steel.com.sa",
    contactPhone: "+966 13 345 6789",
    registeredDate: "2022-08-30",
    lastActivity: "2025-06-08",
  },
  {
    id: "vmv-006",
    name: "Al-Mamlakah Contracting Co.",
    arabicName: "شركة المملكة للمقاولات",
    crNumber: "1010654321",
    vatNumber: "300065432100006",
    city: "Riyadh",
    country: "Saudi Arabia",
    globalStatus: "Suspended",
    tradeCategories: ["Civil Works", "General Contracting"],
    aiScore: 45,
    riskLevel: "High",
    docHealth: "Missing",
    linkedProjectCount: 0,
    linkedPackageCount: 0,
    packageQualStatus: "Not Qualified",
    contactName: "Faisal Al-Rashidi",
    contactEmail: "f.rashidi@almamlakah.sa",
    contactPhone: "+966 11 222 3344",
    registeredDate: "2023-07-14",
    lastActivity: "2025-03-02",
    notes: "Suspended pending investigation into subcontracting violations.",
  },
  {
    id: "vmv-007",
    name: "Najd Façade & Cladding",
    arabicName: "نجد للواجهات والكسوة",
    crNumber: "1010789012",
    vatNumber: "300078901200007",
    city: "Riyadh",
    country: "Saudi Arabia",
    globalStatus: "Active",
    tradeCategories: ["Façade", "Cladding", "Glazing", "Stone Works"],
    aiScore: 78,
    riskLevel: "Low",
    docHealth: "Healthy",
    linkedProjectCount: 1,
    linkedPackageCount: 1,
    packageQualStatus: "Qualified",
    contactName: "Sami Al-Qahtani",
    contactEmail: "s.qahtani@najd-facade.com.sa",
    contactPhone: "+966 11 777 8899",
    registeredDate: "2023-09-05",
    lastActivity: "2025-06-11",
  },
  {
    id: "vmv-008",
    name: "Riyadh Integrated MEP Services",
    arabicName: "خدمات الرياض المتكاملة للكهروميكانيكا",
    crNumber: "1010876543",
    vatNumber: "300087654300008",
    city: "Riyadh",
    country: "Saudi Arabia",
    globalStatus: "Active",
    tradeCategories: ["MEP", "Electrical", "Plumbing", "Fire Fighting"],
    aiScore: 82,
    riskLevel: "Medium",
    docHealth: "Expiring Soon",
    linkedProjectCount: 2,
    linkedPackageCount: 3,
    packageQualStatus: "Pending",
    contactName: "Ibrahim Al-Otaibi",
    contactEmail: "i.otaibi@riyadh-mep.com.sa",
    contactPhone: "+966 11 999 0011",
    registeredDate: "2023-04-18",
    lastActivity: "2025-06-14",
  },
];

// ── Applications ──────────────────────────────────────────────────────────────

export const vmApplications: VMApplication[] = [
  { id: "vma-001", vendorId: "vmv-001", projectId: "vmp-001", packageId: "vmpkg-001", status: "Qualified",     qualStatus: "Qualified",     appliedDate: "2025-03-01", lastUpdated: "2025-05-20", aiScore: 84 },
  { id: "vma-002", vendorId: "vmv-001", projectId: "vmp-002", packageId: "vmpkg-003", status: "Shortlisted",   qualStatus: "Qualified",     appliedDate: "2025-02-10", lastUpdated: "2025-06-01", aiScore: 87 },
  { id: "vma-003", vendorId: "vmv-001", projectId: "vmp-001", packageId: "vmpkg-002", status: "Under Review",  qualStatus: "Pending",       appliedDate: "2025-05-15", lastUpdated: "2025-06-10", aiScore: 81 },
  { id: "vma-004", vendorId: "vmv-002", projectId: "vmp-004", packageId: "vmpkg-007", status: "Qualified",     qualStatus: "Qualified",     appliedDate: "2025-01-20", lastUpdated: "2025-04-30", aiScore: 72 },
  { id: "vma-005", vendorId: "vmv-002", projectId: "vmp-001", packageId: "vmpkg-002", status: "Invited",       qualStatus: "Pending",       appliedDate: "2025-06-01", lastUpdated: "2025-06-01" },
  { id: "vma-006", vendorId: "vmv-003", projectId: "vmp-001", packageId: "vmpkg-002", status: "Shortlisted",   qualStatus: "Qualified",     appliedDate: "2025-02-28", lastUpdated: "2025-06-05", aiScore: 91 },
  { id: "vma-007", vendorId: "vmv-003", projectId: "vmp-002", packageId: "vmpkg-003", status: "Under Review",  qualStatus: "Pending",       appliedDate: "2025-04-12", lastUpdated: "2025-06-08", aiScore: 89 },
  { id: "vma-008", vendorId: "vmv-003", projectId: "vmp-004", packageId: "vmpkg-006", status: "Qualified",     qualStatus: "Qualified",     appliedDate: "2025-03-05", lastUpdated: "2025-05-22", aiScore: 92 },
  { id: "vma-009", vendorId: "vmv-003", projectId: "vmp-005", packageId: "vmpkg-008", status: "Invited",       qualStatus: "Pending",       appliedDate: "2025-06-10", lastUpdated: "2025-06-10" },
  { id: "vma-010", vendorId: "vmv-004", projectId: "vmp-004", packageId: "vmpkg-006", status: "Under Review",  qualStatus: "Pending",       appliedDate: "2025-04-01", lastUpdated: "2025-05-28", aiScore: 65 },
  { id: "vma-011", vendorId: "vmv-005", projectId: "vmp-002", packageId: "vmpkg-004", status: "Shortlisted",   qualStatus: "Qualified",     appliedDate: "2025-02-15", lastUpdated: "2025-06-03", aiScore: 88 },
  { id: "vma-012", vendorId: "vmv-005", projectId: "vmp-001", packageId: "vmpkg-001", status: "Qualified",     qualStatus: "Qualified",     appliedDate: "2025-03-10", lastUpdated: "2025-05-15", aiScore: 86 },
  { id: "vma-013", vendorId: "vmv-006", projectId: "vmp-001", packageId: "vmpkg-001", status: "Rejected",      qualStatus: "Not Qualified", appliedDate: "2024-11-01", lastUpdated: "2025-03-02", aiScore: 45, reviewerNote: "Suspended — compliance violation." },
  { id: "vma-014", vendorId: "vmv-007", projectId: "vmp-003", packageId: "vmpkg-005", status: "Under Review",  qualStatus: "Pending",       appliedDate: "2025-05-01", lastUpdated: "2025-06-11", aiScore: 78 },
  { id: "vma-015", vendorId: "vmv-008", projectId: "vmp-001", packageId: "vmpkg-002", status: "Under Review",  qualStatus: "Pending",       appliedDate: "2025-04-20", lastUpdated: "2025-06-09", aiScore: 82 },
  { id: "vma-016", vendorId: "vmv-008", projectId: "vmp-004", packageId: "vmpkg-006", status: "Invited",       qualStatus: "Pending",       appliedDate: "2025-06-05", lastUpdated: "2025-06-05" },
  { id: "vma-017", vendorId: "vmv-008", projectId: "vmp-005", packageId: "vmpkg-008", status: "Registered",    qualStatus: "Pending",       appliedDate: "2025-06-12", lastUpdated: "2025-06-14" },
];

// ── Documents ─────────────────────────────────────────────────────────────────

export const vmDocuments: VMDocument[] = [
  { id: "vmd-001", vendorId: "vmv-001", docType: "Commercial Registration",  fileName: "CR_AlBina_2025.pdf",        status: "Valid",          issueDate: "2025-01-10", expiryDate: "2026-01-09", isGlobal: true, uploadedDate: "2025-01-12" },
  { id: "vmd-002", vendorId: "vmv-001", docType: "ZATCA Certificate",        fileName: "ZATCA_AlBina.pdf",          status: "Valid",          issueDate: "2024-12-01", expiryDate: "2025-11-30", isGlobal: true, uploadedDate: "2025-01-12" },
  { id: "vmd-003", vendorId: "vmv-001", docType: "Contractor Classification", fileName: "MOMRA_AlBina.pdf",         status: "Valid",          issueDate: "2024-06-01", expiryDate: "2026-05-31", isGlobal: true, uploadedDate: "2024-06-05" },
  { id: "vmd-004", vendorId: "vmv-001", docType: "ISO 9001",                 fileName: "ISO9001_AlBina.pdf",        status: "Valid",          issueDate: "2023-09-01", expiryDate: "2026-08-31", isGlobal: true, uploadedDate: "2023-09-05" },
  { id: "vmd-005", vendorId: "vmv-002", docType: "Commercial Registration",  fileName: "CR_RedSands.pdf",           status: "Valid",          issueDate: "2025-02-01", expiryDate: "2026-01-31", isGlobal: true, uploadedDate: "2025-02-03" },
  { id: "vmd-006", vendorId: "vmv-002", docType: "ZATCA Certificate",        fileName: "ZATCA_RedSands.pdf",        status: "Expiring Soon",  issueDate: "2024-07-01", expiryDate: "2025-06-30", isGlobal: true, uploadedDate: "2024-07-05" },
  { id: "vmd-007", vendorId: "vmv-002", docType: "Contractor Classification", fileName: "Class_RedSands.pdf",       status: "Valid",          issueDate: "2024-08-01", expiryDate: "2026-07-31", isGlobal: true, uploadedDate: "2024-08-03" },
  { id: "vmd-008", vendorId: "vmv-003", docType: "Commercial Registration",  fileName: "CR_GulfEM_2025.pdf",        status: "Valid",          issueDate: "2025-03-01", expiryDate: "2026-02-28", isGlobal: true, uploadedDate: "2025-03-03" },
  { id: "vmd-009", vendorId: "vmv-003", docType: "ZATCA Certificate",        fileName: "ZATCA_GulfEM.pdf",          status: "Valid",          issueDate: "2025-01-01", expiryDate: "2025-12-31", isGlobal: true, uploadedDate: "2025-01-05" },
  { id: "vmd-010", vendorId: "vmv-003", docType: "Contractor Classification", fileName: "Class_GulfEM.pdf",         status: "Valid",          issueDate: "2024-04-01", expiryDate: "2026-03-31", isGlobal: true, uploadedDate: "2024-04-03" },
  { id: "vmd-011", vendorId: "vmv-003", docType: "ISO 9001",                 fileName: "ISO9001_GulfEM.pdf",        status: "Valid",          issueDate: "2023-11-01", expiryDate: "2026-10-31", isGlobal: true, uploadedDate: "2023-11-05" },
  { id: "vmd-012", vendorId: "vmv-003", docType: "ISO 45001 (OHSAS)",        fileName: "OHSAS_GulfEM.pdf",          status: "Valid",          issueDate: "2024-02-01", expiryDate: "2027-01-31", isGlobal: true, uploadedDate: "2024-02-05" },
  { id: "vmd-013", vendorId: "vmv-004", docType: "Commercial Registration",  fileName: "CR_DesertClimate.pdf",      status: "Valid",          issueDate: "2025-01-20", expiryDate: "2026-01-19", isGlobal: true, uploadedDate: "2025-01-22" },
  { id: "vmd-014", vendorId: "vmv-004", docType: "ZATCA Certificate",        fileName: "ZATCA_DesertClimate.pdf",   status: "Expired",        issueDate: "2024-02-01", expiryDate: "2025-01-31", isGlobal: true, uploadedDate: "2024-02-05" },
  { id: "vmd-015", vendorId: "vmv-004", docType: "Contractor Classification", fileName: "Class_DesertClimate.pdf",  status: "Valid",          issueDate: "2024-05-01", expiryDate: "2026-04-30", isGlobal: true, uploadedDate: "2024-05-05" },
  { id: "vmd-016", vendorId: "vmv-005", docType: "Commercial Registration",  fileName: "CR_ArabianSteel.pdf",       status: "Valid",          issueDate: "2025-02-15", expiryDate: "2026-02-14", isGlobal: true, uploadedDate: "2025-02-17" },
  { id: "vmd-017", vendorId: "vmv-005", docType: "ZATCA Certificate",        fileName: "ZATCA_ArabianSteel.pdf",    status: "Valid",          issueDate: "2025-03-01", expiryDate: "2026-02-28", isGlobal: true, uploadedDate: "2025-03-03" },
  { id: "vmd-018", vendorId: "vmv-005", docType: "Contractor Classification", fileName: "Class_ArabianSteel.pdf",   status: "Valid",          issueDate: "2024-07-01", expiryDate: "2026-06-30", isGlobal: true, uploadedDate: "2024-07-05" },
  { id: "vmd-019", vendorId: "vmv-005", docType: "Steel Fabrication Cert.",  fileName: "SteelFab_ArabianSteel.pdf", status: "Valid",          issueDate: "2023-10-01", expiryDate: "2026-09-30", isGlobal: true, uploadedDate: "2023-10-05" },
  { id: "vmd-020", vendorId: "vmv-006", docType: "Commercial Registration",  fileName: "CR_Mamlakah.pdf",           status: "Valid",          issueDate: "2024-07-14", expiryDate: "2025-07-13", isGlobal: true, uploadedDate: "2024-07-15" },
  { id: "vmd-021", vendorId: "vmv-006", docType: "ZATCA Certificate",        fileName: "",                          status: "Missing",        isGlobal: true, uploadedDate: "2024-07-15" },
  { id: "vmd-022", vendorId: "vmv-006", docType: "Contractor Classification", fileName: "",                         status: "Missing",        isGlobal: true, uploadedDate: "2024-07-15" },
  { id: "vmd-023", vendorId: "vmv-007", docType: "Commercial Registration",  fileName: "CR_NajdFacade.pdf",         status: "Valid",          issueDate: "2025-04-01", expiryDate: "2026-03-31", isGlobal: true, uploadedDate: "2025-04-03" },
  { id: "vmd-024", vendorId: "vmv-007", docType: "ZATCA Certificate",        fileName: "ZATCA_NajdFacade.pdf",      status: "Valid",          issueDate: "2025-01-15", expiryDate: "2026-01-14", isGlobal: true, uploadedDate: "2025-01-17" },
  { id: "vmd-025", vendorId: "vmv-007", docType: "Contractor Classification", fileName: "Class_NajdFacade.pdf",     status: "Valid",          issueDate: "2024-09-01", expiryDate: "2026-08-31", isGlobal: true, uploadedDate: "2024-09-05" },
  { id: "vmd-026", vendorId: "vmv-008", docType: "Commercial Registration",  fileName: "CR_RiyadhMEP.pdf",          status: "Valid",          issueDate: "2025-04-18", expiryDate: "2026-04-17", isGlobal: true, uploadedDate: "2025-04-20" },
  { id: "vmd-027", vendorId: "vmv-008", docType: "ZATCA Certificate",        fileName: "ZATCA_RiyadhMEP.pdf",       status: "Expiring Soon",  issueDate: "2024-07-10", expiryDate: "2025-07-09", isGlobal: true, uploadedDate: "2024-07-12" },
  { id: "vmd-028", vendorId: "vmv-008", docType: "Contractor Classification", fileName: "Class_RiyadhMEP.pdf",      status: "Valid",          issueDate: "2024-10-01", expiryDate: "2026-09-30", isGlobal: true, uploadedDate: "2024-10-05" },
];

// ── Findings ──────────────────────────────────────────────────────────────────

export const vmFindings: VMFinding[] = [
  { id: "vmf-001", vendorId: "vmv-004", title: "ZATCA Certificate Expired",     description: "Vendor's ZATCA certificate expired 31 Jan 2025. No renewal submitted.",                         severity: "High",     status: "Open",       raisedDate: "2025-02-05",              raisedBy: "Compliance Team" },
  { id: "vmf-002", vendorId: "vmv-006", title: "Subcontracting Violation",      description: "Vendor exceeded permitted subcontracting threshold on Project Alpha without prior approval.",  severity: "Critical", status: "Open",       raisedDate: "2025-02-28",              raisedBy: "Project Manager — Alpha" },
  { id: "vmf-003", vendorId: "vmv-006", title: "Missing Regulatory Documents",  description: "ZATCA and Contractor Classification not uploaded despite two reminders.",                      severity: "High",     status: "Open",       raisedDate: "2025-01-20",              raisedBy: "Prequalification Team" },
  { id: "vmf-004", vendorId: "vmv-002", title: "ZATCA Certificate Expiring",    description: "ZATCA certificate expires 30 Jun 2025. Vendor notified; renewal in progress.",                severity: "Medium",   status: "Monitoring", raisedDate: "2025-05-15",              raisedBy: "Compliance Automation" },
  { id: "vmf-005", vendorId: "vmv-008", title: "ZATCA Expiring in 21 Days",     description: "ZATCA certificate expires 9 Jul 2025. Vendor alerted; renewal in process.",                   severity: "Medium",   status: "Monitoring", raisedDate: "2025-06-18",              raisedBy: "Compliance Automation" },
  { id: "vmf-006", vendorId: "vmv-001", title: "HSE Incident — Minor",          description: "One minor recordable injury on NEOM site, June 2025. RCA in progress.",                       severity: "Low",      status: "Monitoring", raisedDate: "2025-06-10",              raisedBy: "HSE Team — NEOM" },
  { id: "vmf-007", vendorId: "vmv-003", title: "Late Submission — MEP Block A", description: "Vendor submitted prequalification documents 8 days late for Package MEP Block A.",            severity: "Low",      status: "Resolved",   raisedDate: "2025-03-08", resolvedDate: "2025-03-20", raisedBy: "Package Coordinator" },
];

// ── Reviews ───────────────────────────────────────────────────────────────────

export const vmReviews: VMReview[] = [
  { id: "vmr-001", vendorId: "vmv-001", applicationId: "vma-001", section: "Financial Standing",   status: "Pass",        score: 90, reviewerName: "Fatima Al-Harbi",  reviewDate: "2025-04-15", comment: "Strong financials; audited accounts verified." },
  { id: "vmr-002", vendorId: "vmv-001", applicationId: "vma-001", section: "Technical Capability", status: "Pass",        score: 85, reviewerName: "Ahmed Al-Shehri",  reviewDate: "2025-04-18" },
  { id: "vmr-003", vendorId: "vmv-001", applicationId: "vma-001", section: "HSE Record",           status: "Pass",        score: 80, reviewerName: "Fatima Al-Harbi",  reviewDate: "2025-04-20" },
  { id: "vmr-004", vendorId: "vmv-001", applicationId: "vma-001", section: "Regulatory Compliance",status: "Pass",        score: 100,reviewerName: "Omar Al-Rashid",   reviewDate: "2025-04-22" },
  { id: "vmr-005", vendorId: "vmv-003", applicationId: "vma-006", section: "Financial Standing",   status: "Pass",        score: 92, reviewerName: "Fatima Al-Harbi",  reviewDate: "2025-04-01", comment: "Excellent financial position; no liabilities flagged." },
  { id: "vmr-006", vendorId: "vmv-003", applicationId: "vma-006", section: "Technical Capability", status: "Pass",        score: 95, reviewerName: "Ahmed Al-Shehri",  reviewDate: "2025-04-03" },
  { id: "vmr-007", vendorId: "vmv-003", applicationId: "vma-006", section: "HSE Record",           status: "Pass",        score: 88, reviewerName: "Fatima Al-Harbi",  reviewDate: "2025-04-05" },
  { id: "vmr-008", vendorId: "vmv-003", applicationId: "vma-006", section: "Regulatory Compliance",status: "Pass",        score: 100,reviewerName: "Omar Al-Rashid",   reviewDate: "2025-04-07" },
  { id: "vmr-009", vendorId: "vmv-004", applicationId: "vma-010", section: "Regulatory Compliance",status: "Fail",        score: 20, reviewerName: "Omar Al-Rashid",   reviewDate: "2025-05-01", comment: "ZATCA certificate expired. Cannot proceed until renewed." },
  { id: "vmr-010", vendorId: "vmv-004", applicationId: "vma-010", section: "Financial Standing",   status: "Conditional", score: 60, reviewerName: "Fatima Al-Harbi",  reviewDate: "2025-05-03", comment: "Some liquidity concerns. Request updated financials." },
  { id: "vmr-011", vendorId: "vmv-005", applicationId: "vma-011", section: "Financial Standing",   status: "Pass",        score: 88, reviewerName: "Fatima Al-Harbi",  reviewDate: "2025-04-10" },
  { id: "vmr-012", vendorId: "vmv-005", applicationId: "vma-011", section: "Technical Capability", status: "Pass",        score: 92, reviewerName: "Ahmed Al-Shehri",  reviewDate: "2025-04-12" },
  { id: "vmr-013", vendorId: "vmv-005", applicationId: "vma-011", section: "HSE Record",           status: "Pass",        score: 85, reviewerName: "Fatima Al-Harbi",  reviewDate: "2025-04-14" },
];

// ── Activity ──────────────────────────────────────────────────────────────────

export const vmActivity: VMActivityItem[] = [
  { id: "act-001", vendorId: "vmv-001", type: "application", title: "Applied to NEOM Foundation Works",      detail: "Package: Foundation Works — Spine Road",    date: "2025-02-10", actor: "Vendor Portal" },
  { id: "act-002", vendorId: "vmv-001", type: "document",    title: "Uploaded Commercial Registration",                                                            date: "2025-01-12", actor: "Khalid Al-Mansouri" },
  { id: "act-003", vendorId: "vmv-001", type: "review",      title: "Financial review passed",               detail: "North Riyadh — Earthworks",                 date: "2025-04-15", actor: "Fatima Al-Harbi" },
  { id: "act-004", vendorId: "vmv-001", type: "status",      title: "Qualified for Earthworks Package",                                                            date: "2025-05-20", actor: "Package Coordinator" },
  { id: "act-005", vendorId: "vmv-001", type: "application", title: "Applied to MEP Block A",                detail: "Package: MEP Infrastructure — Block A",      date: "2025-05-15", actor: "Vendor Portal" },
  { id: "act-006", vendorId: "vmv-001", type: "finding",     title: "HSE Minor Incident Logged",             detail: "One minor recordable injury on NEOM site",  date: "2025-06-10", actor: "HSE Team" },
  { id: "act-007", vendorId: "vmv-002", type: "invitation",  title: "Invited to MEP Block A",                detail: "Invitation sent via portal",                date: "2025-06-01", actor: "Package Coordinator" },
  { id: "act-008", vendorId: "vmv-002", type: "status",      title: "Qualified for Landscaping Package",     detail: "Jeddah Waterfront Landscaping",             date: "2025-04-30", actor: "Package Coordinator" },
  { id: "act-009", vendorId: "vmv-002", type: "document",    title: "ZATCA Expiry Alert Raised",                                                                   date: "2025-05-15", actor: "Compliance Automation" },
  { id: "act-010", vendorId: "vmv-003", type: "application", title: "Applied to MEP Block A",                                                                      date: "2025-02-28", actor: "Vendor Portal" },
  { id: "act-011", vendorId: "vmv-003", type: "review",      title: "All review sections passed",            detail: "MEP Block A — North Riyadh",                date: "2025-04-07", actor: "Review Panel" },
  { id: "act-012", vendorId: "vmv-003", type: "status",      title: "Shortlisted for MEP Block A",                                                                 date: "2025-06-05", actor: "Project Director" },
  { id: "act-013", vendorId: "vmv-003", type: "invitation",  title: "Invited to Qiddiya MEP",                                                                      date: "2025-06-10", actor: "Package Coordinator" },
  { id: "act-014", vendorId: "vmv-004", type: "application", title: "Applied to Jeddah HVAC",                                                                      date: "2025-04-01", actor: "Vendor Portal" },
  { id: "act-015", vendorId: "vmv-004", type: "finding",     title: "ZATCA Expired — Finding Raised",                                                              date: "2025-02-05", actor: "Compliance Team" },
  { id: "act-016", vendorId: "vmv-004", type: "review",      title: "Regulatory review failed",              detail: "ZATCA certificate expired",                 date: "2025-05-01", actor: "Omar Al-Rashid" },
  { id: "act-017", vendorId: "vmv-005", type: "application", title: "Applied to NEOM Steel Frame",                                                                 date: "2025-02-15", actor: "Vendor Portal" },
  { id: "act-018", vendorId: "vmv-005", type: "review",      title: "Technical review passed",               detail: "Steel Structural Frame — NEOM",             date: "2025-04-12", actor: "Ahmed Al-Shehri" },
  { id: "act-019", vendorId: "vmv-005", type: "status",      title: "Shortlisted for NEOM Steel Frame",                                                            date: "2025-06-03", actor: "Project Director" },
  { id: "act-020", vendorId: "vmv-006", type: "finding",     title: "Subcontracting Violation Logged",                                                             date: "2025-02-28", actor: "Project Manager" },
  { id: "act-021", vendorId: "vmv-006", type: "status",      title: "Suspended — Pending Investigation",                                                           date: "2025-03-02", actor: "Compliance Director" },
  { id: "act-022", vendorId: "vmv-007", type: "application", title: "Applied to Diriyah Façade Works",                                                             date: "2025-05-01", actor: "Vendor Portal" },
  { id: "act-023", vendorId: "vmv-007", type: "document",    title: "All documents uploaded",                                                                       date: "2025-05-01", actor: "Sami Al-Qahtani" },
  { id: "act-024", vendorId: "vmv-008", type: "application", title: "Applied to MEP Block A",                                                                      date: "2025-04-20", actor: "Vendor Portal" },
  { id: "act-025", vendorId: "vmv-008", type: "invitation",  title: "Invited to Jeddah HVAC",                                                                      date: "2025-06-05", actor: "Package Coordinator" },
  { id: "act-026", vendorId: "vmv-008", type: "finding",     title: "ZATCA Expiry Alert Raised",                                                                   date: "2025-06-18", actor: "Compliance Automation" },
  { id: "act-027", vendorId: "vmv-008", type: "application", title: "Registered for Qiddiya MEP",                                                                  date: "2025-06-14", actor: "Vendor Portal" },
];
