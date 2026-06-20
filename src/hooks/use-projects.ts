import { useCallback, useState } from "react";
import { seededProjects } from "@/data/seed";
import type { Project } from "@/types";

const STORAGE_KEY = "mawthuq-projects";

function load(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Project[];
  } catch {}
  return seededProjects;
}

function persist(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(load);

  const addProject = useCallback((project: Project) => {
    setProjects((prev) => {
      const next = [project, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      persist(next);
      return next;
    });
  }, []);

  return { projects, addProject, updateProject };
}
