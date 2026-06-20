import { useCallback } from "react";
import { api } from "@/lib/api";
import { emitDataChanged } from "@/lib/data-events";
import type { BackendInvitation, BackendPackage, BackendProject, VendorPackageApplication } from "@/types";
import type { VMVendor } from "@/data/vendor-master-seed";

function addDays(base: Date, days: number) {
  const nextDate = new Date(base);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function today() {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface InviteVendorInput {
  vendor: VMVendor;
  projectId: string;
  packageId: string;
  note?: string;
}

interface UsePackageInviteFlowOptions {
  applications: VendorPackageApplication[];
  invitations: BackendInvitation[];
  projects: BackendProject[];
  packages: BackendPackage[];
}

export function usePackageInviteFlow({
  applications,
  invitations,
  projects,
  packages,
}: UsePackageInviteFlowOptions) {
  const inviteVendorToPackage = useCallback(
    async ({ vendor, projectId, packageId, note }: InviteVendorInput) => {
      const project = projects.find((item) => item.id === projectId);
      const pkg = packages.find((item) => item.id === packageId);
      if (!project) {
        throw new Error("Project not found");
      }
      if (!pkg) {
        throw new Error("Package not found");
      }

      const application = await api.createApplication({
        vendorId: vendor.id,
        projectId,
        packageId,
        applicationStatus: "Invited",
        qualificationStatus: "Not Started",
        source: "invited",
      });

      const activeInvitation = invitations.find(
        (item) =>
          item.packageId === packageId &&
          item.vendorId === vendor.id &&
          item.status !== "Expired" &&
          item.status !== "Bounced" &&
          item.status !== "Declined",
      );

      const invitationPayload: Partial<BackendInvitation> = {
        vendorId: vendor.id,
        projectId,
        packageId,
        applicationId: application.id,
        companyName: vendor.name,
        contactName: vendor.contactName,
        contactEmail: vendor.contactEmail,
        category: pkg.category ?? vendor.tradeCategories[0],
        note: note?.trim() || undefined,
        status: "Invited",
        invitedAt: today(),
        expiresAt: addDays(new Date(), 30),
      };

      const invitation = activeInvitation
        ? await api.updateInvitation(activeInvitation.id, invitationPayload)
        : await api.createInvitation(invitationPayload);

      emitDataChanged("applications");
      emitDataChanged("invitations");
      emitDataChanged("packages");

      return {
        project,
        package: pkg,
        application,
        invitation,
        existed:
          applications.some(
            (item) => item.vendorId === vendor.id && item.packageId === packageId,
          ) || Boolean(activeInvitation),
      };
    },
    [applications, invitations, packages, projects],
  );

  return { inviteVendorToPackage };
}
