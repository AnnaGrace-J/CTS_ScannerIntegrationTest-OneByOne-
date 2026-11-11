# ACE CTS Functional Inventory

This inventory was prepared from the current ACE CTS demo application screens, workflow behaviour, state transitions, seed data, form controls, reports, admin settings, audit trail, archive, search, and architecture pages.

## Login Page
- Route: /login
- Module: General
- Actor(s): All active users
- Purpose: ACE CTS shall provide a secure login page for authenticated access to authorized functions.
- Screenshot file(s): 01-login-page.png
- Suggested SRS section: 3.1
- Description: ACE CTS shall provide a secure login page for authenticated access to authorized functions.
- Functional behaviour:
  - Login: Authenticates the user and opens the authorized landing page
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Username | Text | Editable | Yes | User login identifier |
| 2 | Password | Password | Editable / masked | Yes | User password |
| 3 | Forgot Password | Action link | Selectable | No | Initiates password assistance process |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Login | Authenticates the user and opens the authorized landing page | Invalid credentials shall show an alert | Role-based dashboard |
- Validations: Username and password shall be required. Invalid credentials shall not create a session.
- Integration touch points: ACE CTS shall validate user credentials against the Bank-approved identity source. Interface specifications shall be finalized with the Bank.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Valid login -> Authorized dashboard; Invalid login -> Login page with alert
- Audit events: Successful and unsuccessful access attempts shall be auditable subject to Bank security policy.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Logout
- Route: /outward/dashboard
- Module: General
- Actor(s): Authenticated users
- Purpose: ACE CTS shall provide user menu options for password change and logout.
- Screenshot file(s): 03-user-menu-logout-change-password.png
- Suggested SRS section: 3.2
- Description: ACE CTS shall provide user menu options for password change and logout.
- Functional behaviour:
  - Change Password: Opens password change page
  - Logout: Clears session and returns user to login
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | User Name | Display | Read-only | No | Shows logged-in user |
| 2 | Role | Display | Read-only | No | Shows assigned role |
| 3 | Branch | Display | Read-only | No | Shows assigned branch |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Change Password | Opens password change page | None | Change Password |
| 2 | Logout | Clears session and returns user to login | Session shall be ended | Login Page |
- Validations: Logout shall terminate the active session and prevent protected page access without re-authentication.
- Integration touch points: ACE CTS shall support integration with the Bank session management policy.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Logout selected -> Login Page
- Audit events: Logout shall be captured in audit trail.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Change Password
- Route: /change-password
- Module: General
- Actor(s): Authenticated users
- Purpose: ACE CTS shall allow a user to change his or her password after successful login.
- Screenshot file(s): 04-change-password-page.png
- Suggested SRS section: 3.3
- Description: ACE CTS shall allow a user to change his or her password after successful login.
- Functional behaviour:
  - Change: Submits password change
  - Exit: Leaves page without change
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | User Name | Text | Disabled | No | Current user |
| 2 | Old Password | Password | Editable | Yes | Existing password |
| 3 | New Password | Password | Editable | Yes | New password |
| 4 | Confirm Password | Password | Editable | Yes | Must match new password |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Change | Submits password change | New and confirm password must match | Dashboard |
| 2 | Exit | Leaves page without change | None | Dashboard |
- Validations: Old password shall be verified. New password and confirmation shall match before update.
- Integration touch points: ACE CTS shall apply the Bank password policy and identity-management interface when finalized.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Password changed -> Dashboard; Validation failed -> Change Password Page
- Audit events: Password change shall create an audit event without storing password values.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Outward Dashboard & Menu
- Route: /outward/dashboard
- Module: Outward
- Actor(s): Maker, Checker, Admin
- Purpose: ACE CTS shall display outward workitem counts, workflow tiles, process navigation, and current work queues.
- Screenshot file(s): 20-outward-dashboard.png
- Suggested SRS section: 3.4.1
- Description: ACE CTS shall display outward workitem counts, workflow tiles, process navigation, and current work queues.
- Functional behaviour:
  - Workflow Tile: Opens selected outward work-step
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Workitem Count | Display tile | Read-only | No | Shows queue count by work-step |
| 2 | Recent Workitems | Grid | Read-only | No | Shows outward items |
| 3 | Workitems Chart | Chart | Read-only | No | Shows queue trend by category |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Workflow Tile | Opens selected outward work-step | Role access applies | Selected queue |
- Validations: Dashboard counts shall refresh when workitems move between workflow stages.
- Integration touch points: ACE CTS shall present operational queue data from the application database.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Tile selected -> Selected outward work-step
- Audit events: Dashboard access may be logged according to Bank audit policy.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Scanning and Data Entry
- Route: /outward/scanning
- Module: Outward
- Actor(s): Maker, Admin
- Purpose: ACE CTS shall capture outward cheque images, create batches, fetch credit account details, validate MICR and amount data, and submit valid batches to authorization.
- Screenshot file(s): 21-outward-scanning-empty.png, 22-outward-scanning-new-batch-modal.png, 23-outward-scanning-with-cheques.png, 24-outward-scanning-iqa-modal.png, 25-outward-scanning-submit-success.png
- Suggested SRS section: 3.4.2
- Description: ACE CTS shall capture outward cheque images, create batches, fetch credit account details, validate MICR and amount data, and submit valid batches to authorization.
- Functional behaviour:
  - New Batch: Creates a new outward batch
  - Scan: Captures cheque images
  - Fetch Account: Retrieves credit account details
  - Submit: Validates and uploads batch
  - Save and Close: Stores draft batch
  - Discard Batch: Marks batch cheques discarded
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Account No. | Text | Editable | Yes | Credit account number |
| 2 | Account Status / Customer ID / Branch / Name | Display | Disabled | No | Returned by CBS lookup |
| 3 | Cheque No. | Text | Editable | Yes | MICR cheque number |
| 4 | MICR Account No. | Text | Editable | Yes | MICR account number |
| 5 | MICR Routing Number | Text | Editable | Yes | Routing number |
| 6 | Amount | Amount | Editable | Yes | Cheque amount |
| 7 | Cheque Date | Date | Editable | Yes | Issue date |
| 8 | Drawer Name / Remarks | Text | Editable | Conditional | Drawer and exception notes |
| 9 | Batch Amount | Amount | Editable | Yes | Must match calculated amount |
| 10 | Scanner | List | Selectable | Yes | Scanner station selection |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | New Batch | Creates a new outward batch | Batch details required | Scanning |
| 2 | Scan | Captures cheque images | Batch must be open | Scanning |
| 3 | Fetch Account | Retrieves credit account details | Account must exist and be valid | Scanning |
| 4 | Submit | Validates and uploads batch | IQA, duplicate, stale, in-house, routing, and amount checks | Outward Authorization |
| 5 | Save and Close | Stores draft batch | None | Scanning |
| 6 | Discard Batch | Marks batch cheques discarded | Remarks required for discarded items | Discard |
- Validations: ACE CTS shall validate duplicate cheques, stale cheques, in-house cheques, representment rules, routing number format, junk MICR characters, image quality flags, account fetch completion, and batch amount balancing.
- Integration touch points: ACE CTS shall integrate with cheque scanners and CBS. Scanner, CBS, and endorsement specifications shall be finalized with the Bank.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Valid batch submitted -> Outward Authorization; Discard selected -> Discard / archive; Validation failed -> Scanning and Data Entry
- Audit events: Batch creation, scan, account fetch, save, discard, IQA handling, and submit shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Outward Authorization
- Route: /outward/authorization
- Module: Outward
- Actor(s): Checker, Admin
- Purpose: ACE CTS shall provide FIFO checker review of submitted outward batches with image viewer, account data, cheque details, and maker-checker controls.
- Screenshot file(s): 26-outward-authorization-search.png, 27-outward-authorization-detail.png, 28-outward-authorization-confirmation.png
- Suggested SRS section: 3.4.3
- Description: ACE CTS shall provide FIFO checker review of submitted outward batches with image viewer, account data, cheque details, and maker-checker controls.
- Functional behaviour:
  - Authorize Batch: Accepts batch
  - Repair Batch: Sends batch to maker repair
  - Discard Batch: Discards batch
  - Exit: Leaves page
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Search Criteria | Text/date fields | Editable | No | Batch, branch, cheque, MICR, routing, account, amount, endorsement, type, value date, scan date |
| 2 | Credit Account Details | Display | Disabled | No | Account values |
| 3 | Cheque Details | Display/edit by permission | Disabled for authorization | No | Cheque data under review |
| 4 | Batch Details | Display | Disabled | No | Batch balancing details |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Authorize Batch | Accepts batch | Confirmation required and maker-checker restriction applies | Hold for ICL File Generation |
| 2 | Repair Batch | Sends batch to maker repair | Confirmation required | Outward Repair |
| 3 | Discard Batch | Discards batch | Confirmation required | Discard |
| 4 | Exit | Leaves page | Confirmation required | Dashboard |
- Validations: The same maker shall not authorize his or her own batch unless Bank policy allows an administrator override.
- Integration touch points: ACE CTS shall maintain maker-checker controls through the user and queue access model.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Authorized -> Hold for ICL File Generation; Repair requested -> Outward Repair; Discarded -> Discard
- Audit events: Authorization, repair return, and discard decisions shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Outward Repair
- Route: /outward/repair
- Module: Outward
- Actor(s): Maker, Admin
- Purpose: ACE CTS shall allow makers to correct checker-returned outward batches and send them back for authorization.
- Screenshot file(s): 29-outward-repair-search.png, 30-outward-repair-detail.png
- Suggested SRS section: 3.4.4
- Description: ACE CTS shall allow makers to correct checker-returned outward batches and send them back for authorization.
- Functional behaviour:
  - Complete: Completes repair and routes batch back
  - Exit: Leaves repair page
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Search Criteria | Text/date fields | Editable | No | Batch and cheque filters |
| 2 | Cheque Details | Text/date/checkbox | Editable | As applicable | Correctable fields |
| 3 | Remarks | Text | Editable | Conditional | Repair note |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Complete | Completes repair and routes batch back | No-change confirmation if no data changed | Outward Authorization |
| 2 | Exit | Leaves repair page | Confirmation required | Dashboard |
- Validations: ACE CTS shall require confirmation when repair is completed without field changes.
- Integration touch points: ACE CTS shall retain original and repaired values for audit review where required.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Repair complete -> Outward Authorization
- Audit events: Repair completion and changed-field status shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Hold for ICL File Generation
- Route: /outward/icl-generation
- Module: Outward
- Actor(s): Service, Admin
- Purpose: ACE CTS shall hold authorized outward instruments until the value date is due for ICL generation.
- Screenshot file(s): 31-outward-hold-for-icl-generation.png
- Suggested SRS section: 3.4.5
- Description: ACE CTS shall hold authorized outward instruments until the value date is due for ICL generation.
- Functional behaviour:
  - Run Service Tick: Processes due held items
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Item ID / Cheque No. | Grid | Read-only | No | Held items |
| 2 | Value Date | Date | Read-only | No | Generation eligibility |
| 3 | Reason / Status | Display | Read-only | No | Due or waiting status |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Run Service Tick | Processes due held items | Due-date rule applies | ICL File Generation |
- Validations: Only due value-date instruments shall advance for file generation.
- Integration touch points: ACE CTS shall use business date and clearing-cycle configuration approved by the Bank.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Due item -> ICL File Generation; Not due -> Hold for ICL File Generation
- Audit events: Service movement from hold to ICL generation shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## ICL File Generation / Forward Upload File
- Route: /outward/icl-generation
- Module: Outward
- Actor(s): Service, Admin
- Purpose: ACE CTS shall generate outward forward upload ICL files with cheque counts, total amount, generated date/time, file path, and upload status.
- Screenshot file(s): 32-outward-icl-generation.png
- Suggested SRS section: 3.4.6
- Description: ACE CTS shall generate outward forward upload ICL files with cheque counts, total amount, generated date/time, file path, and upload status.
- Functional behaviour:
  - Run Service Tick: Generates file for ready items
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | ICL File Name | Grid | Read-only | No | Generated file |
| 2 | Cheque Count | Number | Read-only | No | Included items |
| 3 | Total Amount | Amount | Read-only | No | File total |
| 4 | Local Path | Text | Read-only | No | Bank-approved output path |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Run Service Tick | Generates file for ready items | Eligible items required | Forward Upload File Response |
- Validations: File count and total amount shall reconcile with included instruments.
- Integration touch points: ACE CTS shall exchange ICL files with the Clearing House / CBM. File naming, encryption, signing, and transport specifications shall be finalized with the Bank.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: File generated -> Forward Upload File Response
- Audit events: Generated file name, count, amount, and path shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Forward Upload File Response
- Route: /outward/forward-upload-response
- Module: Outward
- Actor(s): Operations user, Admin
- Purpose: ACE CTS shall record Clearing House / CBM responses for outward forward upload files at file and per-cheque level.
- Screenshot file(s): 33-outward-forward-upload-response.png, 34-outward-forward-upload-response-exception.png
- Suggested SRS section: 3.4.7
- Description: ACE CTS shall record Clearing House / CBM responses for outward forward upload files at file and per-cheque level.
- Functional behaviour:
  - Accept All: Marks file cheques accepted
  - Reject All: Marks file cheques rejected
  - Accept with Exception: Accepts file with selected rejected cheques
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Search Criteria | Text fields | Editable | No | Cheque, amount, MICR, routing, credit account, file name |
| 2 | Reject Reason | List | Selectable | Conditional | Required for rejected response |
| 3 | File-level Remarks | Text | Editable | Conditional | Required for rejected response |
| 4 | Per-cheque Decision | List | Selectable | Yes | Accepted or Rejected |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Accept All | Marks file cheques accepted | Confirmation through action | Wait for Return |
| 2 | Reject All | Marks file cheques rejected | Reason and remarks required | Outward NAK Repair |
| 3 | Accept with Exception | Accepts file with selected rejected cheques | Rejected items require reason and remarks | Wait for Return / Outward NAK Repair |
- Validations: Rejected file or cheque decisions shall require reject reason and remarks.
- Integration touch points: ACE CTS shall receive or record Clearing House / CBM acknowledgement and negative acknowledgement response details.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Accepted -> Wait for Return; Rejected -> Outward NAK Repair; Accepted with exception -> Mixed routing by cheque decision
- Audit events: Response decision, reason, remarks, count, and file reference shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Outward NAK Repair
- Route: /outward/nak-repair
- Module: Outward
- Actor(s): Maker, Admin
- Purpose: ACE CTS shall allow repair of outward items rejected by Clearing House / CBM before regenerating upload files.
- Screenshot file(s): 35-outward-nak-repair.png
- Suggested SRS section: 3.4.8
- Description: ACE CTS shall allow repair of outward items rejected by Clearing House / CBM before regenerating upload files.
- Functional behaviour:
  - Accept: Completes NAK repair
  - Discard: Discards item
  - Exit: Leaves page
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Search Criteria | Text | Editable | No | Queue filters |
| 2 | Cheque Details | Text | Editable | Yes | Correctable cheque fields |
| 3 | NAK Reason / Remarks | Display | Disabled | No | Response reason and remarks |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Accept | Completes NAK repair | Valid data required | ICL File Generation |
| 2 | Discard | Discards item | Remarks required | Discard |
| 3 | Exit | Leaves page | None | Dashboard |
- Validations: Discard from NAK repair shall require remarks.
- Integration touch points: ACE CTS shall preserve Clearing House / CBM negative acknowledgement details with the repaired instrument.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Accepted -> ICL File Generation; Discarded -> Discard
- Audit events: NAK repair accept and discard actions shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Wait for Return
- Route: /outward/wait-for-return
- Module: Outward
- Actor(s): Service, Admin
- Purpose: ACE CTS shall hold CBM-accepted outward cheques while awaiting return download status before cutoff.
- Screenshot file(s): 36-outward-wait-for-return.png
- Suggested SRS section: 3.4.9
- Description: ACE CTS shall hold CBM-accepted outward cheques while awaiting return download status before cutoff.
- Functional behaviour:
  - Process Return Download: Applies returned status file
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Cheque No. | Grid | Read-only | No | Waiting cheque |
| 2 | Amount | Amount | Read-only | No | Cheque amount |
| 3 | ICL File | Text | Read-only | No | Forward file reference |
| 4 | Return Status | Display | Read-only | No | Pending, accepted, or rejected |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Process Return Download | Applies returned status file | Valid response required | Credit Posting / Work Exit |
- Validations: ACE CTS shall apply cutoff handling for items without return status according to Bank rules.
- Integration touch points: ACE CTS shall exchange return status files with Clearing House / CBM.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Return accepted -> Credit Posting; Return rejected -> Work Exit / return handling
- Audit events: Return download result and count shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Credit Posting
- Route: /outward/credit-posting
- Module: Outward
- Actor(s): Service, Admin
- Purpose: ACE CTS shall generate credit posting files for accepted outward cheques and complete the outward work item.
- Screenshot file(s): 37-outward-credit-posting.png
- Suggested SRS section: 3.4.10
- Description: ACE CTS shall generate credit posting files for accepted outward cheques and complete the outward work item.
- Functional behaviour:
  - Run Service Tick: Generates credit posting file
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Credit Account | Grid | Read-only | No | Beneficiary account |
| 2 | Amount | Amount | Read-only | No | Posting amount |
| 3 | Posting File Name | Grid | Read-only | No | Generated CBS file |
| 4 | Generated Path | Text | Read-only | No | Bank-approved output path |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Run Service Tick | Generates credit posting file | Eligible accepted items required | Work Exit |
- Validations: Posting file count and amount shall reconcile with included instruments.
- Integration touch points: ACE CTS shall integrate with CBS for outward credit posting. File format and response handling shall be finalized with the Bank.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Posting generated -> Work Exit
- Audit events: Credit posting file generation shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Outward Reports
- Route: /outward/reports
- Module: Outward
- Actor(s): Maker, Checker, Admin
- Purpose: ACE CTS shall provide outward clearing reports with search criteria, output preview, and controlled downloads.
- Screenshot file(s): 38-outward-reports-search.png, 39-outward-report-output.png
- Suggested SRS section: 3.4.11
- Description: ACE CTS shall provide outward clearing reports with search criteria, output preview, and controlled downloads.
- Functional behaviour:
  - Generate: Creates report output
  - Clear: Clears criteria
  - Download / PDF / Excel: Exports generated report
  - Exit: Leaves reports
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Select Report | List | Selectable | Yes | Outward report type |
| 2 | Batch ID / Maker ID / Branch / Bank / Cutoff | Search criteria | Editable | No | Filters report output |
| 3 | From Date / To Date | Date | Editable | Yes | Report period |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Generate | Creates report output | Report type required | Report output |
| 2 | Clear | Clears criteria | None | Search |
| 3 | Download / PDF / Excel | Exports generated report | Report must be generated | Download |
| 4 | Exit | Leaves reports | None | Dashboard |
- Validations: Report type shall be mandatory. Date criteria shall be applied to returned results.
- Integration touch points: ACE CTS shall provide report extracts in Bank-approved formats.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Generate -> Report output
- Audit events: Report generation and download shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Inward Dashboard & Menu
- Route: /inward/dashboard
- Module: Inward
- Actor(s): Maker, Checker, Admin
- Purpose: ACE CTS shall display inward queue counts, process navigation, workflow tiles, charts, and recent workitems.
- Screenshot file(s): 50-inward-dashboard.png
- Suggested SRS section: 3.5.1
- Description: ACE CTS shall display inward queue counts, process navigation, workflow tiles, charts, and recent workitems.
- Functional behaviour:
  - Workflow Tile: Opens selected inward work-step
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Workflow Tiles | Display/action | Selectable | No | Queue counts |
| 2 | Recent Workitems | Grid | Read-only | No | Inward items |
| 3 | Workitems Chart | Chart | Read-only | No | Queue distribution |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Workflow Tile | Opens selected inward work-step | Role access applies | Selected queue |
- Validations: Counts shall update when inward items move between work-steps.
- Integration touch points: ACE CTS shall present operational inward queue data from the application database.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Tile selected -> Selected inward work-step
- Audit events: Dashboard access may be logged according to Bank audit policy.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Read and Upload ICL File / Forward Download File
- Route: /inward/upload-icl
- Module: Inward
- Actor(s): Maker, Service, Admin
- Purpose: ACE CTS shall import inward forward download ICL files received from Clearing House / CBM and route instruments to technical verification.
- Screenshot file(s): 51-inward-upload-icl.png, 52-inward-upload-icl-imported-file.png
- Suggested SRS section: 3.5.2
- Description: ACE CTS shall import inward forward download ICL files received from Clearing House / CBM and route instruments to technical verification.
- Functional behaviour:
  - Generate Sample Forward Download File: Stages file name for upload
  - Run Upload Service: Imports file
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Forward Download File | File input | Selectable | Yes | ICL input file |
| 2 | Imported File Details | Grid | Read-only | No | File name, count, amount, status, error file |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Generate Sample Forward Download File | Stages file name for upload | None | Upload ICL |
| 2 | Run Upload Service | Imports file | File validation and duplicate checks | Technical Verification |
- Validations: ACE CTS shall validate file format, duplicate file reference, and duplicate cheque information.
- Integration touch points: ACE CTS shall exchange ICL files with Clearing House / CBM. Final interface specifications shall be finalized with the Bank.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Valid file -> Technical Verification; Invalid or duplicate file -> Error handling queue / audit
- Audit events: ICL import success and failure shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Technical Verification
- Route: /inward/technical-verification
- Module: Inward
- Actor(s): Maker, Admin
- Purpose: ACE CTS shall provide inward technical verification with cheque image, signature image, CBS account details, reject reason, and remarks.
- Screenshot file(s): 53-inward-technical-verification-search.png, 54-inward-technical-verification-detail.png, 55-inward-technical-verification-reject-modal.png
- Suggested SRS section: 3.5.3
- Description: ACE CTS shall provide inward technical verification with cheque image, signature image, CBS account details, reject reason, and remarks.
- Functional behaviour:
  - Accept: Accepts cheque
  - Reject: Rejects cheque
  - Refer: Refers cheque to checker
  - Run Cutoff Check: Applies cutoff auto-return rule
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Search Criteria | Text | Editable | No | Cheque, amount, MICR, routing, customer account |
| 2 | Account Details | Display | Disabled | No | Drawer account and balance |
| 3 | Cheque Details | Display | Disabled | No | Cheque and settlement details |
| 4 | Reject Reason / Remarks | List/text | Editable | Conditional | Required for Reject or Refer |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Accept | Accepts cheque | Confirmation required | Debit Posting |
| 2 | Reject | Rejects cheque | Reason and remarks required | Return ICL Creation |
| 3 | Refer | Refers cheque to checker | Reason and remarks required | Referral |
| 4 | Run Cutoff Check | Applies cutoff auto-return rule | Cutoff time applies | Return ICL Creation |
- Validations: Reject and refer shall require reason and remarks. PO handling may hide sensitive balance and signature details where applicable.
- Integration touch points: ACE CTS shall integrate with CBS for account, balance, status, stop payment, and signature details.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Accept -> Debit Posting; Reject -> Return ICL Creation; Refer -> Referral
- Audit events: Technical accept, reject, refer, and cutoff actions shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Debit Posting
- Route: /inward/debit-posting
- Module: Inward
- Actor(s): Service, Admin
- Purpose: ACE CTS shall generate debit posting files for accepted inward cheques.
- Screenshot file(s): 56-inward-debit-posting.png
- Suggested SRS section: 3.5.4
- Description: ACE CTS shall generate debit posting files for accepted inward cheques.
- Functional behaviour:
  - Run Debit Posting Service: Generates debit posting file
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Customer Account | Grid | Read-only | No | Account to debit |
| 2 | Amount | Amount | Read-only | No | Debit amount |
| 3 | Posting File Name / Count / Amount / Path | Grid | Read-only | No | Generated posting file details |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Run Debit Posting Service | Generates debit posting file | Eligible items required | Manual Return Maker |
- Validations: Posting file count and amount shall reconcile with accepted inward cheques.
- Integration touch points: ACE CTS shall integrate with CBS for debit posting. Interface specifications shall be finalized with the Bank.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Posted -> Manual Return Maker
- Audit events: Debit posting file generation and item inclusion shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Referral
- Route: /inward/referral
- Module: Inward
- Actor(s): Checker, Admin
- Purpose: ACE CTS shall allow branch/checker referral review of inward items with account/signature details.
- Screenshot file(s): 57-inward-referral-search.png, 58-inward-referral-detail.png
- Suggested SRS section: 3.5.5
- Description: ACE CTS shall allow branch/checker referral review of inward items with account/signature details.
- Functional behaviour:
  - Accept: Accepts referred cheque
  - Reject: Rejects referred cheque
  - Exit: Leaves page
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Search Criteria | Text | Editable | No | Queue filters |
| 2 | Account Details | Display | Disabled | No | Drawer account data |
| 3 | Reject Reason / Remarks | List/text | Editable | Conditional | Required for reject |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Accept | Accepts referred cheque | Confirmation required | Debit Posting |
| 2 | Reject | Rejects referred cheque | Reason and remarks required | Return ICL Creation |
| 3 | Exit | Leaves page | None | Dashboard |
- Validations: Referral reject shall require reason and remarks.
- Integration touch points: ACE CTS shall retrieve account and signature data from CBS or the Bank signature source.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Accept -> Debit Posting; Reject -> Return ICL Creation
- Audit events: Referral accept and reject shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Manual Cheque Return - Maker
- Route: /inward/manual-return-maker
- Module: Inward
- Actor(s): Maker, Admin
- Purpose: ACE CTS shall allow a maker to manually return an accepted inward cheque before cutoff.
- Screenshot file(s): 59-inward-manual-return-maker-search.png, 60-inward-manual-return-maker-detail.png
- Suggested SRS section: 3.5.6
- Description: ACE CTS shall allow a maker to manually return an accepted inward cheque before cutoff.
- Functional behaviour:
  - Reject: Submits maker return decision
  - Exit: Leaves page
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Search Criteria | Text | Editable | No | Queue filters |
| 2 | Reject Reason | List | Selectable | Yes | Return reason |
| 3 | Remarks | Text | Editable | Yes | Maker remarks |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Reject | Submits maker return decision | Reason and remarks required | Manual Return Checker |
| 2 | Exit | Leaves page | None | Dashboard |
- Validations: Manual return maker decision shall require reason and remarks.
- Integration touch points: ACE CTS shall apply cutoff and Bank return reason configuration.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Reject -> Manual Return Checker
- Audit events: Maker return decision shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Manual Cheque Return - Checker
- Route: /inward/manual-return-checker
- Module: Inward
- Actor(s): Checker, Admin
- Purpose: ACE CTS shall allow checker approval or rejection of manual return maker decisions.
- Screenshot file(s): 61-inward-manual-return-checker-search.png, 62-inward-manual-return-checker-detail.png
- Suggested SRS section: 3.5.7
- Description: ACE CTS shall allow checker approval or rejection of manual return maker decisions.
- Functional behaviour:
  - Accept: Accepts maker return decision
  - Reject: Rejects maker return decision
  - Run Cutoff Auto-Accept: Auto-accepts pending maker decisions after cutoff
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Search Criteria | Text | Editable | No | Queue filters |
| 2 | Last User Details | Display | Disabled | No | Maker decision details |
| 3 | Reject Reason / Remarks | Display/edit | Read-only or editable | Conditional | Return decision information |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Accept | Accepts maker return decision | Maker-checker rule applies | Return ICL Creation |
| 2 | Reject | Rejects maker return decision | Maker-checker rule applies | Manual Return Maker |
| 3 | Run Cutoff Auto-Accept | Auto-accepts pending maker decisions after cutoff | Cutoff rule applies | Return ICL Creation |
- Validations: The same user shall not check his or her own manual return decision unless Bank policy defines an administrator override.
- Integration touch points: ACE CTS shall apply Bank maker-checker and cutoff policy.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Accept -> Return ICL Creation; Reject -> Manual Return Maker
- Audit events: Manual return checker decision shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## ICL Return Upload File Creation
- Route: /inward/return-icl-generation
- Module: Inward
- Actor(s): Service, Admin
- Purpose: ACE CTS shall generate inward return upload ICL files for Pay/No Pay instruments.
- Screenshot file(s): 63-inward-return-icl-creation.png
- Suggested SRS section: 3.5.8
- Description: ACE CTS shall generate inward return upload ICL files for Pay/No Pay instruments.
- Functional behaviour:
  - Run Return ICL Service: Generates return upload file
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Ready Instruments | Grid | Read-only | No | Cheque, amount, pay/no pay, reason |
| 2 | Generated Return Upload Files | Grid | Read-only | No | File name, count, amount, time, path |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Run Return ICL Service | Generates return upload file | Eligible return items required | Return Upload File Response |
- Validations: Return file count and amount shall reconcile with included instruments.
- Integration touch points: ACE CTS shall exchange return ICL files with Clearing House / CBM.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: File generated -> Return Upload File Response
- Audit events: Return upload file generation shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Return Upload File Response
- Route: /inward/return-upload-response
- Module: Inward
- Actor(s): Operations user, Admin
- Purpose: ACE CTS shall capture Clearing House / CBM response for inward return upload files.
- Screenshot file(s): 64-inward-return-upload-response.png, 65-inward-return-upload-response-exception.png
- Suggested SRS section: 3.5.9
- Description: ACE CTS shall capture Clearing House / CBM response for inward return upload files.
- Functional behaviour:
  - Accept All: Accepts return upload response
  - Reject All: Rejects file response
  - Accept with Exception: Routes per-cheque exceptions
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Search Criteria | Text | Editable | No | Cheque, amount, MICR, routing, account, file |
| 2 | Reject Reason | List | Selectable | Conditional | Required for rejected response |
| 3 | File-level Remarks | Text | Editable | Conditional | Required for rejected response |
| 4 | Per-cheque Decision | List | Selectable | Yes | Accepted or rejected |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Accept All | Accepts return upload response | Confirmation through action | Charge Posting / Work Exit |
| 2 | Reject All | Rejects file response | Reason and remarks required | Inward NAK Repair |
| 3 | Accept with Exception | Routes per-cheque exceptions | Rejected items require reason and remarks | Mixed routing |
- Validations: Rejected response decisions shall require reason and remarks.
- Integration touch points: ACE CTS shall receive or record Clearing House / CBM return upload acknowledgement details.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Accepted -> Inward Charge Posting or Work Exit; Rejected -> Inward NAK Repair
- Audit events: Return response decisions shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Inward NAK Repair
- Route: /inward/nak-repair
- Module: Inward
- Actor(s): Maker, Admin
- Purpose: ACE CTS shall allow repair of inward return upload items rejected by Clearing House / CBM.
- Screenshot file(s): 66-inward-nak-repair.png
- Suggested SRS section: 3.5.10
- Description: ACE CTS shall allow repair of inward return upload items rejected by Clearing House / CBM.
- Functional behaviour:
  - Complete: Completes repair
  - Exit: Leaves page
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Search Criteria | Text | Editable | No | Queue filters |
| 2 | Cheque / Account Data | Display | Disabled | No | Cheque and NAK details |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Complete | Completes repair | Valid data required | Return ICL Creation |
| 2 | Exit | Leaves page | None | Dashboard |
- Validations: Only inward NAK repair queue items shall be available on this page.
- Integration touch points: ACE CTS shall retain Clearing House / CBM NAK details with the item.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Complete -> Return ICL Creation
- Audit events: Inward NAK repair completion shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Inward Charge Posting
- Route: /inward/charge-posting
- Module: Inward
- Actor(s): Service, Admin
- Purpose: ACE CTS shall generate charge posting files for inward items that require charge posting.
- Screenshot file(s): 67-inward-charge-posting.png
- Suggested SRS section: 3.5.11
- Description: ACE CTS shall generate charge posting files for inward items that require charge posting.
- Functional behaviour:
  - Run Charge Posting: Generates charge posting file
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Charge Amount | Amount | Read-only | No | Configured charge |
| 2 | Charge Posting Files | Grid | Read-only | No | File, count, total charge amount, path, status |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Run Charge Posting | Generates charge posting file | Eligible charge items required | Work Exit |
- Validations: Charge count and total amount shall reconcile with included items and configured charge amount.
- Integration touch points: ACE CTS shall integrate with CBS for charge posting.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Posting generated -> Work Exit
- Audit events: Charge posting generation shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Inward Reports
- Route: /inward/reports
- Module: Inward
- Actor(s): Maker, Checker, Admin
- Purpose: ACE CTS shall provide inward clearing reports with search criteria, output preview, and controlled downloads.
- Screenshot file(s): 68-inward-reports-search.png, 69-inward-report-output.png
- Suggested SRS section: 3.5.12
- Description: ACE CTS shall provide inward clearing reports with search criteria, output preview, and controlled downloads.
- Functional behaviour:
  - Generate: Creates report output
  - Clear: Clears criteria
  - Download / PDF / Excel: Exports generated report
  - Exit: Leaves reports
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Select Report | List | Selectable | Yes | Inward report type |
| 2 | Branch / Bank / Date Range | Search criteria | Editable | No | Filters report output |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Generate | Creates report output | Report type required | Report output |
| 2 | Clear | Clears criteria | None | Search |
| 3 | Download / PDF / Excel | Exports generated report | Report must be generated | Download |
| 4 | Exit | Leaves reports | None | Dashboard |
- Validations: Report type shall be mandatory. Date criteria shall be applied to returned results.
- Integration touch points: ACE CTS shall provide inward report extracts in Bank-approved formats.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Generate -> Report output
- Audit events: Report generation and download shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Search Interface
- Route: /search
- Module: General
- Actor(s): Maker, Checker, Admin
- Purpose: ACE CTS shall provide a general cheque search with process, routing, MICR, cheque, customer account, amount, date, and endorsement filters.
- Screenshot file(s): 05-cheque-search.png, 06-cheque-search-result-viewer.png
- Suggested SRS section: 3.6.4
- Description: ACE CTS shall provide a general cheque search with process, routing, MICR, cheque, customer account, amount, date, and endorsement filters.
- Functional behaviour:
  - Search: Runs search and displays result grid
  - Clear: Clears criteria
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Process Name | List | Selectable | No | All, outward, inward |
| 2 | Routing No. / MICR A/c No. / Cheque No. | Text | Editable | Conditional | Search identifiers |
| 3 | Customer A/c No. / Amount / Cheque Date / Endorsement Number | Text/date | Editable | Conditional | Additional filters |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Search | Runs search and displays result grid | At least one useful criterion should be supplied by policy | Search Result |
| 2 | Clear | Clears criteria | None | Search |
- Validations: Search criteria shall be applied exactly to available cheque records.
- Integration touch points: ACE CTS shall search indexed cheque and archive records according to retention policy.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Result selected -> Cheque image viewer
- Audit events: Search and image viewing may be audited based on Bank policy.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Archival
- Route: /admin/archive
- Module: General
- Actor(s): Admin
- Purpose: ACE CTS shall support archival lookup of terminal cheque records with associated images and audit trail.
- Screenshot file(s): 10-admin-archive.png
- Suggested SRS section: 3.6.2
- Description: ACE CTS shall support archival lookup of terminal cheque records with associated images and audit trail.
- Functional behaviour:
  - Rebuild Archive: Rebuilds archive index from completed records
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Archive Search | Search criteria | Editable | No | Process and reference filters |
| 2 | Archive Count | Display | Read-only | No | Number of archived records |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Rebuild Archive | Rebuilds archive index from completed records | Admin access required | Archive Browser |
- Validations: Only completed, exited, or discarded items shall be archived.
- Integration touch points: ACE CTS shall support Bank-approved archival storage, indexing, and retrieval.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Archived record selected -> Archive detail
- Audit events: Archive rebuild and record access shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Admin Module
- Route: /admin
- Module: Admin
- Actor(s): Admin
- Purpose: ACE CTS shall provide user management, role assignment, queue visibility, settings, audit log, service controls, archive access, and reset functions.
- Screenshot file(s): 07-admin-dashboard.png, 08-admin-settings.png, 09-admin-audit-log.png
- Suggested SRS section: 3.6.7
- Description: ACE CTS shall provide user management, role assignment, queue visibility, settings, audit log, service controls, archive access, and reset functions.
- Functional behaviour:
  - Save Settings: Saves configuration changes
  - Reset Demo Data: Restores configured seed state
  - Rebuild Archive: Rebuilds archive index
  - Archive: Opens archive browser
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Users and Role Assignment | Grid/list | Editable by admin | Yes | User role and status |
| 2 | Queue Access Management | Display | Read-only | No | Role-based queue access |
| 3 | Application Settings | Configuration | Editable by admin | Yes | Cutoff, poll interval, representment, routing, CBS/CBM settings |
| 4 | Audit Log | Grid | Read-only | No | Audit events |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
| 1 | Save Settings | Saves configuration changes | Valid values required | Admin |
| 2 | Reset Demo Data | Restores configured seed state | Admin confirmation policy recommended | Admin |
| 3 | Rebuild Archive | Rebuilds archive index | Admin access required | Archive |
| 4 | Archive | Opens archive browser | None | Archive Browser |
- Validations: Only administrators shall access admin functions. Settings shall be validated before saving.
- Integration touch points: ACE CTS shall support Bank-defined user, role, queue, parameter, and system-administration controls.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Settings saved -> Admin; Archive selected -> Archive Browser
- Audit events: User role updates, settings changes, archive rebuild, reset, and admin service actions shall be audited.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

## Architecture / Deployment
- Route: /architecture
- Module: Architecture
- Actor(s): Admin, Bank IT, Vendor implementation team
- Purpose: ACE CTS shall provide an architecture view for deployment discussion and final infrastructure confirmation.
- Screenshot file(s): 11-architecture-page.png
- Suggested SRS section: 6
- Description: ACE CTS shall provide an architecture view for deployment discussion and final infrastructure confirmation.
- Functional behaviour:
  - 
- Fields:
| S. No. | Field Name | Field Type | Editable / Disabled | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Runtime Boundaries | Diagram | Read-only | No | Logical deployment blocks |
| 2 | External Interfaces | Diagram | Read-only | No | Scanner, CBS, Clearing House / CBM |
- Buttons / Options:
| S. No. | Button / Option | Behaviour | Confirmation Message | Target Work-step |
| --- | --- | --- | --- | --- |
- Validations: Final infrastructure, HA/DR, network, security, and interface specifications shall be confirmed with Bank IT.
- Integration touch points: CBS, scanner stations, Clearing House / CBM, database, web/application tiers, DR environment.
- Workflow source: Previous configured ACE CTS work-step or authorized navigation.
- Workflow target: Architecture reviewed -> Implementation planning
- Audit events: Architecture page access may be audited under administrator activity policy.
- Notes for SRS: Describe implemented behaviour only; final Bank-specific interface details shall be confirmed during implementation.

