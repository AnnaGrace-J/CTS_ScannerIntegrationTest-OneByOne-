import { describe, expect, it } from "vitest";
import { seedCheques, seedSettings } from "../data/seed";
import {
  detectDuplicateCheque,
  detectRepresentment,
  getWorkstepCounts,
  isStaleCheque,
  parseMICR,
  validateRoutingNumber
} from "./workflow";

describe("validation utilities", () => {
  it("parses MICR lines into cheque, routing, account, and transaction code", () => {
    expect(parseMICR("908420 100001 001000245117999 31")).toEqual({
      chequeNo: "908420",
      routingNumber: "100001",
      accountNo: "001000245117999",
      transactionCode: "31"
    });
  });

  it("validates numeric routing numbers used by demo cheques", () => {
    expect(validateRoutingNumber("100001")).toBe(true);
    expect(validateRoutingNumber("BADRT")).toBe(false);
  });

  it("detects duplicate cheques and representment within configured days", () => {
    const candidate = { ...seedCheques[0], id: "CHQ-TEST-DUP" };
    expect(detectDuplicateCheque(candidate, seedCheques)).toBe(true);
    expect(detectRepresentment(candidate, seedCheques, seedSettings)).toBe(true);
  });

  it("marks cheques older than six months as stale", () => {
    expect(isStaleCheque("2025-11-01", "2026-06-01")).toBe(true);
    expect(isStaleCheque("2026-05-01", "2026-06-01")).toBe(false);
  });
});

describe("workstep counts", () => {
  it("calculates dashboard counts from current cheque worksteps", () => {
    const counts = getWorkstepCounts(seedCheques);
    expect(counts.find((count) => count.workstep === "OUTWARD_AUTHORIZATION")?.count).toBeGreaterThan(0);
    expect(counts.find((count) => count.workstep === "TECHNICAL_VERIFICATION")?.count).toBeGreaterThan(0);
  });
});
