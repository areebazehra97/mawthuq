import { useEffect, useState } from "react";
import { packageConfigStorageKey } from "@/data/seed";
import { loadPackageConfig } from "@/lib/storage";
import type { PackageSetupConfig } from "@/types";

export function usePackageConfig() {
  const [config, setConfig] = useState<PackageSetupConfig>(() => loadPackageConfig());

  useEffect(() => {
    window.localStorage.setItem(packageConfigStorageKey, JSON.stringify(config));
  }, [config]);

  return { config, setConfig };
}
