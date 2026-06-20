import type {
  ApplicationStatusValue,
  BackendInvitation,
  BackendPackage,
  BackendProject,
  BackendProjectStatus,
  BackendState,
  CommandCenterActivityItem,
  CommandCenterAttentionPackage,
  CommandCenterBlocker,
  CommandCenterDeadline,
  CommandCenterProjectSummary,
  CommandCenterReviewQueueItem,
  CommandCenterSummary,
  InvitationStatusValue,
  PackageReadinessStatus,
  ProjectConfig,
  QualificationStatusValue,
  ReviewerRole,
  VendorPackageApplication,
  VendorStatus,
} from "../src/types";

const PROJECT_STATUSES: BackendProjectStatus[] = [
  "Planning",
  "Tendering",
  "Active",
  "Completed",
  "Archived",
];

const PACKAGE_READINESS_STATUSES: PackageReadinessStatus[] = [
  "Not Started",
  "Sourcing Vendors",
  "Awaiting Submissions",
  "Under Review",
  "Vendor Gap",
  "Ready for Shortlist",
  "Ready for Tender",
  "Blocked",
];

const APPLICATION_STATUSES: ApplicationStatusValue[] = [
  "Invited",
  "Opened",
  "In Progress",
  "Submitted",
  "In Review",
  "Clarification Requested",
  "Review Complete",
  "Withdrawn",
];

const QUALIFICATION_STATUSES: QualificationStatusValue[] = [
  "Not Started",
  "Pending Review",
  "Qualified",
  "Conditionally Qualified",
  "Rejected",
  "Shortlisted",
  "Awarded",
];

const INVITATION_STATUSES: InvitationStatusValue[] = [
  "Invited",
  "Opened",
  "In Progress",
  "Submitted",
  "Expired",
  "Bounced",
  "Declined",
];

const PACKAGE_STATUS_VALUES: BackendPackage["status"][] = [
  "Open",
  "Evaluating",
  "Closed",
  "Awarded",
];

export function nowIso() {
  return new Date().toISOString();
}

export function requireString(
  value: unknown,
  field: string,
  options: { optional: true },
): string | undefined;
export function requireString(
  value: unknown,
  field: string,
  options?: { optional?: false },
): string;
export function requireString(
  value: unknown,
  field: string,
  { optional = false }: { optional?: boolean } = {},
) {
  if (optional && (value === undefined || value === null || value === "")) {
    return undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

export function optionalStringArray(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new Error("criteria must be an array of strings");
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

export function optionalObject<T>(value: unknown, field: string): T | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} is invalid`);
  }
  return value as T;
}

export function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  options: { optional: true },
): T | undefined;
export function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  options?: { optional?: false },
): T;
export function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  { optional = false }: { optional?: boolean } = {},
): T | undefined {
  if (optional && value === undefined) return undefined;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${field} is invalid`);
  }
  return value as T;
}

export function derivePackageReadiness(
  applications: VendorPackageApplication[],
  requiredVendorCount: number,
): PackageReadinessStatus {
  if (applications.length === 0) return "Not Started";

  const shortlisted = applications.filter((app) => app.qualificationStatus === "Shortlisted").length;
  const qualified = applications.filter((app) =>
    app.qualificationStatus === "Qualified" ||
    app.qualificationStatus === "Conditionally Qualified",
  ).length;
  const inReview = applications.filter((app) =>
    app.applicationStatus === "In Review" ||
    app.applicationStatus === "Review Complete" ||
    app.applicationStatus === "Clarification Requested",
  ).length;
  const submitted = applications.filter((app) =>
    ["Submitted", "In Review", "Clarification Requested", "Review Complete"].includes(
      app.applicationStatus,
    ),
  ).length;
  const blocked = applications.some((app) => (app.openBlockers?.length ?? 0) > 0);

  if (shortlisted >= requiredVendorCount) return "Ready for Tender";
  if (qualified + shortlisted >= requiredVendorCount) return "Ready for Shortlist";
  if (submitted === 0 && blocked) return "Blocked";
  if (submitted === 0) return "Awaiting Submissions";
  if (qualified + shortlisted < requiredVendorCount) return "Vendor Gap";
  if (inReview > 0) return "Under Review";
  return "Sourcing Vendors";
}

export function refreshPackageReadiness(state: BackendState) {
  state.packages = state.packages.map((pkg) => {
    const packageApps = state.vendorPackageApplications.filter((app) => app.packageId === pkg.id);
    return {
      ...pkg,
      readinessStatus: derivePackageReadiness(packageApps, pkg.requiredVendorCount),
      updatedAt: pkg.updatedAt,
    };
  });
}

export function buildProject(input: Record<string, unknown>): BackendProject {
  const timestamp = nowIso();
  return {
    id: requireString(input.id, "id", { optional: true }) ?? `proj-${Date.now()}`,
    name: requireString(input.name, "name"),
    arabicName: requireString(input.arabicName, "arabicName", { optional: true }),
    location: requireString(input.location, "location"),
    status:
      requireEnum(input.status, PROJECT_STATUSES, "status", { optional: true }) ??
      "Planning",
    description: requireString(input.description, "description", { optional: true }),
    startDate: requireString(input.startDate, "startDate", { optional: true }),
    targetCompletionDate: requireString(
      input.targetCompletionDate,
      "targetCompletionDate",
      { optional: true },
    ),
    timeline: requireString(input.timeline, "timeline", { optional: true }),
    categories: optionalStringArray(input.categories),
    reviewers: optionalStringArray(input.reviewers) as ReviewerRole[] | undefined,
    requiredExperience: optionalStringArray(input.requiredExperience),
    requiredCertifications: optionalStringArray(input.requiredCertifications),
    config: optionalObject<ProjectConfig>(input.config, "config"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function patchProject(project: BackendProject, input: Record<string, unknown>): BackendProject {
  return {
    ...project,
    name: requireString(input.name ?? project.name, "name"),
    arabicName: requireString(input.arabicName, "arabicName", { optional: true }) ?? project.arabicName,
    location: requireString(input.location ?? project.location, "location"),
    status: requireEnum(input.status, PROJECT_STATUSES, "status", { optional: true }) ?? project.status,
    description:
      input.description !== undefined
        ? requireString(input.description, "description", { optional: true })
        : project.description,
    startDate:
      input.startDate !== undefined
        ? requireString(input.startDate, "startDate", { optional: true })
        : project.startDate,
    targetCompletionDate:
      input.targetCompletionDate !== undefined
        ? requireString(input.targetCompletionDate, "targetCompletionDate", { optional: true })
        : project.targetCompletionDate,
    timeline:
      input.timeline !== undefined
        ? requireString(input.timeline, "timeline", { optional: true })
        : project.timeline,
    categories:
      input.categories !== undefined
        ? optionalStringArray(input.categories)
        : project.categories,
    reviewers:
      input.reviewers !== undefined
        ? (optionalStringArray(input.reviewers) as ReviewerRole[] | undefined)
        : project.reviewers,
    requiredExperience:
      input.requiredExperience !== undefined
        ? optionalStringArray(input.requiredExperience)
        : project.requiredExperience,
    requiredCertifications:
      input.requiredCertifications !== undefined
        ? optionalStringArray(input.requiredCertifications)
        : project.requiredCertifications,
    config:
      input.config !== undefined
        ? optionalObject<ProjectConfig>(input.config, "config")
        : project.config,
    updatedAt: nowIso(),
  };
}

export function buildPackage(
  projectId: string,
  input: Record<string, unknown>,
): BackendPackage {
  const timestamp = nowIso();
  return {
    id: requireString(input.id, "id", { optional: true }) ?? `pkg-${Date.now()}`,
    projectId,
    name: requireString(input.name, "name"),
    category: requireString(input.category, "category"),
    valueBand: requireString(input.valueBand, "valueBand"),
    status: requireEnum(input.status, PACKAGE_STATUS_VALUES, "status", { optional: true }) ?? "Open",
    readinessStatus:
      requireEnum(
        input.readinessStatus,
        PACKAGE_READINESS_STATUSES,
        "readinessStatus",
        { optional: true },
      ) ?? "Not Started",
    requiredVendorCount:
      typeof input.requiredVendorCount === "number" ? input.requiredVendorCount : 3,
    deadline: requireString(input.deadline, "deadline", { optional: true }),
    criteria: optionalStringArray(input.criteria),
    primaryForProject: Boolean(input.primaryForProject),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function patchPackage(
  pkg: BackendPackage,
  input: Record<string, unknown>,
): BackendPackage {
  return {
    ...pkg,
    name: input.name !== undefined ? requireString(input.name, "name") : pkg.name,
    category:
      input.category !== undefined ? requireString(input.category, "category") : pkg.category,
    valueBand:
      input.valueBand !== undefined ? requireString(input.valueBand, "valueBand") : pkg.valueBand,
    status:
      requireEnum(input.status, PACKAGE_STATUS_VALUES, "status", { optional: true }) ?? pkg.status,
    readinessStatus:
      requireEnum(
        input.readinessStatus,
        PACKAGE_READINESS_STATUSES,
        "readinessStatus",
        { optional: true },
      ) ?? pkg.readinessStatus,
    requiredVendorCount:
      typeof input.requiredVendorCount === "number"
        ? input.requiredVendorCount
        : pkg.requiredVendorCount,
    deadline:
      input.deadline !== undefined
        ? requireString(input.deadline, "deadline", { optional: true })
        : pkg.deadline,
    criteria: input.criteria !== undefined ? optionalStringArray(input.criteria) : pkg.criteria,
    primaryForProject:
      input.primaryForProject !== undefined
        ? Boolean(input.primaryForProject)
        : pkg.primaryForProject,
    updatedAt: nowIso(),
  };
}

export function buildApplication(
  input: Record<string, unknown>,
): VendorPackageApplication {
  const timestamp = nowIso();
  return {
    id: requireString(input.id, "id", { optional: true }) ?? `app-${Date.now()}`,
    vendorId: requireString(input.vendorId, "vendorId"),
    projectId: requireString(input.projectId, "projectId"),
    packageId: requireString(input.packageId, "packageId"),
    applicationStatus:
      requireEnum(input.applicationStatus, APPLICATION_STATUSES, "applicationStatus", {
        optional: true,
      }) ??
      "Invited",
    qualificationStatus:
      requireEnum(
        input.qualificationStatus,
        QUALIFICATION_STATUSES,
        "qualificationStatus",
        { optional: true },
      ) ?? "Not Started",
    score: typeof input.score === "number" ? input.score : undefined,
    recommendation:
      requireEnum(
        input.recommendation,
        ["PASS", "CONDITIONAL", "FAIL"] as const,
        "recommendation",
        { optional: true },
      ) as VendorStatus | undefined,
    openBlockers: optionalStringArray(input.openBlockers),
    rationale: requireString(input.rationale, "rationale", { optional: true }),
    source:
      requireEnum(
        input.source,
        ["invited", "added_from_vm", "direct"] as const,
        "source",
        { optional: true },
      ) ?? "direct",
    createdAt: timestamp,
    updatedAt: timestamp,
    lastActivityAt: timestamp,
  };
}

export function patchApplication(
  app: VendorPackageApplication,
  input: Record<string, unknown>,
): VendorPackageApplication {
  const next = {
    ...app,
    applicationStatus:
      requireEnum(
        input.applicationStatus,
        APPLICATION_STATUSES,
        "applicationStatus",
        { optional: true },
      ) ?? app.applicationStatus,
    qualificationStatus:
      requireEnum(
        input.qualificationStatus,
        QUALIFICATION_STATUSES,
        "qualificationStatus",
        { optional: true },
      ) ?? app.qualificationStatus,
    score: typeof input.score === "number" ? input.score : app.score,
    recommendation:
      (requireEnum(
        input.recommendation,
        ["PASS", "CONDITIONAL", "FAIL"] as const,
        "recommendation",
        { optional: true },
      ) as VendorStatus | undefined) ?? app.recommendation,
    openBlockers:
      input.openBlockers !== undefined ? optionalStringArray(input.openBlockers) : app.openBlockers,
    rationale:
      input.rationale !== undefined
        ? requireString(input.rationale, "rationale", { optional: true })
        : app.rationale,
    updatedAt: nowIso(),
    lastActivityAt: nowIso(),
  };
  return next;
}

export function buildInvitation(
  input: Record<string, unknown>,
): BackendInvitation {
  const timestamp = nowIso();
  return {
    id: requireString(input.id, "id", { optional: true }) ?? `inv-${Date.now()}`,
    vendorId: requireString(input.vendorId, "vendorId", { optional: true }),
    projectId: requireString(input.projectId, "projectId", { optional: true }),
    packageId: requireString(input.packageId, "packageId", { optional: true }),
    applicationId: requireString(input.applicationId, "applicationId", { optional: true }),
    companyName: requireString(input.companyName, "companyName"),
    contactName: requireString(input.contactName, "contactName"),
    contactEmail: requireString(input.contactEmail, "contactEmail"),
    category: requireString(input.category, "category", { optional: true }),
    status: requireEnum(input.status, INVITATION_STATUSES, "status", { optional: true }) ?? "Invited",
    invitedAt: requireString(input.invitedAt, "invitedAt", { optional: true }) ?? timestamp,
    expiresAt: requireString(input.expiresAt, "expiresAt", { optional: true }),
    createdAt: timestamp,
    updatedAt: timestamp,
    lastActivityAt: timestamp,
  };
}

export function patchInvitation(
  invitation: BackendInvitation,
  input: Record<string, unknown>,
): BackendInvitation {
  return {
    ...invitation,
    vendorId:
      input.vendorId !== undefined
        ? requireString(input.vendorId, "vendorId", { optional: true })
        : invitation.vendorId,
    projectId:
      input.projectId !== undefined
        ? requireString(input.projectId, "projectId", { optional: true })
        : invitation.projectId,
    packageId:
      input.packageId !== undefined
        ? requireString(input.packageId, "packageId", { optional: true })
        : invitation.packageId,
    applicationId:
      input.applicationId !== undefined
        ? requireString(input.applicationId, "applicationId", { optional: true })
        : invitation.applicationId,
    companyName:
      input.companyName !== undefined
        ? requireString(input.companyName, "companyName")
        : invitation.companyName,
    contactName:
      input.contactName !== undefined
        ? requireString(input.contactName, "contactName")
        : invitation.contactName,
    contactEmail:
      input.contactEmail !== undefined
        ? requireString(input.contactEmail, "contactEmail")
        : invitation.contactEmail,
    category:
      input.category !== undefined
        ? requireString(input.category, "category", { optional: true })
        : invitation.category,
    status:
      requireEnum(input.status, INVITATION_STATUSES, "status", { optional: true }) ??
      invitation.status,
    invitedAt:
      input.invitedAt !== undefined
        ? requireString(input.invitedAt, "invitedAt")
        : invitation.invitedAt,
    expiresAt:
      input.expiresAt !== undefined
        ? requireString(input.expiresAt, "expiresAt", { optional: true })
        : invitation.expiresAt,
    updatedAt: nowIso(),
    lastActivityAt: nowIso(),
  };
}

function humanWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function activityTone(item: CommandCenterActivityItem["title"]) {
  if (item.toLowerCase().includes("shortlist") || item.toLowerCase().includes("approved")) {
    return "success" as const;
  }
  if (item.toLowerCase().includes("blocker") || item.toLowerCase().includes("expired")) {
    return "warning" as const;
  }
  return "neutral" as const;
}

function nextActionForPackage(
  pkg: BackendPackage,
  invitedCount: number,
  submittedCount: number,
  inReviewCount: number,
) {
  if (pkg.readinessStatus === "Vendor Gap" || pkg.readinessStatus === "Blocked") {
    return "Add vendors";
  }
  if (pkg.readinessStatus === "Awaiting Submissions" && invitedCount > 0 && submittedCount === 0) {
    return "Send reminders";
  }
  if (pkg.readinessStatus === "Under Review" || inReviewCount > 0) {
    return "Open reviews";
  }
  if (pkg.readinessStatus === "Ready for Shortlist") {
    return "Build shortlist";
  }
  if (pkg.readinessStatus === "Ready for Tender") {
    return "Release tender";
  }
  return "Review package";
}

export function buildCommandCenterSummary(state: BackendState): CommandCenterSummary {
  refreshPackageReadiness(state);

  const packagesNeedingAttention: CommandCenterAttentionPackage[] = state.packages
    .map((pkg) => {
      const project = state.projects.find((item) => item.id === pkg.projectId);
      const apps = state.vendorPackageApplications.filter((item) => item.packageId === pkg.id);
      const invitedCount = apps.length;
      const submittedCount = apps.filter((item) =>
        ["Submitted", "In Review", "Clarification Requested", "Review Complete"].includes(
          item.applicationStatus,
        ),
      ).length;
      const qualifiedCount = apps.filter((item) =>
        item.qualificationStatus === "Qualified" ||
        item.qualificationStatus === "Conditionally Qualified" ||
        item.qualificationStatus === "Shortlisted",
      ).length;
      const inReviewCount = apps.filter((item) =>
        item.applicationStatus === "In Review" ||
        item.applicationStatus === "Clarification Requested" ||
        item.applicationStatus === "Review Complete",
      ).length;
      const mainBlocker =
        apps.flatMap((item) => item.openBlockers ?? [])[0] ??
        (submittedCount === 0
          ? "No vendors have submitted"
          : qualifiedCount < pkg.requiredVendorCount
            ? `Need ${pkg.requiredVendorCount - qualifiedCount} more qualified vendors`
            : "Awaiting shortlist decision");

      return {
        packageId: pkg.id,
        projectId: pkg.projectId,
        projectName: project?.name ?? pkg.projectId,
        packageName: pkg.name,
        category: pkg.category,
        readinessStatus: pkg.readinessStatus,
        invitedCount,
        submittedCount,
        qualifiedCount,
        requiredVendorCount: pkg.requiredVendorCount,
        mainBlocker,
        nextAction: nextActionForPackage(pkg, invitedCount, submittedCount, inReviewCount),
      };
    })
    .sort((a, b) => a.projectName.localeCompare(b.projectName));

  const activeProjectsSummary: CommandCenterProjectSummary[] = state.projects
    .filter((project) => project.status === "Active" || project.status === "Tendering")
    .map((project) => {
      const packages = state.packages.filter((pkg) => pkg.projectId === project.id);
      const applications = state.vendorPackageApplications.filter((app) => app.projectId === project.id);
      return {
        projectId: project.id,
        name: project.name,
        location: project.location,
        status: project.status,
        packageCount: packages.length,
        invitedCount: applications.length,
        submittedCount: applications.filter((app) =>
          ["Submitted", "In Review", "Clarification Requested", "Review Complete"].includes(
            app.applicationStatus,
          ),
        ).length,
      };
    });

  const pendingReviewQueue: CommandCenterReviewQueueItem[] = state.vendorPackageApplications
    .filter((app) =>
      app.applicationStatus === "In Review" ||
      app.applicationStatus === "Clarification Requested" ||
      app.applicationStatus === "Review Complete" ||
      app.qualificationStatus === "Pending Review",
    )
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
    .slice(0, 10)
    .map((app) => ({
      applicationId: app.id,
      vendorId: app.vendorId,
      projectId: app.projectId,
      packageId: app.packageId,
      applicationStatus: app.applicationStatus,
      qualificationStatus: app.qualificationStatus,
      lastActivityAt: app.lastActivityAt,
      score: app.score,
    }));

  const criticalBlockers: CommandCenterBlocker[] = state.vendorPackageApplications
    .flatMap((app) =>
      (app.openBlockers ?? []).map((blocker) => ({
        applicationId: app.id,
        vendorId: app.vendorId,
        projectId: app.projectId,
        packageId: app.packageId,
        blocker,
        severity:
          blocker.toLowerCase().includes("expired") || blocker.toLowerCase().includes("missing")
            ? ("critical" as const)
            : ("warning" as const),
        lastActivityAt: app.lastActivityAt,
      })),
    )
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
    .slice(0, 10);

  const upcomingDeadlines: CommandCenterDeadline[] = [
    ...state.packages
      .filter((pkg) => Boolean(pkg.deadline))
      .map((pkg) => ({
        kind: "package" as const,
        id: pkg.id,
        projectId: pkg.projectId,
        packageId: pkg.id,
        label: pkg.name,
        dueAt: pkg.deadline!,
        status: pkg.readinessStatus,
      })),
    ...state.invitations
      .filter((inv) => Boolean(inv.expiresAt))
      .map((inv) => ({
        kind: "invitation" as const,
        id: inv.id,
        projectId: inv.projectId,
        packageId: inv.packageId,
        label: inv.companyName,
        dueAt: inv.expiresAt!,
        status: inv.status,
      })),
  ]
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 10);

  const recentActivity: CommandCenterActivityItem[] = [
    ...state.auditRecords.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      when: item.timestamp,
      tone: activityTone(item.title),
      sortAt: new Date(item.timestamp).getTime(),
    })),
    ...state.vendorPackageApplications.map((app) => ({
      id: `activity-${app.id}`,
      title: `Application ${app.applicationStatus}`,
      detail: `${app.vendorId} in ${app.packageId}`,
      when: humanWhen(app.lastActivityAt),
      tone: "neutral" as const,
      sortAt: new Date(app.lastActivityAt).getTime(),
    })),
  ]
    .sort((a, b) => b.sortAt - a.sortAt)
    .slice(0, 10)
    .map(({ sortAt: _sortAt, ...item }) => item);

  const vendorPipelineCounts = {
    invited: state.vendorPackageApplications.filter((app) => app.applicationStatus === "Invited")
      .length,
    opened: state.vendorPackageApplications.filter((app) => app.applicationStatus === "Opened")
      .length,
    inProgress: state.vendorPackageApplications.filter(
      (app) => app.applicationStatus === "In Progress",
    ).length,
    submitted: state.vendorPackageApplications.filter(
      (app) => app.applicationStatus === "Submitted",
    ).length,
    inReview: state.vendorPackageApplications.filter((app) =>
      app.applicationStatus === "In Review" ||
      app.applicationStatus === "Clarification Requested" ||
      app.applicationStatus === "Review Complete",
    ).length,
    qualified: state.vendorPackageApplications.filter((app) =>
      app.qualificationStatus === "Qualified" ||
      app.qualificationStatus === "Conditionally Qualified",
    ).length,
    shortlisted: state.vendorPackageApplications.filter(
      (app) => app.qualificationStatus === "Shortlisted",
    ).length,
  };

  return {
    kpis: {
      totalProjects: state.projects.length,
      activeProjects: state.projects.filter(
        (project) => project.status === "Active" || project.status === "Tendering",
      ).length,
      totalPackages: state.packages.length,
      packagesNeedingAttention: packagesNeedingAttention.filter(
        (pkg) => pkg.readinessStatus !== "Ready for Tender",
      ).length,
      pendingReviews: pendingReviewQueue.length,
      totalInvitations: state.invitations.length,
      activeInvitations: state.invitations.filter((inv) =>
        inv.status === "Invited" || inv.status === "Opened" || inv.status === "In Progress",
      ).length,
      submittedApplications: vendorPipelineCounts.submitted + vendorPipelineCounts.inReview,
      shortlistedApplications: vendorPipelineCounts.shortlisted,
      criticalBlockers: criticalBlockers.filter((blocker) => blocker.severity === "critical").length,
    },
    packagesNeedingAttention,
    activeProjectsSummary,
    pendingReviewQueue,
    vendorPipelineCounts,
    criticalBlockers,
    upcomingDeadlines,
    recentActivity,
  };
}
