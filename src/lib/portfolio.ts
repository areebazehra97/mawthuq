import type {
  ApplicationStatusValue,
  BackendInvitation,
  BackendPackage,
  BackendProject,
  CommandCenterSummary,
  InvitationStatus,
  PackageReadinessStatus,
  Project,
  ProjectStatus,
  QualificationStatusValue,
  VendorInvitation,
  VendorPackageApplication,
} from "@/types";

export function mapBackendProjectStatus(status: BackendProject["status"]): ProjectStatus {
  switch (status) {
    case "Planning":
      return "Planning";
    case "Tendering":
      return "Tendering";
    case "Active":
      return "Active";
    case "Completed":
    case "Archived":
      return "Closed";
  }
}

export function mapProjectToLegacy(
  project: BackendProject,
  pkg: BackendPackage | undefined,
  applications: VendorPackageApplication[],
): Project {
  const submittedCount = applications.filter((app) =>
    ["Submitted", "In Review", "Clarification Requested", "Review Complete"].includes(
      app.applicationStatus,
    ),
  ).length;

  return {
    id: project.id,
    name: project.name,
    arabicName: project.arabicName ?? "",
    location: project.location,
    packageName: pkg?.name ?? "Primary Package",
    workCategory: pkg?.category ?? "General Contracting",
    packageValueBand: pkg?.valueBand ?? "SAR 250M – SAR 1B",
    status: mapBackendProjectStatus(project.status),
    categories:
      project.categories ??
      pkg?.criteria ??
      [pkg?.category ?? "General Contracting"],
    submittedCount,
    totalInvited: applications.length,
    scope: project.description,
    timeline:
      project.timeline ??
      (project.startDate && project.targetCompletionDate
        ? `${project.startDate} – ${project.targetCompletionDate}`
        : undefined),
    registrationDeadline: pkg?.deadline,
    reviewers: project.reviewers,
    requiredExperience: project.requiredExperience,
    requiredCertifications: project.requiredCertifications,
    config: project.config,
  };
}

export function mapInvitationStatus(status: BackendInvitation["status"]): InvitationStatus {
  switch (status) {
    case "Invited":
      return "invited";
    case "Opened":
      return "opened";
    case "In Progress":
      return "started";
    case "Submitted":
      return "submitted";
    case "Expired":
      return "expired";
    case "Bounced":
      return "bounced";
    case "Declined":
      return "declined";
  }
}

export function mapBackendInvitation(invitation: BackendInvitation): VendorInvitation {
  return {
    id: invitation.id,
    token: invitation.id.toUpperCase(),
    companyName: invitation.companyName,
    contactPerson: invitation.contactName,
    email: invitation.contactEmail,
    tradeCategory: invitation.category ?? "General Contracting",
    projectContext: undefined,
    status: mapInvitationStatus(invitation.status),
    invitedAt: invitation.invitedAt,
    expiresAt: invitation.expiresAt ?? invitation.invitedAt,
    invitedBy: "System",
    registrationLink: `https://portal.mawthuq.app/register/${invitation.id}`,
  };
}

export function mapBackendInvitationWithContext(
  invitation: BackendInvitation,
  project?: BackendProject,
  pkg?: BackendPackage,
): VendorInvitation {
  const context = [project?.name, pkg?.name].filter(Boolean).join(" — ");

  return {
    ...mapBackendInvitation(invitation),
    projectContext: context || undefined,
  };
}

export function mapApplicationToPackageLink(
  application: VendorPackageApplication,
): {
  id: string;
  vendorId: string;
  projectId: string;
  appStatus: ApplicationStatusValue;
  qualStatus: QualificationStatusValue;
  score?: number;
  addedDate: string;
  lastUpdated: string;
  source: "invited" | "added_from_vm" | "direct";
  blockers?: string[];
  rationale?: string;
} {
  return {
    id: application.id,
    vendorId: application.vendorId,
    projectId: application.projectId,
    appStatus: application.applicationStatus,
    qualStatus: application.qualificationStatus,
    score: application.score,
    addedDate: application.createdAt,
    lastUpdated: application.updatedAt,
    source: application.source ?? "direct",
    blockers: application.openBlockers,
    rationale: application.rationale,
  };
}

export function derivePackageReadinessLabel(summary: CommandCenterSummary, packageId: string): PackageReadinessStatus | undefined {
  return summary.packagesNeedingAttention.find((item) => item.packageId === packageId)?.readinessStatus;
}
