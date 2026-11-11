# ACE CTS Workspace

ACE CTS Workspace is a clickable mock application for cheque truncation operations. It uses generated placeholder cheque/signature images, seed data, Zustand state, and LocalStorage only.

No real customer data, bank data, scanner, clearing house portal, CBS, posting service, or production integration is used.

## Installation

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://127.0.0.1:5173
```

On Windows PowerShell, use `npm.cmd install` and `npm.cmd run dev` if script execution policy blocks `npm`.

## Login Credentials

All mock users use password `password`.

| Username | Role | Typical use |
| --- | --- | --- |
| `maker1` | MAKER | Outward scanning, repair, NAK repair |
| `checker1` | CHECKER | Outward authorization |
| `inwardmaker1` | MAKER | Inward technical verification, manual return maker |
| `inwardchecker1` | CHECKER | Referral, manual return checker |
| `admin1` | ADMIN | All pages, settings, scenarios, reset |

## Roles

- `MAKER`: data entry, scanning, repair, technical verification, manual return maker, NAK repair.
- `CHECKER`: authorization, referral, manual return checker.
- `ADMIN`: all pages, user/queue/settings/admin tools.
- `SERVICE`: background audit identity only.

Direct URLs are also role-checked. Unauthorized users see an access denied page.

## Demo Scenario Launcher

The launcher appears on the Home dashboard and Admin page unless disabled in Admin settings or hidden with `?srsMode=true`. It stages safe local demo data and opens the first page of the scenario.

- Scenario A: Happy-path outward clearing
- Scenario B: Outward rejected by clearing response -> NAK repair -> regenerate
- Scenario C: Inward technical verification reject
- Scenario D: Inward referral accept
- Scenario E: Manual return maker/checker reject
- Scenario F: Cutoff auto-return simulation

When a scenario is active, a guided banner shows step indicators and the next suggested action on each page.

## Full Outward Walkthrough

Fastest path: log in as `admin1`, open Home, launch Scenario A.

1. `/outward/scanning`: create or open a batch, scan demo cheques, fetch account details, and submit.
2. `/outward/authorization`: authorize the batch. Maker/checker separation is enforced for non-admin users.
3. `/outward/icl-generation`: click Run Service Tick to move due items and generate a fake forward ICL file.
4. `/outward/forward-upload-response`: choose Accept All for the clearing response.
5. `/outward/wait-for-return`: simulate return download as Accepted.
6. `/outward/credit-posting`: click Run Service Tick to generate the credit posting file and move cheques to Work Exit.

Rejected path: launch Scenario B, reject the forward upload response, repair the NAK item, then run Service Tick to regenerate the upload file.

## Full Inward Walkthrough

Fastest path: log in as `admin1`, open Home or Admin, launch one of the inward scenarios.

1. `/inward/upload-icl`: generate a sample forward download file and run upload service.
2. `/inward/technical-verification`: inspect cheque image and signature; Accept sends normal cheques to Debit Posting, Reject sends to Return ICL Creation, Refer sends to Referral.
3. `/inward/debit-posting`: run the debit posting service.
4. `/inward/manual-return-maker`: optionally reject an accepted cheque before cutoff.
5. `/inward/manual-return-checker`: checker accepts or rejects the maker return decision.
6. `/inward/return-icl-generation`: run Return ICL Service.
7. `/inward/return-upload-response`: accept or reject the simulated return upload response.
8. `/inward/charge-posting`: run charge posting if enabled; completed items move to Work Exit.

## Reports, Search, Archive, Admin

- Outward and inward reports generate from current LocalStorage demo state and support CSV plus demo PDF/Excel downloads.
- Cheque Search finds outward and inward cheques and displays front/rear placeholder images.
- Archive records are created when cheques reach `WORK_EXIT` or `DISCARD`.
- Admin supports role assignment, queue visibility, settings, audit log, archive browser, service tick, scenario launcher visibility, and Reset Demo Data.

## Reset Data

Use Admin -> Reset Demo Data to restore seed records and clear the active scenario/archive. This writes an audit event and keeps the app fully local.

## What Is Mocked

- Scanner capture and image quality checks.
- CBS account lookup, balance, posting, and signature retrieval.
- Clearing house forward/return upload responses.
- ICL file creation and file paths.
- Credit, debit, and charge posting files.
- Audit logs, archive records, reports, and search storage.

## Known Demo Limitations

- No backend, database, scanner driver, network share, clearing house portal, or CBS integration.
- File downloads are browser-generated demo artifacts.
- LocalStorage persistence is per browser/device.
- Dates and business rules are simplified for repeatable demonstrations.
- Placeholder names and images are synthetic and intentionally non-production.

## Quality Commands

```bash
npm test
npm run build
npm run audit:ip-clean
```

The suite covers workflow utilities, key transitions, archive creation, scenario visibility, and smoke rendering for major pages.
