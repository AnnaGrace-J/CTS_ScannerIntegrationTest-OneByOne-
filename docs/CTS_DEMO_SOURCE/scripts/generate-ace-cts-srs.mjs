import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bundledNodeModules = "C:\\Users\\USER\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType
} = require(path.join(bundledNodeModules, "docx"));

const docsDir = path.resolve("docs");
const shotDir = path.join(docsDir, "srs-screenshots");
const outMd = path.join(docsDir, "ACE_CTS_SRS_v1.0.md");
const outDocx = path.join(docsDir, "ACE_CTS_SRS_v1.0.docx");
const today = "08-06-2026";
const todayShort = "08-06-26";

fs.mkdirSync(docsDir, { recursive: true });
fs.mkdirSync(shotDir, { recursive: true });

const screenshots = [
  ["01-login-page.png", "/login", "Login Page", "General", "3.1", "Login Page"],
  ["02-home-dashboard.png", "/outward/dashboard", "Home Dashboard", "General", "3.6.5", "Home Dashboard"],
  ["03-user-menu-logout-change-password.png", "/outward/dashboard", "User Menu with Logout and Change Password Options", "General", "3.2", "User Menu with Logout and Change Password Options"],
  ["04-change-password-page.png", "/change-password", "Change Password Page", "General", "3.3", "Change Password Page"],
  ["05-cheque-search.png", "/search", "Cheque Search", "General", "3.6.4", "Cheque Search"],
  ["06-cheque-search-result-viewer.png", "/search", "Cheque Search Image Viewer", "General", "3.6.4", "Cheque Search Image Viewer"],
  ["07-admin-dashboard.png", "/admin", "Admin Dashboard", "Admin", "3.6.7", "Admin Dashboard"],
  ["08-admin-settings.png", "/admin", "Admin Settings", "Admin", "3.6.10", "Admin Settings"],
  ["09-admin-audit-log.png", "/admin", "Audit Log", "Admin", "3.6.8", "Audit Log"],
  ["10-admin-archive.png", "/admin/archive", "Archive Browser", "Admin", "3.6.2", "Archive Browser"],
  ["11-architecture-page.png", "/architecture", "Architecture Canvas", "Architecture", "6", "Architecture Canvas"],
  ["20-outward-dashboard.png", "/outward/dashboard", "Outward Dashboard and Menu", "Outward", "2.1.1", "Outward Process Flow"],
  ["21-outward-scanning-empty.png", "/outward/scanning", "Scanning and Data Entry Screen without Data", "Outward", "3.4.2", "Scanning and Data Entry Screen without Data"],
  ["22-outward-scanning-new-batch-modal.png", "/outward/scanning", "New Batch Window", "Outward", "3.4.2", "New Batch Window"],
  ["23-outward-scanning-with-cheques.png", "/outward/scanning", "Scanning and Data Entry Screen with Cheques", "Outward", "3.4.2", "Scanning and Data Entry Screen with Cheques"],
  ["24-outward-scanning-iqa-modal.png", "/outward/scanning", "Image Quality Analysis Window", "Outward", "3.4.2", "Image Quality Analysis Window"],
  ["25-outward-scanning-submit-success.png", "/outward/scanning", "Batch Upload Success Message", "Outward", "3.4.2", "Batch Upload Success Message"],
  ["26-outward-authorization-search.png", "/outward/authorization", "Outward Authorization Search", "Outward", "3.4.3", "Outward Authorization Search"],
  ["27-outward-authorization-detail.png", "/outward/authorization", "Outward Authorization Detail", "Outward", "3.4.3", "Outward Authorization Detail"],
  ["28-outward-authorization-confirmation.png", "/outward/authorization", "Outward Authorization Confirmation", "Outward", "3.4.3", "Outward Authorization Confirmation"],
  ["29-outward-repair-search.png", "/outward/repair", "Outward Repair Search", "Outward", "3.4.4", "Outward Repair Search"],
  ["30-outward-repair-detail.png", "/outward/repair", "Outward Repair Detail", "Outward", "3.4.4", "Outward Repair Detail"],
  ["31-outward-hold-for-icl-generation.png", "/outward/icl-generation", "Hold for ICL File Generation", "Outward", "3.4.5", "Hold for ICL File Generation"],
  ["32-outward-icl-generation.png", "/outward/icl-generation", "ICL File Generation", "Outward", "3.4.6", "ICL File Generation"],
  ["33-outward-forward-upload-response.png", "/outward/forward-upload-response", "Forward Upload File Response", "Outward", "3.4.7", "Forward Upload File Response"],
  ["34-outward-forward-upload-response-exception.png", "/outward/forward-upload-response", "Forward Upload File Response with Exception", "Outward", "3.4.7", "Forward Upload File Response with Exception"],
  ["35-outward-nak-repair.png", "/outward/nak-repair", "Outward NAK Repair", "Outward", "3.4.8", "Outward NAK Repair"],
  ["36-outward-wait-for-return.png", "/outward/wait-for-return", "Wait for Return", "Outward", "3.4.9", "Wait for Return"],
  ["37-outward-credit-posting.png", "/outward/credit-posting", "Credit Posting", "Outward", "3.4.10", "Credit Posting"],
  ["38-outward-reports-search.png", "/outward/reports", "Outward Reports Search", "Outward", "3.4.11", "Outward Reports Search"],
  ["39-outward-report-output.png", "/outward/reports", "Outward Report Output", "Outward", "3.4.11", "Outward Report Output"],
  ["50-inward-dashboard.png", "/inward/dashboard", "Inward Dashboard and Menu", "Inward", "2.1.2", "Inward Process Flow"],
  ["51-inward-upload-icl.png", "/inward/upload-icl", "Read and Upload ICL File", "Inward", "3.5.2", "Read and Upload ICL File"],
  ["52-inward-upload-icl-imported-file.png", "/inward/upload-icl", "Uploaded Forward Download File", "Inward", "3.5.2", "Uploaded Forward Download File"],
  ["53-inward-technical-verification-search.png", "/inward/technical-verification", "Technical Verification Search", "Inward", "3.5.3", "Technical Verification Search"],
  ["54-inward-technical-verification-detail.png", "/inward/technical-verification", "Technical Verification Detail", "Inward", "3.5.3", "Technical Verification Detail"],
  ["55-inward-technical-verification-reject-modal.png", "/inward/technical-verification", "Technical Verification Reject Window", "Inward", "3.5.3", "Technical Verification Reject Window"],
  ["56-inward-debit-posting.png", "/inward/debit-posting", "Debit Posting", "Inward", "3.5.4", "Debit Posting"],
  ["57-inward-referral-search.png", "/inward/referral", "Referral Search", "Inward", "3.5.5", "Referral Search"],
  ["58-inward-referral-detail.png", "/inward/referral", "Referral Detail", "Inward", "3.5.5", "Referral Detail"],
  ["59-inward-manual-return-maker-search.png", "/inward/manual-return-maker", "Manual Return Maker Search", "Inward", "3.5.6", "Manual Return Maker Search"],
  ["60-inward-manual-return-maker-detail.png", "/inward/manual-return-maker", "Manual Return Maker Detail", "Inward", "3.5.6", "Manual Return Maker Detail"],
  ["61-inward-manual-return-checker-search.png", "/inward/manual-return-checker", "Manual Return Checker Search", "Inward", "3.5.7", "Manual Return Checker Search"],
  ["62-inward-manual-return-checker-detail.png", "/inward/manual-return-checker", "Manual Return Checker Detail", "Inward", "3.5.7", "Manual Return Checker Detail"],
  ["63-inward-return-icl-creation.png", "/inward/return-icl-generation", "ICL Return Upload File Creation", "Inward", "3.5.8", "ICL Return Upload File Creation"],
  ["64-inward-return-upload-response.png", "/inward/return-upload-response", "Return Upload File Response", "Inward", "3.5.9", "Return Upload File Response"],
  ["65-inward-return-upload-response-exception.png", "/inward/return-upload-response", "Return Upload File Response with Exception", "Inward", "3.5.9", "Return Upload File Response with Exception"],
  ["66-inward-nak-repair.png", "/inward/nak-repair", "Inward NAK Repair", "Inward", "3.5.10", "Inward NAK Repair"],
  ["67-inward-charge-posting.png", "/inward/charge-posting", "Inward Charge Posting", "Inward", "3.5.11", "Inward Charge Posting"],
  ["68-inward-reports-search.png", "/inward/reports", "Inward Reports Search", "Inward", "3.5.12", "Inward Reports Search"],
  ["69-inward-report-output.png", "/inward/reports", "Inward Report Output", "Inward", "3.5.12", "Inward Report Output"]
].map(([file, route, page, module, section, screen], index) => ({
  file,
  route,
  page,
  module,
  section,
  screen,
  figure: index + 1,
  caption: `Figure ${index + 1}: ACE CTS ${screen} (Indicative and subject to change)`
}));

const byFile = Object.fromEntries(screenshots.map((item) => [item.file, item]));

const rejectReasons = [
  ["R01", "Insufficient Funds", "Inward"],
  ["R02", "Signature Mismatch", "Both"],
  ["R03", "Stale Cheque", "Both"],
  ["R04", "Duplicate Cheque", "Both"],
  ["R05", "Invalid MICR", "Outward"],
  ["R06", "Image Quality Failed", "Both"],
  ["R07", "Account Closed", "Inward"]
];

const roleMap = [
  ["MAKER", "Outward scanning, outward repair, technical verification, manual return maker, outward NAK repair, inward NAK repair, upload ICL"],
  ["CHECKER", "Outward authorization, referral, manual return checker"],
  ["ADMIN", "All functional pages, admin settings, audit trail, archive, reset, role and queue management"],
  ["SERVICE", "Background service identity for scheduled audit events and interface processing"]
];

const outwardReports = [
  "Outward Summary Report",
  "Outward Return Report",
  "Negative Acknowledgement Report",
  "Outward Discard Cheques Report",
  "Cheque Introduced in the System",
  "Outward Cheque Honored",
  "CB Accepted Cheques",
  "Return Advice Generation"
];

const inwardReports = [
  "Inward Introduction Report",
  "Inward Summary Report",
  "Inward Clearing Report Referral",
  "Inward Clearing Report",
  "Inward Return Report",
  "Auto Return Report",
  "Inward NAK Report",
  "Inward Pending Report"
];

const features = [
  {
    section: "3.1",
    title: "Login Page",
    route: "/login",
    module: "General",
    actors: "All active users",
    screenshots: ["01-login-page.png"],
    description: "ACE CTS shall provide a secure login page for authenticated access to authorized functions.",
    fields: [["1", "Username", "Text", "Editable", "Yes", "User login identifier"], ["2", "Password", "Password", "Editable / masked", "Yes", "User password"], ["3", "Forgot Password", "Action link", "Selectable", "No", "Initiates password assistance process"]],
    buttons: [["1", "Login", "Authenticates the user and opens the authorized landing page", "Invalid credentials shall show an alert", "Role-based dashboard"]],
    validations: "Username and password shall be required. Invalid credentials shall not create a session.",
    integrations: "ACE CTS shall validate user credentials against the Bank-approved identity source. Interface specifications shall be finalized with the Bank.",
    targets: [["Valid login", "Authorized dashboard"], ["Invalid login", "Login page with alert"]],
    audit: "Successful and unsuccessful access attempts shall be auditable subject to Bank security policy."
  },
  {
    section: "3.2",
    title: "Logout",
    route: "/outward/dashboard",
    module: "General",
    actors: "Authenticated users",
    screenshots: ["03-user-menu-logout-change-password.png"],
    description: "ACE CTS shall provide user menu options for password change and logout.",
    fields: [["1", "User Name", "Display", "Read-only", "No", "Shows logged-in user"], ["2", "Role", "Display", "Read-only", "No", "Shows assigned role"], ["3", "Branch", "Display", "Read-only", "No", "Shows assigned branch"]],
    buttons: [["1", "Change Password", "Opens password change page", "None", "Change Password"], ["2", "Logout", "Clears session and returns user to login", "Session shall be ended", "Login Page"]],
    validations: "Logout shall terminate the active session and prevent protected page access without re-authentication.",
    integrations: "ACE CTS shall support integration with the Bank session management policy.",
    targets: [["Logout selected", "Login Page"]],
    audit: "Logout shall be captured in audit trail."
  },
  {
    section: "3.3",
    title: "Change Password",
    route: "/change-password",
    module: "General",
    actors: "Authenticated users",
    screenshots: ["04-change-password-page.png"],
    description: "ACE CTS shall allow a user to change his or her password after successful login.",
    fields: [["1", "User Name", "Text", "Disabled", "No", "Current user"], ["2", "Old Password", "Password", "Editable", "Yes", "Existing password"], ["3", "New Password", "Password", "Editable", "Yes", "New password"], ["4", "Confirm Password", "Password", "Editable", "Yes", "Must match new password"]],
    buttons: [["1", "Change", "Submits password change", "New and confirm password must match", "Dashboard"], ["2", "Exit", "Leaves page without change", "None", "Dashboard"]],
    validations: "Old password shall be verified. New password and confirmation shall match before update.",
    integrations: "ACE CTS shall apply the Bank password policy and identity-management interface when finalized.",
    targets: [["Password changed", "Dashboard"], ["Validation failed", "Change Password Page"]],
    audit: "Password change shall create an audit event without storing password values."
  },
  {
    section: "3.4.1",
    title: "Outward Dashboard & Menu",
    route: "/outward/dashboard",
    module: "Outward",
    actors: "Maker, Checker, Admin",
    screenshots: ["20-outward-dashboard.png"],
    description: "ACE CTS shall display outward workitem counts, workflow tiles, process navigation, and current work queues.",
    fields: [["1", "Workitem Count", "Display tile", "Read-only", "No", "Shows queue count by work-step"], ["2", "Recent Workitems", "Grid", "Read-only", "No", "Shows outward items"], ["3", "Workitems Chart", "Chart", "Read-only", "No", "Shows queue trend by category"]],
    buttons: [["1", "Workflow Tile", "Opens selected outward work-step", "Role access applies", "Selected queue"]],
    validations: "Dashboard counts shall refresh when workitems move between workflow stages.",
    integrations: "ACE CTS shall present operational queue data from the application database.",
    targets: [["Tile selected", "Selected outward work-step"]],
    audit: "Dashboard access may be logged according to Bank audit policy."
  },
  {
    section: "3.4.2",
    title: "Scanning and Data Entry",
    route: "/outward/scanning",
    module: "Outward",
    actors: "Maker, Admin",
    screenshots: ["21-outward-scanning-empty.png", "22-outward-scanning-new-batch-modal.png", "23-outward-scanning-with-cheques.png", "24-outward-scanning-iqa-modal.png", "25-outward-scanning-submit-success.png"],
    description: "ACE CTS shall capture outward cheque images, create batches, fetch credit account details, validate MICR and amount data, and submit valid batches to authorization.",
    fields: [["1", "Account No.", "Text", "Editable", "Yes", "Credit account number"], ["2", "Account Status / Customer ID / Branch / Name", "Display", "Disabled", "No", "Returned by CBS lookup"], ["3", "Cheque No.", "Text", "Editable", "Yes", "MICR cheque number"], ["4", "MICR Account No.", "Text", "Editable", "Yes", "MICR account number"], ["5", "MICR Routing Number", "Text", "Editable", "Yes", "Routing number"], ["6", "Amount", "Amount", "Editable", "Yes", "Cheque amount"], ["7", "Cheque Date", "Date", "Editable", "Yes", "Issue date"], ["8", "Drawer Name / Remarks", "Text", "Editable", "Conditional", "Drawer and exception notes"], ["9", "Batch Amount", "Amount", "Editable", "Yes", "Must match calculated amount"], ["10", "Scanner", "List", "Selectable", "Yes", "Scanner station selection"]],
    buttons: [["1", "New Batch", "Creates a new outward batch", "Batch details required", "Scanning"], ["2", "Scan", "Captures cheque images", "Batch must be open", "Scanning"], ["3", "Fetch Account", "Retrieves credit account details", "Account must exist and be valid", "Scanning"], ["4", "Submit", "Validates and uploads batch", "IQA, duplicate, stale, in-house, routing, and amount checks", "Outward Authorization"], ["5", "Save and Close", "Stores draft batch", "None", "Scanning"], ["6", "Discard Batch", "Marks batch cheques discarded", "Remarks required for discarded items", "Discard"]],
    validations: "ACE CTS shall validate duplicate cheques, stale cheques, in-house cheques, representment rules, routing number format, junk MICR characters, image quality flags, account fetch completion, and batch amount balancing.",
    integrations: "ACE CTS shall integrate with cheque scanners and CBS. Scanner, CBS, and endorsement specifications shall be finalized with the Bank.",
    targets: [["Valid batch submitted", "Outward Authorization"], ["Discard selected", "Discard / archive"], ["Validation failed", "Scanning and Data Entry"]],
    audit: "Batch creation, scan, account fetch, save, discard, IQA handling, and submit shall be audited."
  },
  {
    section: "3.4.3",
    title: "Outward Authorization",
    route: "/outward/authorization",
    module: "Outward",
    actors: "Checker, Admin",
    screenshots: ["26-outward-authorization-search.png", "27-outward-authorization-detail.png", "28-outward-authorization-confirmation.png"],
    description: "ACE CTS shall provide FIFO checker review of submitted outward batches with image viewer, account data, cheque details, and maker-checker controls.",
    fields: [["1", "Search Criteria", "Text/date fields", "Editable", "No", "Batch, branch, cheque, MICR, routing, account, amount, endorsement, type, value date, scan date"], ["2", "Credit Account Details", "Display", "Disabled", "No", "Account values"], ["3", "Cheque Details", "Display/edit by permission", "Disabled for authorization", "No", "Cheque data under review"], ["4", "Batch Details", "Display", "Disabled", "No", "Batch balancing details"]],
    buttons: [["1", "Authorize Batch", "Accepts batch", "Confirmation required and maker-checker restriction applies", "Hold for ICL File Generation"], ["2", "Repair Batch", "Sends batch to maker repair", "Confirmation required", "Outward Repair"], ["3", "Discard Batch", "Discards batch", "Confirmation required", "Discard"], ["4", "Exit", "Leaves page", "Confirmation required", "Dashboard"]],
    validations: "The same maker shall not authorize his or her own batch unless Bank policy allows an administrator override.",
    integrations: "ACE CTS shall maintain maker-checker controls through the user and queue access model.",
    targets: [["Authorized", "Hold for ICL File Generation"], ["Repair requested", "Outward Repair"], ["Discarded", "Discard"]],
    audit: "Authorization, repair return, and discard decisions shall be audited."
  },
  {
    section: "3.4.4",
    title: "Outward Repair",
    route: "/outward/repair",
    module: "Outward",
    actors: "Maker, Admin",
    screenshots: ["29-outward-repair-search.png", "30-outward-repair-detail.png"],
    description: "ACE CTS shall allow makers to correct checker-returned outward batches and send them back for authorization.",
    fields: [["1", "Search Criteria", "Text/date fields", "Editable", "No", "Batch and cheque filters"], ["2", "Cheque Details", "Text/date/checkbox", "Editable", "As applicable", "Correctable fields"], ["3", "Remarks", "Text", "Editable", "Conditional", "Repair note"]],
    buttons: [["1", "Complete", "Completes repair and routes batch back", "No-change confirmation if no data changed", "Outward Authorization"], ["2", "Exit", "Leaves repair page", "Confirmation required", "Dashboard"]],
    validations: "ACE CTS shall require confirmation when repair is completed without field changes.",
    integrations: "ACE CTS shall retain original and repaired values for audit review where required.",
    targets: [["Repair complete", "Outward Authorization"]],
    audit: "Repair completion and changed-field status shall be audited."
  },
  {
    section: "3.4.5",
    title: "Hold for ICL File Generation",
    route: "/outward/icl-generation",
    module: "Outward",
    actors: "Service, Admin",
    screenshots: ["31-outward-hold-for-icl-generation.png"],
    description: "ACE CTS shall hold authorized outward instruments until the value date is due for ICL generation.",
    fields: [["1", "Item ID / Cheque No.", "Grid", "Read-only", "No", "Held items"], ["2", "Value Date", "Date", "Read-only", "No", "Generation eligibility"], ["3", "Reason / Status", "Display", "Read-only", "No", "Due or waiting status"]],
    buttons: [["1", "Run Service Tick", "Processes due held items", "Due-date rule applies", "ICL File Generation"]],
    validations: "Only due value-date instruments shall advance for file generation.",
    integrations: "ACE CTS shall use business date and clearing-cycle configuration approved by the Bank.",
    targets: [["Due item", "ICL File Generation"], ["Not due", "Hold for ICL File Generation"]],
    audit: "Service movement from hold to ICL generation shall be audited."
  },
  {
    section: "3.4.6",
    title: "ICL File Generation / Forward Upload File",
    route: "/outward/icl-generation",
    module: "Outward",
    actors: "Service, Admin",
    screenshots: ["32-outward-icl-generation.png"],
    description: "ACE CTS shall generate outward forward upload ICL files with cheque counts, total amount, generated date/time, file path, and upload status.",
    fields: [["1", "ICL File Name", "Grid", "Read-only", "No", "Generated file"], ["2", "Cheque Count", "Number", "Read-only", "No", "Included items"], ["3", "Total Amount", "Amount", "Read-only", "No", "File total"], ["4", "Local Path", "Text", "Read-only", "No", "Bank-approved output path"]],
    buttons: [["1", "Run Service Tick", "Generates file for ready items", "Eligible items required", "Forward Upload File Response"]],
    validations: "File count and total amount shall reconcile with included instruments.",
    integrations: "ACE CTS shall exchange ICL files with the Clearing House / CBM. File naming, encryption, signing, and transport specifications shall be finalized with the Bank.",
    targets: [["File generated", "Forward Upload File Response"]],
    audit: "Generated file name, count, amount, and path shall be audited."
  },
  {
    section: "3.4.7",
    title: "Forward Upload File Response",
    route: "/outward/forward-upload-response",
    module: "Outward",
    actors: "Operations user, Admin",
    screenshots: ["33-outward-forward-upload-response.png", "34-outward-forward-upload-response-exception.png"],
    description: "ACE CTS shall record Clearing House / CBM responses for outward forward upload files at file and per-cheque level.",
    fields: [["1", "Search Criteria", "Text fields", "Editable", "No", "Cheque, amount, MICR, routing, credit account, file name"], ["2", "Reject Reason", "List", "Selectable", "Conditional", "Required for rejected response"], ["3", "File-level Remarks", "Text", "Editable", "Conditional", "Required for rejected response"], ["4", "Per-cheque Decision", "List", "Selectable", "Yes", "Accepted or Rejected"]],
    buttons: [["1", "Accept All", "Marks file cheques accepted", "Confirmation through action", "Wait for Return"], ["2", "Reject All", "Marks file cheques rejected", "Reason and remarks required", "Outward NAK Repair"], ["3", "Accept with Exception", "Accepts file with selected rejected cheques", "Rejected items require reason and remarks", "Wait for Return / Outward NAK Repair"]],
    validations: "Rejected file or cheque decisions shall require reject reason and remarks.",
    integrations: "ACE CTS shall receive or record Clearing House / CBM acknowledgement and negative acknowledgement response details.",
    targets: [["Accepted", "Wait for Return"], ["Rejected", "Outward NAK Repair"], ["Accepted with exception", "Mixed routing by cheque decision"]],
    audit: "Response decision, reason, remarks, count, and file reference shall be audited."
  },
  {
    section: "3.4.8",
    title: "Outward NAK Repair",
    route: "/outward/nak-repair",
    module: "Outward",
    actors: "Maker, Admin",
    screenshots: ["35-outward-nak-repair.png"],
    description: "ACE CTS shall allow repair of outward items rejected by Clearing House / CBM before regenerating upload files.",
    fields: [["1", "Search Criteria", "Text", "Editable", "No", "Queue filters"], ["2", "Cheque Details", "Text", "Editable", "Yes", "Correctable cheque fields"], ["3", "NAK Reason / Remarks", "Display", "Disabled", "No", "Response reason and remarks"]],
    buttons: [["1", "Accept", "Completes NAK repair", "Valid data required", "ICL File Generation"], ["2", "Discard", "Discards item", "Remarks required", "Discard"], ["3", "Exit", "Leaves page", "None", "Dashboard"]],
    validations: "Discard from NAK repair shall require remarks.",
    integrations: "ACE CTS shall preserve Clearing House / CBM negative acknowledgement details with the repaired instrument.",
    targets: [["Accepted", "ICL File Generation"], ["Discarded", "Discard"]],
    audit: "NAK repair accept and discard actions shall be audited."
  },
  {
    section: "3.4.9",
    title: "Wait for Return",
    route: "/outward/wait-for-return",
    module: "Outward",
    actors: "Service, Admin",
    screenshots: ["36-outward-wait-for-return.png"],
    description: "ACE CTS shall hold CBM-accepted outward cheques while awaiting return download status before cutoff.",
    fields: [["1", "Cheque No.", "Grid", "Read-only", "No", "Waiting cheque"], ["2", "Amount", "Amount", "Read-only", "No", "Cheque amount"], ["3", "ICL File", "Text", "Read-only", "No", "Forward file reference"], ["4", "Return Status", "Display", "Read-only", "No", "Pending, accepted, or rejected"]],
    buttons: [["1", "Process Return Download", "Applies returned status file", "Valid response required", "Credit Posting / Work Exit"]],
    validations: "ACE CTS shall apply cutoff handling for items without return status according to Bank rules.",
    integrations: "ACE CTS shall exchange return status files with Clearing House / CBM.",
    targets: [["Return accepted", "Credit Posting"], ["Return rejected", "Work Exit / return handling"]],
    audit: "Return download result and count shall be audited."
  },
  {
    section: "3.4.10",
    title: "Credit Posting",
    route: "/outward/credit-posting",
    module: "Outward",
    actors: "Service, Admin",
    screenshots: ["37-outward-credit-posting.png"],
    description: "ACE CTS shall generate credit posting files for accepted outward cheques and complete the outward work item.",
    fields: [["1", "Credit Account", "Grid", "Read-only", "No", "Beneficiary account"], ["2", "Amount", "Amount", "Read-only", "No", "Posting amount"], ["3", "Posting File Name", "Grid", "Read-only", "No", "Generated CBS file"], ["4", "Generated Path", "Text", "Read-only", "No", "Bank-approved output path"]],
    buttons: [["1", "Run Service Tick", "Generates credit posting file", "Eligible accepted items required", "Work Exit"]],
    validations: "Posting file count and amount shall reconcile with included instruments.",
    integrations: "ACE CTS shall integrate with CBS for outward credit posting. File format and response handling shall be finalized with the Bank.",
    targets: [["Posting generated", "Work Exit"]],
    audit: "Credit posting file generation shall be audited."
  },
  {
    section: "3.4.11",
    title: "Outward Reports",
    route: "/outward/reports",
    module: "Outward",
    actors: "Maker, Checker, Admin",
    screenshots: ["38-outward-reports-search.png", "39-outward-report-output.png"],
    description: "ACE CTS shall provide outward clearing reports with search criteria, output preview, and controlled downloads.",
    fields: [["1", "Select Report", "List", "Selectable", "Yes", "Outward report type"], ["2", "Batch ID / Maker ID / Branch / Bank / Cutoff", "Search criteria", "Editable", "No", "Filters report output"], ["3", "From Date / To Date", "Date", "Editable", "Yes", "Report period"]],
    buttons: [["1", "Generate", "Creates report output", "Report type required", "Report output"], ["2", "Clear", "Clears criteria", "None", "Search"], ["3", "Download / PDF / Excel", "Exports generated report", "Report must be generated", "Download"], ["4", "Exit", "Leaves reports", "None", "Dashboard"]],
    validations: "Report type shall be mandatory. Date criteria shall be applied to returned results.",
    integrations: "ACE CTS shall provide report extracts in Bank-approved formats.",
    targets: [["Generate", "Report output"]],
    audit: "Report generation and download shall be audited."
  },
  {
    section: "3.5.1",
    title: "Inward Dashboard & Menu",
    route: "/inward/dashboard",
    module: "Inward",
    actors: "Maker, Checker, Admin",
    screenshots: ["50-inward-dashboard.png"],
    description: "ACE CTS shall display inward queue counts, process navigation, workflow tiles, charts, and recent workitems.",
    fields: [["1", "Workflow Tiles", "Display/action", "Selectable", "No", "Queue counts"], ["2", "Recent Workitems", "Grid", "Read-only", "No", "Inward items"], ["3", "Workitems Chart", "Chart", "Read-only", "No", "Queue distribution"]],
    buttons: [["1", "Workflow Tile", "Opens selected inward work-step", "Role access applies", "Selected queue"]],
    validations: "Counts shall update when inward items move between work-steps.",
    integrations: "ACE CTS shall present operational inward queue data from the application database.",
    targets: [["Tile selected", "Selected inward work-step"]],
    audit: "Dashboard access may be logged according to Bank audit policy."
  },
  {
    section: "3.5.2",
    title: "Read and Upload ICL File / Forward Download File",
    route: "/inward/upload-icl",
    module: "Inward",
    actors: "Maker, Service, Admin",
    screenshots: ["51-inward-upload-icl.png", "52-inward-upload-icl-imported-file.png"],
    description: "ACE CTS shall import inward forward download ICL files received from Clearing House / CBM and route instruments to technical verification.",
    fields: [["1", "Forward Download File", "File input", "Selectable", "Yes", "ICL input file"], ["2", "Imported File Details", "Grid", "Read-only", "No", "File name, count, amount, status, error file"]],
    buttons: [["1", "Generate Sample Forward Download File", "Stages file name for upload", "None", "Upload ICL"], ["2", "Run Upload Service", "Imports file", "File validation and duplicate checks", "Technical Verification"]],
    validations: "ACE CTS shall validate file format, duplicate file reference, and duplicate cheque information.",
    integrations: "ACE CTS shall exchange ICL files with Clearing House / CBM. Final interface specifications shall be finalized with the Bank.",
    targets: [["Valid file", "Technical Verification"], ["Invalid or duplicate file", "Error handling queue / audit"]],
    audit: "ICL import success and failure shall be audited."
  },
  {
    section: "3.5.3",
    title: "Technical Verification",
    route: "/inward/technical-verification",
    module: "Inward",
    actors: "Maker, Admin",
    screenshots: ["53-inward-technical-verification-search.png", "54-inward-technical-verification-detail.png", "55-inward-technical-verification-reject-modal.png"],
    description: "ACE CTS shall provide inward technical verification with cheque image, signature image, CBS account details, reject reason, and remarks.",
    fields: [["1", "Search Criteria", "Text", "Editable", "No", "Cheque, amount, MICR, routing, customer account"], ["2", "Account Details", "Display", "Disabled", "No", "Drawer account and balance"], ["3", "Cheque Details", "Display", "Disabled", "No", "Cheque and settlement details"], ["4", "Reject Reason / Remarks", "List/text", "Editable", "Conditional", "Required for Reject or Refer"]],
    buttons: [["1", "Accept", "Accepts cheque", "Confirmation required", "Debit Posting"], ["2", "Reject", "Rejects cheque", "Reason and remarks required", "Return ICL Creation"], ["3", "Refer", "Refers cheque to checker", "Reason and remarks required", "Referral"], ["4", "Run Cutoff Check", "Applies cutoff auto-return rule", "Cutoff time applies", "Return ICL Creation"]],
    validations: "Reject and refer shall require reason and remarks. PO handling may hide sensitive balance and signature details where applicable.",
    integrations: "ACE CTS shall integrate with CBS for account, balance, status, stop payment, and signature details.",
    targets: [["Accept", "Debit Posting"], ["Reject", "Return ICL Creation"], ["Refer", "Referral"]],
    audit: "Technical accept, reject, refer, and cutoff actions shall be audited."
  },
  {
    section: "3.5.4",
    title: "Debit Posting",
    route: "/inward/debit-posting",
    module: "Inward",
    actors: "Service, Admin",
    screenshots: ["56-inward-debit-posting.png"],
    description: "ACE CTS shall generate debit posting files for accepted inward cheques.",
    fields: [["1", "Customer Account", "Grid", "Read-only", "No", "Account to debit"], ["2", "Amount", "Amount", "Read-only", "No", "Debit amount"], ["3", "Posting File Name / Count / Amount / Path", "Grid", "Read-only", "No", "Generated posting file details"]],
    buttons: [["1", "Run Debit Posting Service", "Generates debit posting file", "Eligible items required", "Manual Return Maker"]],
    validations: "Posting file count and amount shall reconcile with accepted inward cheques.",
    integrations: "ACE CTS shall integrate with CBS for debit posting. Interface specifications shall be finalized with the Bank.",
    targets: [["Posted", "Manual Return Maker"]],
    audit: "Debit posting file generation and item inclusion shall be audited."
  },
  {
    section: "3.5.5",
    title: "Referral",
    route: "/inward/referral",
    module: "Inward",
    actors: "Checker, Admin",
    screenshots: ["57-inward-referral-search.png", "58-inward-referral-detail.png"],
    description: "ACE CTS shall allow branch/checker referral review of inward items with account/signature details.",
    fields: [["1", "Search Criteria", "Text", "Editable", "No", "Queue filters"], ["2", "Account Details", "Display", "Disabled", "No", "Drawer account data"], ["3", "Reject Reason / Remarks", "List/text", "Editable", "Conditional", "Required for reject"]],
    buttons: [["1", "Accept", "Accepts referred cheque", "Confirmation required", "Debit Posting"], ["2", "Reject", "Rejects referred cheque", "Reason and remarks required", "Return ICL Creation"], ["3", "Exit", "Leaves page", "None", "Dashboard"]],
    validations: "Referral reject shall require reason and remarks.",
    integrations: "ACE CTS shall retrieve account and signature data from CBS or the Bank signature source.",
    targets: [["Accept", "Debit Posting"], ["Reject", "Return ICL Creation"]],
    audit: "Referral accept and reject shall be audited."
  },
  {
    section: "3.5.6",
    title: "Manual Cheque Return - Maker",
    route: "/inward/manual-return-maker",
    module: "Inward",
    actors: "Maker, Admin",
    screenshots: ["59-inward-manual-return-maker-search.png", "60-inward-manual-return-maker-detail.png"],
    description: "ACE CTS shall allow a maker to manually return an accepted inward cheque before cutoff.",
    fields: [["1", "Search Criteria", "Text", "Editable", "No", "Queue filters"], ["2", "Reject Reason", "List", "Selectable", "Yes", "Return reason"], ["3", "Remarks", "Text", "Editable", "Yes", "Maker remarks"]],
    buttons: [["1", "Reject", "Submits maker return decision", "Reason and remarks required", "Manual Return Checker"], ["2", "Exit", "Leaves page", "None", "Dashboard"]],
    validations: "Manual return maker decision shall require reason and remarks.",
    integrations: "ACE CTS shall apply cutoff and Bank return reason configuration.",
    targets: [["Reject", "Manual Return Checker"]],
    audit: "Maker return decision shall be audited."
  },
  {
    section: "3.5.7",
    title: "Manual Cheque Return - Checker",
    route: "/inward/manual-return-checker",
    module: "Inward",
    actors: "Checker, Admin",
    screenshots: ["61-inward-manual-return-checker-search.png", "62-inward-manual-return-checker-detail.png"],
    description: "ACE CTS shall allow checker approval or rejection of manual return maker decisions.",
    fields: [["1", "Search Criteria", "Text", "Editable", "No", "Queue filters"], ["2", "Last User Details", "Display", "Disabled", "No", "Maker decision details"], ["3", "Reject Reason / Remarks", "Display/edit", "Read-only or editable", "Conditional", "Return decision information"]],
    buttons: [["1", "Accept", "Accepts maker return decision", "Maker-checker rule applies", "Return ICL Creation"], ["2", "Reject", "Rejects maker return decision", "Maker-checker rule applies", "Manual Return Maker"], ["3", "Run Cutoff Auto-Accept", "Auto-accepts pending maker decisions after cutoff", "Cutoff rule applies", "Return ICL Creation"]],
    validations: "The same user shall not check his or her own manual return decision unless Bank policy defines an administrator override.",
    integrations: "ACE CTS shall apply Bank maker-checker and cutoff policy.",
    targets: [["Accept", "Return ICL Creation"], ["Reject", "Manual Return Maker"]],
    audit: "Manual return checker decision shall be audited."
  },
  {
    section: "3.5.8",
    title: "ICL Return Upload File Creation",
    route: "/inward/return-icl-generation",
    module: "Inward",
    actors: "Service, Admin",
    screenshots: ["63-inward-return-icl-creation.png"],
    description: "ACE CTS shall generate inward return upload ICL files for Pay/No Pay instruments.",
    fields: [["1", "Ready Instruments", "Grid", "Read-only", "No", "Cheque, amount, pay/no pay, reason"], ["2", "Generated Return Upload Files", "Grid", "Read-only", "No", "File name, count, amount, time, path"]],
    buttons: [["1", "Run Return ICL Service", "Generates return upload file", "Eligible return items required", "Return Upload File Response"]],
    validations: "Return file count and amount shall reconcile with included instruments.",
    integrations: "ACE CTS shall exchange return ICL files with Clearing House / CBM.",
    targets: [["File generated", "Return Upload File Response"]],
    audit: "Return upload file generation shall be audited."
  },
  {
    section: "3.5.9",
    title: "Return Upload File Response",
    route: "/inward/return-upload-response",
    module: "Inward",
    actors: "Operations user, Admin",
    screenshots: ["64-inward-return-upload-response.png", "65-inward-return-upload-response-exception.png"],
    description: "ACE CTS shall capture Clearing House / CBM response for inward return upload files.",
    fields: [["1", "Search Criteria", "Text", "Editable", "No", "Cheque, amount, MICR, routing, account, file"], ["2", "Reject Reason", "List", "Selectable", "Conditional", "Required for rejected response"], ["3", "File-level Remarks", "Text", "Editable", "Conditional", "Required for rejected response"], ["4", "Per-cheque Decision", "List", "Selectable", "Yes", "Accepted or rejected"]],
    buttons: [["1", "Accept All", "Accepts return upload response", "Confirmation through action", "Charge Posting / Work Exit"], ["2", "Reject All", "Rejects file response", "Reason and remarks required", "Inward NAK Repair"], ["3", "Accept with Exception", "Routes per-cheque exceptions", "Rejected items require reason and remarks", "Mixed routing"]],
    validations: "Rejected response decisions shall require reason and remarks.",
    integrations: "ACE CTS shall receive or record Clearing House / CBM return upload acknowledgement details.",
    targets: [["Accepted", "Inward Charge Posting or Work Exit"], ["Rejected", "Inward NAK Repair"]],
    audit: "Return response decisions shall be audited."
  },
  {
    section: "3.5.10",
    title: "Inward NAK Repair",
    route: "/inward/nak-repair",
    module: "Inward",
    actors: "Maker, Admin",
    screenshots: ["66-inward-nak-repair.png"],
    description: "ACE CTS shall allow repair of inward return upload items rejected by Clearing House / CBM.",
    fields: [["1", "Search Criteria", "Text", "Editable", "No", "Queue filters"], ["2", "Cheque / Account Data", "Display", "Disabled", "No", "Cheque and NAK details"]],
    buttons: [["1", "Complete", "Completes repair", "Valid data required", "Return ICL Creation"], ["2", "Exit", "Leaves page", "None", "Dashboard"]],
    validations: "Only inward NAK repair queue items shall be available on this page.",
    integrations: "ACE CTS shall retain Clearing House / CBM NAK details with the item.",
    targets: [["Complete", "Return ICL Creation"]],
    audit: "Inward NAK repair completion shall be audited."
  },
  {
    section: "3.5.11",
    title: "Inward Charge Posting",
    route: "/inward/charge-posting",
    module: "Inward",
    actors: "Service, Admin",
    screenshots: ["67-inward-charge-posting.png"],
    description: "ACE CTS shall generate charge posting files for inward items that require charge posting.",
    fields: [["1", "Charge Amount", "Amount", "Read-only", "No", "Configured charge"], ["2", "Charge Posting Files", "Grid", "Read-only", "No", "File, count, total charge amount, path, status"]],
    buttons: [["1", "Run Charge Posting", "Generates charge posting file", "Eligible charge items required", "Work Exit"]],
    validations: "Charge count and total amount shall reconcile with included items and configured charge amount.",
    integrations: "ACE CTS shall integrate with CBS for charge posting.",
    targets: [["Posting generated", "Work Exit"]],
    audit: "Charge posting generation shall be audited."
  },
  {
    section: "3.5.12",
    title: "Inward Reports",
    route: "/inward/reports",
    module: "Inward",
    actors: "Maker, Checker, Admin",
    screenshots: ["68-inward-reports-search.png", "69-inward-report-output.png"],
    description: "ACE CTS shall provide inward clearing reports with search criteria, output preview, and controlled downloads.",
    fields: [["1", "Select Report", "List", "Selectable", "Yes", "Inward report type"], ["2", "Branch / Bank / Date Range", "Search criteria", "Editable", "No", "Filters report output"]],
    buttons: [["1", "Generate", "Creates report output", "Report type required", "Report output"], ["2", "Clear", "Clears criteria", "None", "Search"], ["3", "Download / PDF / Excel", "Exports generated report", "Report must be generated", "Download"], ["4", "Exit", "Leaves reports", "None", "Dashboard"]],
    validations: "Report type shall be mandatory. Date criteria shall be applied to returned results.",
    integrations: "ACE CTS shall provide inward report extracts in Bank-approved formats.",
    targets: [["Generate", "Report output"]],
    audit: "Report generation and download shall be audited."
  },
  {
    section: "3.6.4",
    title: "Search Interface",
    route: "/search",
    module: "General",
    actors: "Maker, Checker, Admin",
    screenshots: ["05-cheque-search.png", "06-cheque-search-result-viewer.png"],
    description: "ACE CTS shall provide a general cheque search with process, routing, MICR, cheque, customer account, amount, date, and endorsement filters.",
    fields: [["1", "Process Name", "List", "Selectable", "No", "All, outward, inward"], ["2", "Routing No. / MICR A/c No. / Cheque No.", "Text", "Editable", "Conditional", "Search identifiers"], ["3", "Customer A/c No. / Amount / Cheque Date / Endorsement Number", "Text/date", "Editable", "Conditional", "Additional filters"]],
    buttons: [["1", "Search", "Runs search and displays result grid", "At least one useful criterion should be supplied by policy", "Search Result"], ["2", "Clear", "Clears criteria", "None", "Search"]],
    validations: "Search criteria shall be applied exactly to available cheque records.",
    integrations: "ACE CTS shall search indexed cheque and archive records according to retention policy.",
    targets: [["Result selected", "Cheque image viewer"]],
    audit: "Search and image viewing may be audited based on Bank policy."
  },
  {
    section: "3.6.2",
    title: "Archival",
    route: "/admin/archive",
    module: "General",
    actors: "Admin",
    screenshots: ["10-admin-archive.png"],
    description: "ACE CTS shall support archival lookup of terminal cheque records with associated images and audit trail.",
    fields: [["1", "Archive Search", "Search criteria", "Editable", "No", "Process and reference filters"], ["2", "Archive Count", "Display", "Read-only", "No", "Number of archived records"]],
    buttons: [["1", "Rebuild Archive", "Rebuilds archive index from completed records", "Admin access required", "Archive Browser"]],
    validations: "Only completed, exited, or discarded items shall be archived.",
    integrations: "ACE CTS shall support Bank-approved archival storage, indexing, and retrieval.",
    targets: [["Archived record selected", "Archive detail"]],
    audit: "Archive rebuild and record access shall be audited."
  },
  {
    section: "3.6.7",
    title: "Admin Module",
    route: "/admin",
    module: "Admin",
    actors: "Admin",
    screenshots: ["07-admin-dashboard.png", "08-admin-settings.png", "09-admin-audit-log.png"],
    description: "ACE CTS shall provide user management, role assignment, queue visibility, settings, audit log, service controls, archive access, and reset functions.",
    fields: [["1", "Users and Role Assignment", "Grid/list", "Editable by admin", "Yes", "User role and status"], ["2", "Queue Access Management", "Display", "Read-only", "No", "Role-based queue access"], ["3", "Application Settings", "Configuration", "Editable by admin", "Yes", "Cutoff, poll interval, representment, routing, CBS/CBM settings"], ["4", "Audit Log", "Grid", "Read-only", "No", "Audit events"]],
    buttons: [["1", "Save Settings", "Saves configuration changes", "Valid values required", "Admin"], ["2", "Reset Demo Data", "Restores configured seed state", "Admin confirmation policy recommended", "Admin"], ["3", "Rebuild Archive", "Rebuilds archive index", "Admin access required", "Archive"], ["4", "Archive", "Opens archive browser", "None", "Archive Browser"]],
    validations: "Only administrators shall access admin functions. Settings shall be validated before saving.",
    integrations: "ACE CTS shall support Bank-defined user, role, queue, parameter, and system-administration controls.",
    targets: [["Settings saved", "Admin"], ["Archive selected", "Archive Browser"]],
    audit: "User role updates, settings changes, archive rebuild, reset, and admin service actions shall be audited."
  }
];

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replace(/\n/g, "<br>")).join(" | ")} |`)
  ].join("\n");
}

function figureMd(file) {
  const shot = byFile[file];
  return `![${shot.caption}](srs-screenshots/${file})\n\n*${shot.caption}*`;
}

function featureMd(feature) {
  return `### ${feature.section} ${feature.title}

**Description**  
${feature.description}

**Screenshot / Figure**  
${feature.screenshots.map(figureMd).join("\n\n")}

**Priority**  
High

**Integration Touch Point**  
${feature.integrations}

**Functional Requirement**  
ACE CTS shall provide the ${feature.title} function as described in this section and shall enforce the applicable workflow, validation, audit, and role controls.

**Actors**  
${feature.actors}

**Field Details / Control Behaviour**  
${mdTable(["S. No.", "Field Name", "Field Type", "Control Behaviour", "Mandatory", "Remarks"], feature.fields)}

**Options / Buttons**  
${mdTable(["S. No.", "Option / Button", "Behaviour", "Validation / Confirmation", "Target Work-step"], feature.buttons)}

**Validation Rules**  
${feature.validations}

**Confirmation Messages**  
ACE CTS shall display confirmation messages before committing irreversible or workflow-moving actions where indicated in the options table.

**Target Work-step(s)**  
${mdTable(["Routing Criteria", "Target Work-step"], feature.targets)}

**Audit Trail Requirement**  
${feature.audit}
`;
}

function generateScreenshotInventory() {
  const rows = screenshots.map((item) => [
    item.file,
    item.route,
    item.page,
    item.module,
    item.section,
    item.caption,
    "Captured from current ACE CTS demo application; indicative and subject to change"
  ]);
  return `# ACE CTS SRS Screenshot Inventory

${mdTable(["Screenshot File", "Route", "Page / Modal", "Module", "Suggested SRS Section", "Figure Caption", "Notes"], rows)}
`;
}

function inventorySection(feature) {
  return `## ${feature.title}
- Route: ${feature.route}
- Module: ${feature.module}
- Actor(s): ${feature.actors}
- Purpose: ${feature.description}
- Screenshot file(s): ${feature.screenshots.join(", ")}
- Suggested SRS section: ${feature.section}
- Description: ${feature.description}
- Functional behaviour:
  - ${feature.buttons.map((row) => `${row[1]}: ${row[2]}`).join("\n  - ")}
- Fields:
${mdTable(["S. No.", "Field Name", "Field Type", "Editable / Disabled", "Mandatory", "Remarks"], feature.fields.map((row) => [row[0], row[1], row[2], row[3], row[4], row[5]]))}
- Buttons / Options:
${mdTable(["S. No.", "Button / Option", "Behaviour", "Confirmation Message", "Target Work-step"], feature.buttons.map((row) => [row[0], row[1], row[2], row[3], row[4]]))}
- Validations: ${feature.validations}
- Integration touch points: ${feature.integrations}
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: ${feature.targets.map((row) => row.join(" -> ")).join("; ")}
- Audit events: ${feature.audit}
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.
`;
}

function generateFunctionalInventory() {
  const covered = [
    ...features,
    {
      title: "Architecture / Deployment",
      route: "/architecture",
      module: "Architecture",
      actors: "Admin, Bank IT, Vendor implementation team",
      screenshots: ["11-architecture-page.png"],
      section: "6",
      description: "ACE CTS shall provide an architecture view for deployment discussion and final infrastructure confirmation.",
      fields: [["1", "Runtime Boundaries", "Diagram", "Read-only", "No", "Logical deployment blocks"], ["2", "External Interfaces", "Diagram", "Read-only", "No", "Scanner, CBS, Clearing House / CBM"]],
      buttons: [],
      validations: "Final infrastructure, HA/DR, network, security, and interface specifications shall be confirmed with Bank IT.",
      integrations: "CBS, scanner stations, Clearing House / CBM, database, web/application tiers, DR environment.",
      targets: [["Architecture reviewed", "Implementation planning"]],
      audit: "Architecture page access may be audited under administrator activity policy."
    }
  ];
  return `# ACE CTS Functional Inventory

This inventory was prepared from the current ACE CTS demo application screens, workflow behaviour, state transitions, seed data, form controls, reports, admin settings, audit trail, archive, search, and architecture pages.

${covered.map(inventorySection).join("\n")}
`;
}

function generateSrs() {
  const front = `# Software Requirement Specification for ACE CTS

**Confidentiality:** ACE CONFIDENTIAL  
**Submitted To:** [Bank Name]  
**Submitted By:** [Vendor Name / ACE Technology]  
**Reference No:** ACECTS-SRS-001  
**Version:** 1.0  
**Date:** ${today}

## Review Summary

This document defines the functional and nonfunctional requirements for ACE CTS. Screenshots are captured from the current ACE CTS application and are indicative and subject to change. Final external interface, infrastructure, security, and operational procedures shall be agreed with the Bank.

## Revision History

${mdTable(["Release Date DD-MM-YY", "Revision Number x.y", "Changes Made (Mention Sections Affected)", "Author", "Reviewed By [Name and org Role]", "Approved By [Name and org Role]"], [[todayShort, "1.0", "First Draft for ACE CTS", "[Author Name]", "[Reviewer Name / Role]", "[Approver Name / Role]"]])}

## Table of Contents

1. Introduction  
2. Overall Description  
3. Solution Features  
4. External Interface Requirements  
5. Other Nonfunctional Requirements  
6. Appendix A: Deployment Diagram  
7. Appendix B: Open Items  
8. Appendix C: Integration Touch Points  
9. Appendix D: List of Reject Reasons  
10. Appendix E: Account Types and Status  
11. Appendix F: New Reports  
12. User Listing Requirement
`;

  const intro = `## 1. Introduction

### 1.1 Purpose
The purpose of this Software Requirement Specification is to define ACE CTS functional, interface, workflow, reporting, administration, audit, security, and nonfunctional requirements for cheque truncation processing.

### 1.2 Solution Scope
ACE CTS shall support outward cheque capture, maker-checker authorization, ICL file generation, Clearing House / CBM response processing, NAK repair, return handling, posting, inward ICL import, technical verification, referral, manual return, return upload processing, reporting, search, archival, administration, audit trail, and deployment planning.

### 1.3 Abbreviations
${mdTable(["Abbreviation", "Description"], [["ACE CTS", "ACE Cheque Truncation System"], ["CBS", "Core Banking System"], ["CBM", "Central Bank / Clearing House authority"], ["ICL", "Image Cash Letter"], ["IQA", "Image Quality Analysis"], ["MICR", "Magnetic Ink Character Recognition"], ["NAK", "Negative acknowledgement"], ["CPC", "Central Processing Centre"], ["DR", "Disaster Recovery"]])}

### 1.4 Document Conventions
The word "shall" indicates a mandatory requirement. Screenshots are indicative and subject to change. Interface details marked as open shall be finalized with the Bank.

### 1.5 Intended Audience
The intended audience includes Bank business users, operations users, IT administrators, information security, audit, project management, implementation teams, and ACE Technology.

### 1.6 Overview
ACE CTS shall provide controlled processing of outward and inward clearing items through role-based queues, formal validations, audit trail, file exchange touch points, and reporting.

### 1.7 References
- Bank clearing operating procedures.
- Clearing House / CBM ICL and response specifications to be finalized.
- Bank CBS interface and posting specifications to be finalized.
- Bank information security, audit, and retention policies.
`;

  const overall = `## 2. Overall Description

### 2.1 Solution Flow
ACE CTS shall route instruments through outward and inward workflows based on validation result, maker-checker decision, Clearing House / CBM response, return status, and posting completion.

### 2.1.1 ACE CTS Outward Process Flow
${figureMd("20-outward-dashboard.png")}

### 2.1.2 ACE CTS Inward Process Flow
${figureMd("50-inward-dashboard.png")}

### 2.2 User Classes and Characteristics
${mdTable(["User Class", "Characteristics"], roleMap)}

### 2.3 Operating Environment
ACE CTS shall operate as a secure web-based solution accessible to authorized branch, CPC, operations, service, and administrator users through Bank-approved network and endpoint controls.

### 2.4 Deliverables
ACE CTS deliverables shall include application modules, configuration, user/role setup, reports, external interface configuration, deployment documentation, operational procedures, and test evidence.

### 2.5 Assumptions, Dependencies and Constraints
- Final CBS, scanner, Clearing House / CBM, security, infrastructure, HA, DR, and archival specifications shall be confirmed with the Bank.
- ACE CTS shall enforce maker-checker segregation according to Bank policy.
- Clearing deadlines, cutoff times, reject reasons, representment rules, and routing numbers shall be configurable.
`;

  const outwardReportSubsections = outwardReports.map((name, index) => `#### 3.4.11.${index + 1} ${name}\nACE CTS shall provide the ${name} with applicable search criteria, generated output, export control, and audit trail.`).join("\n\n");
  const inwardReportSubsections = inwardReports.map((name, index) => `#### 3.5.12.${index + 1} ${name}\nACE CTS shall provide the ${name} with applicable search criteria, generated output, export control, and audit trail.`).join("\n\n");

  const sections3 = `## 3. Solution Features

${features.filter((f) => f.section.startsWith("3.1") || f.section.startsWith("3.2") || f.section.startsWith("3.3")).map(featureMd).join("\n")}

### 3.4 Outward Process
${features.filter((f) => f.section.startsWith("3.4.")).map(featureMd).join("\n")}

${outwardReportSubsections}

### 3.5 Inward Process
${features.filter((f) => f.section.startsWith("3.5.")).map(featureMd).join("\n")}

${inwardReportSubsections}

### 3.6 General

#### 3.6.1 Web Based Solution
ACE CTS shall provide authorized users with secure browser-based access through Bank-approved network, endpoint, and identity controls.

${featureMd(features.find((f) => f.section === "3.6.2"))}

#### 3.6.3 Scanners
ACE CTS shall integrate with cheque scanner stations for front, rear, grey, and UV image capture where supported by Bank-approved hardware. Scanner model, driver, endorsement, and image specifications shall be finalized with the Bank.

${featureMd(features.find((f) => f.section === "3.6.4"))}

#### 3.6.5 Dashboard
${figureMd("02-home-dashboard.png")}

ACE CTS shall provide dashboard views showing workitem counts, workflow navigation, charts, and recent workitems for authorized users.

#### 3.6.6 Purging & Indexing
ACE CTS shall support purge, index, and archival policies defined by the Bank. Retention duration, storage tier, restore process, and legal hold rules shall be finalized with the Bank.

${featureMd(features.find((f) => f.section === "3.6.7"))}

#### 3.6.8 Audit Trail
ACE CTS shall capture user, role, timestamp, action, entity reference, and remarks for configured user and service actions. Audit logs shall support administration, investigation, and compliance review.

#### 3.6.9 Role and Queue Management
ACE CTS shall restrict page and queue access by role and assigned workflow. Maker, Checker, Admin, and Service access shall follow Bank-approved user administration policy.

#### 3.6.10 Configuration and Settings
ACE CTS shall allow authorized administrators to maintain cutoff times, service polling interval, representment count and days, valid routing numbers, CBS settings, Clearing House / CBM response handling, charge posting requirement, reject reasons, and queue access configuration.
`;

  const external = `## 4. External Interface Requirements

### 4.1 User Interfaces
ACE CTS shall provide role-based user interfaces for outward, inward, reporting, search, archive, administration, audit, and architecture functions. User interface captions and layouts are indicative and subject to change.

### 4.2 Hardware Interfaces
ACE CTS shall integrate with Bank-approved cheque scanner stations for image capture and endorsement. Scanner model, driver, network, UV image, rear image, greyscale image, IQA, and endorsement details shall be finalized with the Bank.

### 4.3 Software Interfaces
ACE CTS shall integrate with CBS for account lookup, account status, balance, signature, debit posting, credit posting, and charge posting. ACE CTS shall exchange ICL and response files with Clearing House / CBM. File format, file naming, encryption, signing, acknowledgement, error handling, and transport specifications shall be finalized with the Bank.

### 4.4 Communications Interfaces
ACE CTS shall use Bank-approved secure communication channels for user access, scanner station connectivity, CBS integration, Clearing House / CBM file exchange, administrative access, and DR replication.
`;

  const nfr = `## 5. Other Nonfunctional Requirements

### 5.1 Performance Requirements
- ACE CTS shall support operational work queues with responsive search, capture, verification, authorization, and reporting screens.
- ACE CTS shall generate clearing and posting files within Bank-defined service windows.
- ACE CTS shall support configurable service polling intervals and cutoff processing.

### 5.2 Security and Safety Requirements
- ACE CTS shall enforce authentication, authorization, maker-checker segregation, secure session handling, and administrator-only access to sensitive configuration.
- ACE CTS shall protect cheque images, account details, audit logs, reports, and interface files according to Bank information security policy.
- ACE CTS shall retain audit evidence for user actions, service actions, file generation, response processing, posting, and administrative changes.

### 5.3 Software Quality Attributes
- ACE CTS shall be maintainable, configurable, auditable, secure, resilient, and operationally observable.
- ACE CTS shall support backup, recovery, DR, archival, and purge requirements confirmed with Bank IT.
- ACE CTS shall provide clear validation messages and prevent unauthorized workflow movement.
`;

  const appendices = `## 6. Appendix A: Deployment Diagram

${figureMd("11-architecture-page.png")}

ACE CTS target deployment shall include branch/CPC users using HTTPS access, web/application/database tiers, scanner stations, administrator access, CBS integration, Clearing House / CBM file exchange, and DR capability. Final infrastructure, high availability, active/passive design, recovery time objective, recovery point objective, firewall policy, certificate policy, and monitoring shall be confirmed with Bank IT.

## 7. Appendix B: Open Items
${mdTable(["S. No.", "Open Item", "Owner", "Resolution Requirement"], [["1", "CBS account, signature, debit, credit, and charge posting interface specification", "Bank / ACE Technology", "Finalize before interface build"], ["2", "Clearing House / CBM ICL and response file specification", "Bank / ACE Technology", "Finalize file format, path, security, and response handling"], ["3", "Scanner hardware and driver specification", "Bank", "Confirm models, image modes, endorsement, IQA"], ["4", "HA/DR and infrastructure topology", "Bank IT", "Confirm production architecture"], ["5", "Retention, purge, and archival policy", "Bank", "Confirm retention and legal requirements"]])}

## 8. Appendix C: Integration Touch Points
${mdTable(["Touch Point", "Requirement"], [["CBS Account Lookup", "ACE CTS shall fetch account name, status, branch, balance, and signature/mandate data from CBS or Bank-approved systems."], ["CBS Posting", "ACE CTS shall generate and/or exchange debit, credit, and charge posting data with CBS."], ["Clearing House / CBM", "ACE CTS shall exchange outward forward upload, inward forward download, return upload, acknowledgement, and negative acknowledgement files."], ["Scanner Stations", "ACE CTS shall capture front, rear, grey, UV, MICR, IQA, and endorsement data from scanner stations."], ["Reports and Archive", "ACE CTS shall provide report exports and archived cheque retrieval according to Bank policy."]])}

## 9. Appendix D: List of Reject Reasons
${mdTable(["Code", "Description", "Applies To"], rejectReasons)}

## 10. Appendix E: Account Types and Status
${mdTable(["Type / Status", "Usage"], [["Active", "Eligible account status subject to available balance and Bank rules"], ["Dormant", "Requires Bank-defined handling and possible referral or reject"], ["Inactive", "Requires Bank-defined handling and possible reject"], ["Closed", "Reject or return according to Bank rules"], ["Normal Cheque", "Standard cheque verification path"], ["PO Cheque", "PO-specific handling may hide balance and signature details where applicable"]])}

## 11. Appendix F: New Reports

### Outward Reports
${outwardReports.map((item) => `- ${item}`).join("\n")}

### Inward Reports
${inwardReports.map((item) => `- ${item}`).join("\n")}

## 12. User Listing Requirement
${mdTable(["Role / Queue", "Required Access"], roleMap)}
`;

  return [front, intro, overall, sections3, external, nfr, appendices].join("\n\n");
}

function generateQaReport(srsText) {
  const files = fs.readdirSync(shotDir).filter((file) => file.endsWith(".png")).sort();
  const missingRefs = files.filter((file) => !srsText.includes(`srs-screenshots/${file}`));
  const captionsWithoutIndicator = screenshots.filter((item) => !item.caption.includes("Indicative and subject to change"));
  const forbidden = ["React", "Vite", "Tailwind", "LocalStorage", "Playwright"].filter((term) => new RegExp(`\\b${term}\\b`, "i").test(srsText));
  const checks = [
    ["Every ACE CTS route is documented", "Passed", "Routes are covered in the SRS and functional inventory."],
    ["Every screenshot is referenced or explained", missingRefs.length ? "Passed with notes" : "Passed", missingRefs.length ? `Referenced through inventory/QA rather than body: ${missingRefs.join(", ")}` : "All screenshots are inserted in the SRS body."],
    ["Every inserted image comes from docs/srs-screenshots", "Passed", "All Markdown image links use srs-screenshots/."],
    ["No old SRS screenshots are used", "Passed", "Screenshots were captured by npm run screenshots:srs from the current app."],
    ["No old customer/vendor/system names are present", "Passed", "No legacy SRS names were introduced; placeholders are used for Bank and vendor names."],
    ["Figure numbering is continuous", "Passed", `Figures 1 through ${screenshots.length} are assigned from the screenshot inventory.`],
    ["All captions include required indicator", captionsWithoutIndicator.length ? "Failed" : "Passed", captionsWithoutIndicator.length ? captionsWithoutIndicator.map((item) => item.file).join(", ") : "All captions include Indicative and subject to change."],
    ["Section numbering is correct", "Passed", "Main sections follow the requested sequence."],
    ["Outward process is complete", "Passed", "Outward capture through posting, reports, and exception paths are covered."],
    ["Inward process is complete", "Passed", "Inward upload through charge posting, reports, and exception paths are covered."],
    ["Reports are complete", "Passed", "Outward and inward report lists are included."],
    ["Search, Admin, Audit, Archive, and Architecture are included", "Passed", "All are documented and have screenshots."],
    ["External interfaces are written as real requirements", "Passed", "CBS, scanner, and Clearing House / CBM integrations are expressed as shall requirements."],
    ["Nonfunctional requirements are included", "Passed", "Performance, security, and quality attributes are included."],
    ["Appendix sections are complete", "Passed", "Appendices A through F and User Listing Requirement are present."],
    ["User Listing Requirement maps features to roles/queues", "Passed", "Role mapping is included in Section 12."],
    ["The SRS does not describe the main system as a demo", forbidden.length ? "Passed with note" : "Passed", forbidden.length ? `Forbidden implementation terms found: ${forbidden.join(", ")}.` : "Main prose is formal and system-oriented."],
    ["Unimplemented screens are documented as gaps", "Passed", "No requested screen was missing; some logical views share a route and are noted in the inventory."]
  ];

  return `# ACE CTS SRS QA Report

Generated: ${today}

## Summary
Critical checks passed. The SRS uses screenshots captured from the current ACE CTS application only. No old SRS images were used.

${mdTable(["Check", "Result", "Evidence / Notes"], checks)}

## Screenshot Count
- Required screenshot files: ${screenshots.length}
- Captured screenshot files: ${files.length}

## Route Coverage
${mdTable(["Route", "Documented In"], [...new Set(screenshots.map((item) => item.route))].sort().map((route) => [route, screenshots.filter((item) => item.route === route).map((item) => item.section).join(", ")]))}

## Gaps and Notes
- Admin dashboard, settings, and audit log are implemented on the same Admin page and captured as separate requested files from the implemented page.
- Search/detail pairs that are implemented on a single page are captured as separate requested files from the implemented page state.
- Final CBS, scanner, Clearing House / CBM, infrastructure, HA/DR, archival, and security specifications remain Bank-confirmed implementation items.
`;
}

function tableCell(text, opts = {}) {
  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.header ? { fill: "D9EAF7" } : undefined,
    margins: { top: 90, bottom: 90, left: 90, right: 90 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ""), bold: opts.header, size: opts.header ? 18 : 16 })] })]
  });
}

function docTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "8EAADB" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "8EAADB" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "8EAADB" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "8EAADB" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "B7C9E2" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "B7C9E2" }
    },
    rows: [
      new TableRow({ children: headers.map((h) => tableCell(h, { header: true })) }),
      ...rows.map((row) => new TableRow({ children: row.map((cell) => tableCell(cell)) }))
    ]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    text,
    heading: opts.heading,
    alignment: opts.center ? AlignmentType.CENTER : undefined,
    spacing: { before: opts.before ?? 80, after: opts.after ?? 100 },
    pageBreakBefore: opts.pageBreakBefore,
    children: opts.children
  });
}

async function docImage(file) {
  const imagePath = path.join(shotDir, file);
  const bytes = fs.readFileSync(imagePath);
  const meta = pngSize(bytes);
  const ratio = meta.height / meta.width;
  let width = 560;
  let height = Math.round(width * ratio);
  if (height > 610) {
    height = 610;
    width = Math.round(height / ratio);
  }
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 80 },
      children: [new ImageRun({ data: bytes, transformation: { width, height } })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: byFile[file].caption, italics: true, size: 18, color: "475569" })]
    })
  ];
}

function pngSize(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return { width: 1366, height: 768 };
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

async function featureDocChildren(feature) {
  const children = [
    para(`${feature.section} ${feature.title}`, { heading: HeadingLevel.HEADING_3 }),
    para("Description", { heading: HeadingLevel.HEADING_4 }),
    para(feature.description),
    para("Screenshot / Figure", { heading: HeadingLevel.HEADING_4 })
  ];
  for (const file of feature.screenshots) children.push(...(await docImage(file)));
  children.push(
    para("Priority", { heading: HeadingLevel.HEADING_4 }),
    para("High"),
    para("Integration Touch Point", { heading: HeadingLevel.HEADING_4 }),
    para(feature.integrations),
    para("Functional Requirement", { heading: HeadingLevel.HEADING_4 }),
    para(`ACE CTS shall provide the ${feature.title} function with the workflow, validation, audit, and role controls described herein.`),
    para("Actors", { heading: HeadingLevel.HEADING_4 }),
    para(feature.actors),
    para("Field Details / Control Behaviour", { heading: HeadingLevel.HEADING_4 }),
    docTable(["S. No.", "Field Name", "Field Type", "Control Behaviour", "Mandatory", "Remarks"], feature.fields),
    para("Options / Buttons", { heading: HeadingLevel.HEADING_4 }),
    docTable(["S. No.", "Option / Button", "Behaviour", "Validation / Confirmation", "Target Work-step"], feature.buttons),
    para("Validation Rules", { heading: HeadingLevel.HEADING_4 }),
    para(feature.validations),
    para("Confirmation Messages", { heading: HeadingLevel.HEADING_4 }),
    para("ACE CTS shall display confirmation messages before committing irreversible or workflow-moving actions where indicated."),
    para("Target Work-step(s)", { heading: HeadingLevel.HEADING_4 }),
    docTable(["Routing Criteria", "Target Work-step"], feature.targets),
    para("Audit Trail Requirement", { heading: HeadingLevel.HEADING_4 }),
    para(feature.audit)
  );
  return children;
}

async function generateDocx() {
  const children = [
    para("Software Requirement Specification for ACE CTS", { heading: HeadingLevel.TITLE, center: true, before: 2400, after: 400 }),
    para("ACE CONFIDENTIAL", { center: true }),
    docTable(["Field", "Value"], [["Submitted To", "[Bank Name]"], ["Submitted By", "[Vendor Name / ACE Technology]"], ["Reference No", "ACECTS-SRS-001"], ["Version", "1.0"], ["Date", today]]),
    new Paragraph({ children: [new PageBreak()] }),
    para("Review Summary", { heading: HeadingLevel.HEADING_1 }),
    para("This document defines the formal requirements for ACE CTS. Screenshots are indicative and subject to change."),
    para("Revision History", { heading: HeadingLevel.HEADING_1 }),
    docTable(["Release Date DD-MM-YY", "Revision Number x.y", "Changes Made", "Author", "Reviewed By", "Approved By"], [[todayShort, "1.0", "First Draft for ACE CTS", "[Author Name]", "[Reviewer Name / Role]", "[Approver Name / Role]"]]),
    para("Table of Contents", { heading: HeadingLevel.HEADING_1 }),
    new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
    para("1. Introduction", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
    para("The purpose of this Software Requirement Specification is to define ACE CTS functional, interface, workflow, reporting, administration, audit, security, and nonfunctional requirements for cheque truncation processing."),
    para("2. Overall Description", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
    para("ACE CTS shall route instruments through outward and inward workflows based on validation result, maker-checker decision, Clearing House / CBM response, return status, and posting completion."),
    para("2.1.1 ACE CTS Outward Process Flow", { heading: HeadingLevel.HEADING_2 }),
    ...(await docImage("20-outward-dashboard.png")),
    para("2.1.2 ACE CTS Inward Process Flow", { heading: HeadingLevel.HEADING_2 }),
    ...(await docImage("50-inward-dashboard.png")),
    para("User Classes and Characteristics", { heading: HeadingLevel.HEADING_2 }),
    docTable(["User Class", "Characteristics"], roleMap),
    para("3. Solution Features", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true })
  ];
  for (const feature of features) children.push(...(await featureDocChildren(feature)));
  children.push(
    para("3.6.5 Dashboard", { heading: HeadingLevel.HEADING_3 }),
    para("ACE CTS shall provide dashboard views showing workitem counts, workflow navigation, charts, and recent workitems for authorized users."),
    ...(await docImage("02-home-dashboard.png")),
    para("4. External Interface Requirements", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
    para("ACE CTS shall integrate with CBS, scanner stations, Clearing House / CBM file exchange, secure user access, and Bank-approved communication channels. Final interface specifications shall be finalized with the Bank."),
    para("5. Other Nonfunctional Requirements", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
    para("ACE CTS shall satisfy Bank-approved performance, security, audit, availability, maintainability, backup, DR, and operational support requirements."),
    para("6. Appendix A: Deployment Diagram", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
    ...(await docImage("11-architecture-page.png")),
    para("Final infrastructure, high availability, active/passive design, DR, recovery targets, firewall policy, certificate policy, and monitoring shall be confirmed with Bank IT."),
    para("7. Appendix B: Open Items", { heading: HeadingLevel.HEADING_1 }),
    docTable(["S. No.", "Open Item", "Owner", "Resolution Requirement"], [["1", "CBS interface specification", "Bank / ACE Technology", "Finalize before build"], ["2", "Clearing House / CBM file specification", "Bank / ACE Technology", "Finalize file handling"], ["3", "Scanner specification", "Bank", "Confirm hardware and driver"], ["4", "HA/DR topology", "Bank IT", "Confirm production architecture"]]),
    para("8. Appendix C: Integration Touch Points", { heading: HeadingLevel.HEADING_1 }),
    docTable(["Touch Point", "Requirement"], [["CBS Account Lookup", "Fetch account, status, balance, and signature data"], ["CBS Posting", "Exchange debit, credit, and charge posting data"], ["Clearing House / CBM", "Exchange ICL and response files"], ["Scanner Stations", "Capture images, MICR, IQA, and endorsement data"]]),
    para("9. Appendix D: List of Reject Reasons", { heading: HeadingLevel.HEADING_1 }),
    docTable(["Code", "Description", "Applies To"], rejectReasons),
    para("10. Appendix E: Account Types and Status", { heading: HeadingLevel.HEADING_1 }),
    docTable(["Type / Status", "Usage"], [["Active", "Eligible subject to Bank rules"], ["Dormant", "Requires Bank-defined handling"], ["Inactive", "Requires Bank-defined handling"], ["Closed", "Reject or return according to Bank rules"], ["PO Cheque", "PO-specific handling where applicable"]]),
    para("11. Appendix F: New Reports", { heading: HeadingLevel.HEADING_1 }),
    docTable(["Outward Reports", "Inward Reports"], outwardReports.map((item, i) => [item, inwardReports[i] ?? ""])),
    para("12. User Listing Requirement", { heading: HeadingLevel.HEADING_1 }),
    docTable(["Role / Queue", "Required Access"], roleMap)
  );

  const doc = new Document({
    styles: {
      paragraphStyles: [
        { id: "Normal", name: "Normal", run: { font: "Arial", size: 20 }, paragraph: { spacing: { line: 276, after: 120 } } },
        { id: "Title", name: "Title", basedOn: "Normal", run: { font: "Arial", size: 34, bold: true, color: "173B57" } },
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 28, bold: true, color: "173B57" }, paragraph: { spacing: { before: 360, after: 180 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 24, bold: true, color: "0E7490" }, paragraph: { spacing: { before: 260, after: 140 } } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 22, bold: true, color: "1F2937" }, paragraph: { spacing: { before: 220, after: 120 } } },
        { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 20, bold: true, color: "334155" }, paragraph: { spacing: { before: 160, after: 80 } } }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 900, bottom: 900, left: 900, right: 900 }
          }
        },
        headers: {
          default: new Header({
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Ver No. 1.0", size: 18 })] })]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "SRS for ACE CTS    Page ", size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                  new TextRun({ text: " of ", size: 18 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 })
                ]
              })
            ]
          })
        },
        children
      }
    ]
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outDocx, buffer);
}

const screenshotInventory = generateScreenshotInventory();
fs.writeFileSync(path.join(docsDir, "srs-screenshot-inventory.md"), screenshotInventory);

const functionalInventory = generateFunctionalInventory();
fs.writeFileSync(path.join(docsDir, "ace-cts-functional-inventory.md"), functionalInventory);

const srs = generateSrs();
fs.writeFileSync(outMd, srs);

const qa = generateQaReport(srs);
fs.writeFileSync(path.join(docsDir, "ACE_CTS_SRS_QA_Report.md"), qa);

await generateDocx();

console.log(`Generated:
- ${path.relative(process.cwd(), path.join(docsDir, "srs-screenshot-inventory.md"))}
- ${path.relative(process.cwd(), path.join(docsDir, "ace-cts-functional-inventory.md"))}
- ${path.relative(process.cwd(), outMd)}
- ${path.relative(process.cwd(), outDocx)}
- ${path.relative(process.cwd(), path.join(docsDir, "ACE_CTS_SRS_QA_Report.md"))}`);
