import { useCallback, useEffect, useMemo, useState } from "react";
import { seededBackendInvitations } from "@/data/seed";
import { api } from "@/lib/api";
import { emitDataChanged, subscribeToDataChanged } from "@/lib/data-events";
import type { BackendInvitation } from "@/types";

interface UseInvitationsOptions {
  projectId?: string;
  packageId?: string;
  applicationId?: string;
}

export function useInvitations(options: UseInvitationsOptions = {}) {
  const { projectId, packageId, applicationId } = options;
  const [invitations, setInvitations] = useState<BackendInvitation[]>(seededBackendInvitations);

  const filteredInvitations = useMemo(
    () =>
      invitations.filter((invitation) => {
        if (projectId && invitation.projectId !== projectId) return false;
        if (packageId && invitation.packageId !== packageId) return false;
        if (applicationId && invitation.applicationId !== applicationId) return false;
        return true;
      }),
    [applicationId, invitations, packageId, projectId],
  );

  const refresh = useCallback(async () => {
    try {
      setInvitations(await api.getInvitations());
    } catch {
      setInvitations(seededBackendInvitations);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToDataChanged(refresh);
  }, [refresh]);

  const createInvitation = useCallback(async (invitation: Partial<BackendInvitation>) => {
    await api.createInvitation(invitation);
    await refresh();
    emitDataChanged("invitations");
  }, [refresh]);

  const updateInvitation = useCallback(
    async (invitationId: string, updates: Partial<BackendInvitation>) => {
      await api.updateInvitation(invitationId, updates);
      await refresh();
      emitDataChanged("invitations");
    },
    [refresh],
  );

  const deleteInvitation = useCallback(async (invitationId: string) => {
    await api.deleteInvitation(invitationId);
    await refresh();
    emitDataChanged("invitations");
  }, [refresh]);

  return {
    invitations: filteredInvitations,
    allInvitations: invitations,
    refresh,
    createInvitation,
    updateInvitation,
    deleteInvitation,
  };
}
