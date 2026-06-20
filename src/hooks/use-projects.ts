import { useCallback, useEffect, useMemo, useState } from "react";
import {
  seededBackendApplications,
  seededBackendPackages,
  seededBackendProjects,
} from "@/data/seed";
import { api } from "@/lib/api";
import { emitDataChanged, subscribeToDataChanged } from "@/lib/data-events";
import { mapProjectToLegacy } from "@/lib/portfolio";
import type {
  BackendPackage,
  BackendProject,
  Project,
  VendorPackageApplication,
} from "@/types";

function primaryPackageFor(
  packages: BackendPackage[],
  projectId: string,
) {
  return (
    packages.find((pkg) => pkg.projectId === projectId && pkg.primaryForProject) ??
    packages.find((pkg) => pkg.projectId === projectId)
  );
}

export function useProjects() {
  const [backendProjects, setBackendProjects] = useState<BackendProject[]>(seededBackendProjects);
  const [packages, setPackages] = useState<BackendPackage[]>(seededBackendPackages);
  const [applications, setApplications] = useState<VendorPackageApplication[]>(
    seededBackendApplications,
  );

  const refresh = useCallback(async () => {
    try {
      const nextProjects = await api.getProjects();
      const nextPackages = (
        await Promise.all(nextProjects.map((project) => api.getProjectPackages(project.id)))
      ).flat();
      const nextApplications = await api.getApplications();

      setBackendProjects(nextProjects);
      setPackages(nextPackages);
      setApplications(nextApplications);
    } catch {
      setBackendProjects(seededBackendProjects);
      setPackages(seededBackendPackages);
      setApplications(seededBackendApplications);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToDataChanged(refresh);
  }, [refresh]);

  const projects = useMemo<Project[]>(
    () =>
      backendProjects.map((project) =>
        mapProjectToLegacy(
          project,
          primaryPackageFor(packages, project.id),
          applications.filter((app) => app.projectId === project.id),
        ),
      ),
    [applications, backendProjects, packages],
  );

  const addProject = useCallback(async (project: Partial<Project>) => {
    const createdProject = await api.createProject({
      name: project.name,
      arabicName: project.arabicName,
      location: project.location,
      status:
        project.status === "Closed"
          ? "Archived"
          : project.status ?? "Planning",
      description: project.scope,
      timeline: project.timeline,
      categories: project.categories,
      reviewers: project.reviewers,
      requiredExperience: project.requiredExperience,
      requiredCertifications: project.requiredCertifications,
      config: project.config,
    });

    await api.createPackage(createdProject.id, {
      name: project.packageName ?? "Primary Package",
      category: project.workCategory ?? "General Contracting",
      valueBand: project.packageValueBand ?? "SAR 250M – SAR 1B",
      status: createdProject.status === "Tendering" ? "Evaluating" : "Open",
      requiredVendorCount: 3,
      deadline: project.registrationDeadline,
      criteria:
        project.requiredCertifications && project.requiredCertifications.length > 0
          ? project.requiredCertifications
          : project.categories,
      primaryForProject: true,
    });

    await refresh();
    emitDataChanged("projects");
  }, [refresh]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const currentPackage = primaryPackageFor(packages, id);

    await api.updateProject(id, {
      name: updates.name,
      arabicName: updates.arabicName,
      location: updates.location,
      status:
        updates.status === "Closed"
          ? "Archived"
          : updates.status,
      description: updates.scope,
      timeline: updates.timeline,
      categories: updates.categories,
      reviewers: updates.reviewers,
      requiredExperience: updates.requiredExperience,
      requiredCertifications: updates.requiredCertifications,
      config: updates.config,
    });

    if (currentPackage) {
      await api.updatePackage(currentPackage.id, {
        name: updates.packageName,
        category: updates.workCategory,
        valueBand: updates.packageValueBand,
        deadline: updates.registrationDeadline,
        criteria:
          updates.requiredCertifications && updates.requiredCertifications.length > 0
            ? updates.requiredCertifications
            : updates.categories,
      });
    }

    await refresh();
    emitDataChanged("projects");
  }, [packages, refresh]);

  const deleteProject = useCallback(async (id: string) => {
    await api.deleteProject(id);
    await refresh();
    emitDataChanged("projects");
  }, [refresh]);

  const getPrimaryPackage = useCallback(
    (projectId: string) => primaryPackageFor(packages, projectId),
    [packages],
  );

  return {
    projects,
    backendProjects,
    packages,
    applications,
    getPrimaryPackage,
    addProject,
    updateProject,
    deleteProject,
    refresh,
  };
}
