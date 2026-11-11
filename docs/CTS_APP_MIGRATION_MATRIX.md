# CTS demo to CTS.App migration matrix

This matrix tracks the page-level migration from `docs/CTS_DEMO_SOURCE` into the Blazor `CTS.App` project. All demo routes are now represented by dedicated Razor pages. Operational pages share `WorkflowWorkspace.razor` for consistent API integration, accessibility, light/dark appearance, and workflow actions while retaining route-specific content and controls.

| Area | Demo route | CTS.App implementation | Status |
| --- | --- | --- | --- |
| Access | `/login` | `Login.razor` | Migrated |
| Access | `/change-password` | `ChangePassword.razor` | Migrated |
| Outward | `/outward/dashboard` | `OutwardDashboard.razor` | Migrated |
| Outward | `/outward/scanning` | `OutwardScanning.razor` | Migrated |
| Outward | `/outward/authorization` | `OutwardAuthorization.razor` | Migrated |
| Outward | `/outward/repair` | `OutwardRepair.razor` | Migrated |
| Outward | `/outward/hold-for-icl-generation` | `OutwardHoldForIcl.razor` | Migrated |
| Outward | `/outward/icl-generation` | `OutwardIclGeneration.razor` | Migrated |
| Outward | `/outward/forward-upload-response` | `ForwardUploadResponse.razor` | Migrated |
| Outward | `/outward/nak-repair` | `OutwardNakRepair.razor` | Migrated |
| Outward | `/outward/wait-for-return` | `WaitForReturn.razor` | Migrated |
| Outward | `/outward/credit-posting` | `CreditPosting.razor` | Migrated |
| Outward | `/outward/reports` | `Reports.razor` | Migrated |
| Inward | `/inward/dashboard` | `InwardDashboard.razor` | Migrated |
| Inward | `/inward/upload-icl` | `InwardUploadIcl.razor` | Migrated |
| Inward | `/inward/technical-verification` | `InwardTechnicalVerification.razor` | Migrated |
| Inward | `/inward/debit-posting` | `InwardDebitPosting.razor` | Migrated |
| Inward | `/inward/referral` | `InwardReferral.razor` | Migrated |
| Inward | `/inward/manual-return-maker` | `ManualReturnMaker.razor` | Migrated |
| Inward | `/inward/manual-return-checker` | `ManualReturnChecker.razor` | Migrated |
| Inward | `/inward/return-icl-generation` | `ReturnIclGeneration.razor` | Migrated |
| Inward | `/inward/return-upload-response` | `ReturnUploadResponse.razor` | Migrated |
| Inward | `/inward/nak-repair` | `InwardNakRepair.razor` | Migrated |
| Inward | `/inward/charge-posting` | `InwardChargePosting.razor` | Migrated |
| Inward | `/inward/reports` | `Reports.razor` | Migrated |
| General | `/search` | `Search.razor` | Migrated |
| Administration | `/admin` | `Admin.razor` | Migrated |
| Administration | `/admin/archive` | `Archive.razor` | Migrated |
| Reference | `/architecture` | `Architecture.razor` | Migrated |

The automated route-coverage test in `CTS.App.Tests/Pages/DemoRouteMigrationTests.cs` prevents a future migration regression.
