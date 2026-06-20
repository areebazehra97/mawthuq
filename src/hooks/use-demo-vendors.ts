import { type SetStateAction, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { subscribeToDataChanged, emitDataChanged } from "@/lib/data-events";
import { loadVendors } from "@/lib/storage";
import type { VendorRecord } from "@/types";

export function useDemoVendors() {
  const [vendors, setVendorsState] = useState<VendorRecord[]>(() => loadVendors());

  const refresh = useCallback(async () => {
    try {
      setVendorsState(await api.getVendors());
    } catch {
      setVendorsState(loadVendors());
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToDataChanged(refresh);
  }, [refresh]);

  const setVendors = useCallback((updater: SetStateAction<VendorRecord[]>) => {
    setVendorsState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      void api.saveVendors(next).then(() => emitDataChanged("vendors")).catch(() => {});
      return next;
    });
  }, []);

  return { vendors, setVendors, refresh };
}
