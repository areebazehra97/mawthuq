import {
  auditRecordsStorageKey,
  fieldReviewStorageKey,
  packageConfigStorageKey,
  ruleReviewStorageKey,
  seededAuditRecords,
  seededPackageConfig,
  seededVendorDocuments,
  seededVendors,
  vendorStorageKey,
  vendorDocumentsStorageKey,
} from "@/data/seed";
import type {
  AuditRecord,
  FieldReviewState,
  PackageSetupConfig,
  RuleReviewState,
  VendorDocument,
  VendorRecord,
} from "@/types";

export function loadVendors(): VendorRecord[] {
  if (typeof window === "undefined") {
    return seededVendors;
  }

  const raw = window.localStorage.getItem(vendorStorageKey);
  if (!raw) {
    window.localStorage.setItem(vendorStorageKey, JSON.stringify(seededVendors));
    return seededVendors;
  }

  try {
    return JSON.parse(raw) as VendorRecord[];
  } catch {
    window.localStorage.setItem(vendorStorageKey, JSON.stringify(seededVendors));
    return seededVendors;
  }
}

export function loadPackageConfig(): PackageSetupConfig {
  if (typeof window === "undefined") {
    return seededPackageConfig;
  }

  const raw = window.localStorage.getItem(packageConfigStorageKey);
  if (!raw) {
    window.localStorage.setItem(
      packageConfigStorageKey,
      JSON.stringify(seededPackageConfig),
    );
    return seededPackageConfig;
  }

  try {
    return JSON.parse(raw) as PackageSetupConfig;
  } catch {
    window.localStorage.setItem(
      packageConfigStorageKey,
      JSON.stringify(seededPackageConfig),
    );
    return seededPackageConfig;
  }
}

export function loadVendorDocuments(): VendorDocument[] {
  if (typeof window === "undefined") {
    return seededVendorDocuments;
  }

  const raw = window.localStorage.getItem(vendorDocumentsStorageKey);
  if (!raw) {
    window.localStorage.setItem(
      vendorDocumentsStorageKey,
      JSON.stringify(seededVendorDocuments),
    );
    return seededVendorDocuments;
  }

  try {
    return JSON.parse(raw) as VendorDocument[];
  } catch {
    window.localStorage.setItem(
      vendorDocumentsStorageKey,
      JSON.stringify(seededVendorDocuments),
    );
    return seededVendorDocuments;
  }
}

export function loadAuditRecords(): AuditRecord[] {
  if (typeof window === "undefined") {
    return seededAuditRecords;
  }

  const raw = window.localStorage.getItem(auditRecordsStorageKey);
  if (!raw) {
    window.localStorage.setItem(auditRecordsStorageKey, JSON.stringify(seededAuditRecords));
    return seededAuditRecords;
  }

  try {
    return JSON.parse(raw) as AuditRecord[];
  } catch {
    window.localStorage.setItem(auditRecordsStorageKey, JSON.stringify(seededAuditRecords));
    return seededAuditRecords;
  }
}

export function loadFieldReviewState(): FieldReviewState[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(fieldReviewStorageKey);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as FieldReviewState[];
  } catch {
    return [];
  }
}

export function loadRuleReviewState(): RuleReviewState[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(ruleReviewStorageKey);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as RuleReviewState[];
  } catch {
    return [];
  }
}
