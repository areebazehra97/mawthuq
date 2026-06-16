import { useEffect, useState } from "react";
import { vendorStorageKey } from "@/data/seed";
import { loadVendors } from "@/lib/storage";
import type { VendorRecord } from "@/types";

export function useDemoVendors() {
  const [vendors, setVendors] = useState<VendorRecord[]>(() => loadVendors());

  useEffect(() => {
    window.localStorage.setItem(vendorStorageKey, JSON.stringify(vendors));
  }, [vendors]);

  return { vendors, setVendors };
}
