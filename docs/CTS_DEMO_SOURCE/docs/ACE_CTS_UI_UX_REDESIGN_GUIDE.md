# ACE CTS UI/UX Redesign Guide

## Purpose

ACE CTS Workspace uses an original banking-grade interface that is intentionally separate from any prior third-party screen style. The product keeps cheque clearing workflow logic unchanged while presenting it through a modern operations workspace.

## Design Principles

- Use a left-side navigation shell for stable module access.
- Use data-dense cards, grids, swimlanes, and timelines for operations work.
- Keep workflows clear without copying legacy arrow dashboards or vendor screen captions.
- Use neutral backgrounds, white surfaces, subtle borders, and accessible text contrast.
- Use accent colors only for status and priority.

## Color Tokens

| Token | Value | Use |
| --- | --- | --- |
| primary | `#0F2A44` | Navigation, headings, primary actions |
| primaryLight | `#1E4E79` | Hover and secondary emphasis |
| accent | `#0E9488` | Status accents only |
| success | `#15803D` | Completed/success states |
| warning | `#B45309` | Pending/warning states |
| danger | `#B91C1C` | Rejected/exception states |
| info | `#2563EB` | Informational states |
| background | `#F5F7FA` | Workspace background |
| surface | `#FFFFFF` | Cards and panels |
| border | `#D8DEE6` | Card/table borders |
| textPrimary | `#172033` | Primary text |
| textSecondary | `#667085` | Supporting text |

## Component Inventory

Core reusable components are defined in `src/design-system/components.tsx` and `src/layouts/AppShellV2.tsx`.

- AppShellV2
- SidebarNavigation
- TopCommandBar
- PageHeader
- Breadcrumbs
- ModuleSwitcher
- UserProfileMenu
- MetricCard
- WorkflowStepper
- WorkflowSwimlane
- QueueCard
- WorkItemSummaryPanel
- DataGrid
- FilterPanel
- SearchCriteriaCard
- FormCard
- FieldRow
- StatusPill
- PriorityPill
- ActionToolbar
- StickyActionFooter
- ConfirmDialog
- ExceptionDialog
- ScannerStatusPanel
- ChequeImageWorkspace
- SignatureViewer
- AuditTimeline
- EmptyState
- LoadingSkeleton
- ToastNotification
- ReportHeader
- ReportResultTable
- ArchitectureCanvas

## Page Layout Patterns

- Login uses a product statement and abstract clearing illustration on the left, and a compact sign-in card on the right.
- Dashboards use metrics, workflow swimlanes, queue health, and recent audit summaries.
- Work queues use filters above a grid and split-view detail layouts.
- Service pages use file status, count, amount, run action, exception, and audit sections.
- Reports use a filter panel, actions, report header, and result table.
- Architecture uses original node cards and connection concepts, not imported diagrams.

## Accessibility Rules

- Use native buttons and links for interactions.
- Keep focusable controls keyboard accessible.
- Provide clear text labels for actions and status.
- Avoid color-only status signals; use labels and icons where possible.
- Maintain readable contrast on navy, white, amber, red, and green states.

## Do / Do Not

Do:

- Use ACE CTS Workspace naming.
- Use workflow swimlanes, cards, data grids, and audit timelines.
- Use synthetic placeholder cheque images only.
- Preserve all domain rules and state transitions.

Do not:

- Use legacy vendor/customer names.
- Reuse legacy screenshots, logos, screen captions, or copied UI structures.
- Reintroduce top-only legacy navigation as the primary shell.
- Change maker-checker, validation, reporting, search, archive, or audit behavior for cosmetic reasons.

## Business Logic Preservation

The redesign is presentation-layer remediation. Workflow states, transition functions, validations, IDs, archive records, reports, audit events, and LocalStorage persistence are preserved.
