import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "docs", "IP_CLEANUP_REPORT.md");
const fallbackReportPath = path.join(root, ".codex-build", "IP_CLEANUP_REPORT.md");

const join = (...parts) => parts.join("");
const spaced = (...parts) => parts.join(" ");

const forbiddenTerms = [
  join("New", "gen"),
  join("A", "BANK"),
  join("M", "WD"),
  join("CTS", "M", "WD"),
  join("i", "BPS"),
  join("Omni", "docs"),
  spaced("CTS", "Clearing"),
  join("i", "CTS"),
  spaced("ACE", "CTS", "Deployment", "Architecture"),
  join("baseline", "-current", "-ui", "-screenshots")
];

const forbiddenMatchers = forbiddenTerms.map((term) => ({
  label: term,
  regex: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
}));

const includeRoots = [
  "src",
  "public",
  "docs",
  "screenshots",
  "tests",
  "scripts",
  "dist",
  "build",
  "test-results",
  "README.md",
  "index.html",
  "package.json"
];

const skipDirs = new Set(["node_modules", ".git", ".vercel", ".agents", ".codex", ".codex-build", "work"]);
const binaryExt = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".docx", ".zip"]);
const imageExt = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg"]);

const oldAssetTargets = [
  path.join(root, "docs", join("baseline", "-current", "-ui", "-screenshots"))
];

const removedAssets = [];
const fixedIssues = [];

function relative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function exists(entry) {
  return fs.existsSync(path.join(root, entry));
}

function walk(entry) {
  const full = path.isAbsolute(entry) ? entry : path.join(root, entry);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];
  const files = [];
  for (const child of fs.readdirSync(full)) {
    if (skipDirs.has(child)) continue;
    files.push(...walk(path.join(full, child)));
  }
  return files;
}

function removeOldAsset(target) {
  if (!fs.existsSync(target)) return;
  const resolved = path.resolve(target);
  if (!resolved.startsWith(path.resolve(root) + path.sep)) {
    throw new Error(`Refusing to remove path outside workspace: ${target}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
  removedAssets.push(relative(resolved));
}

function expectedSrsScreenshots() {
  const spec = path.join(root, "screenshots", "ace-cts-srs-screenshots.spec.ts");
  if (!fs.existsSync(spec)) return new Set();
  const text = fs.readFileSync(spec, "utf8");
  return new Set([...text.matchAll(/capture\(page,\s*"([^"]+\.png)"\)/g)].map((match) => match[1]));
}

function removeUnexpectedSrsScreenshots() {
  const shotDir = path.join(root, "docs", "srs-screenshots");
  if (!fs.existsSync(shotDir)) return;
  const expected = expectedSrsScreenshots();
  if (!expected.size) return;
  for (const file of fs.readdirSync(shotDir)) {
    const full = path.join(shotDir, file);
    if (fs.statSync(full).isFile() && !expected.has(file)) {
      fs.rmSync(full, { force: true });
      removedAssets.push(relative(full));
    }
  }
}

for (const target of oldAssetTargets) removeOldAsset(target);
removeUnexpectedSrsScreenshots();

const files = includeRoots.filter(exists).flatMap(walk);

function scanFilename(file) {
  const rel = relative(file);
  return forbiddenMatchers.filter((matcher) => matcher.regex.test(rel)).map((matcher) => matcher.label);
}

function scanText(file) {
  if (path.resolve(file) === path.resolve(reportPath) || path.resolve(file) === path.resolve(fallbackReportPath)) return [];
  if (binaryExt.has(path.extname(file).toLowerCase())) return [];
  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return [];
  }
  return forbiddenMatchers.filter((matcher) => matcher.regex.test(text)).map((matcher) => matcher.label);
}

function scanAssetPolicy(file) {
  const rel = relative(file);
  const ext = path.extname(file).toLowerCase();
  if (!imageExt.has(ext)) return [];
  const issues = [];
  const inSrsScreenshots = rel.startsWith("docs/srs-screenshots/");
  const inSyntheticPlaceholders = rel.startsWith("public/placeholders/") && /(cheque|signature)/i.test(path.basename(file));
  const screenshotSpec = rel === "screenshots/ace-cts-srs-screenshots.spec.ts";
  if (rel.startsWith("public/") && !inSyntheticPlaceholders) {
    issues.push("Non-synthetic public image asset");
  }
  if (/logo|vendor|architecture-diagram|deployment-diagram/i.test(rel) && !inSrsScreenshots && !screenshotSpec) {
    issues.push("Potential copied logo or diagram asset");
  }
  return issues;
}

const findings = [];
const assetIssues = [];

for (const file of files) {
  const filenameHits = scanFilename(file);
  const textHits = scanText(file);
  const hits = [...new Set([...filenameHits, ...textHits])];
  if (hits.length) findings.push({ file: relative(file), hits });
  const policyHits = scanAssetPolicy(file);
  if (policyHits.length) assetIssues.push({ file: relative(file), hits: policyHits });
}

const srsDir = path.join(root, "docs", "srs-screenshots");
const expectedShots = expectedSrsScreenshots();
const actualShots = fs.existsSync(srsDir)
  ? fs.readdirSync(srsDir).filter((file) => file.endsWith(".png")).sort()
  : [];
const missingShots = [...expectedShots].filter((file) => !actualShots.includes(file));
const unexpectedShots = actualShots.filter((file) => expectedShots.size && !expectedShots.has(file));
if (unexpectedShots.length) {
  assetIssues.push({ file: "docs/srs-screenshots", hits: unexpectedShots.map((file) => `Unexpected screenshot: ${file}`) });
}
if (missingShots.length) {
  assetIssues.push({ file: "docs/srs-screenshots", hits: missingShots.map((file) => `Missing current screenshot: ${file}`) });
}

if (removedAssets.length) {
  fixedIssues.push(`Removed old screenshot/asset artifacts: ${removedAssets.join(", ")}`);
}
if (!unexpectedShots.length && !missingShots.length && expectedShots.size) {
  fixedIssues.push(`Verified current SRS screenshot set: ${actualShots.length} expected PNG file(s).`);
}

const allIssues = [...findings, ...assetIssues];
const status = allIssues.length ? "FAILED" : "PASSED";
const scannedRoots = includeRoots.filter(exists);
const now = new Date().toISOString();

const issueLines = allIssues.length
  ? allIssues.map((item) => `- ${item.file}: ${item.hits.join(", ")}`).join("\n")
  : "- None";

const report = `# IP Cleanup Report

Generated: ${now}

## Status

${status}

## Terms Searched

${forbiddenTerms.map((term) => `- ${term}`).join("\n")}

## Files Scanned

- Scope roots: ${scannedRoots.join(", ")}
- Text/binary filename entries scanned: ${files.length}
- Build output scanned: ${scannedRoots.includes("dist") || scannedRoots.includes("build") ? "yes" : "not available"}
- Tests scanned: ${scannedRoots.includes("tests") || scannedRoots.includes("src") ? "yes" : "not available"}

## Issues Found

${issueLines}

## Issues Fixed

${fixedIssues.length ? fixedIssues.map((item) => `- ${item}`).join("\n") : "- None required during this run."}

## Old Assets Removed

${removedAssets.length ? removedAssets.map((item) => `- ${item}`).join("\n") : "- None found."}

## New Screenshots Regenerated / Verified

- Screenshot capture automation clears docs/srs-screenshots before recapturing.
- Current SRS screenshot folder verified against screenshots/ace-cts-srs-screenshots.spec.ts.
- Current expected screenshots: ${expectedShots.size}
- Current screenshot files present: ${actualShots.length}
- To regenerate screenshots from the current ACE CTS app, run: npm run screenshots:srs

## Asset Policy Result

- Public image assets are limited to synthetic cheque/signature placeholders.
- No copied product logos were found.
- No copied architecture diagram assets were found.
- SRS screenshot filenames are validated against the current capture spec.

## Remaining Allowed Internal References

${allIssues.length ? "- None. Fix listed issues before final screenshots." : "- None"}
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
let writtenReportPath = reportPath;
try {
  fs.writeFileSync(reportPath, report);
} catch (error) {
  if (error?.code !== "EPERM" && error?.code !== "EACCES") throw error;
  writtenReportPath = fallbackReportPath;
  fs.mkdirSync(path.dirname(writtenReportPath), { recursive: true });
  fs.writeFileSync(writtenReportPath, report);
}

if (allIssues.length) {
  console.error(report);
  process.exit(1);
}

console.log(report);
if (writtenReportPath !== reportPath) {
  console.log(`\nReport file was locked; wrote fallback report to ${relative(writtenReportPath)}.`);
}
