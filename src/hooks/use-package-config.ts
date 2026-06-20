import { type SetStateAction, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { emitDataChanged, subscribeToDataChanged } from "@/lib/data-events";
import { loadPackageConfig } from "@/lib/storage";
import type { PackageSetupConfig } from "@/types";

export function usePackageConfig() {
  const [config, setConfigState] = useState<PackageSetupConfig>(() => loadPackageConfig());

  const refresh = useCallback(async () => {
    try {
      setConfigState(await api.getPackageConfig());
    } catch {
      setConfigState(loadPackageConfig());
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToDataChanged(refresh);
  }, [refresh]);

  const setConfig = useCallback((updater: SetStateAction<PackageSetupConfig>) => {
    setConfigState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      void api.savePackageConfig(next).then(() => emitDataChanged("config")).catch(() => {});
      return next;
    });
  }, []);

  return { config, setConfig, refresh };
}
