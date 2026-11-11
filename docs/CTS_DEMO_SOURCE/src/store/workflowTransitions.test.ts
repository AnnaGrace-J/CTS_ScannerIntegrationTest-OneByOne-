import { beforeEach, describe, expect, it } from "vitest";
import { useDemoStore } from "./useDemoStore";

function freshStore() {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDemoStore.getState().login("admin1", "password");
  return useDemoStore.getState();
}

describe("workflow transitions", () => {
  beforeEach(() => {
    freshStore();
  });

  it("moves submitted scanning batches to outward authorization", () => {
    const state = useDemoStore.getState();
    state.submitScanningBatch("BAT-OUT-001", "test submit");
    const moved = useDemoStore.getState().cheques.filter((cheque) => cheque.batchId === "BAT-OUT-001" && cheque.chequeNo === "908420");
    expect(moved[0].workstep).toBe("OUTWARD_AUTHORIZATION");
    expect(useDemoStore.getState().audit[0].action).toBe("Submit Scanning Batch");
  });

  it("stages outward CBM rejection scenario and sends rejected upload response to NAK repair", () => {
    const route = useDemoStore.getState().launchScenario("B");
    expect(route).toBe("/outward/forward-upload-response");
    const file = useDemoStore.getState().iclFiles.find((item) => item.id === "SCN-B-OUT-CBM-REJECT");
    expect(file).toBeDefined();

    useDemoStore.getState().updateForwardUploadResponse(file!.id, { "CHQ-OUT-005": "Rejected" }, "Invalid MICR", "Scenario reject");
    const cheque = useDemoStore.getState().cheques.find((item) => item.id === "CHQ-OUT-005");
    expect(cheque?.workstep).toBe("OUTWARD_NAK_REPAIR");
    expect(cheque?.nakReason).toBe("Invalid MICR");
  });

  it("archives cheques that reach work exit", () => {
    useDemoStore.getState().moveChequeToWorkstep("CHQ-OUT-004", "WORK_EXIT", "test terminal move");
    const record = useDemoStore.getState().archive.find((item) => item.cheque.id === "CHQ-OUT-004");
    expect(record).toBeDefined();
    expect(record?.frontImageUrl).toContain("cheque");
  });

  it("rejects inward technical verification items to return ICL creation", () => {
    useDemoStore.getState().launchScenario("C");
    const target = useDemoStore.getState().cheques.find((cheque) => cheque.id === "CHQ-IN-001");
    expect(target?.workstep).toBe("TECHNICAL_VERIFICATION");
    expect(useDemoStore.getState().technicalReject("CHQ-IN-001", "Signature Mismatch", "Test reject")).toBe(true);
    expect(useDemoStore.getState().cheques.find((cheque) => cheque.id === "CHQ-IN-001")?.workstep).toBe("RETURN_ICL_CREATION");
  });

  it("restores the Demo Scenario Launcher global setting on reset", () => {
    useDemoStore.getState().updateSettings({ showDemoScenarioLauncher: false });
    expect(useDemoStore.getState().settings.showDemoScenarioLauncher).toBe(false);
    useDemoStore.getState().resetDemo();
    expect(useDemoStore.getState().settings.showDemoScenarioLauncher).toBe(true);
  });
});
