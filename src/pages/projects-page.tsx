import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Plus, Users } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";

const projectStatusCls: Record<ProjectStatus, string> = {
  Active:    "bg-success/15 text-success border-success/40",
  Tendering: "bg-info/10 text-info border-info/30",
  Planning:  "bg-muted text-muted-foreground border-border",
  Closed:    "bg-destructive/10 text-destructive border-destructive/40",
};

export function ProjectsPage() {
  const { projects } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Portfolio
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">All Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a project to review contractor applications, manage invitations, and build your shortlist.
          </p>
        </div>
        <Link
          to="/project-setup"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const hasVendors = project.submittedCount > 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`status-pill ${projectStatusCls[project.status]}`}>
          {project.status}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {project.location}
        </span>
      </div>

      <h3 className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
        {project.name}
      </h3>
      <p
        className="mt-0.5 text-[12px] text-muted-foreground"
        style={{ fontFamily: '"Noto Sans Arabic", sans-serif' }}
      >
        {project.arabicName}
      </p>

      <div className="mt-3 space-y-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{project.packageName}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {project.workCategory}&ensp;·&ensp;{project.packageValueBand}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.categories.map((cat) => (
          <span key={cat} className="chip text-[10px]">
            {cat}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {project.totalInvited} invited
        </span>
        <span
          className={cn(
            "flex items-center gap-1 font-medium",
            hasVendors ? "text-success" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              hasVendors ? "bg-success" : "bg-muted-foreground/40",
            )}
          />
          {project.submittedCount} submitted
        </span>
        <span className="ml-auto flex items-center gap-1 text-accent opacity-0 transition-opacity group-hover:opacity-100">
          Open <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
