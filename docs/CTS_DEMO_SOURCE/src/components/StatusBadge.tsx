import type { ChequeStatus } from "../types";
import { StatusPill } from "./operations";

export function StatusBadge({ status }: { status: ChequeStatus }) {
  return <StatusPill status={status} />;
}
