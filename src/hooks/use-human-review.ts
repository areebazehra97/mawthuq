import { type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { emitDataChanged, subscribeToDataChanged } from "@/lib/data-events";
import {
  loadAuditRecords,
  loadFieldReviewState,
  loadRuleReviewState,
} from "@/lib/storage";
import type { AuditRecord, FieldReviewState, RuleReviewState } from "@/types";

export function useHumanReview() {
  const [auditRecords, setAuditRecordsState] = useState<AuditRecord[]>(() => loadAuditRecords());
  const [fieldStates, setFieldStatesState] = useState<FieldReviewState[]>(() => loadFieldReviewState());
  const [ruleStates, setRuleStatesState] = useState<RuleReviewState[]>(() => loadRuleReviewState());

  const fieldRef = useRef(fieldStates);
  const ruleRef = useRef(ruleStates);

  useEffect(() => {
    fieldRef.current = fieldStates;
  }, [fieldStates]);

  useEffect(() => {
    ruleRef.current = ruleStates;
  }, [ruleStates]);

  const refresh = useCallback(async () => {
    try {
      const [audit, review] = await Promise.all([api.getAuditRecords(), api.getReviewState()]);
      setAuditRecordsState(audit);
      setFieldStatesState(review.fieldStates);
      setRuleStatesState(review.ruleStates);
    } catch {
      setAuditRecordsState(loadAuditRecords());
      setFieldStatesState(loadFieldReviewState());
      setRuleStatesState(loadRuleReviewState());
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToDataChanged(refresh);
  }, [refresh]);

  const setAuditRecords = useCallback((updater: SetStateAction<AuditRecord[]>) => {
    setAuditRecordsState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      void api.saveAuditRecords(next).then(() => emitDataChanged("audit")).catch(() => {});
      return next;
    });
  }, []);

  const setFieldStates = useCallback((updater: SetStateAction<FieldReviewState[]>) => {
    setFieldStatesState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      fieldRef.current = next;
      void api
        .saveReviewState(next, ruleRef.current)
        .then(() => emitDataChanged("review-state"))
        .catch(() => {});
      return next;
    });
  }, []);

  const setRuleStates = useCallback((updater: SetStateAction<RuleReviewState[]>) => {
    setRuleStatesState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      ruleRef.current = next;
      void api
        .saveReviewState(fieldRef.current, next)
        .then(() => emitDataChanged("review-state"))
        .catch(() => {});
      return next;
    });
  }, []);

  return {
    auditRecords,
    setAuditRecords,
    fieldStates,
    setFieldStates,
    ruleStates,
    setRuleStates,
    refresh,
  };
}
