import { useCallback, useEffect, useMemo, useState } from "react";
import { seededBackendPackages } from "@/data/seed";
import { api } from "@/lib/api";
import { emitDataChanged, subscribeToDataChanged } from "@/lib/data-events";
import type { BackendPackage } from "@/types";

export function useProjectPackages(projectId?: string) {
  const [packages, setPackages] = useState<BackendPackage[]>(
    projectId
      ? seededBackendPackages.filter((pkg) => pkg.projectId === projectId)
      : seededBackendPackages,
  );

  const refresh = useCallback(async () => {
    try {
      if (projectId) {
        setPackages(await api.getProjectPackages(projectId));
        return;
      }

      const projects = await api.getProjects();
      const nextPackages = (
        await Promise.all(projects.map((project) => api.getProjectPackages(project.id)))
      ).flat();
      setPackages(nextPackages);
    } catch {
      setPackages(
        projectId
          ? seededBackendPackages.filter((pkg) => pkg.projectId === projectId)
          : seededBackendPackages,
      );
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
    return subscribeToDataChanged(refresh);
  }, [refresh]);

  const primaryPackage = useMemo(
    () => packages.find((pkg) => pkg.primaryForProject) ?? packages[0],
    [packages],
  );

  const createPackage = useCallback(async (input: Partial<BackendPackage>) => {
    if (!projectId) return;
    await api.createPackage(projectId, input);
    await refresh();
    emitDataChanged("packages");
  }, [projectId, refresh]);

  const updatePackage = useCallback(async (packageId: string, updates: Partial<BackendPackage>) => {
    await api.updatePackage(packageId, updates);
    await refresh();
    emitDataChanged("packages");
  }, [refresh]);

  const deletePackage = useCallback(async (packageId: string) => {
    await api.deletePackage(packageId);
    await refresh();
    emitDataChanged("packages");
  }, [refresh]);

  return {
    packages,
    primaryPackage,
    refresh,
    createPackage,
    updatePackage,
    deletePackage,
  };
}
