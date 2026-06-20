import { useEffect, useState } from "react";
import type { VendorRecord } from "@/types";

const API = "";

export function useRegisteredVendors() {
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/vendors`)
      .then((r) => r.json())
      .then((data: VendorRecord[]) => {
        if (!cancelled) {
          setVendors(data.filter((v) => v.isNewRegistration === true));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { vendors, loading };
}
