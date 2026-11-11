# ACE CTS Business Logic Regression Checklist

Generated for the ACE CTS Workspace page-level UX redesign.

## Regression Result

Overall status: **PASS**

The UI redesign did not change the business workflow, maker/checker controls, workflow state transitions, validation utilities, audit logging, archive creation, settings persistence, report generation, search preview, or reset behavior.

## Automated Test Evidence

| Test file | Coverage |
| --- | --- |
| `src/store/businessLogicRegression.test.ts` | End-to-end store workflow regression for authentication, outward clearing, inward clearing, settings, audit, archive, and reset behavior. |
| `src/store/workflowTransitions.test.ts` | Existing workflow transition checks for scan submit, CBM rejection, archive creation, inward technical reject, and reset of demo launcher settings. |
| `src/domain/workflow.test.ts` | Validation utilities, MICR parsing, routing validation, duplicate/representment detection, stale cheque rule, and dashboard counts. |
| `src/pages/pages.smoke.test.tsx` | Route rendering, scenario launcher visibility, reports/download audit events, and cheque search image preview. |
| `src/components/operations/operations.smoke.test.tsx` | Shared redesigned process components: headers, collapsible filters, action buttons, status pills, cheque/signature viewers. |

## Authentication

| Item | Status | Evidence |
| --- | --- | --- |
| Login works | PASS | `businessLogicRegression.test.ts` validates valid and invalid mock credentials. |
| Logout works | PASS | `businessLogicRegression.test.ts` validates session clears and audit is written. |
| Change password works | PASS | `businessLogicRegression.test.ts` validates simulated password change and audit event. |
| Role-based access works | PASS | `businessLogicRegression.test.ts` validates maker/checker/admin route access rules. |

## Outward

| Item | Status | Evidence |
| --- | --- | --- |
| Scan new batch | PASS | Regression creates a new outward batch through `saveScanningBatch`. |
| Account fetch works | PASS | Regression validates account lookup target and account validation utility. |
| Scanner mock works | PASS | Regression validates generated scanned cheques include placeholder images and UIC values. |
| Batch validation works | PASS | `workflow.test.ts` covers MICR, routing, duplicate, representment, and stale cheque validation utilities. |
| Submit to authorization works | PASS | Regression submits batch and verifies `OUTWARD_AUTHORIZATION`. |
| Maker cannot authorize own batch | PASS | Regression validates maker cannot access `/outward/authorization`. |
| Checker can authorize batch | PASS | Regression authorizes as checker and verifies `HOLD_FOR_ICL_GENERATION`. |
| Checker can send batch to repair | PASS | Regression sends submitted batch to `OUTWARD_REPAIR`. |
| Maker can repair and return to authorization | PASS | Regression completes repair as maker and verifies return to `OUTWARD_AUTHORIZATION`. |
| ICL generation works | PASS | Regression runs outward service tick and verifies forward upload file creation/routing. |
| Forward upload response accept all works | PASS | Regression accepts all generated file cheques and verifies `WAIT_FOR_RETURN`. |
| Forward upload response reject all works | PASS | Regression rejects scenario file and verifies `OUTWARD_NAK_REPAIR`. |
| Accept with exception works | PASS | Regression accepts one cheque and rejects another in one response. |
| Outward NAK repair complete works | PASS | Regression accepts NAK repair and verifies return to `ICL_FILE_GENERATION`. |
| Wait for return accepted works | PASS | Regression simulates accepted return and verifies `CREDIT_POSTING`. |
| Credit posting works | PASS | Regression runs service tick and verifies `WORK_EXIT` plus archive. |
| Discard paths work | PASS | Regression covers NAK cheque discard and batch discard to `DISCARD`. |

## Inward

| Item | Status | Evidence |
| --- | --- | --- |
| Upload/generate forward download ICL works | PASS | Regression imports a fake forward download ICL and verifies technical verification workitems. |
| Technical verification accept works | PASS | Regression accepts normal inward cheque and verifies `DEBIT_POSTING`. |
| Technical verification reject works | PASS | Regression rejects technical item and verifies `RETURN_ICL_CREATION`. |
| Technical verification refer works | PASS | Regression refers technical item and verifies `REFERRAL`. |
| Debit posting works | PASS | Regression runs debit posting and verifies `MANUAL_RETURN_MAKER`. |
| Referral accept/reject works | PASS | Regression covers referral accept to debit posting and reject to return ICL. |
| Manual return maker works | PASS | Regression maker rejects accepted inward cheque and verifies `MANUAL_RETURN_CHECKER`. |
| Manual return checker accept/reject works | PASS | Regression covers checker reject back to maker and checker accept to return ICL. |
| Return ICL creation works | PASS | Regression generates return ICL file and verifies `RETURN_UPLOAD_FILE_RESPONSE`. |
| Return upload response accept/reject/exception works | PASS | Regression covers accepted response to charge posting, rejected response to NAK repair, and mixed exception response. |
| Inward NAK repair complete works | PASS | Regression completes inward NAK repair and verifies `RETURN_ICL_CREATION`. |
| Charge posting works | PASS | Regression runs charge posting and verifies `WORK_EXIT` plus archive. |

## General

| Item | Status | Evidence |
| --- | --- | --- |
| Reports generate | PASS | `pages.smoke.test.tsx` generates an outward report. |
| Downloads work | PASS | `pages.smoke.test.tsx` exercises CSV, PDF demo, and Excel demo export actions and verifies audit events. |
| Search opens cheque image viewer | PASS | `pages.smoke.test.tsx` renders cheque search and verifies synthetic cheque image preview. |
| Archive contains completed/discarded cheques | PASS | Regression verifies archive records for `WORK_EXIT` and `DISCARD`. |
| Audit events are written | PASS | Regression verifies audit growth and named report/export/settings events. |
| Admin settings save | PASS | Regression updates settings and verifies persisted store values plus audit. |
| Reset demo data works | PASS | Regression resets demo data and verifies default settings and cleared archive. |

## Commands

Run these before final screenshots:

```powershell
npm.cmd run build
npx.cmd vitest run --config vitest.config.ts --pool forks --poolOptions.forks.singleFork --cache=false
npm.cmd run audit:ip-clean
```

## Open Failures

None.
