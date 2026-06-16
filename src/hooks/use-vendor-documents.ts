import { useEffect, useState } from "react";
import { vendorDocumentsStorageKey } from "@/data/seed";
import { loadVendorDocuments } from "@/lib/storage";
import type { VendorDocument } from "@/types";

export function useVendorDocuments() {
  const [documents, setDocuments] = useState<VendorDocument[]>(() => loadVendorDocuments());

  useEffect(() => {
    window.localStorage.setItem(vendorDocumentsStorageKey, JSON.stringify(documents));
  }, [documents]);

  return { documents, setDocuments };
}
