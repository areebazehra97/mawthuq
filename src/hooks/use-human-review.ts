import { useEffect, useState } from "react";
import {
  auditRecordsStorageKey,
  fieldReviewStorageKey,
  ruleReviewStorageKey,
} from "@/data/seed";
import {
  loadAuditRecords,
  loadFieldReviewState,
  loadRuleReviewState,
} from "@/lib/storage";
import type { AuditRecord, FieldReviewState, RuleReviewState } from "@/types";

export function useHumanReview() {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(() => loadAuditRecords());
  const [fieldStates, setFieldStates] = useState<FieldReviewState[]>(() => loadFieldReviewState());
  const [ruleStates, setRuleStates] = useState<RuleReviewState[]>(() => loadRuleReviewState());

  useEffect(() => {
    window.localStorage.setItem(auditRecordsStorageKey, JSON.stringify(auditRecords));
  }, [auditRecords]);

  useEffect(() => {
    window.localStorage.setItem(fieldReviewStorageKey, JSON.stringify(fieldStates));
  }, [fieldStates]);

  useEffect(() => {
    window.localStorage.setItem(ruleReviewStorageKey, JSON.stringify(ruleStates));
  }, [ruleStates]);

  return {
    auditRecords,
    setAuditRecords,
    fieldStates,
    setFieldStates,
    ruleStates,
    setRuleStates,
  };
}
