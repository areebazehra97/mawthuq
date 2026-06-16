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
  uploadDate: string;
  language: DocumentLanguage;
  expiryDate: string;
  status: DocumentStatus;
  confidenceScore: number;
  sizeLabel: string;
  source: "Demo Pack" | "Manual Upload";
}

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
  sourceDocument: string;
  pageNumber: number;
  evidenceSnippet: string;
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
  dimensions: ScorecardDimensionScore[];
  findings: ScorecardFinding[];
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
