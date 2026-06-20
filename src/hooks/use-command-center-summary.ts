import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { subscribeToDataChanged } from "@/lib/data-events";
import type { CommandCenterSummary } from "@/types";

export function useCommandCenterSummary() {
  const [summary, setSummary] = useState<CommandCenterSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setSummary(await api.getCommandCenterSummary());
    } catch {
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToDataChanged(refresh);
  }, [refresh]);

  return { summary, isLoading, refresh };
}
