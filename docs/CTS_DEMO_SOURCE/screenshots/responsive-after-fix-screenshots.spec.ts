import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.join(process.cwd(), "docs", "responsive-after-fix-screenshots");

const captures = [
  { name: "admin-dashboard", route: "/admin?hideDemoLauncher=true" },
  { name: "admin-settings", route: "/admin?hideDemoLauncher=true", click: "Settings" },
  { name: "outward-dashboard", route: "/outward/dashboard?hideDemoLauncher=true" },
  { name: "outward-scanning", route: "/outward/scanning?hideDemoLauncher=true" },
  { name: "outward-authorization", route: "/outward/authorization?hideDemoLauncher=true" },
  { name: "inward-dashboard", route: "/inward/dashboard?hideDemoLauncher=true" },
  { name: "technical-verification", route: "/inward/technical-verification?hideDemoLauncher=true" },
  { name: "reports", route: "/outward/reports?hideDemoLauncher=true" },
  { name: "search", route: "/search?hideDemoLauncher=true" },
  { name: "architecture", route: "/architecture?hideDemoLauncher=true" }
];

test("capture responsive after-fix screenshots", async ({ page }) => {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/login");
  await page.getByLabel("Username").fill("admin1");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/outward\/dashboard/);

  for (const capture of captures) {
    await page.goto(capture.route);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "1";
    });
    if (capture.click) {
      await page.getByRole("button", { name: capture.click }).click();
    }
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.screenshot({ fullPage: true, path: path.join(outputDir, `${capture.name}.png`) });
  }
});
