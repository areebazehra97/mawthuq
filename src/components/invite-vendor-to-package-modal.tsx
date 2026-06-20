import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Mail, Search, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  BackendPackage,
  BackendProject,
  VendorPackageApplication,
} from "@/types";
import type { DocHealth, VendorGlobalStatus, VMVendor } from "@/data/vendor-master-seed";

const globalStatusCls: Record<VendorGlobalStatus, string> = {
  "Active": "bg-success/15 text-success border-success/40",
  "Under Review": "bg-warning/15 text-warning-foreground border-warning/40",
  "Suspended": "bg-orange-500/10 text-orange-700 border-orange-400/40",
  "Blacklisted": "bg-destructive/10 text-destructive border-destructive/40",
  "Inactive": "bg-muted text-muted-foreground border-border",
};

const docHealthCls: Record<DocHealth, string> = {
  "Healthy": "bg-success/15 text-success border-success/40",
  "Expiring Soon": "bg-warning/15 text-warning-foreground border-warning/40",
  "Expired": "bg-destructive/10 text-destructive border-destructive/40",
  "Missing": "bg-muted text-muted-foreground border-border",
};

interface InviteVendorToPackageModalProps {
  applications: VendorPackageApplication[];
  existingVendorIds?: Set<string>;
  fixedPackageId?: string;
  fixedProjectId?: string;
  initialVendor?: VMVendor | null;
  onClose: () => void;
  onInvite: (input: {
    vendor: VMVendor;
    projectId: string;
    packageId: string;
    note?: string;
  }) => Promise<void>;
  packages: BackendPackage[];
  projects: BackendProject[];
  title: string;
  vendors: VMVendor[];
}

export function InviteVendorToPackageModal({
  applications,
  existingVendorIds,
  fixedPackageId,
  fixedProjectId,
  initialVendor,
  onClose,
  onInvite,
  packages,
  projects,
  title,
  vendors,
}: InviteVendorToPackageModalProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedVendorId, setSelectedVendorId] = useState(initialVendor?.id ?? "");
  const [projectId, setProjectId] = useState(fixedProjectId ?? "");
  const [packageId, setPackageId] = useState(fixedPackageId ?? "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectableVendors = useMemo(() => {
    const query = search.toLowerCase().trim();
    return vendors.filter((vendor) => {
      if (existingVendorIds?.has(vendor.id) && vendor.id !== initialVendor?.id) return false;
      if (categoryFilter !== "All" && !vendor.tradeCategories.includes(categoryFilter)) return false;
      if (
        query &&
        !vendor.name.toLowerCase().includes(query) &&
        !vendor.city.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [categoryFilter, existingVendorIds, initialVendor?.id, search, vendors]);

  const categories = useMemo(
    () => Array.from(new Set(vendors.flatMap((vendor) => vendor.tradeCategories))).sort(),
    [vendors],
  );

  const selectedVendor =
    initialVendor ?? vendors.find((vendor) => vendor.id === selectedVendorId) ?? null;
  const openProjects = projects.filter(
    (project) => project.status === "Active" || project.status === "Tendering",
  );
  const availablePackages = packages.filter(
    (pkg) =>
      pkg.projectId === projectId &&
      pkg.status !== "Awarded" &&
      pkg.status !== "Closed",
  );
  const selectedPackage = packages.find((pkg) => pkg.id === packageId);
  const isBlocked =
    selectedVendor?.globalStatus === "Suspended" ||
    selectedVendor?.globalStatus === "Blacklisted";
  const hasDocIssue =
    selectedVendor?.docHealth === "Expired" || selectedVendor?.docHealth === "Missing";
  const categoryMismatch =
    selectedVendor !== null &&
    selectedPackage !== undefined &&
    !selectedVendor.tradeCategories.includes(selectedPackage.category);
  const alreadyApplied =
    selectedVendor !== null &&
    packageId !== "" &&
    applications.some(
      (application) =>
        application.vendorId === selectedVendor.id &&
        application.packageId === packageId,
    );
  const canSubmit =
    selectedVendor !== null &&
    projectId !== "" &&
    packageId !== "" &&
    !isBlocked &&
    !alreadyApplied &&
    !submitting;

  const selectCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Choose a vendor, package, and create a linked package application.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          {!initialVendor && (
            <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[180px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search vendor or city…"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className={selectCls}
                >
                  <option value="All">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                {selectableVendors.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    No vendors match these filters.
                  </p>
                ) : (
                  selectableVendors.map((vendor) => {
                    const active = selectedVendor?.id === vendor.id;
                    return (
                      <button
                        key={vendor.id}
                        type="button"
                        onClick={() => setSelectedVendorId(vendor.id)}
                        className={cn(
                          "w-full rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-primary/30 bg-primary/[0.04] ring-1 ring-primary/20"
                            : "border-border bg-card hover:border-primary/20 hover:bg-muted/20",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{vendor.name}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {vendor.city}
                            </p>
                          </div>
                          <span className={`status-pill text-[10px] ${globalStatusCls[vendor.globalStatus]}`}>
                            {vendor.globalStatus}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {vendor.tradeCategories.slice(0, 3).map((category) => (
                            <span key={category} className="chip text-[10px]">
                              {category}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="space-y-4 p-5">
            {selectedVendor ? (
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{selectedVendor.name}</p>
                  <span className={`status-pill text-[10px] ${globalStatusCls[selectedVendor.globalStatus]}`}>
                    {selectedVendor.globalStatus}
                  </span>
                  <span className={`status-pill text-[10px] ${docHealthCls[selectedVendor.docHealth]}`}>
                    {selectedVendor.docHealth}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedVendor.tradeCategories.slice(0, 3).map((category) => (
                    <span key={category} className="chip text-[10px]">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Select a vendor to continue.
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Project</label>
              <select
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  if (!fixedPackageId) setPackageId("");
                }}
                disabled={Boolean(fixedProjectId)}
                className={selectCls}
              >
                <option value="">Select a project…</option>
                {openProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Package</label>
              <select
                value={packageId}
                onChange={(event) => setPackageId(event.target.value)}
                disabled={Boolean(fixedPackageId) || projectId === "" || availablePackages.length === 0}
                className={selectCls}
              >
                <option value="">
                  {projectId === ""
                    ? "Select a project first…"
                    : availablePackages.length === 0
                      ? "No open packages for this project"
                      : "Select a package…"}
                </option>
                {availablePackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} · {pkg.valueBand}
                  </option>
                ))}
              </select>
            </div>

            {isBlocked && selectedVendor && (
              <Banner tone="danger">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This vendor is <strong>{selectedVendor.globalStatus.toLowerCase()}</strong> and cannot be invited.
                </span>
              </Banner>
            )}

            {alreadyApplied && (
              <Banner tone="warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>This vendor already has an application for the selected package.</span>
              </Banner>
            )}

            {!alreadyApplied && categoryMismatch && (
              <Banner tone="warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Vendor trade categories do not match this package scope.</span>
              </Banner>
            )}

            {!isBlocked && hasDocIssue && selectedVendor && (
              <Banner tone="warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Vendor has <strong>{selectedVendor.docHealth.toLowerCase()}</strong> documents and
                  must resolve this before qualifying.
                </span>
              </Banner>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Message <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Add a note for the vendor invitation…"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={async () => {
              if (!selectedVendor) return;
              setSubmitting(true);
              try {
                await onInvite({
                  vendor: selectedVendor,
                  projectId,
                  packageId,
                  note,
                });
              } finally {
                setSubmitting(false);
              }
            }}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Send Invitation
          </Button>
        </div>
      </div>
    </div>
  );
}

function Banner({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "danger" | "warning";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
        tone === "danger"
          ? "border border-destructive/30 bg-destructive/8 text-destructive"
          : "border border-warning/40 bg-warning/10 text-warning-foreground",
      )}
    >
      {children}
    </div>
  );
}
