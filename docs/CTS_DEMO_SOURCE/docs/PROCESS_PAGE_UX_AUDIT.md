# ACE CTS Process Page UX Audit

Generated: 2026-06-23 21:35 Asia/Rangoon

Scope: current ACE CTS demo source in `D:\OneDrive\Documents\CTS DEMO`.

This audit identifies current residual visual similarity risk against legacy third-party CTS-style screens while preserving all business process behavior, role access, validations, workflow transitions, audit, archive, search, reports, localStorage, and mock service behavior.

## Audit Summary

| Risk | Current finding |
| --- | --- |
| High | None currently identified after the latest ACE page-level UX pass. |
| Medium | Dense cheque review/detail pages still require continued care because they naturally combine image review, search queues, and many banking fields. |
| Low | Dashboards, service consoles, reports, admin, archive, architecture, and import/posting pages now read as ACE workspace screens. |

## Residual Medium-Risk Screens

These screens are not currently high risk, but they remain the closest to traditional CTS layouts because their domain requires cheque images, dense grids, and maker/checker forms:

- Scanning & Data Entry
- Outward Authorization Detail
- Outward Repair Detail
- Technical Verification Detail
- Referral Detail
- Manual Return Maker Detail
- Manual Return Checker Detail
- Outward NAK Repair
- Inward NAK Repair

Recommended handling: keep the ACE operations header, metadata strips, summary metrics, rounded review workspace, modern queue grid, and sticky action bar. Avoid reverting to a flat full-page form with a plain table and image panel.

## Shared Visual Flags

| Flag | Current status | Follow-up rule |
| --- | --- | --- |
| Old-style form/table composition | Reduced to Medium on dense detail screens; Low elsewhere. | Keep forms inside ACE `FormPanel`/`FormSection`; keep grids as queue grids with row affordance. |
| Old teal/gray process panel look | Low. | Continue using ACE primary/background tokens, rounded panels, metadata cards, and restrained service consoles. |
| Old dashboard tile arrangement | Low. | Keep workflow swimlane/stepper and summary strips; do not restore arrow-tile dashboards. |
| Old image viewer layout | Medium on cheque-heavy screens. | Keep modern cheque review workspace, patterned canvas, rounded image frame, and signature card. |
| Old modal style | Low. | Use current `ConfirmModal` ACE dialog styling for confirmations. |
| Old yellow/dropdown style | Low. | Current shell and user menu use ACE styling; do not add legacy yellow user dropdowns. |
| Old grid style | Medium on queue-heavy pages. | Keep `SearchGrid` queue styling and empty states. |
| Old button arrangement | Medium on action-heavy detail pages. | Prefer header actions and `StickyActionBar`; avoid scattered button rows. |
| Copied captions/assets/names | Low. | Continue using ACE wording and generated placeholder cheque/signature assets only. |

## Outward Pages

| Page | Current route | Current components used | Current layout summary | Similarity risk | What must change visually | Business logic to preserve | New UX pattern recommendation | Related tests that must continue to pass |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Outward Dashboard | `/outward/dashboard` | `DashboardPage`, `OperationsHeader`, `QueueSummaryStrip`, `WorkflowSwimlane`, `SearchGrid`, `WorkitemsChart`, `DemoScenarioLauncher` | ACE dashboard with breadcrumbs, queue metrics, workflow swimlane, workitems chart, and scenario launcher controls. | Low | No major change required. Avoid returning to arrow-tile dashboard. | Counts from current workstep state; tile/card navigation; launcher hide/show and screenshot query hiding. | Keep ACE operations dashboard with summary strip and swimlane. | `pages.smoke.test.tsx` dashboard and launcher tests; workflow count tests. |
| Scanning & Data Entry | `/outward/scanning` | `OutwardScanningPage`, `OperationsHeader`, `QueueSummaryStrip`, `SearchGrid`, `FormPanel`, `StickyActionBar`, `ExceptionBanner`, page-local scanner and IQA modals | Split capture workspace: cheque image tabs and batch grid on left, account/cheque/batch/scanner panels on right, sticky submit/save actions. | Medium | Further reduce visual density by grouping field clusters and keeping the image viewer visually distinct from legacy capture panels. | New batch, open saved batch, scan simulation, UIC generation, account fetch, all submit validations, IQA modal, save, discard, submit to authorization, audit events. | ACE capture cockpit with scanner status, validation summary, and guided next-action banner. | Workflow utility tests; smoke test for `Outward Scanning Workspace`; manual scan-submit regression. |
| Outward Authorization Search | `/outward/authorization` | `OutwardBatchReviewPage mode="authorization"`, `OperationsHeader`, `QueueSummaryStrip`, `FormSection`, `SearchGrid` | FIFO batch search workspace with filters and batch result grid above detail area. | Medium | Keep filters collapsible/compact; avoid plain full-width search form above a flat table. | FIFO sorting, filters, batch selection, maker/checker role blocking. | Queue-first layout: summary metrics, collapsible filters, selectable batch grid. | Smoke process workspace tests; maker/checker access tests; transition tests. |
| Outward Authorization Detail | `/outward/authorization` | `ChequeImageViewer`, `SearchGrid`, `FormSection`, `StickyActionBar`, `ConfirmModal`, `StatusBadge` | Cheque review detail with image viewer, instruments grid, account/cheque/batch details, authorize/repair/discard actions. | Medium | Keep sticky actions and rounded review workspace; avoid dense legacy image-left/form-right without ACE metadata and summary context. | Same-maker restriction, authorize batch, repair batch, discard batch, discard cheque checkbox, remarks, audit events. | Reviewer cockpit with image review, batch health summary, and action confirmation drawer/modal. | Workflow transition tests; smoke tests; manual authorization/repair/discard regression. |
| Outward Repair Search | `/outward/repair` | `OutwardBatchReviewPage mode="repair"`, `OperationsHeader`, `QueueSummaryStrip`, `FormSection`, `SearchGrid` | Maker repair queue with search filters and batch result grid. | Medium | Keep queue language and metadata; avoid checker-search screen clone styling. | Search filters, batch loading, role access. | Repair queue workspace with exception-oriented summary strip. | Smoke route render; role access; repair transition tests. |
| Outward Repair Detail | `/outward/repair` | `ChequeImageViewer`, `SearchGrid`, `FormSection`, `StickyActionBar`, `ConfirmModal` | Editable cheque detail panels with image and instruments grid; complete returns batch to authorization. | Medium | Visually differentiate editable repair fields from read-only authorization fields using ACE field states and exception banner. | Editable repair fields, no-change confirmation, save changes, return to authorization, audit. | Exception repair workspace with changed-field indicator and sticky complete action. | Workflow transition tests; manual repair complete regression. |
| Hold for ICL File Generation | `/outward/icl-generation` | `OutwardIclGenerationPage`, `OperationsHeader`, `QueueSummaryStrip`, `ServiceControls`, `SearchGrid`, `StatusBadge` | Service console showing hold queue and value-date readiness. | Low | No major change required. Keep service console pattern. | Business date/value date rule; service tick; audit. | Service operations console with hold reason column and run-tick controls. | Workflow service transition tests; smoke test for file generation console. |
| ICL File Generation | `/outward/icl-generation` | Same route/component as hold view, `SearchGrid<ICLFile>` | Same console includes ready queue and generated forward file records. | Low | Keep generated file card/table distinct from hold queue. | Forward file generation, file metadata, movement to upload response, audit. | File generation console with file-status card and generated file grid. | Workflow transition tests; manual service tick regression. |
| Forward Upload File Response | `/outward/forward-upload-response` | `ForwardUploadResponsePage`, `OperationsHeader`, `FormSection`, `SearchGrid`, `SelectField`, `TextField`, `ServiceControls`, `ExceptionBanner` | Manual response workspace with file grid, response panel, per-cheque decision grid. | Low | Keep response panel modern; avoid old portal-response flat table. | Accept all, reject all, accept with exception, reason/remarks requirement, NAK routing, audit. | File response workspace with side response panel and per-item decision matrix. | Workflow transition tests; manual accepted/rejected response regression. |
| Outward NAK Repair | `/outward/nak-repair` | `OutwardNakRepairPage`, `OperationsHeader`, `FormSection`, `SearchGrid`, `ChequeImageViewer`, `StickyActionBar`, `ExceptionBanner` | Repair queue with cheque image and editable details. | Medium | Keep exception-focused header and avoid plain NAK form clone. | Edit allowed fields, accept back to file generation, discard with mandatory remarks, audit. | NAK exception workspace with repair reason panel and sticky accept/discard actions. | Workflow transition tests; manual NAK repair regression. |
| Wait for Return | `/outward/wait-for-return` | `WaitForReturnPage`, `OperationsHeader`, `ServiceRunPanel`, `SearchGrid`, `ServiceControls` | Return status service console with accepted/rejected simulation buttons. | Low | No major change required. | Return download simulation, accepted to credit posting, rejected to work exit, cutoff behavior. | Return status console with service actions and pending grid. | Workflow transition tests; manual return status regression. |
| Credit Posting | `/outward/credit-posting` | `CreditPostingPage`, `OperationsHeader`, `ExceptionBanner`, `SearchGrid`, `ServiceControls`, `StatusBadge` | Posting service console with warning banner, accepted cheque grid, posting file grid. | Low | No major change required. | Posting file generation, warning-only connectivity simulation, move to work exit, audit/archive. | Posting console with file-status summary and audit trail link. | Workflow transition/archive tests; manual posting regression. |
| Outward Reports | `/outward/reports` | `ReportsPage direction="outward"`, `OperationsHeader`, `QueueSummaryStrip`, `FormSection`, `StickyActionBar`, `SearchGrid` | Reporting workspace with report criteria, export buttons, bank-style report header and results. | Low | Keep report preview distinct; avoid plain search-and-grid report screen. | Required report selection, filters, totals, CSV/PDF/Excel demo exports, audit. | Report builder with preview panel, totals, and export toolbar. | Smoke reports test; manual report generate/export regression. |

## Inward Pages

| Page | Current route | Current components used | Current layout summary | Similarity risk | What must change visually | Business logic to preserve | New UX pattern recommendation | Related tests that must continue to pass |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Inward Dashboard | `/inward/dashboard` | `DashboardPage`, `OperationsHeader`, `QueueSummaryStrip`, `WorkflowSwimlane`, `SearchGrid`, `WorkitemsChart`, `DemoScenarioLauncher` | ACE dashboard with metrics, workflow swimlane, pending items, and workitems chart. | Low | No major change required. Avoid returning to tile/arrow dashboard. | Counts from inward worksteps, route navigation, launcher visibility. | Keep ACE operations dashboard with inward-specific queue health. | Smoke dashboard tests; workflow count tests. |
| Upload ICL / Forward Download File | `/inward/upload-icl` | `InwardUploadIclPage`, `OperationsHeader`, `QueueSummaryStrip`, `SearchGrid`, `ServiceControls`, `ExceptionBanner` | Import console with dropzone, sample generator, upload service action, imported file grid. | Low | No major change required. | Sample file generation, duplicate validation, error file state, import to technical verification, audit. | Service import console with file status metrics and upload action. | Smoke process workspace tests; manual upload service regression. |
| Technical Verification Search | `/inward/technical-verification` | `InwardTechnicalVerificationPage`, `OperationsHeader`, `QueueSummaryStrip`, `FormSection`, `SearchGrid` | Search/filter section and technical verification queue grid above detail workspace. | Medium | Keep search compact; avoid old filter form dominating first viewport. | Filters, row selection, CBS mock lookup, cutoff action. | Verification queue workspace with collapsible filter and selected-cheque summary. | Smoke technical verification test; role/access tests. |
| Technical Verification Detail | `/inward/technical-verification` | `ChequeImageViewer`, signature panel, `FormSection`, `SelectField`, `TextField`, `StickyActionBar`, `ConfirmModal`, `ExceptionBanner` | Cheque image and signature review with account, cheque, rejection detail panels and accept/reject/refer actions. | Medium | Keep signature viewer and PO hidden-state treatment modern; avoid old image-plus-form composition. | Account lookup, balance/signature hiding for PO, accept/reject/refer routing, reject reason/remarks, cutoff mapping, audit. | Technical review cockpit with image, signature, account risk, and sticky decision actions. | Smoke test; workflow transition tests; manual accept/reject/refer regression. |
| Debit Posting | `/inward/debit-posting` | `InwardDebitPostingPage`, `OperationsHeader`, `SearchGrid`, `StatusBadge` | Automated posting console with service action, accepted cheque grid, posting file grid. | Low | No major change required. | Debit posting file creation, no response read, move to manual return maker, audit. | Posting service console with file-status summary. | Workflow transition tests; manual debit posting regression. |
| Referral Search | `/inward/referral` | `InwardReferralPage`, `OperationsHeader`, `QueueSummaryStrip`, `SearchPanel`, `SearchGrid` | Branch-scoped referral queue with filters and result grid. | Medium | Keep branch/routing scope visible; avoid old checker queue layout. | Branch/routing visibility, filters, row selection. | Branch-scoped referral workspace with queue metrics. | Role/access tests; manual referral visibility regression. |
| Referral Detail | `/inward/referral` | `DetailLayout`, `ChequeImageViewer`, signature panel, `FormSection`, `StickyActionBar`, `ConfirmModal` | Detail workspace with cheque image/signature, account/cheque/reason panels, accept/reject actions. | Medium | Distinguish referral review from technical verification with clear checker-review context. | Accept/reject routing, reason/remarks requirement, PO hidden sensitive data, audit. | Referral decision cockpit with branch context and sticky checker actions. | Workflow transition tests; manual referral accept/reject regression. |
| Manual Return Maker Search | `/inward/manual-return-maker` | `ManualReturnPage mode="maker"`, `OperationsHeader`, `SearchPanel`, `SearchGrid` | Maker queue for accepted cheques eligible for manual return before cutoff. | Medium | Keep maker role and cutoff context visible. | Filters, row selection, maker role restriction. | Maker work queue with cutoff metadata and selected item summary. | Role/access tests; manual return maker transition tests. |
| Manual Return Maker Detail | `/inward/manual-return-maker` | `DetailLayout`, `ChequeImageViewer`, signature panel, `FormSection`, `StickyActionBar`, `ConfirmModal` | Cheque detail with reject reason/remarks and maker reject action. | Medium | Keep detail panels modern; avoid old full-page cheque rejection form. | Reject reason/remarks required, send to checker, audit. | Maker decision workspace with validation summary and sticky reject action. | Workflow transition tests; manual maker reject regression. |
| Manual Return Checker Search | `/inward/manual-return-checker` | `ManualReturnPage mode="checker"`, `OperationsHeader`, `SearchPanel`, `SearchGrid` | Checker queue for maker return decisions with cutoff auto-accept action. | Medium | Keep checker review context distinct from maker screen. | Filters, row selection, cutoff auto-accept, maker/checker control. | Checker approval workspace with queue metrics and cutoff action. | Role/access tests; manual checker transition tests. |
| Manual Return Checker Detail | `/inward/manual-return-checker` | `DetailLayout`, `ChequeImageViewer`, signature panel, `FormSection`, `StickyActionBar`, `ConfirmModal` | Checker detail with accept/reject maker decision actions. | Medium | Keep maker decision status and last user details prominent. | Checker accept moves to return creation, checker reject returns to maker as accepted, same-user restriction, audit. | Checker decision cockpit with maker trail panel and sticky actions. | Workflow transition tests; manual checker accept/reject regression. |
| Return ICL Creation | `/inward/return-icl-generation` | `ReturnIclCreationPage`, `OperationsHeader`, `SearchGrid` | Return file service console with ready instrument grid and generated return upload file grid. | Low | No major change required. | Collate pay/no-pay instruments, generate file, move to response, audit. | Return file creation console with file-status card. | Workflow transition tests; manual return file generation regression. |
| Return Upload File Response | `/inward/return-upload-response` | `ReturnUploadResponsePage`, `OperationsHeader`, `FormSection`, `SearchGrid`, `SelectField`, `TextField`, `ExceptionBanner` | Manual return response workspace with file grid, response side panel, per-cheque decision grid. | Low | Keep response side panel and decision matrix. | Accept/reject/exception handling, reason/remarks requirement, charge posting/work exit routing, NAK routing, audit. | Return response workspace with file-level and item-level controls. | Smoke process workspace test; workflow transition tests. |
| Inward NAK Repair | `/inward/nak-repair` | `InwardNakRepairPage`, `OperationsHeader`, `SearchGrid`, `ChequeImageViewer`, `FormSection`, `StickyActionBar`, `StatusBadge` | NAK repair queue with cheque image and read-only account/NAK detail, complete action. | Medium | Keep exception context prominent and avoid flat repair detail form. | Complete sends back to return file creation, audit. | NAK repair workspace with reason panel and completion action. | Workflow transition tests; manual inward NAK repair regression. |
| Inward Charge Posting | `/inward/charge-posting` | `InwardChargePostingPage`, `OperationsHeader`, `SearchGrid`, `StatusBadge` | Charge posting console with queue grid, charge amount, and generated file grid. | Low | No major change required. | Charge posting file generation, move completed items to work exit, audit/archive. | Charge posting service console with file summary. | Workflow transition/archive tests; manual charge posting regression. |
| Inward Reports | `/inward/reports` | `ReportsPage direction="inward"`, `OperationsHeader`, `QueueSummaryStrip`, `FormSection`, `StickyActionBar`, `SearchGrid` | Reporting workspace with inward report criteria, export toolbar, totals, preview grid. | Low | Keep report builder style. | Required report selection, filters, totals, demo downloads, audit. | Report builder with preview panel and export toolbar. | Smoke reports/search test; manual inward report export regression. |

## General Pages

| Page | Current route | Current components used | Current layout summary | Similarity risk | What must change visually | Business logic to preserve | New UX pattern recommendation | Related tests that must continue to pass |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cheque Search | `/search` | `SearchPage`, `OperationsHeader`, `QueueSummaryStrip`, `FormSection`, `StickyActionBar`, `SearchGrid` | Search workspace with required filters, results grid, and front/rear image retrieval panel. | Low | Keep image panel rounded and separate from search criteria; avoid old archive retrieval layout. | Required filters, outward/inward search, row click image retrieval, audit event. | Search workspace with summary metrics and image preview panel. | Smoke reports/search test; manual search regression. |
| Admin Settings | `/admin` | `AdminPage`, `OperationsHeader`, `QueueSummaryStrip`, `FormSection`, `SearchGrid`, `DemoScenarioLauncher`, `ServiceControls` | Admin console with users, queue access, settings, demo controls, reject reasons, archive status. | Low | No major change required. Keep settings sections separated and avoid plain admin table page. | Admin-only access, user role updates, settings save, launcher setting, reset, service tick, audit. | Admin console with grouped settings and operational controls. | Smoke admin test; launcher tests; settings/reset transition tests. |
| Audit Log | `/admin` | `AdminPage`, `AuditTrailPanel`, `SearchGrid` | Audit trail panel appears after settings and archive status on admin page. | Low | Consider a future dedicated audit route only if needed; current panel is visually consistent. | Audit event append order, setting/update/reset/workflow audit records. | Audit timeline panel with filters if volume grows. | Store transition tests; manual audit event checks. |
| Archive | `/admin/archive` | `ArchivePage`, `OperationsHeader`, `QueueSummaryStrip`, `FormSection`, `SearchGrid`, `AuditTrailPanel` | Archive browser with filters, archived cheque grid, image detail, and audit snapshot. | Low | Keep archive detail modern; avoid old document retrieval style. | Archive rebuild, terminal cheque records, images, audit trail snapshots. | Archive browser with record summary and document preview panel. | Smoke archive test; archive creation transition tests. |
| Architecture | `/architecture` | `ArchitecturePage`, `OperationsHeader`, `ArchitectureCanvas`, icon cards | ACE architecture canvas with mocked integration boundaries. | Low | No major change required. Do not add copied diagrams/assets. | Informational page only; no workflow logic. | Original ACE topology canvas with mock boundary cards. | Smoke route render; IP cleanup audit. |

## High-Risk Identification

Current high-risk screens: none.

Previously high-risk screens have been reduced to Medium by the current ACE operations shell and shared components. The remaining Medium screens should stay on the redesign watchlist because their necessary cheque-review patterns can drift toward older CTS form compositions if future changes remove:

- `OperationsHeader`
- `QueueSummaryStrip`
- `FormPanel`/`FormSection`
- `SearchGrid`
- `ChequeImageViewer`
- `StickyActionBar`
- `ConfirmModal`
- `ExceptionBanner`

## Business Logic Preservation Checklist

Every page above must preserve:

- Existing route and role-based direct URL protection.
- Maker/checker separation and same-user restrictions.
- Existing workflow states and transitions.
- Existing validation rules and mandatory reason/remarks behavior.
- Existing localStorage state persistence and reset behavior.
- Existing seed data shape.
- Existing audit event creation.
- Existing archive creation for terminal items.
- Existing report/search/export behavior.
- Existing mock scanner, mock service tick, mock account lookup, and mock response behavior.
- Existing screenshot mode and demo launcher visibility behavior.

## Test Coverage Map

| Test area | File |
| --- | --- |
| Workflow utilities | `src/domain/workflow.test.ts` |
| Workflow transitions, archive creation, launcher reset | `src/store/workflowTransitions.test.ts` |
| Major page smoke rendering, launcher visibility, redesigned process headings | `src/pages/pages.smoke.test.tsx` |
| SRS screenshot capture | `screenshots/ace-cts-srs-screenshots.spec.ts` |
| IP/text cleanup scan | `scripts/audit-ip-clean.mjs` |

## Recommended Next Visual QA Pass

Use browser screenshots at `1366x768` and `1920x1080` for the Medium-risk detail pages. Confirm:

- No table or form block dominates the first viewport without ACE context.
- Sticky actions do not cover workflow buttons or table rows.
- Image viewer, signature viewer, and detail panels remain visually distinct.
- Confirm modals use ACE dialog styling.
- Report/search/archive grids fit without awkward horizontal overflow beyond intended table scrolling.
- Scenario launcher is hidden when `?srsMode=true` or `?hideDemoLauncher=true`.
