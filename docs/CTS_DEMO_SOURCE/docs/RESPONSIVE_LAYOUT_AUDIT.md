# Responsive Layout Audit

Generated: 2026-07-16

## Scope

Audited the ACE CTS demo for readability and layout stability at:

- 1366x768 at 90%, 100%, and 125% zoom
- 1440x900 at 100% zoom
- 1920x1080 at 100% zoom

Routes covered:

- General: `/login`, `/change-password`, `/search`, `/admin`, `/architecture`
- Outward: `/outward/dashboard`, `/outward/scanning`, `/outward/authorization`, `/outward/repair`, `/outward/hold-for-icl-generation`, `/outward/icl-generation`, `/outward/forward-upload-response`, `/outward/nak-repair`, `/outward/wait-for-return`, `/outward/credit-posting`, `/outward/reports`
- Inward: `/inward/dashboard`, `/inward/upload-icl`, `/inward/technical-verification`, `/inward/debit-posting`, `/inward/referral`, `/inward/manual-return-maker`, `/inward/manual-return-checker`, `/inward/return-icl-generation`, `/inward/return-upload-response`, `/inward/nak-repair`, `/inward/charge-posting`, `/inward/reports`

## Findings

| Area | Issue | Risk | Fix |
| --- | --- | --- | --- |
| Admin dashboard | System Health and Settings Summary cards could become too narrow, causing values like `LocalStorage`, `Visible`, `Success`, and `Manual` to wrap vertically. | High | Reworked Admin dashboard sections to stack full-width and use responsive card grids. |
| Shared key/value rows | Rows used viewport breakpoints only, so narrow cards inside wide viewports did not stack. | High | Added `KeyValueRow` / `FieldRow` with container-query stacking. |
| Shared form/card grids | Several panels used fixed column counts such as `xl:grid-cols-4` or narrow side rail grids. | High | Added reusable `responsive-card-grid`, `responsive-field-grid`, `responsive-sidebar-grid`, and `responsive-workspace-grid`. |
| Dashboard workstep cards | Cards could render below readable width inside side-by-side dashboard layouts. | Medium | Replaced fixed workstep card grids with auto-fit card grids. |
| Architecture canvas | Five-column architecture grid squeezed cards below readable width. | Medium | Replaced forced grid placement with responsive architecture cards. |
| File/path values | Some file names and Windows paths used `break-all`, which can cause letter-by-letter wrapping. | Medium | Replaced with `text-soft-wrap`. |
| Form grid span classes | Old `xl:col-span-4` utilities created implicit skinny columns inside auto-fit grids. | Medium | Replaced with `col-span-full`. |

## Failure Screenshots

No remaining failures after remediation. Future automated failures are saved to:

- `test-results/responsive/`

The placeholder folder exists at:

- `docs/responsive-failures/`

## Result

PASS. Automated responsive audit passed across the target route and viewport matrix.
