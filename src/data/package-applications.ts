// Package-specific vendor application model
// Bridges Project (proj-001 etc.) with VMVendor (vmv-001 etc.)

export type PkgAppStatus =
  | "Invited"
  | "Opened"
  | "In Progress"
  | "Submitted"
  | "In Review"
  | "Clarification Requested"
  | "Review Complete"
  | "Withdrawn";

export type PkgQualStatus =
  | "Not Started"
  | "Pending Review"
  | "Qualified"
  | "Conditionally Qualified"
  | "Rejected"
  | "Shortlisted"
  | "Awarded";

export type PkgReadinessStatus =
  | "Not Started"
  | "Sourcing Vendors"
  | "Awaiting Submissions"
  | "Under Review"
  | "Vendor Gap"
  | "Ready for Shortlist"
  | "Ready for Tender";

export interface PackageVendorLink {
  id: string;
  vendorId: string;    // VMVendor.id
  projectId: string;   // Project.id from seededProjects (proj-001 etc.)
  appStatus: PkgAppStatus;
  qualStatus: PkgQualStatus;
  score?: number;
  addedDate: string;
  lastUpdated: string;
  source: "invited" | "added_from_vm" | "direct";
  blockers?: string[];
  rationale?: string;
}

// ── Seeded links ───────────────────────────────────────────────────────────────

export const seededPkgLinks: PackageVendorLink[] = [

  // ── proj-001: North Riyadh — Main Works Prequalification ──────────────────

  {
    id: "pvl-001", vendorId: "vmv-001", projectId: "proj-001",
    appStatus: "Review Complete", qualStatus: "Qualified", score: 92,
    addedDate: "2025-03-01", lastUpdated: "2025-05-20",
    source: "added_from_vm",
  },
  {
    id: "pvl-002", vendorId: "vmv-003", projectId: "proj-001",
    appStatus: "In Review", qualStatus: "Pending Review", score: 89,
    addedDate: "2025-02-28", lastUpdated: "2025-06-05",
    source: "invited",
  },
  {
    id: "pvl-003", vendorId: "vmv-005", projectId: "proj-001",
    appStatus: "Invited", qualStatus: "Not Started",
    addedDate: "2025-06-01", lastUpdated: "2025-06-01",
    source: "invited",
  },
  {
    id: "pvl-004", vendorId: "vmv-002", projectId: "proj-001",
    appStatus: "Review Complete", qualStatus: "Rejected", score: 48,
    addedDate: "2025-01-20", lastUpdated: "2025-04-30",
    source: "added_from_vm",
    blockers: ["Category mismatch — landscaping scope not required for this package"],
    rationale: "Vendor does not meet civil/structural scope requirements.",
  },
  {
    id: "pvl-005", vendorId: "vmv-008", projectId: "proj-001",
    appStatus: "Submitted", qualStatus: "Pending Review", score: 82,
    addedDate: "2025-04-20", lastUpdated: "2025-06-09",
    source: "added_from_vm",
    blockers: ["ZATCA certificate expiring 9 Jul 2025 — renewal required before award"],
  },

  // ── proj-002: NEOM Linear City — Groundworks ──────────────────────────────

  {
    id: "pvl-006", vendorId: "vmv-001", projectId: "proj-002",
    appStatus: "Submitted", qualStatus: "Pending Review", score: 87,
    addedDate: "2025-02-10", lastUpdated: "2025-06-01",
    source: "invited",
  },
  {
    id: "pvl-007", vendorId: "vmv-005", projectId: "proj-002",
    appStatus: "In Review", qualStatus: "Qualified", score: 88,
    addedDate: "2025-02-15", lastUpdated: "2025-06-03",
    source: "invited",
  },
  {
    id: "pvl-008", vendorId: "vmv-004", projectId: "proj-002",
    appStatus: "Opened", qualStatus: "Not Started",
    addedDate: "2025-04-01", lastUpdated: "2025-05-28",
    source: "added_from_vm",
    blockers: ["ZATCA certificate expired 31 Jan 2025 — must renew before submission"],
  },
  {
    id: "pvl-009", vendorId: "vmv-008", projectId: "proj-002",
    appStatus: "Invited", qualStatus: "Not Started",
    addedDate: "2025-06-05", lastUpdated: "2025-06-05",
    source: "invited",
    blockers: ["ZATCA certificate expiring 9 Jul 2025"],
  },

  // ── proj-003: Diriyah Gate — Hospitality Zone ─────────────────────────────

  {
    id: "pvl-010", vendorId: "vmv-007", projectId: "proj-003",
    appStatus: "In Review", qualStatus: "Qualified", score: 78,
    addedDate: "2025-05-01", lastUpdated: "2025-06-11",
    source: "added_from_vm",
  },
  {
    id: "pvl-011", vendorId: "vmv-003", projectId: "proj-003",
    appStatus: "Submitted", qualStatus: "Pending Review", score: 76,
    addedDate: "2025-04-12", lastUpdated: "2025-06-08",
    source: "invited",
  },
  {
    id: "pvl-012", vendorId: "vmv-004", projectId: "proj-003",
    appStatus: "Invited", qualStatus: "Not Started",
    addedDate: "2025-06-10", lastUpdated: "2025-06-10",
    source: "invited",
    blockers: ["ZATCA certificate expired", "Under global review"],
  },
];

// ── Readiness helper ──────────────────────────────────────────────────────────

const REQUIRED_VENDORS = 3;

export function getReadinessStatus(links: PackageVendorLink[]): PkgReadinessStatus {
  if (links.length === 0) return "Not Started";

  const shortlisted = links.filter(l => l.qualStatus === "Shortlisted").length;
  const qualified   = links.filter(l => l.qualStatus === "Qualified" || l.qualStatus === "Conditionally Qualified").length;
  const inReview    = links.filter(l => l.appStatus === "In Review" || l.appStatus === "Review Complete").length;
  const submitted   = links.filter(l =>
    ["Submitted", "In Review", "Clarification Requested", "Review Complete"].includes(l.appStatus)
  ).length;

  if (shortlisted >= REQUIRED_VENDORS) return "Ready for Tender";
  if (qualified + shortlisted >= REQUIRED_VENDORS) return "Ready for Shortlist";
  if (inReview > 0) return "Under Review";
  if (submitted === 0) return "Awaiting Submissions";
  if (qualified + shortlisted < REQUIRED_VENDORS) return "Vendor Gap";
  return "Sourcing Vendors";
}
