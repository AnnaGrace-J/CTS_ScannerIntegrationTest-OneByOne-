export type Role = "MAKER" | "CHECKER" | "ADMIN" | "SERVICE";

export type AccountStatus = "Active" | "Dormant" | "Closed" | "Inactive";

export type ChequeDirection = "OUTWARD" | "INWARD";

export type OutwardWorkstep =
  | "SCANNING_DATA_ENTRY"
  | "OUTWARD_AUTHORIZATION"
  | "OUTWARD_REPAIR"
  | "HOLD_FOR_ICL_GENERATION"
  | "ICL_FILE_GENERATION"
  | "FORWARD_UPLOAD_FILE_RESPONSE"
  | "OUTWARD_NAK_REPAIR"
  | "WAIT_FOR_RETURN"
  | "CREDIT_POSTING"
  | "DISCARD"
  | "WORK_EXIT";

export type InwardWorkstep =
  | "READ_UPLOAD_FORWARD_DOWNLOAD_ICL"
  | "TECHNICAL_VERIFICATION"
  | "DEBIT_POSTING"
  | "REFERRAL"
  | "MANUAL_RETURN_MAKER"
  | "MANUAL_RETURN_CHECKER"
  | "RETURN_ICL_CREATION"
  | "RETURN_UPLOAD_FILE_RESPONSE"
  | "INWARD_NAK_REPAIR"
  | "INWARD_CHARGE_POSTING"
  | "WORK_EXIT";

export type Workstep = OutwardWorkstep | InwardWorkstep;

export type ChequeStatus =
  | "Captured"
  | "Scanned"
  | "Pending Authorization"
  | "Repair Required"
  | "Ready for ICL"
  | "Uploaded"
  | "NAK"
  | "Returned"
  | "Posted"
  | "Discarded"
  | "Exited";

export type Branch = {
  id: string;
  name: string;
  code: string;
  clearingCode: string;
};

export type User = {
  id: string;
  username: string;
  name: string;
  role: Role;
  branchId: string;
  status: "Active" | "Locked";
};

export type DemoUser = User & {
  branch: string;
};

export type Account = {
  id: string;
  accountNo: string;
  customerName: string;
  branchId: string;
  status: AccountStatus;
  balance: number;
  currency: "MMK";
};

export type Cheque = {
  id: string;
  direction: ChequeDirection;
  workstep: Workstep;
  batchNo: string;
  batchId: string;
  chequeNo: string;
  micrLine: string;
  accountId: string;
  accountNo: string;
  payee: string;
  amount: number;
  currency: "MMK";
  branch: string;
  branchCode: string;
  presentingBank: string;
  presentingBankCode: string;
  payingBank: string;
  payingBankCode: string;
  status: ChequeStatus;
  scanDate: string;
  valueDate?: string;
  issueDate: string;
  representmentCount: number;
  imageFrontUrl: string;
  imageRearUrl: string;
  signatureUrl: string;
  uic: string;
  chequeType?: string;
  checkDigit?: string;
  drawerName?: string;
  remarks?: string;
  discarded?: boolean;
  imageQualityFlags?: string[];
  iclFileId?: string;
  postingFileId?: string;
  rejectReason?: string;
  nakReason?: string;
  nakRemarks?: string;
  returnStatus?: "Accepted" | "Rejected" | "Pending";
  lastMakerId?: string;
  lastCheckerId?: string;
  lastUserDetails?: string;
  reason?: string;
};

export type ChequeItem = Cheque;

export type Batch = {
  id: string;
  batchNo: string;
  direction: ChequeDirection;
  branchId: string;
  batchType?: string;
  status?: string;
  scannerId: string;
  scannerIp: string;
  createdBy: string;
  lastMakerId?: string;
  lastCheckerId?: string;
  createdAt: string;
  valueDate?: string;
  itemCount: number;
  totalAmount: number;
};

export type ICLFile = {
  id: string;
  direction: ChequeDirection;
  fileName: string;
  batchIds: string[];
  chequeIds?: string[];
  chequeCount?: number;
  totalAmount?: number;
  localPath?: string;
  reason?: string;
  remarks?: string;
  errorFile?: boolean;
  status: "Pending" | "Generated" | "Uploaded" | "Accepted" | "Rejected" | "Failed";
  createdAt: string;
};

export type PostingFile = {
  id: string;
  direction: ChequeDirection;
  fileName: string;
  chequeIds: string[];
  count?: number;
  totalAmount?: number;
  localPath?: string;
  warning?: string;
  status: "Pending" | "Generated" | "Posted" | "Failed";
  createdAt: string;
};

export type ReportJob = {
  id: string;
  name: string;
  requestedBy: string;
  status: "Queued" | "Running" | "Completed" | "Failed";
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  userId: string;
  user: string;
  role: Role;
  action: string;
  entityId?: string;
  note: string;
};

export type WorkstepCount = {
  direction: ChequeDirection;
  workstep: Workstep;
  label: string;
  count: number;
};

export type RejectReason = {
  code: string;
  description: string;
  appliesTo: "OUTWARD" | "INWARD" | "BOTH";
};

export type AppSettings = {
  representmentCount: number;
  representmentDays: number;
  pollIntervalSeconds: number;
  outwardCutoffTime: string;
  inwardCutoffTime: string;
  inwardChargePostingRequired?: boolean;
  validRoutingNumbers?: string[];
  cbsMockMode?: "Success" | "Failure";
  cbmMockResponseMode?: "Manual" | "AcceptAll" | "RejectAll";
  showDemoScenarioLauncher?: boolean;
};

export type ArchiveRecord = {
  id: string;
  archivedAt: string;
  cheque: ChequeItem;
  frontImageUrl: string;
  rearImageUrl: string;
  auditTrail: AuditEvent[];
};

export type NavRoute = {
  path: string;
  label: string;
};

export type WorkflowTile = {
  label: string;
  count: number;
  route: string;
  workstep?: Workstep;
  tone: "blue" | "green" | "amber" | "red" | "gray";
};

export type WorkitemPoint = {
  name: string;
  outward: number;
  inward: number;
};
