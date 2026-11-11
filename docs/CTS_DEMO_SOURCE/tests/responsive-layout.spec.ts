import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const routes = [
  "/login",
  "/change-password",
  "/search",
  "/admin",
  "/architecture",
  "/outward/dashboard",
  "/outward/scanning",
  "/outward/authorization",
  "/outward/repair",
  "/outward/hold-for-icl-generation",
  "/outward/icl-generation",
  "/outward/forward-upload-response",
  "/outward/nak-repair",
  "/outward/wait-for-return",
  "/outward/credit-posting",
  "/outward/reports",
  "/inward/dashboard",
  "/inward/upload-icl",
  "/inward/technical-verification",
  "/inward/debit-posting",
  "/inward/referral",
  "/inward/manual-return-maker",
  "/inward/manual-return-checker",
  "/inward/return-icl-generation",
  "/inward/return-upload-response",
  "/inward/nak-repair",
  "/inward/charge-posting",
  "/inward/reports"
];

const viewportMatrix = [
  { height: 768, label: "1366x768", width: 1366, zoomLevels: [0.9, 1, 1.25] },
  { height: 900, label: "1440x900", width: 1440, zoomLevels: [1] },
  { height: 1080, label: "1920x1080", width: 1920, zoomLevels: [1] }
];
const failureDir = path.join(process.cwd(), "test-results", "responsive");

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill("admin1");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/outward\/dashboard/);
}

function routeName(route: string, zoom: number, viewport: string) {
  return `${route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-") || "login"}-${viewport}-zoom-${String(Math.round(zoom * 100))}`;
}

test.describe("responsive layout audit", () => {
  test.beforeAll(() => {
    fs.mkdirSync(failureDir, { recursive: true });
  });

  for (const viewport of viewportMatrix) {
    for (const zoom of viewport.zoomLevels) {
      test(`major pages are readable at ${viewport.label}, zoom ${Math.round(zoom * 100)}%`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await loginAsAdmin(page);
        const failures: string[] = [];

        for (const route of routes) {
          await page.goto(`${route}${route.includes("?") ? "&" : "?"}hideDemoLauncher=true`);
          await page.evaluate((level) => {
            document.documentElement.style.zoom = String(level);
          }, zoom);
          await page.waitForLoadState("networkidle").catch(() => undefined);

        const result = await page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;
          const overflow = document.documentElement.scrollWidth - viewportWidth;
          const visibleElements = Array.from(document.querySelectorAll<HTMLElement>("body *")).filter((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
          });

          const suspiciousText = visibleElements
            .map((element) => {
              const text = (element.innerText || "").trim().replace(/\s+/g, " ");
              const rect = element.getBoundingClientRect();
              const lineHeight = Number.parseFloat(window.getComputedStyle(element).lineHeight || "0") || 16;
              const estimatedLines = rect.height / lineHeight;
              return { selector: element.tagName.toLowerCase(), text, width: rect.width, height: rect.height, estimatedLines };
            })
            .filter((item) => item.text.length > 3 && item.text.length < 80 && item.width < 30 && item.height > 60 && item.estimatedLines > 3)
            .slice(0, 8);

          const narrowCards = visibleElements
            .map((element) => {
              const className = String(element.className || "");
              const rect = element.getBoundingClientRect();
              const text = (element.innerText || "").trim().replace(/\s+/g, " ");
              return { selector: element.tagName.toLowerCase(), className, text, width: rect.width };
            })
            .filter((item) => {
              const isCard = /enterprise-panel|shadow-enterprise|rounded-xl|responsive-card|FieldGroup/i.test(item.className);
              const hasReadableText = item.text.length > 12;
              return isCard && hasReadableText && item.width > 0 && item.width < 240;
            })
            .slice(0, 8);

          const offscreenButtons = visibleElements
            .filter((element) => element.matches("button, a[href], [role='button']"))
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const text = (element.innerText || element.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
              return { selector: element.tagName.toLowerCase(), text, left: rect.left, right: rect.right };
            })
            .filter((item) => item.right > viewportWidth + 2 || item.left < -2)
            .slice(0, 8);

          return { overflow, suspiciousText, narrowCards, offscreenButtons };
        });

        const routeFailures: string[] = [];
        if (result.overflow > 2) routeFailures.push(`horizontal overflow ${result.overflow}px`);
        if (result.suspiciousText.length) routeFailures.push(`suspicious vertical text ${JSON.stringify(result.suspiciousText)}`);
        if (result.narrowCards.length) routeFailures.push(`cards below readable width ${JSON.stringify(result.narrowCards)}`);
        if (result.offscreenButtons.length) routeFailures.push(`buttons outside viewport ${JSON.stringify(result.offscreenButtons)}`);

        if (routeFailures.length) {
          const name = routeName(route, zoom, viewport.label);
          await page.screenshot({ fullPage: true, path: path.join(failureDir, `${name}.png`) });
          failures.push(`${route} at ${viewport.label}, ${Math.round(zoom * 100)}%: ${routeFailures.join("; ")}`);
        }
        }

        expect(failures).toEqual([]);
      });
    }
  }
});
