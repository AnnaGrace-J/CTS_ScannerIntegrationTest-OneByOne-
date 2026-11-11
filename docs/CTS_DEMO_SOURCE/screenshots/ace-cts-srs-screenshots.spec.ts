import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const screenshotDir = path.resolve("docs", "srs-screenshots");

async function prepareFolder() {
  fs.rmSync(screenshotDir, { recursive: true, force: true });
  fs.mkdirSync(screenshotDir, { recursive: true });
}

function srsPath(route: string) {
  return `${route}${route.includes("?") ? "&" : "?"}srsMode=true`;
}

async function gotoSrs(page: Page, route: string) {
  await page.goto(srsPath(route), { waitUntil: "networkidle" });
  await page.waitForTimeout(250);
}

async function capture(page: Page, fileName: string) {
  await page.screenshot({
    path: path.join(screenshotDir, fileName),
    fullPage: true,
    animations: "disabled"
  });
}

async function loginAdmin(page: Page, clearState = true) {
  await page.goto(srsPath("/login"), { waitUntil: "networkidle" });
  if (clearState) {
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
  }
  await page.getByLabel("Username").fill("admin1");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Outward Clearing Workspace" })).toBeVisible();
}

async function resetAndLogin(page: Page) {
  await loginAdmin(page, true);
}

async function clickFirst(page: Page, name: string | RegExp) {
  const button = page.getByRole("button", { name }).first();
  try {
    await button.click({ timeout: 3_000 });
  } catch {
    return;
  }
  await page.waitForTimeout(600);
}

async function fillIfReady(page: Page, label: string, value: string) {
  try {
    await page.getByLabel(label).fill(value, { timeout: 3_000 });
  } catch {
    return;
  }
}

async function selectLastIfReady(page: Page, value: string) {
  try {
    await page.locator("select:not([disabled])").last().selectOption(value, { timeout: 3_000 });
  } catch {
    return;
  }
}

async function selectLabelIfReady(page: Page, label: string, option: { label: string }) {
  try {
    await page.getByLabel(label).selectOption(option, { timeout: 3_000 });
  } catch {
    return;
  }
}

async function runOutwardServiceTick(page: Page) {
  await clickFirst(page, /Run Service Tick/i);
  await page.waitForTimeout(900);
}

async function launchScenario(page: Page, id: "A" | "B" | "C" | "D" | "E" | "F") {
  await gotoSrs(page, "/outward/dashboard");
  await page.goto("/outward/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: new RegExp(`Scenario ${id}:`, "i") }).click();
  await page.waitForTimeout(600);
}

async function stageOutwardResponse(page: Page) {
  await resetAndLogin(page);
  await gotoSrs(page, "/outward/icl-generation");
  await runOutwardServiceTick(page);
  await gotoSrs(page, "/outward/forward-upload-response");
}

async function stageReturnUploadResponse(page: Page) {
  await resetAndLogin(page);
  await launchScenario(page, "C");
  await gotoSrs(page, "/inward/technical-verification");
  await page.locator("textarea").fill("SRS return workflow capture", { timeout: 3_000 }).catch(() => undefined);
  await clickFirst(page, /^Reject$/);
  await clickFirst(page, /^Yes$/);
  await gotoSrs(page, "/inward/return-icl-generation");
  await clickFirst(page, /Run Return ICL Service/i);
  await gotoSrs(page, "/inward/return-upload-response");
}

test.describe("ACE CTS SRS screenshots", () => {
  test.beforeAll(async () => {
    await prepareFolder();
  });

  test("captures SRS screenshot set from current demo application", async ({ page }) => {
    await resetAndLogin(page);

    await page.goto(srsPath("/login"), { waitUntil: "networkidle" });
    await capture(page, "01-login-page.png");

    await loginAdmin(page, false);
    await gotoSrs(page, "/outward/dashboard");
    await capture(page, "02-home-dashboard.png");

    await page.getByRole("button", { name: "Open user menu" }).click();
    await capture(page, "03-user-menu-logout-change-password.png");

    await gotoSrs(page, "/change-password");
    await capture(page, "04-change-password-page.png");

    await gotoSrs(page, "/search");
    await capture(page, "05-cheque-search.png");
    await clickFirst(page, /^Search$/);
    await capture(page, "06-cheque-search-result-viewer.png");

    await gotoSrs(page, "/admin");
    await capture(page, "07-admin-dashboard.png");
    await capture(page, "08-admin-settings.png");
    await capture(page, "09-admin-audit-log.png");
    await gotoSrs(page, "/admin/archive");
    await clickFirst(page, /Rebuild Archive/i);
    await capture(page, "10-admin-archive.png");
    await gotoSrs(page, "/architecture");
    await capture(page, "11-architecture-page.png");

    await gotoSrs(page, "/outward/dashboard");
    await capture(page, "20-outward-dashboard.png");
    await gotoSrs(page, "/outward/scanning");
    await capture(page, "21-outward-scanning-empty.png");
    await clickFirst(page, /New Batch/i);
    await capture(page, "22-outward-scanning-new-batch-modal.png");
    await clickFirst(page, /^Next$/);
    await clickFirst(page, /^Next$/);
    await clickFirst(page, /^OK$/);
    await clickFirst(page, /^Scan$/);
    await clickFirst(page, /Fetch Account/i);
    await capture(page, "23-outward-scanning-with-cheques.png");
    await clickFirst(page, /^Submit Batch$/);
    await capture(page, "24-outward-scanning-iqa-modal.png");
    await clickFirst(page, /^Accept Image$/);
    await clickFirst(page, /^Submit Batch$/);
    await capture(page, "25-outward-scanning-submit-success.png");

    await gotoSrs(page, "/outward/authorization");
    await capture(page, "26-outward-authorization-search.png");
    await capture(page, "27-outward-authorization-detail.png");
    await clickFirst(page, /Authorize Batch/i);
    await capture(page, "28-outward-authorization-confirmation.png");
    await clickFirst(page, /^No$/);

    await resetAndLogin(page);
    await gotoSrs(page, "/outward/authorization");
    await clickFirst(page, /Repair Batch/i);
    await clickFirst(page, /^Yes$/);
    await gotoSrs(page, "/outward/repair");
    await capture(page, "29-outward-repair-search.png");
    await capture(page, "30-outward-repair-detail.png");

    await resetAndLogin(page);
    await gotoSrs(page, "/outward/icl-generation");
    await capture(page, "31-outward-hold-for-icl-generation.png");
    await runOutwardServiceTick(page);
    await capture(page, "32-outward-icl-generation.png");
    await gotoSrs(page, "/outward/forward-upload-response");
    await capture(page, "33-outward-forward-upload-response.png");
    await fillIfReady(page, "File-level Remarks", "Exception response captured for SRS");
    await selectLastIfReady(page, "Rejected");
    await capture(page, "34-outward-forward-upload-response-exception.png");
    await clickFirst(page, /Reject All/i);
    await gotoSrs(page, "/outward/nak-repair");
    await capture(page, "35-outward-nak-repair.png");

    await stageOutwardResponse(page);
    await clickFirst(page, /Accept All/i);
    await gotoSrs(page, "/outward/wait-for-return");
    await capture(page, "36-outward-wait-for-return.png");
    await clickFirst(page, /Simulate CBM Return Download: Accepted/i);
    await gotoSrs(page, "/outward/credit-posting");
    await runOutwardServiceTick(page);
    await capture(page, "37-outward-credit-posting.png");
    await gotoSrs(page, "/outward/reports");
    await capture(page, "38-outward-reports-search.png");
    await selectLabelIfReady(page, "Select Report *", { label: "Outward Summary Report" });
    await clickFirst(page, /^Generate$/);
    await capture(page, "39-outward-report-output.png");

    await resetAndLogin(page);
    await gotoSrs(page, "/inward/dashboard");
    await capture(page, "50-inward-dashboard.png");
    await gotoSrs(page, "/inward/upload-icl");
    await capture(page, "51-inward-upload-icl.png");
    await clickFirst(page, /Generate Sample Forward Download File/i);
    await clickFirst(page, /Run Upload Service/i);
    await capture(page, "52-inward-upload-icl-imported-file.png");

    await gotoSrs(page, "/inward/technical-verification");
    await capture(page, "53-inward-technical-verification-search.png");
    await capture(page, "54-inward-technical-verification-detail.png");
    await clickFirst(page, /^Reject$/);
    await capture(page, "55-inward-technical-verification-reject-modal.png");
    await clickFirst(page, /^No$/);
    await gotoSrs(page, "/inward/debit-posting");
    await capture(page, "56-inward-debit-posting.png");
    await gotoSrs(page, "/inward/referral");
    await capture(page, "57-inward-referral-search.png");
    await capture(page, "58-inward-referral-detail.png");
    await gotoSrs(page, "/inward/manual-return-maker");
    await capture(page, "59-inward-manual-return-maker-search.png");
    await capture(page, "60-inward-manual-return-maker-detail.png");

    await launchScenario(page, "F");
    await gotoSrs(page, "/inward/manual-return-checker");
    await capture(page, "61-inward-manual-return-checker-search.png");
    await capture(page, "62-inward-manual-return-checker-detail.png");
    await clickFirst(page, /^Accept$/);
    await clickFirst(page, /^Yes$/);
    await gotoSrs(page, "/inward/return-icl-generation");
    await capture(page, "63-inward-return-icl-creation.png");
    await clickFirst(page, /Run Return ICL Service/i);
    await gotoSrs(page, "/inward/return-upload-response");
    await capture(page, "64-inward-return-upload-response.png");
    await fillIfReady(page, "File-level Remarks", "Exception response captured for SRS");
    await selectLastIfReady(page, "Rejected");
    await capture(page, "65-inward-return-upload-response-exception.png");
    await clickFirst(page, /Reject All/i);
    await gotoSrs(page, "/inward/nak-repair");
    await capture(page, "66-inward-nak-repair.png");

    await stageReturnUploadResponse(page);
    await clickFirst(page, /Accept All/i);
    await gotoSrs(page, "/inward/charge-posting");
    await clickFirst(page, /Run Charge Posting/i);
    await capture(page, "67-inward-charge-posting.png");
    await gotoSrs(page, "/inward/reports");
    await capture(page, "68-inward-reports-search.png");
    await selectLabelIfReady(page, "Select Report *", { label: "Inward Summary Report" });
    await clickFirst(page, /^Generate$/);
    await capture(page, "69-inward-report-output.png");
  });
});
