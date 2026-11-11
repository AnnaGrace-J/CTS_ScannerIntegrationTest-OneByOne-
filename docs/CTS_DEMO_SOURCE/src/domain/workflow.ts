import type {
  Account,
  AppSettings,
  AuditEvent,
  Cheque,
  ChequeDirection,
  ChequeStatus,
  DemoUser,
  Role,
  WorkitemPoint,
  Workstep,
  WorkstepCount,
  WorkflowTile
} from "../types";

export const workstepLabels: Record<Workstep, string> = {
  SCANNING_DATA_ENTRY: "Scanning / Data Entry",
  OUTWARD_AUTHORIZATION: "Outward Authorization",
  OUTWARD_REPAIR: "Outward Repair",
  HOLD_FOR_ICL_GENERATION: "Hold for ICL",
  ICL_FILE_GENERATION: "ICL File Generation",
  FORWARD_UPLOAD_FILE_RESPONSE: "Forward Upload Response",
  OUTWARD_NAK_REPAIR: "Outward NAK Repair",
  WAIT_FOR_RETURN: "Wait for Return",
  CREDIT_POSTING: "Credit Posting",
  DISCARD: "Discard",
  WORK_EXIT: "Work Exit",
  READ_UPLOAD_FORWARD_DOWNLOAD_ICL: "Read Upload Forward ICL",
  TECHNICAL_VERIFICATION: "Technical Verification",
  DEBIT_POSTING: "Debit Posting",
  REFERRAL: "Referral",
  MANUAL_RETURN_MAKER: "Manual Return Maker",
  MANUAL_RETURN_CHECKER: "Manual Return Checker",
  RETURN_ICL_CREATION: "Return ICL Creation",
  RETURN_UPLOAD_FILE_RESPONSE: "Return Upload Response",
  INWARD_NAK_REPAIR: "Inward NAK Repair",
  INWARD_CHARGE_POSTING: "Inward Charge Posting"
};

export const outwardFlow: Workstep[] = [
  "SCANNING_DATA_ENTRY",
  "OUTWARD_AUTHORIZATION",
  "OUTWARD_REPAIR",
  "HOLD_FOR_ICL_GENERATION",
  "ICL_FILE_GENERATION",
  "FORWARD_UPLOAD_FILE_RESPONSE",
  "OUTWARD_NAK_REPAIR",
  "WAIT_FOR_RETURN",
  "CREDIT_POSTING"
];

export const inwardFlow: Workstep[] = [
  "READ_UPLOAD_FORWARD_DOWNLOAD_ICL",
  "TECHNICAL_VERIFICATION",
  "DEBIT_POSTING",
  "REFERRAL",
  "MANUAL_RETURN_MAKER",
  "MANUAL_RETURN_CHECKER",
  "RETURN_ICL_CREATION",
  "RETURN_UPLOAD_FILE_RESPONSE",
  "INWARD_NAK_REPAIR",
  "INWARD_CHARGE_POSTING"
];

export const makerWorksteps: Workstep[] = [
  "SCANNING_DATA_ENTRY",
  "OUTWARD_REPAIR",
  "TECHNICAL_VERIFICATION",
  "MANUAL_RETURN_MAKER",
  "OUTWARD_NAK_REPAIR",
  "INWARD_NAK_REPAIR",
  "READ_UPLOAD_FORWARD_DOWNLOAD_ICL"
];

export const checkerWorksteps: Workstep[] = ["OUTWARD_AUTHORIZATION", "REFERRAL", "MANUAL_RETURN_CHECKER"];

export function canRoleAccessWorkstep(role: Role, workstep: Workstep): boolean {
  if (role === "ADMIN") return true;
  if (role === "SERVICE") return false;
  if (role === "MAKER") return makerWorksteps.includes(workstep);
  return checkerWorksteps.includes(workstep);
}

export function statusForWorkstep(workstep: Workstep): ChequeStatus {
  if (workstep.includes("REPAIR")) return "Repair Required";
  if (workstep.includes("NAK")) return "NAK";
  if (workstep.includes("POSTING")) return "Posted";
  if (workstep === "OUTWARD_AUTHORIZATION") return "Pending Authorization";
  if (workstep === "HOLD_FOR_ICL_GENERATION" || workstep === "ICL_FILE_GENERATION") return "Ready for ICL";
  if (workstep.includes("UPLOAD") || workstep.includes("ICL")) return "Uploaded";
  if (workstep.includes("RETURN") || workstep === "WAIT_FOR_RETURN") return "Returned";
  if (workstep === "DISCARD") return "Discarded";
  if (workstep === "WORK_EXIT") return "Exited";
  return "Scanned";
}

export function generateUIC(
  date: string,
  presentingBankCode: string,
  branchCode: string,
  scannerId: string,
  batchNumber: string,
  sequenceNumber: number
): string {
  const cleanDate = date.replace(/-/g, "");
  return [cleanDate, presentingBankCode, branchCode, scannerId, batchNumber, String(sequenceNumber).padStart(6, "0")].join("-");
}

export function generateBatchId(
  processName: string,
  date: string,
  scannerIpLast3: string,
  random: string,
  userName: string,
  serialNo: number,
  branchCode: string
): string {
  const cleanDate = date.replace(/-/g, "");
  return `${processName}-${cleanDate}-${scannerIpLast3}-${random}-${userName}-${String(serialNo).padStart(3, "0")}-${branchCode}`;
}

export function parseMICR(micrLine: string) {
  const parts = micrLine.trim().split(/\s+/);
  return {
    chequeNo: parts[0] ?? "",
    routingNumber: parts[1] ?? "",
    accountNo: parts[2] ?? "",
    transactionCode: parts[3] ?? ""
  };
}

export function validateRoutingNumber(routingNumber: string): boolean {
  return /^[0-9]{6,9}$/.test(routingNumber);
}

export function detectDuplicateCheque(candidate: Cheque, cheques: Cheque[]): boolean {
  return cheques.some(
    (cheque) =>
      cheque.id !== candidate.id &&
      cheque.chequeNo === candidate.chequeNo &&
      cheque.accountNo === candidate.accountNo &&
      cheque.payingBankCode === candidate.payingBankCode
  );
}

export function detectRepresentment(candidate: Cheque, cheques: Cheque[], settings: AppSettings): boolean {
  const candidateDate = new Date(candidate.scanDate).getTime();
  return cheques.some((cheque) => {
    if (cheque.id === candidate.id || cheque.chequeNo !== candidate.chequeNo || cheque.accountNo !== candidate.accountNo) {
      return false;
    }
    const days = Math.abs(candidateDate - new Date(cheque.scanDate).getTime()) / 86400000;
    return days <= settings.representmentDays && cheque.representmentCount < settings.representmentCount;
  });
}

export function isStaleCheque(issueDate: string, businessDate: string, staleAfterDays = 180): boolean {
  const ageDays = (new Date(businessDate).getTime() - new Date(issueDate).getTime()) / 86400000;
  return ageDays > staleAfterDays;
}

export function getWorkstepCounts(cheques: Cheque[]): WorkstepCount[] {
  const counts = new Map<string, WorkstepCount>();
  for (const cheque of cheques) {
    const key = `${cheque.direction}:${cheque.workstep}`;
    const current = counts.get(key) ?? {
      direction: cheque.direction,
      workstep: cheque.workstep,
      label: workstepLabels[cheque.workstep],
      count: 0
    };
    counts.set(key, { ...current, count: current.count + 1 });
  }
  return [...counts.values()];
}

export function countFor(counts: WorkstepCount[], direction: ChequeDirection, workstep: Workstep): number {
  return counts.find((item) => item.direction === direction && item.workstep === workstep)?.count ?? 0;
}

export function applyCountsToTiles(
  tiles: Array<Omit<WorkflowTile, "count">>,
  counts: WorkstepCount[],
  direction: ChequeDirection
): WorkflowTile[] {
  return tiles.map((tile) => ({
    ...tile,
    count: tile.workstep ? countFor(counts, direction, tile.workstep) : 0
  }));
}

export function getChartWorkitems(counts: WorkstepCount[]): WorkitemPoint[] {
  return [
    {
      name: "Capture",
      outward: countFor(counts, "OUTWARD", "SCANNING_DATA_ENTRY"),
      inward: countFor(counts, "INWARD", "READ_UPLOAD_FORWARD_DOWNLOAD_ICL")
    },
    {
      name: "Verify",
      outward: countFor(counts, "OUTWARD", "OUTWARD_AUTHORIZATION"),
      inward: countFor(counts, "INWARD", "TECHNICAL_VERIFICATION")
    },
    {
      name: "Repair",
      outward: countFor(counts, "OUTWARD", "OUTWARD_REPAIR") + countFor(counts, "OUTWARD", "OUTWARD_NAK_REPAIR"),
      inward: countFor(counts, "INWARD", "INWARD_NAK_REPAIR")
    },
    {
      name: "Post",
      outward: countFor(counts, "OUTWARD", "CREDIT_POSTING"),
      inward: countFor(counts, "INWARD", "DEBIT_POSTING") + countFor(counts, "INWARD", "INWARD_CHARGE_POSTING")
    },
    {
      name: "Return",
      outward: countFor(counts, "OUTWARD", "WAIT_FOR_RETURN"),
      inward:
        countFor(counts, "INWARD", "MANUAL_RETURN_MAKER") +
        countFor(counts, "INWARD", "MANUAL_RETURN_CHECKER") +
        countFor(counts, "INWARD", "RETURN_ICL_CREATION")
    }
  ];
}

export function addAuditEvent(
  events: AuditEvent[],
  actor: DemoUser | undefined | null,
  action: string,
  note: string,
  entityId?: string
): AuditEvent[] {
  const user = actor ?? {
    id: "USR-SERVICE",
    name: "CTS Background Service",
    role: "SERVICE" as const
  };
  return [
    {
      id: `AUD-${Date.now()}-${events.length + 1}`,
      at: new Date().toLocaleString(),
      userId: user.id,
      user: user.name,
      role: user.role,
      action,
      entityId,
      note
    },
    ...events
  ];
}

export function validateAccountForCheque(account: Account | undefined): string | undefined {
  if (!account) return "Account not found";
  if (account.status === "Closed") return "Account Closed";
  if (account.status === "Inactive") return "Inactive account";
  return undefined;
}
