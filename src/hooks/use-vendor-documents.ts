import { type SetStateAction, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { emitDataChanged, subscribeToDataChanged } from "@/lib/data-events";
import { loadVendorDocuments } from "@/lib/storage";
import type { VendorDocument } from "@/types";

export function useVendorDocuments() {
  const [documents, setDocumentsState] = useState<VendorDocument[]>(() => loadVendorDocuments());

  const refresh = useCallback(async () => {
    try {
      setDocumentsState(await api.getDocuments());
    } catch {
      setDocumentsState(loadVendorDocuments());
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToDataChanged(refresh);
  }, [refresh]);

  const setDocuments = useCallback(
    (updater: SetStateAction<VendorDocument[]>) => {
      setDocumentsState((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        void api.saveDocuments(next).then(() => emitDataChanged("documents")).catch(() => {});
        return next;
      });
    },
    [],
  );

  const uploadVendorFiles = useCallback(
    async (
      vendorId: string,
      files: Array<{
        fileName: string;
        mimeType: string;
        size: number;
        base64: string;
        suggestedDocumentType: string;
        language: VendorDocument["language"];
      }>,
    ) => {
      const uploaded = await api.uploadVendorFiles(vendorId, files);
      setDocumentsState((current) => [...uploaded, ...current]);
      emitDataChanged("documents");
      emitDataChanged("audit");
      emitDataChanged("vendors");
      return uploaded;
    },
    [],
  );

  const replaceDocument = useCallback(
    (oldDocId: string, newDocPayload: Omit<VendorDocument, "id" | "version" | "supersedes" | "isCurrentVersion">) => {
      setDocumentsState((current) => {
        const old = current.find((d) => d.id === oldDocId);
        if (!old) return current;
        const newId = `${oldDocId}-r${Date.now()}`;
        const newDoc: VendorDocument = {
          ...newDocPayload,
          id: newId,
          version: (old.version ?? 1) + 1,
          supersedes: oldDocId,
          isCurrentVersion: true,
        };
        const next = current.map((d) =>
          d.id === oldDocId ? { ...d, supersededBy: newId, isCurrentVersion: false } : d,
        );
        next.unshift(newDoc);
        void api.saveDocuments(next).then(() => emitDataChanged("documents")).catch(() => {});
        return next;
      });
    },
    [],
  );

  return { documents, setDocuments, refresh, uploadVendorFiles, replaceDocument };
}
