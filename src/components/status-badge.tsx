import { Badge } from "@/components/ui/badge";
import type { VendorStatus } from "@/types";

const statusVariantMap: Record<VendorStatus, "success" | "warning" | "danger"> = {
  PASS: "success",
  CONDITIONAL: "warning",
  FAIL: "danger",
};

export function StatusBadge({ status }: { status: VendorStatus }) {
  return <Badge variant={statusVariantMap[status]}>{status}</Badge>;
}
