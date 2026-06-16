import { Badge } from "@/components/ui/badge";
import type { DocumentStatus } from "@/types";

const statusVariantMap: Record<DocumentStatus, "success" | "warning" | "danger" | "neutral"> = {
  Valid: "success",
  Missing: "danger",
  Expired: "danger",
  Ambiguous: "warning",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge variant={statusVariantMap[status]}>{status}</Badge>;
}
