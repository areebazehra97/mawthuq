import { useCallback, useEffect, useState } from "react";
import { seededBackendApplications } from "@/data/seed";
import { api } from "@/lib/api";
import { emitDataChanged, subscribeToDataChanged } from "@/lib/data-events";
import type { VendorPackageApplication } from "@/types";

interface UseApplicationsOptions {
  packageId?: string;
  vendorId?: string;
}

export function useApplications(options: UseApplicationsOptions = {}) {
  const { packageId, vendorId } = options;
  const [applications, setApplications] = useState<VendorPackageApplication[]>(
    seededBackendApplications.filter((app) => {
      if (packageId) return app.packageId === packageId;
      if (vendorId) return app.vendorId === vendorId;
      return true;
    }),
  );

  const refresh = useCallback(async () => {
    try {
      if (packageId) {
        setApplications(await api.getPackageApplications(packageId));
        return;
      }
      if (vendorId) {
        setApplications(await api.getVendorApplications(vendorId));
        return;
      }
      setApplications(await api.getApplications());
    } catch {
      setApplications(
        seededBackendApplications.filter((app) => {
          if (packageId) return app.packageId === packageId;
          if (vendorId) return app.vendorId === vendorId;
          return true;
        }),
      );
    }
  }, [packageId, vendorId]);

  useEffect(() => {
    void refresh();
    return subscribeToDataChanged(refresh);
  }, [refresh]);

  const createApplication = useCallback(async (application: Partial<VendorPackageApplication>) => {
    await api.createApplication(application);
    await refresh();
    emitDataChanged("applications");
  }, [refresh]);

  const updateApplication = useCallback(
    async (applicationId: string, updates: Partial<VendorPackageApplication>) => {
      await api.updateApplication(applicationId, updates);
      await refresh();
      emitDataChanged("applications");
    },
    [refresh],
  );

  const deleteApplication = useCallback(async (applicationId: string) => {
    await api.deleteApplication(applicationId);
    await refresh();
    emitDataChanged("applications");
  }, [refresh]);

  return {
    applications,
    refresh,
    createApplication,
    updateApplication,
    deleteApplication,
  };
}
