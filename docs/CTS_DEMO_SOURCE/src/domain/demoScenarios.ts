import { seedBatches, seedCheques, seedICLFiles, seedPostingFiles } from "../data/seed";
import { statusForWorkstep } from "./workflow";
import type { AuditEvent, Batch, ChequeItem, ICLFile, PostingFile, Workstep } from "../types";

export type ScenarioId = "A" | "B" | "C" | "D" | "E" | "F";

export type ScenarioStep = {
  route: string;
  label: string;
  action: string;
};

export type DemoScenario = {
  id: ScenarioId;
  title: string;
  summary: string;
  startRoute: string;
  steps: ScenarioStep[];
};

export const demoScenarios: DemoScenario[] = [
  {
    id: "A",
    title: "Happy-path outward clearing",
    summary: "Scan, authorize, generate ICL, accept CBM response, accept return, and post credit.",
    startRoute: "/outward/scanning",
    steps: [
      { route: "/outward/scanning", label: "Capture", action: "Create or open a batch, scan demo cheques, fetch CBS account, then submit." },
      { route: "/outward/authorization", label: "Authorize", action: "Authorize the batch as checker1 or admin1." },
      { route: "/outward/icl-generation", label: "ICL", action: "Run Service Tick to create the forward upload file." },
      { route: "/outward/forward-upload-response", label: "CBM ACK", action: "Choose Accept All for the forward upload response." },
      { route: "/outward/wait-for-return", label: "Return", action: "Simulate CBM Return Download: Accepted." },
      { route: "/outward/credit-posting", label: "Posting", action: "Run Service Tick to create the credit posting file and exit." }
    ]
  },
  {
    id: "B",
    title: "Outward rejected by CBM -> NAK repair -> regenerate",
    summary: "Stage a forward upload file, reject it, repair the NAK item, and regenerate an upload file.",
    startRoute: "/outward/forward-upload-response",
    steps: [
      { route: "/outward/forward-upload-response", label: "Reject", action: "Enter file remarks and choose Reject All." },
      { route: "/outward/nak-repair", label: "Repair", action: "Correct MICR or cheque details and choose Accept." },
      { route: "/outward/icl-generation", label: "Regenerate", action: "Run Service Tick to generate a fresh CBM upload file." }
    ]
  },
  {
    id: "C",
    title: "Inward technical verification reject",
    summary: "Inspect image/signature, select a reject reason, and send the item to return ICL creation.",
    startRoute: "/inward/technical-verification",
    steps: [
      { route: "/inward/technical-verification", label: "Verify", action: "Open the first item, choose a reject reason, add remarks, and Reject." },
      { route: "/inward/return-icl-generation", label: "Return ICL", action: "Run Return ICL Service to create a CBM return upload file." },
      { route: "/inward/return-upload-response", label: "CBM Response", action: "Choose Accept All, then continue to charge posting if enabled." }
    ]
  },
  {
    id: "D",
    title: "Inward referral accept",
    summary: "Stage a referred cheque for checker review, accept it, then debit post.",
    startRoute: "/inward/referral",
    steps: [
      { route: "/inward/referral", label: "Referral", action: "Review image and account data, then Accept." },
      { route: "/inward/debit-posting", label: "Debit", action: "Run Debit Posting Service." },
      { route: "/inward/manual-return-maker", label: "Return Window", action: "Leave accepted, or use the manual return scenario for maker/checker rejection." }
    ]
  },
  {
    id: "E",
    title: "Manual return maker/checker reject",
    summary: "Stage an accepted inward cheque, maker rejects it, checker confirms, and return ICL is created.",
    startRoute: "/inward/manual-return-maker",
    steps: [
      { route: "/inward/manual-return-maker", label: "Maker", action: "Choose Reject with reason and remarks." },
      { route: "/inward/manual-return-checker", label: "Checker", action: "Sign in as inwardchecker1 or admin1 and Accept the maker reject decision." },
      { route: "/inward/return-icl-generation", label: "Return ICL", action: "Run Return ICL Service." }
    ]
  },
  {
    id: "F",
    title: "Cutoff auto-return simulation",
    summary: "Stage pending inward items and run cutoff services to show automatic return behavior.",
    startRoute: "/inward/technical-verification",
    steps: [
      { route: "/inward/technical-verification", label: "Technical Cutoff", action: "Run Inward Cutoff Check to auto-return pending verification items." },
      { route: "/inward/manual-return-checker", label: "Manual Cutoff", action: "Run Cutoff Auto-Accept for maker return decisions." },
      { route: "/inward/return-icl-generation", label: "Return ICL", action: "Run Return ICL Service for auto-returned items." }
    ]
  }
];

export function getScenario(id: ScenarioId | null | undefined) {
  return demoScenarios.find((scenario) => scenario.id === id);
}

export function suggestedStepForPath(scenario: DemoScenario | undefined, pathname: string) {
  if (!scenario) return undefined;
  return scenario.steps.find((step) => step.route === pathname) ?? scenario.steps[0];
}

function setWorkstep(cheque: ChequeItem, workstep: Workstep, patch: Partial<ChequeItem> = {}): ChequeItem {
  return { ...cheque, ...patch, workstep, status: statusForWorkstep(workstep) };
}

function scenarioFile(id: string, direction: "OUTWARD" | "INWARD", cheque: ChequeItem, fileName: string, localPath: string): ICLFile {
  return {
    id,
    direction,
    fileName,
    batchIds: [cheque.batchId],
    chequeIds: [cheque.id],
    chequeCount: 1,
    totalAmount: cheque.amount,
    localPath,
    status: "Uploaded",
    createdAt: new Date().toLocaleString()
  };
}

export function buildScenarioData(
  id: ScenarioId,
  audit: AuditEvent[]
): {
  cheques: ChequeItem[];
  batches: Batch[];
  iclFiles: ICLFile[];
  postingFiles: PostingFile[];
  audit: AuditEvent[];
} {
  let cheques = seedCheques.map((cheque) => ({ ...cheque }));
  let batches = seedBatches.map((batch) => ({ ...batch }));
  let iclFiles = seedICLFiles.map((file) => ({ ...file }));
  const postingFiles = seedPostingFiles.map((file) => ({ ...file }));

  const update = (chequeId: string, workstep: Workstep, patch: Partial<ChequeItem> = {}) => {
    cheques = cheques.map((cheque) => (cheque.id === chequeId ? setWorkstep(cheque, workstep, patch) : cheque));
  };

  if (id === "A") {
    update("CHQ-OUT-001", "SCANNING_DATA_ENTRY");
    batches = batches.map((batch) => (batch.id === "BAT-OUT-001" ? { ...batch, status: "SCANNING_DATA_ENTRY" } : batch));
  }

  if (id === "B") {
    const fileId = "SCN-B-OUT-CBM-REJECT";
    update("CHQ-OUT-005", "FORWARD_UPLOAD_FILE_RESPONSE", { iclFileId: fileId, returnStatus: "Pending" });
    const target = cheques.find((cheque) => cheque.id === "CHQ-OUT-005");
    if (target) iclFiles = [scenarioFile(fileId, "OUTWARD", target, "MMDB_OUT_SCENARIO_B_001.icl", "C:\\CTS\\Outward\\Upload\\"), ...iclFiles];
  }

  if (id === "C") {
    update("CHQ-IN-001", "TECHNICAL_VERIFICATION", { rejectReason: undefined, remarks: "", returnStatus: "Pending" });
  }

  if (id === "D") {
    update("CHQ-IN-001", "REFERRAL", { rejectReason: "Signature Mismatch", remarks: "Scenario referral for checker review", returnStatus: "Pending" });
  }

  if (id === "E") {
    update("CHQ-IN-001", "MANUAL_RETURN_MAKER", { rejectReason: undefined, remarks: "", returnStatus: "Accepted" });
  }

  if (id === "F") {
    update("CHQ-IN-001", "TECHNICAL_VERIFICATION", { returnStatus: "Pending", remarks: "" });
    update("CHQ-IN-002", "MANUAL_RETURN_CHECKER", {
      rejectReason: "Insufficient Funds",
      remarks: "Scenario maker return pending cutoff",
      returnStatus: "Rejected",
      lastMakerId: "USR-INMAKER1",
      lastUserDetails: "inwardmaker1 marked rejected for cutoff scenario"
    });
  }

  return { cheques, batches, iclFiles, postingFiles, audit };
}
