export type VendorStatus = "PASS" | "CONDITIONAL" | "FAIL";

export type ReviewStage =
  | "Uploaded"
  | "Extracted"
  | "Scored"
  | "In Review"
  | "Approved"
  | "Rejected";

export interface PackageMetric {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}

export interface ReviewItem {
  label: string;
  state: "Complete" | "Flagged" | "Missing" | "Pending";
  evidence: string;
}

export interface TimelineEvent {
  title: string;
  detail: string;
  when: string;
}

export interface VendorRecord {
  id: string;
  name: string;
  arabicName: string;
  city: string;
  classification: string;
  primaryDiscipline: string;
  workCategory?: string;
  projectId?: string;
  status: VendorStatus;
  reviewStage: ReviewStage;
  packageHealth: string;
  score: number;
  documentsSubmitted: number;
  openIssues: number;
  expiryRisk: string;
  submittedAt: string;
  metrics: PackageMetric[];
  reviewItems: ReviewItem[];
  timeline: TimelineEvent[];
  summary: string;
}

export interface NavigationItem {
  label: string;
  path: string;
  description: string;
}

export type ProjectStatus = "Active" | "Planning" | "Tendering" | "Closed";

export type BackendProjectStatus =
  | "Planning"
  | "Tendering"
  | "Active"
  | "Completed"
  | "Archived";

export interface ProjectCategory {
  name: string;
  subCategories: string[];
  requiredDocuments: string[];
}

export interface ProjectConfig {
  categories: ProjectCategory[];
  scoringWeights: ScoringWeights;
  decisionThresholds: DecisionThresholds;
  hardGateRules: string[];
  expiryReminderDays?: number[];
}

export interface Project {
  id: string;
  name: string;
  arabicName: string;
  location: string;
  packageName: string;
  workCategory: string;
  packageValueBand: string;
  status: ProjectStatus;
  categories: string[];
  submittedCount: number;
  totalInvited: number;
  scope?: string;
  timeline?: string;
  registrationDeadline?: string;
  reviewers?: ReviewerRole[];
  requiredExperience?: string[];
  requiredCertifications?: string[];
  config?: ProjectConfig;
}

export interface BackendProject {
  id: string;
  name: string;
  arabicName?: string;
  location: string;
  status: BackendProjectStatus;
  description?: string;
  startDate?: string;
  targetCompletionDate?: string;
  timeline?: string;
  categories?: string[];
  reviewers?: ReviewerRole[];
  requiredExperience?: string[];
  requiredCertifications?: string[];
  config?: ProjectConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ScoringWeights {
  compliance: number;
  financial: number;
  technical: number;
  hse: number;
  localization: number;
}

export interface DecisionThresholds {
  pass: number;
  conditionalMin: number;
  conditionalMax: number;
}

export interface PackageSetupConfig {
  packageName: string;
  projectName: string;
  workCategory: string;
  packageValueBand: string;
  requiredDocuments: string[];
  hardGateRules: string[];
  scoringWeights: ScoringWeights;
  decisionThresholds: DecisionThresholds;
}

export interface ActivityFeedItem {
  id: string;
  title: string;
  detail: string;
  when: string;
  tone?: "neutral" | "success" | "warning";
}

export type DocumentStatus = "Valid" | "Missing" | "Expired" | "Ambiguous";

export type DocumentLanguage = "English" | "Arabic" | "Bilingual";

export interface VendorDocument {
  id: string;
  vendorId: string;
  name: string;
  documentType: string;
  classifiedDocumentType?: string;
  uploadDate: string;
  issueDate?: string;
  issuingAuthority?: string;
  language: DocumentLanguage;
  expiryDate: string;
  status: DocumentStatus;
  reviewerComments?: string;
  confidenceScore: number;
  sizeLabel: string;
  source: "Demo Pack" | "Manual Upload";
  version: number;
  isCurrentVersion: boolean;
  supersedes?: string;
  supersededBy?: string;
  mimeType?: string;
  contentPreview?: string;
  uploadedBy?: string;
  storagePath?: string;
  storageProvider?: "local" | "supabase";
  documentHash?: string;
  supportLevel?: "live" | "demo_supported" | "unsupported";
  lastProcessedAt?: string | null;
}

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
  sourceDocument: string;
  pageNumber: number;
  evidenceSnippet: string;
  sourceMode?: "live" | "seeded" | "demo_supported";
}

export type ExtractionSourceMode = "live" | "seeded" | "demo_supported";

export type ExtractionStatus =
  | "not_started"
  | "queued"
  | "classifying"
  | "extracting"
  | "validating"
  | "running"
  | "complete"
  | "failed";

export type ExtractionQualityStatus =
  | "Evidence complete"
  | "Partial evidence"
  | "Fallback used"
  | "Reviewer action required";

export interface ExtractionDocumentDebug {
  documentId: string;
  documentName: string;
  documentType: string;
  classifiedDocumentType: string;
  supportLevel: "live" | "demo_supported" | "unsupported";
  textSource: "pdf" | "text" | "preview" | "none";
  extractedPages: number;
  usedFallback: boolean;
}

export interface ExtractionDebugInfo {
  modelName?: string;
  promptVersion?: string;
  fallbackReason?: string | null;
  errorMessage?: string | null;
  cacheHit?: boolean;
  documentSummaries: ExtractionDocumentDebug[];
}

export interface VendorExtraction {
  vendorId: string;
  fields: ExtractedField[];
  sourceMode: ExtractionSourceMode;
  extractionStatus: ExtractionStatus;
  lastRunAt: string | null;
  warning?: string;
  supportedLiveDocumentTypes: string[];
  qualityStatus?: ExtractionQualityStatus;
  modelName?: string;
  promptVersion?: string;
  documentHash?: string;
  fallbackReason?: string | null;
  completedAt?: string | null;
  debug?: ExtractionDebugInfo;
}

export type RiskLevel = "High" | "Medium" | "Low";

export type RuleResult = "Pass" | "Review" | "Fail";

export interface ScorecardFinding {
  id: string;
  dimension: "Compliance" | "Financial" | "Technical" | "HSE" | "Localization";
  ruleName: string;
  inputValue: string;
  result: RuleResult;
  riskLevel: RiskLevel;
  sourceCitation: string;
  explanation: string;
  hardGate: boolean;
}

export interface ScorecardDimensionScore {
  dimension: "Compliance" | "Financial" | "Technical" | "HSE" | "Localization";
  score: number;
  weight: number;
}

export interface VendorScorecard {
  vendorId: string;
  overallScore: number;
  decision: VendorStatus;
  riskLevel: RiskLevel;
  missingDocuments: number;
  expiredDocuments: number;
  hardGateFailures: number;
  criticalDocExpired: boolean;
  dimensions: ScorecardDimensionScore[];
  findings: ScorecardFinding[];
}

export type PackageReadinessStatus =
  | "Not Started"
  | "Sourcing Vendors"
  | "Awaiting Submissions"
  | "Under Review"
  | "Vendor Gap"
  | "Ready for Shortlist"
  | "Ready for Tender"
  | "Blocked";

export type ApplicationStatusValue =
  | "Invited"
  | "Opened"
  | "In Progress"
  | "Submitted"
  | "In Review"
  | "Clarification Requested"
  | "Review Complete"
  | "Withdrawn";

export type QualificationStatusValue =
  | "Not Started"
  | "Pending Review"
  | "Qualified"
  | "Conditionally Qualified"
  | "Rejected"
  | "Shortlisted"
  | "Awarded";

export type InvitationStatusValue =
  | "Invited"
  | "Opened"
  | "In Progress"
  | "Submitted"
  | "Expired"
  | "Bounced"
  | "Declined";

export interface BackendPackage {
  id: string;
  projectId: string;
  name: string;
  category: string;
  valueBand: string;
  status: "Open" | "Evaluating" | "Closed" | "Awarded";
  readinessStatus: PackageReadinessStatus;
  requiredVendorCount: number;
  deadline?: string;
  criteria?: string[];
  primaryForProject?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorPackageApplication {
  id: string;
  vendorId: string;
  projectId: string;
  packageId: string;
  applicationStatus: ApplicationStatusValue;
  qualificationStatus: QualificationStatusValue;
  score?: number;
  recommendation?: VendorStatus;
  openBlockers?: string[];
  rationale?: string;
  source?: "invited" | "added_from_vm" | "direct";
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface BackendInvitation {
  id: string;
  vendorId?: string;
  projectId?: string;
  packageId?: string;
  applicationId?: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  category?: string;
  note?: string;
  status: InvitationStatusValue;
  invitedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export type InvitationStatus =
  | "invited"
  | "opened"
  | "started"
  | "submitted"
  | "expired"
  | "bounced"
  | "declined";

export interface VendorInvitation {
  id: string;
  token: string;
  companyName: string;
  contactPerson: string;
  email: string;
  tradeCategory: string;
  projectContext?: string;
  status: InvitationStatus;
  invitedAt: string;
  expiresAt: string;
  openedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  invitedBy: string;
  registrationLink: string;
}

export type ReviewerRole =
  | "Procurement Analyst"
  | "Procurement Manager"
  | "Finance Reviewer"
  | "HSE Reviewer"
  | "PMO Director";

export type FieldReviewAction = "Accept" | "Reject" | "Edit" | "Escalate";

export type RuleReviewAction = "Override";

export interface FieldReviewState {
  vendorId: string;
  fieldLabel: string;
  status: "Pending" | "Accepted" | "Rejected" | "Escalated" | "Edited";
  reviewerRole: ReviewerRole;
  currentValue: string;
  notes: string;
}

export interface RuleReviewState {
  vendorId: string;
  ruleId: string;
  overrideResult: RuleResult | "";
  reason: string;
  assignedReviewer: ReviewerRole;
}

export interface AuditRecord {
  id: string;
  vendorId: string;
  timestamp: string;
  actor: ReviewerRole | "System";
  title: string;
  detail: string;
}

export interface ReportPreview {
  vendor: string;
  decision: VendorStatus;
  score: number;
  findings: ScorecardFinding[];
  citations: ExtractedField[];
  auditTrail: AuditRecord[];
}

export interface CommandCenterKpis {
  totalProjects: number;
  activeProjects: number;
  totalPackages: number;
  packagesNeedingAttention: number;
  pendingReviews: number;
  totalInvitations: number;
  activeInvitations: number;
  submittedApplications: number;
  shortlistedApplications: number;
  criticalBlockers: number;
}

export interface CommandCenterAttentionPackage {
  packageId: string;
  projectId: string;
  projectName: string;
  packageName: string;
  category: string;
  readinessStatus: PackageReadinessStatus;
  invitedCount: number;
  submittedCount: number;
  qualifiedCount: number;
  requiredVendorCount: number;
  mainBlocker: string;
  nextAction: string;
}

export interface CommandCenterProjectSummary {
  projectId: string;
  name: string;
  location: string;
  status: BackendProjectStatus;
  packageCount: number;
  invitedCount: number;
  submittedCount: number;
}

export interface CommandCenterReviewQueueItem {
  applicationId: string;
  vendorId: string;
  projectId: string;
  packageId: string;
  applicationStatus: ApplicationStatusValue;
  qualificationStatus: QualificationStatusValue;
  lastActivityAt: string;
  score?: number;
}

export interface CommandCenterVendorPipelineCounts {
  invited: number;
  opened: number;
  inProgress: number;
  submitted: number;
  inReview: number;
  qualified: number;
  shortlisted: number;
}

export interface CommandCenterBlocker {
  applicationId: string;
  vendorId: string;
  projectId: string;
  packageId: string;
  blocker: string;
  severity: "critical" | "warning";
  lastActivityAt: string;
}

export interface CommandCenterDeadline {
  kind: "package" | "invitation";
  id: string;
  projectId?: string;
  packageId?: string;
  label: string;
  dueAt: string;
  status: string;
}

export interface CommandCenterActivityItem {
  id: string;
  title: string;
  detail: string;
  when: string;
  tone?: "neutral" | "success" | "warning";
}

export interface CommandCenterSummary {
  kpis: CommandCenterKpis;
  packagesNeedingAttention: CommandCenterAttentionPackage[];
  activeProjectsSummary: CommandCenterProjectSummary[];
  pendingReviewQueue: CommandCenterReviewQueueItem[];
  vendorPipelineCounts: CommandCenterVendorPipelineCounts;
  criticalBlockers: CommandCenterBlocker[];
  upcomingDeadlines: CommandCenterDeadline[];
  recentActivity: CommandCenterActivityItem[];
}

export interface BackendState {
  vendors: VendorRecord[];
  documents: VendorDocument[];
  extractions: VendorExtraction[];
  auditRecords: AuditRecord[];
  fieldReviewStates: FieldReviewState[];
  ruleReviewStates: RuleReviewState[];
  packageConfig: PackageSetupConfig;
  projects: BackendProject[];
  packages: BackendPackage[];
  vendorPackageApplications: VendorPackageApplication[];
  invitations: BackendInvitation[];
  reports?: Record<string, ReportPreview>;
}
