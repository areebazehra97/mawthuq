import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { emitDataChanged, subscribeToDataChanged } from "@/lib/data-events";
import { loadVendorExtractions } from "@/lib/storage";
import type { VendorExtraction } from "@/types";

export function useVendorExtractions() {
  const [extractions, setExtractions] = useState<VendorExtraction[]>(() =>
    loadVendorExtractions(),
  );

  const refresh = useCallback(async () => {
    try {
      setExtractions(await api.getExtractions());
    } catch {
      setExtractions(loadVendorExtractions());
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToDataChanged(refresh);
  }, [refresh]);

  const runExtraction = useCallback(async (vendorId: string) => {
    const extraction = await api.runExtraction(vendorId);
    setExtractions((current) => [
      ...current.filter((record) => record.vendorId !== vendorId),
      extraction,
    ]);
    emitDataChanged("extractions");
    return extraction;
  }, []);

  return { extractions, runExtraction, refresh };
}
