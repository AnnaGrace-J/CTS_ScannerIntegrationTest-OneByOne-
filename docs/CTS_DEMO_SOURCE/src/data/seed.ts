import { generateBatchId, generateUIC, statusForWorkstep } from "../domain/workflow";
import type {
  Account,
  AuditEvent,
  Batch,
  Branch,
  ChequeItem,
  ICLFile,
  NavRoute,
  PostingFile,
  RejectReason,
  ReportJob,
  User,
  WorkflowTile,
  AppSettings
} from "../types";

export const outwardRoutes: NavRoute[] = [
  { path: "/outward/dashboard", label: "Dashboard" },
  { path: "/outward/scanning", label: "Scanning" },
  { path: "/outward/authorization", label: "Authorization" },
  { path: "/outward/repair", label: "Repair" },
  { path: "/outward/hold-for-icl-generation", label: "Hold for ICL" },
  { path: "/outward/icl-generation", label: "ICL Generation" },
  { path: "/outward/forward-upload-response", label: "Upload Response" },
  { path: "/outward/nak-repair", label: "NAK Repair" },
  { path: "/outward/wait-for-return", label: "Wait for Return" },
  { path: "/outward/credit-posting", label: "Credit Posting" },
  { path: "/outward/reports", label: "Reports" }
];

export const inwardRoutes: NavRoute[] = [
  { path: "/inward/dashboard", label: "Dashboard" },
  { path: "/inward/upload-icl", label: "Upload ICL" },
  { path: "/inward/technical-verification", label: "Technical Verification" },
  { path: "/inward/debit-posting", label: "Debit Posting" },
  { path: "/inward/referral", label: "Referral" },
  { path: "/inward/manual-return-maker", label: "Return Maker" },
  { path: "/inward/manual-return-checker", label: "Return Checker" },
  { path: "/inward/return-icl-generation", label: "Return ICL" },
  { path: "/inward/return-upload-response", label: "Return Response" },
  { path: "/inward/nak-repair", label: "NAK Repair" },
  { path: "/inward/charge-posting", label: "Charge Posting" },
  { path: "/inward/reports", label: "Reports" }
];

export const utilityRoutes: NavRoute[] = [
  { path: "/search", label: "Search" },
  { path: "/admin", label: "Admin" },
  { path: "/admin/archive", label: "Archive" },
  { path: "/architecture", label: "Architecture" }
];

export const seedBranches: Branch[] = [
  { id: "BR-HO", code: "000", clearingCode: "100000", name: "Head Office" },
  { id: "BR-001", code: "001", clearingCode: "100001", name: "Branch 001" },
  { id: "BR-002", code: "002", clearingCode: "100002", name: "Branch 002" }
];

export const seedUsers: User[] = [
  { id: "USR-MAKER1", username: "maker1", name: "Moe Maker", role: "MAKER", branchId: "BR-001", status: "Active" },
  { id: "USR-CHECKER1", username: "checker1", name: "Aye Checker", role: "CHECKER", branchId: "BR-001", status: "Active" },
  { id: "USR-ADMIN1", username: "admin1", name: "Admin One", role: "ADMIN", branchId: "BR-HO", status: "Active" },
  { id: "USR-INMAKER1", username: "inwardmaker1", name: "Hla Inward Maker", role: "MAKER", branchId: "BR-002", status: "Active" },
  { id: "USR-INCHECKER1", username: "inwardchecker1", name: "Nandar Inward Checker", role: "CHECKER", branchId: "BR-002", status: "Active" },
  { id: "USR-SERVICE", username: "service", name: "CTS Background Service", role: "SERVICE", branchId: "BR-HO", status: "Locked" }
];

export const seedAccounts: Account[] = [
  { id: "ACC-001", accountNo: "001-000-245117999", customerName: "Demo Trading Co.", branchId: "BR-001", status: "Active", balance: 8200000, currency: "MMK" },
  { id: "ACC-002", accountNo: "001-000-245118000", customerName: "Golden Sample Ltd.", branchId: "BR-001", status: "Dormant", balance: 3100000, currency: "MMK" },
  { id: "ACC-003", accountNo: "002-009-881230145", customerName: "Myanmar Demo Foods", branchId: "BR-002", status: "Active", balance: 18900000, currency: "MMK" },
  { id: "ACC-004", accountNo: "002-010-440998871", customerName: "Sample Logistics", branchId: "BR-002", status: "Closed", balance: 0, currency: "MMK" },
  { id: "ACC-005", accountNo: "000-020-090455672", customerName: "Demo City Mart", branchId: "BR-HO", status: "Inactive", balance: 950000, currency: "MMK" },
  { id: "ACC-006", accountNo: "000-020-090455673", customerName: "Demo Construction", branchId: "BR-HO", status: "Active", balance: 11200000, currency: "MMK" }
];

export const seedRejectReasons: RejectReason[] = [
  { code: "R01", description: "Insufficient Funds", appliesTo: "INWARD" },
  { code: "R02", description: "Signature Mismatch", appliesTo: "BOTH" },
  { code: "R03", description: "Stale Cheque", appliesTo: "BOTH" },
  { code: "R04", description: "Duplicate Cheque", appliesTo: "BOTH" },
  { code: "R05", description: "Invalid MICR", appliesTo: "OUTWARD" },
  { code: "R06", description: "Image Quality Failed", appliesTo: "BOTH" },
  { code: "R07", description: "Account Closed", appliesTo: "INWARD" }
];

export const seedSettings: AppSettings = {
  representmentCount: 3,
  representmentDays: 15,
  pollIntervalSeconds: 10,
  outwardCutoffTime: "15:00",
  inwardCutoffTime: "15:00",
  inwardChargePostingRequired: true,
  validRoutingNumbers: ["100000", "100001", "100002", "200101", "200102", "AYDB", "MMDB", "NPDB"],
  cbsMockMode: "Success",
  cbmMockResponseMode: "Manual",
  showDemoScenarioLauncher: true
};

const front1 = "/placeholders/cheque-001.svg";
const front2 = "/placeholders/cheque-002.svg";
const rear = "/placeholders/cheque-rear.svg";
const signature = "/placeholders/signature.svg";

function cheque(input: Omit<ChequeItem, "status" | "uic" | "imageFrontUrl" | "imageRearUrl" | "signatureUrl"> & { sequenceNumber: number }): ChequeItem {
  return {
    ...input,
    status: statusForWorkstep(input.workstep),
    uic: generateUIC(input.scanDate, input.presentingBankCode, input.branchCode, "SCN01", input.batchNo.replace(/\D/g, "").slice(-4), input.sequenceNumber),
    imageFrontUrl: input.sequenceNumber % 2 === 0 ? front2 : front1,
    imageRearUrl: rear,
    signatureUrl: signature
  };
}

export const seedCheques: ChequeItem[] = [
  cheque({
    id: "CHQ-OUT-001",
    direction: "OUTWARD",
    workstep: "SCANNING_DATA_ENTRY",
    batchId: "BAT-OUT-001",
    batchNo: "OUT-0601-01",
    chequeNo: "908420",
    micrLine: "908420 100001 001000245117999 31",
    accountId: "ACC-001",
    accountNo: "001-000-245117999",
    payee: "Demo Trading Co.",
    amount: 640000,
    currency: "MMK",
    branch: "Branch 001",
    branchCode: "001",
    presentingBank: "MM Demo Bank",
    presentingBankCode: "MMDB",
    payingBank: "Ayeyar Demo Bank",
    payingBankCode: "AYDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-20",
    representmentCount: 0,
    sequenceNumber: 1
  }),
  cheque({
    id: "CHQ-OUT-002",
    direction: "OUTWARD",
    workstep: "OUTWARD_AUTHORIZATION",
    batchId: "BAT-OUT-001",
    batchNo: "OUT-0601-01",
    chequeNo: "908421",
    micrLine: "908421 100001 001000245117999 31",
    accountId: "ACC-001",
    accountNo: "001-000-245117999",
    payee: "Demo Trading Co.",
    amount: 1250000,
    currency: "MMK",
    branch: "Branch 001",
    branchCode: "001",
    presentingBank: "MM Demo Bank",
    presentingBankCode: "MMDB",
    payingBank: "Ayeyar Demo Bank",
    payingBankCode: "AYDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-25",
    representmentCount: 0,
    sequenceNumber: 2
  }),
  cheque({
    id: "CHQ-OUT-003",
    direction: "OUTWARD",
    workstep: "OUTWARD_REPAIR",
    batchId: "BAT-OUT-001",
    batchNo: "OUT-0601-01",
    chequeNo: "908422",
    micrLine: "908422 100001 001000245118000 31",
    accountId: "ACC-002",
    accountNo: "001-000-245118000",
    payee: "Golden Sample Ltd.",
    amount: 2400000,
    currency: "MMK",
    branch: "Branch 001",
    branchCode: "001",
    presentingBank: "MM Demo Bank",
    presentingBankCode: "MMDB",
    payingBank: "Mandalay Demo Bank",
    payingBankCode: "MYDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-28",
    representmentCount: 1,
    reason: "Image Quality Failed",
    sequenceNumber: 3
  }),
  cheque({
    id: "CHQ-OUT-004",
    direction: "OUTWARD",
    workstep: "HOLD_FOR_ICL_GENERATION",
    batchId: "BAT-OUT-002",
    batchNo: "OUT-0601-02",
    chequeNo: "801122",
    micrLine: "801122 100002 002009881230145 31",
    accountId: "ACC-003",
    accountNo: "002-009-881230145",
    payee: "Myanmar Demo Foods",
    amount: 870000,
    currency: "MMK",
    branch: "Branch 002",
    branchCode: "002",
    presentingBank: "MM Demo Bank",
    presentingBankCode: "MMDB",
    payingBank: "Naypyitaw Demo Bank",
    payingBankCode: "NPDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-29",
    representmentCount: 0,
    sequenceNumber: 4
  }),
  cheque({
    id: "CHQ-OUT-005",
    direction: "OUTWARD",
    workstep: "ICL_FILE_GENERATION",
    batchId: "BAT-OUT-002",
    batchNo: "OUT-0601-02",
    chequeNo: "801123",
    micrLine: "801123 100002 002009881230145 31",
    accountId: "ACC-003",
    accountNo: "002-009-881230145",
    payee: "Myanmar Demo Foods",
    amount: 1540000,
    currency: "MMK",
    branch: "Branch 002",
    branchCode: "002",
    presentingBank: "MM Demo Bank",
    presentingBankCode: "MMDB",
    payingBank: "Naypyitaw Demo Bank",
    payingBankCode: "NPDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-30",
    representmentCount: 0,
    sequenceNumber: 5
  }),
  cheque({
    id: "CHQ-OUT-006",
    direction: "OUTWARD",
    workstep: "OUTWARD_NAK_REPAIR",
    batchId: "BAT-OUT-003",
    batchNo: "OUT-0601-03",
    chequeNo: "661004",
    micrLine: "661004 BADRT 002010440998871 31",
    accountId: "ACC-004",
    accountNo: "002-010-440998871",
    payee: "Sample Logistics",
    amount: 3325000,
    currency: "MMK",
    branch: "Branch 002",
    branchCode: "002",
    presentingBank: "MM Demo Bank",
    presentingBankCode: "MMDB",
    payingBank: "Shan Demo Bank",
    payingBankCode: "SHDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-12",
    representmentCount: 0,
    reason: "Invalid MICR",
    sequenceNumber: 6
  }),
  cheque({
    id: "CHQ-IN-001",
    direction: "INWARD",
    workstep: "READ_UPLOAD_FORWARD_DOWNLOAD_ICL",
    batchId: "BAT-IN-001",
    batchNo: "IN-0601-01",
    chequeNo: "120098",
    micrLine: "120098 100000 000020090455672 31",
    accountId: "ACC-005",
    accountNo: "000-020-090455672",
    payee: "Demo City Mart",
    amount: 420000,
    currency: "MMK",
    branch: "Head Office",
    branchCode: "000",
    presentingBank: "Delta Demo Bank",
    presentingBankCode: "DLDB",
    payingBank: "MM Demo Bank",
    payingBankCode: "MMDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-15",
    representmentCount: 0,
    sequenceNumber: 7
  }),
  cheque({
    id: "CHQ-IN-002",
    direction: "INWARD",
    workstep: "TECHNICAL_VERIFICATION",
    batchId: "BAT-IN-001",
    batchNo: "IN-0601-01",
    chequeNo: "120099",
    micrLine: "120099 100000 000020090455672 31",
    accountId: "ACC-005",
    accountNo: "000-020-090455672",
    payee: "Demo City Mart",
    amount: 590000,
    currency: "MMK",
    branch: "Head Office",
    branchCode: "000",
    presentingBank: "Delta Demo Bank",
    presentingBankCode: "DLDB",
    payingBank: "MM Demo Bank",
    payingBankCode: "MMDB",
    scanDate: "2026-06-01",
    issueDate: "2025-10-15",
    representmentCount: 0,
    reason: "Stale Cheque",
    sequenceNumber: 8
  }),
  cheque({
    id: "CHQ-IN-003",
    direction: "INWARD",
    workstep: "DEBIT_POSTING",
    batchId: "BAT-IN-002",
    batchNo: "IN-0601-02",
    chequeNo: "120100",
    micrLine: "120100 100000 000020090455673 31",
    accountId: "ACC-006",
    accountNo: "000-020-090455673",
    payee: "Demo Construction",
    amount: 4950000,
    currency: "MMK",
    branch: "Head Office",
    branchCode: "000",
    presentingBank: "Delta Demo Bank",
    presentingBankCode: "DLDB",
    payingBank: "MM Demo Bank",
    payingBankCode: "MMDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-31",
    representmentCount: 0,
    sequenceNumber: 9
  }),
  cheque({
    id: "CHQ-IN-004",
    direction: "INWARD",
    workstep: "REFERRAL",
    batchId: "BAT-IN-002",
    batchNo: "IN-0601-02",
    chequeNo: "120101",
    micrLine: "120101 100000 000020090455673 31",
    accountId: "ACC-006",
    accountNo: "000-020-090455673",
    payee: "Demo Construction",
    amount: 7150000,
    currency: "MMK",
    branch: "Head Office",
    branchCode: "000",
    presentingBank: "Delta Demo Bank",
    presentingBankCode: "DLDB",
    payingBank: "MM Demo Bank",
    payingBankCode: "MMDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-27",
    representmentCount: 0,
    reason: "Insufficient Funds",
    sequenceNumber: 10
  }),
  cheque({
    id: "CHQ-IN-005",
    direction: "INWARD",
    workstep: "MANUAL_RETURN_MAKER",
    batchId: "BAT-IN-003",
    batchNo: "IN-0601-03",
    chequeNo: "120102",
    micrLine: "120102 100001 001000245118000 31",
    accountId: "ACC-002",
    accountNo: "001-000-245118000",
    payee: "Golden Sample Ltd.",
    amount: 210000,
    currency: "MMK",
    branch: "Branch 001",
    branchCode: "001",
    presentingBank: "Ayeyar Demo Bank",
    presentingBankCode: "AYDB",
    payingBank: "MM Demo Bank",
    payingBankCode: "MMDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-22",
    representmentCount: 1,
    reason: "Signature Mismatch",
    sequenceNumber: 11
  }),
  cheque({
    id: "CHQ-IN-006",
    direction: "INWARD",
    workstep: "INWARD_NAK_REPAIR",
    batchId: "BAT-IN-003",
    batchNo: "IN-0601-03",
    chequeNo: "120103",
    micrLine: "120103 100002 002010440998871 31",
    accountId: "ACC-004",
    accountNo: "002-010-440998871",
    payee: "Sample Logistics",
    amount: 650000,
    currency: "MMK",
    branch: "Branch 002",
    branchCode: "002",
    presentingBank: "Ayeyar Demo Bank",
    presentingBankCode: "AYDB",
    payingBank: "MM Demo Bank",
    payingBankCode: "MMDB",
    scanDate: "2026-06-01",
    issueDate: "2026-05-26",
    representmentCount: 0,
    reason: "Account Closed",
    sequenceNumber: 12
  })
];

export const seedBatches: Batch[] = [
  { id: "BAT-OUT-001", batchNo: "OUT-0601-01", direction: "OUTWARD", branchId: "BR-001", scannerId: "SCN01", scannerIp: "10.10.1.121", createdBy: "USR-MAKER1", createdAt: "2026-06-01 09:21", itemCount: 3, totalAmount: 4290000 },
  { id: "BAT-OUT-002", batchNo: "OUT-0601-02", direction: "OUTWARD", branchId: "BR-002", scannerId: "SCN01", scannerIp: "10.10.2.122", createdBy: "USR-MAKER1", createdAt: "2026-06-01 09:45", itemCount: 2, totalAmount: 2410000 },
  { id: "BAT-OUT-003", batchNo: "OUT-0601-03", direction: "OUTWARD", branchId: "BR-002", scannerId: "SCN02", scannerIp: "10.10.2.123", createdBy: "USR-SERVICE", createdAt: "2026-06-01 10:20", itemCount: 1, totalAmount: 3325000 },
  { id: "BAT-IN-001", batchNo: "IN-0601-01", direction: "INWARD", branchId: "BR-HO", scannerId: "CBM01", scannerIp: "10.20.1.221", createdBy: "USR-SERVICE", createdAt: "2026-06-01 10:05", itemCount: 2, totalAmount: 1010000 },
  { id: "BAT-IN-002", batchNo: "IN-0601-02", direction: "INWARD", branchId: "BR-HO", scannerId: "CBM01", scannerIp: "10.20.1.221", createdBy: "USR-SERVICE", createdAt: "2026-06-01 11:00", itemCount: 2, totalAmount: 12100000 },
  { id: "BAT-IN-003", batchNo: "IN-0601-03", direction: "INWARD", branchId: "BR-001", scannerId: "CBM01", scannerIp: "10.20.1.221", createdBy: "USR-SERVICE", createdAt: "2026-06-01 11:35", itemCount: 2, totalAmount: 860000 }
];

export const seedICLFiles: ICLFile[] = [
  { id: "ICL-OUT-001", direction: "OUTWARD", fileName: "MMDB_OUT_20260601_001.icl", batchIds: ["BAT-OUT-002"], status: "Generated", createdAt: "2026-06-01 12:10" },
  { id: "ICL-IN-RET-001", direction: "INWARD", fileName: "MMDB_RET_20260601_001.icl", batchIds: ["BAT-IN-003"], status: "Pending", createdAt: "2026-06-01 12:25" }
];

export const seedPostingFiles: PostingFile[] = [
  { id: "POST-OUT-001", direction: "OUTWARD", fileName: "credit-posting-20260601.txt", chequeIds: ["CHQ-OUT-004", "CHQ-OUT-005"], status: "Pending", createdAt: "2026-06-01 12:45" },
  { id: "POST-IN-001", direction: "INWARD", fileName: "debit-posting-20260601.txt", chequeIds: ["CHQ-IN-003"], status: "Generated", createdAt: "2026-06-01 12:50" }
];

export const seedReportJobs: ReportJob[] = [
  { id: "REP-001", name: "Outward clearing summary", requestedBy: "USR-ADMIN1", status: "Completed", createdAt: "2026-06-01 13:00" },
  { id: "REP-002", name: "Inward technical exceptions", requestedBy: "USR-INMAKER1", status: "Queued", createdAt: "2026-06-01 13:10" }
];

export const outwardTileDefs: Array<Omit<WorkflowTile, "count">> = [
  { label: "Scanning", route: "/outward/scanning", tone: "blue", workstep: "SCANNING_DATA_ENTRY" },
  { label: "Authorization", route: "/outward/authorization", tone: "amber", workstep: "OUTWARD_AUTHORIZATION" },
  { label: "Repair", route: "/outward/repair", tone: "red", workstep: "OUTWARD_REPAIR" },
  { label: "ICL Hold", route: "/outward/icl-generation", tone: "green", workstep: "HOLD_FOR_ICL_GENERATION" },
  { label: "Credit Posting", route: "/outward/credit-posting", tone: "gray", workstep: "CREDIT_POSTING" }
];

export const inwardTileDefs: Array<Omit<WorkflowTile, "count">> = [
  { label: "ICL Uploaded", route: "/inward/upload-icl", tone: "blue", workstep: "READ_UPLOAD_FORWARD_DOWNLOAD_ICL" },
  { label: "Technical Verification", route: "/inward/technical-verification", tone: "amber", workstep: "TECHNICAL_VERIFICATION" },
  { label: "Debit Posting", route: "/inward/debit-posting", tone: "green", workstep: "DEBIT_POSTING" },
  { label: "Referral", route: "/inward/referral", tone: "red", workstep: "REFERRAL" },
  { label: "Charge Posting", route: "/inward/charge-posting", tone: "gray", workstep: "INWARD_CHARGE_POSTING" }
];

export const seedAudit: AuditEvent[] = [
  {
    id: "AUD-001",
    at: "2026-06-01 09:05",
    userId: "USR-MAKER1",
    user: "Moe Maker",
    role: "MAKER",
    action: "Login",
    entityId: "USR-MAKER1",
    note: "Operator session started"
  },
  {
    id: "AUD-002",
    at: "2026-06-01 09:21",
    userId: "USR-MAKER1",
    user: "Moe Maker",
    role: "MAKER",
    action: "Create Batch",
    entityId: generateBatchId("OUTWARD", "2026-06-01", "121", "A7F", "maker1", 1, "001"),
    note: "Batch OUT-0601-01 captured with three demo items"
  },
  {
    id: "AUD-003",
    at: "2026-06-01 10:03",
    userId: "USR-SERVICE",
    user: "CTS Background Service",
    role: "SERVICE",
    action: "Poll Upload Response",
    entityId: "ICL-OUT-001",
    note: "Mock CBM response placed CHQ-OUT-006 into NAK repair"
  }
];
