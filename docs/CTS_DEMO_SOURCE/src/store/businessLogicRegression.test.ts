import { beforeEach, describe, expect, it } from "vitest";
import { canAccessRoute } from "../domain/access";
import { parseMICR, validateAccountForCheque } from "../domain/workflow";
import { seedCheques } from "../data/seed";
import type { Batch, ChequeItem } from "../types";
import { useDemoStore } from "./useDemoStore";

function resetAs(username = "admin1") {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  expect(useDemoStore.getState().login(username, "password")).toBe(true);
}

function loginAs(username: string) {
  useDemoStore.getState().login(username, "password");
}

function cheque(id: string) {
  const found = useDemoStore.getState().cheques.find((item) => item.id === id);
  expect(found).toBeDefined();
  return found!;
}

function latestOutwardUploadFile() {
  const found = useDemoStore
    .getState()
    .iclFiles.find((file) => file.direction === "OUTWARD" && file.status === "Uploaded" && file.chequeIds?.length);
  expect(found).toBeDefined();
  return found!;
}

function latestInwardReturnFile() {
  const found = useDemoStore
    .getState()
    .iclFiles.find((file) => file.direction === "INWARD" && file.localPath === "C:\\CTS\\Inward\\ReturnUpload\\" && file.chequeIds?.length);
  expect(found).toBeDefined();
  return found!;
}

function makeScannedOutwardBatch(): { batch: Batch; cheques: ChequeItem[] } {
  const base = seedCheques[0];
  const batch: Batch = {
    id: "BAT-REG-OUT-001",
    batchNo: "OUT-REG-001",
    direction: "OUTWARD",
    branchId: "BR-001",
    scannerId: "FB30U",
    scannerIp: "10.10.1.130",
    createdBy: "USR-MAKER1",
    createdAt: "2026-06-23 09:00",
    itemCount: 3,
    totalAmount: 600000
  };
  const cheques = [1, 2, 3].map((sequence) => {
    const chequeNo = `77${sequence}001`;
    return {
      ...base,
      id: `CHQ-REG-OUT-${sequence}`,
      batchId: batch.id,
      batchNo: batch.batchNo,
      chequeNo,
      micrLine: `${chequeNo} 100001 001000245117999 31`,
      amount: 200000,
      scanDate: "2026-06-23",
      issueDate: "2026-06-20",
      valueDate: "2026-06-23",
      workstep: "SCANNING_DATA_ENTRY" as const,
      status: "Scanned" as const,
      discarded: false,
      uic: `20260623-MMDB-001-FB30U-0001-${String(sequence).padStart(6, "0")}`,
      imageFrontUrl: "/placeholders/cheque-001.svg",
      imageRearUrl: "/placeholders/cheque-rear.svg",
      signatureUrl: "/placeholders/signature.svg"
    };
  });
  return { batch, cheques };
}

describe("business logic regression after UI redesign", () => {
  beforeEach(() => {
    resetAs("admin1");
  });

  it("preserves authentication, logout, change password, and role access rules", () => {
    expect(useDemoStore.getState().user?.username).toBe("admin1");
    expect(useDemoStore.getState().changePassword("password", "new-password")).toBe(true);
    expect(useDemoStore.getState().audit[0].action).toBe("Change Password");

    useDemoStore.getState().logout();
    expect(useDemoStore.getState().user).toBeNull();
    expect(useDemoStore.getState().login("maker1", "bad-password")).toBe(false);
    expect(useDemoStore.getState().login("maker1", "password")).toBe(true);

    expect(canAccessRoute("MAKER", "/outward/scanning")).toBe(true);
    expect(canAccessRoute("MAKER", "/outward/authorization")).toBe(false);
    expect(canAccessRoute("CHECKER", "/outward/authorization")).toBe(true);
    expect(canAccessRoute("CHECKER", "/outward/scanning")).toBe(false);
    expect(canAccessRoute("ADMIN", "/admin")).toBe(true);
    expect(canAccessRoute("MAKER", "/admin")).toBe(false);
  });

  it("preserves outward scan, validation, maker/checker, repair, authorization, posting, and archive flow", () => {
    resetAs("maker1");
    const { batch, cheques } = makeScannedOutwardBatch();
    const account = useDemoStore.getState().accounts.find((item) => item.id === cheques[0].accountId);
    expect(validateAccountForCheque(account)).toBeUndefined();
    expect(parseMICR(cheques[0].micrLine).routingNumber).toBe("100001");

    useDemoStore.getState().saveScanningBatch(batch, cheques, "regression scan save");
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id)).toHaveLength(3);
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id).every((item) => item.imageFrontUrl && item.uic)).toBe(true);

    useDemoStore.getState().submitScanningBatch(batch.id, "regression submit");
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id).every((item) => item.workstep === "OUTWARD_AUTHORIZATION")).toBe(true);
    expect(canAccessRoute("MAKER", "/outward/authorization")).toBe(false);

    loginAs("checker1");
    const submitted = useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id);
    useDemoStore.getState().sendOutwardBatchToRepair(batch.id, submitted, "regression repair request");
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id).every((item) => item.workstep === "OUTWARD_REPAIR")).toBe(true);

    loginAs("maker1");
    const repairDraft = useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id).map((item) => ({ ...item, remarks: "corrected" }));
    useDemoStore.getState().completeOutwardRepair(batch.id, repairDraft, true);
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id).every((item) => item.workstep === "OUTWARD_AUTHORIZATION")).toBe(true);

    loginAs("checker1");
    useDemoStore.getState().authorizeOutwardBatch(batch.id, useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id), "regression authorize");
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id).every((item) => item.workstep === "HOLD_FOR_ICL_GENERATION")).toBe(true);

    useDemoStore.getState().runOutwardServiceTick();
    const file = latestOutwardUploadFile();
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id).every((item) => item.workstep === "FORWARD_UPLOAD_FILE_RESPONSE")).toBe(true);

    const decisions = Object.fromEntries(file.chequeIds!.map((id) => [id, "Accepted" as const]));
    useDemoStore.getState().updateForwardUploadResponse(file.id, decisions, "Accepted", "regression accept all");
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id).every((item) => item.workstep === "WAIT_FOR_RETURN")).toBe(true);

    useDemoStore.getState().simulateCbmReturnDownload(true);
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id).every((item) => item.workstep === "CREDIT_POSTING")).toBe(true);

    useDemoStore.getState().runOutwardServiceTick();
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === batch.id).every((item) => item.workstep === "WORK_EXIT")).toBe(true);
    expect(useDemoStore.getState().archive.some((record) => record.cheque.batchId === batch.id)).toBe(true);
  });

  it("preserves outward upload reject all, accept with exception, NAK repair, wait reject, and discard paths", () => {
    useDemoStore.getState().launchScenario("B");
    let file = useDemoStore.getState().iclFiles.find((item) => item.id === "SCN-B-OUT-CBM-REJECT")!;

    useDemoStore.getState().updateForwardUploadResponse(file.id, { "CHQ-OUT-005": "Rejected" }, "Invalid MICR", "reject all");
    expect(cheque("CHQ-OUT-005").workstep).toBe("OUTWARD_NAK_REPAIR");

    useDemoStore.getState().acceptOutwardNakCheque({ ...cheque("CHQ-OUT-005"), remarks: "corrected MICR" });
    expect(cheque("CHQ-OUT-005").workstep).toBe("ICL_FILE_GENERATION");
    useDemoStore.getState().runOutwardServiceTick();
    expect(cheque("CHQ-OUT-005").workstep).toBe("FORWARD_UPLOAD_FILE_RESPONSE");

    useDemoStore.getState().launchScenario("B");
    file = useDemoStore.getState().iclFiles.find((item) => item.id === "SCN-B-OUT-CBM-REJECT")!;
    useDemoStore
      .getState()
      .updateForwardUploadResponse(file.id, { "CHQ-OUT-005": "Rejected", "CHQ-OUT-004": "Accepted" }, "Duplicate Cheque", "exception response");
    expect(cheque("CHQ-OUT-005").workstep).toBe("OUTWARD_NAK_REPAIR");
    expect(cheque("CHQ-OUT-004").workstep).toBe("WAIT_FOR_RETURN");

    useDemoStore.getState().simulateCbmReturnDownload(false);
    expect(cheque("CHQ-OUT-004").workstep).toBe("WORK_EXIT");
    expect(useDemoStore.getState().archive.some((record) => record.cheque.id === "CHQ-OUT-004")).toBe(true);

    expect(useDemoStore.getState().discardOutwardNakCheque({ ...cheque("CHQ-OUT-005"), remarks: "discard after NAK" })).toBe(true);
    expect(cheque("CHQ-OUT-005").workstep).toBe("DISCARD");
    expect(useDemoStore.getState().archive.some((record) => record.cheque.id === "CHQ-OUT-005")).toBe(true);

    resetAs("checker1");
    const batchCheques = useDemoStore.getState().cheques.filter((item) => item.batchId === "BAT-OUT-001");
    useDemoStore.getState().discardOutwardBatch("BAT-OUT-001", batchCheques, "checker discard path");
    expect(useDemoStore.getState().cheques.filter((item) => item.batchId === "BAT-OUT-001").every((item) => item.workstep === "DISCARD")).toBe(true);
  });

  it("preserves inward upload, technical decisions, debit posting, referral, manual return, return response, NAK, charge, and archive flow", () => {
    resetAs("inwardmaker1");
    const importResult = useDemoStore.getState().importInwardForwardDownloadFile("REG_FORWARD_DOWNLOAD.icl");
    expect(importResult.ok).toBe(true);
    const importedFile = useDemoStore.getState().iclFiles.find((file) => file.fileName === "REG_FORWARD_DOWNLOAD.icl")!;
    const importedIds = importedFile.chequeIds!;
    expect(importedIds).toHaveLength(2);
    expect(importedIds.every((id) => cheque(id).workstep === "TECHNICAL_VERIFICATION")).toBe(true);

    const normalId = importedIds.find((id) => cheque(id).chequeType !== "2")!;
    useDemoStore.getState().technicalAccept(normalId);
    expect(cheque(normalId).workstep).toBe("DEBIT_POSTING");
    useDemoStore.getState().runInwardDebitPosting();
    expect(cheque(normalId).workstep).toBe("MANUAL_RETURN_MAKER");

    expect(useDemoStore.getState().manualReturnMakerReject(normalId, "Signature Mismatch", "maker return")).toBe(true);
    expect(cheque(normalId).workstep).toBe("MANUAL_RETURN_CHECKER");

    loginAs("inwardchecker1");
    expect(useDemoStore.getState().manualReturnCheckerReject(normalId)).toBe(true);
    expect(cheque(normalId).workstep).toBe("MANUAL_RETURN_MAKER");
    loginAs("inwardmaker1");
    expect(useDemoStore.getState().manualReturnMakerReject(normalId, "Signature Mismatch", "maker return again")).toBe(true);
    loginAs("inwardchecker1");
    expect(useDemoStore.getState().manualReturnCheckerAccept(normalId)).toBe(true);
    expect(cheque(normalId).workstep).toBe("RETURN_ICL_CREATION");

    useDemoStore.getState().generateReturnIclFile();
    const returnFile = latestInwardReturnFile();
    expect(cheque(normalId).workstep).toBe("RETURN_UPLOAD_FILE_RESPONSE");

    useDemoStore.getState().updateReturnUploadResponse(returnFile.id, { [normalId]: "Accepted" }, "Accepted", "return accepted");
    expect(cheque(normalId).workstep).toBe("INWARD_CHARGE_POSTING");
    useDemoStore.getState().runInwardChargePosting();
    expect(cheque(normalId).workstep).toBe("WORK_EXIT");
    expect(useDemoStore.getState().archive.some((record) => record.cheque.id === normalId)).toBe(true);
  });

  it("preserves inward reject, refer, referral reject, return upload reject all/exception, and NAK repair paths", () => {
    useDemoStore.getState().launchScenario("C");
    expect(useDemoStore.getState().technicalReject("CHQ-IN-001", "Signature Mismatch", "bad signature")).toBe(true);
    expect(cheque("CHQ-IN-001").workstep).toBe("RETURN_ICL_CREATION");

    useDemoStore.getState().launchScenario("C");
    expect(useDemoStore.getState().technicalRefer("CHQ-IN-001", "Insufficient Funds", "refer checker")).toBe(true);
    expect(cheque("CHQ-IN-001").workstep).toBe("REFERRAL");

    useDemoStore.getState().launchScenario("D");
    useDemoStore.getState().referralAccept("CHQ-IN-001");
    expect(cheque("CHQ-IN-001").workstep).toBe("DEBIT_POSTING");
    useDemoStore.getState().launchScenario("D");
    expect(useDemoStore.getState().referralReject("CHQ-IN-001", "Account Closed", "reject referral")).toBe(true);
    expect(cheque("CHQ-IN-001").workstep).toBe("RETURN_ICL_CREATION");

    resetAs("admin1");
    useDemoStore.getState().moveChequeToWorkstep("CHQ-IN-001", "RETURN_ICL_CREATION", "prepare return file");
    useDemoStore.getState().moveChequeToWorkstep("CHQ-IN-002", "RETURN_ICL_CREATION", "prepare return file");
    useDemoStore.getState().generateReturnIclFile();
    let returnFile = latestInwardReturnFile();
    useDemoStore.getState().updateReturnUploadResponse(
      returnFile.id,
      { "CHQ-IN-001": "Accepted", "CHQ-IN-002": "Rejected" },
      "Invalid MICR",
      "exception response",
      { "CHQ-IN-002": "Invalid MICR" },
      { "CHQ-IN-002": "repair required" }
    );
    expect(cheque("CHQ-IN-001").workstep).toBe("INWARD_CHARGE_POSTING");
    expect(cheque("CHQ-IN-002").workstep).toBe("INWARD_NAK_REPAIR");

    useDemoStore.getState().completeInwardNakRepair({ ...cheque("CHQ-IN-002"), remarks: "completed" });
    expect(cheque("CHQ-IN-002").workstep).toBe("RETURN_ICL_CREATION");

    useDemoStore.getState().generateReturnIclFile();
    returnFile = latestInwardReturnFile();
    useDemoStore.getState().updateReturnUploadResponse(returnFile.id, { "CHQ-IN-002": "Rejected" }, "Duplicate Cheque", "reject all");
    expect(cheque("CHQ-IN-002").workstep).toBe("INWARD_NAK_REPAIR");
  });

  it("preserves audit, settings persistence, reset data, and archive rebuild behavior", () => {
    const originalAuditCount = useDemoStore.getState().audit.length;
    useDemoStore.getState().updateSettings({ pollIntervalSeconds: 12, showDemoScenarioLauncher: false });
    expect(useDemoStore.getState().settings.pollIntervalSeconds).toBe(12);
    expect(useDemoStore.getState().settings.showDemoScenarioLauncher).toBe(false);
    expect(useDemoStore.getState().audit.length).toBeGreaterThan(originalAuditCount);

    useDemoStore.getState().moveChequeToWorkstep("CHQ-OUT-004", "WORK_EXIT", "archive regression");
    expect(useDemoStore.getState().archive.some((record) => record.cheque.id === "CHQ-OUT-004")).toBe(true);
    useDemoStore.getState().rebuildArchive();
    expect(useDemoStore.getState().archive.some((record) => record.cheque.id === "CHQ-OUT-004")).toBe(true);

    useDemoStore.getState().resetDemo();
    expect(useDemoStore.getState().settings.pollIntervalSeconds).toBe(10);
    expect(useDemoStore.getState().settings.showDemoScenarioLauncher).toBe(true);
    expect(useDemoStore.getState().archive).toHaveLength(0);
  });
});
