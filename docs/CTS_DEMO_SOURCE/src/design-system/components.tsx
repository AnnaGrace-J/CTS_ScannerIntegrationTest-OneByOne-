import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Circle, Clock3, FileSearch, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { AuditEvent, ChequeStatus } from "../types";

export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs font-semibold text-ace-muted">
      {items.map((item, index) => (
        <span key={item}>
          {index > 0 ? <span className="mx-2 text-slate-400">/</span> : null}
          <span className={index === items.length - 1 ? "text-ace-primary" : ""}>{item}</span>
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({ actions, breadcrumbs, subtitle, title }: { actions?: ReactNode; breadcrumbs?: string[]; subtitle?: ReactNode; title: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ace-primary">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ace-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function MetricCard({ label, tone = "info", value }: { label: string; tone?: "info" | "success" | "warning" | "danger"; value: ReactNode }) {
  const tones = {
    info: "border-ace-info/20 bg-blue-50 text-ace-info",
    success: "border-ace-success/20 bg-emerald-50 text-ace-success",
    warning: "border-ace-warning/20 bg-amber-50 text-ace-warning",
    danger: "border-ace-danger/20 bg-red-50 text-ace-danger"
  };
  return (
    <div className={`min-w-0 rounded-lg border p-4 shadow-enterprise ${tones[tone]}`}>
      <div className="label-text text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="value-text mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

export function StatusPill({ status }: { status: ChequeStatus | string }) {
  const text = String(status);
  const tone = text.includes("Discard") || text.includes("NAK") || text.includes("Reject")
    ? "border-red-200 bg-red-50 text-ace-danger"
    : text.includes("Pending") || text.includes("Ready") || text.includes("Return")
      ? "border-amber-200 bg-amber-50 text-ace-warning"
      : text.includes("Exit") || text.includes("Post")
        ? "border-emerald-200 bg-emerald-50 text-ace-success"
        : "border-blue-200 bg-blue-50 text-ace-info";
  return <span aria-label={`Status: ${text}`} className={`status-pill inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${tone}`}>{text}</span>;
}

export function PriorityPill({ label = "Exception" }: { label?: string }) {
  return <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-ace-danger">{label}</span>;
}

export function QueueCard({ count, label, route, tone = "info" }: { count: number; label: string; route: string; tone?: "info" | "success" | "warning" | "danger" }) {
  return (
    <Link className="block rounded-lg border border-ace-border bg-white p-4 shadow-enterprise transition hover:-translate-y-0.5 hover:border-ace-primaryLight hover:shadow-ace" to={route}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-bold text-ace-primary">{label}</div>
        {count > 0 && tone === "danger" ? <PriorityPill /> : null}
      </div>
      <MetricCard label="Workitems" tone={tone} value={count} />
    </Link>
  );
}

export function WorkflowStepper({ steps }: { steps: Array<{ label: string; count: number; route: string; exception?: boolean }> }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-stretch gap-3">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-3">
            <QueueCard count={step.count} label={step.label} route={step.route} tone={step.exception ? "danger" : step.count > 0 ? "info" : "success"} />
            {index < steps.length - 1 ? <div className="h-px w-8 bg-ace-border" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkflowSwimlane({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="enterprise-panel">
      <div className="enterprise-header">{title}</div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function WorkItemSummaryPanel({ children, title = "Queue Health" }: { children: ReactNode; title?: string }) {
  return (
    <aside className="enterprise-panel h-full">
      <div className="enterprise-header">{title}</div>
      <div className="p-4">{children}</div>
    </aside>
  );
}

export function DataGrid({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <section className="enterprise-panel overflow-hidden">
      {title ? <div className="enterprise-header">{title}</div> : null}
      {children}
    </section>
  );
}

export function FilterPanel({ children, title = "Filters" }: { children: ReactNode; title?: string }) {
  return (
    <section className="enterprise-panel">
      <div className="enterprise-header">{title}</div>
      <div className="responsive-field-grid p-4">{children}</div>
    </section>
  );
}

export const SearchCriteriaCard = FilterPanel;
export const FormCard = FilterPanel;

export function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="key-value-row text-sm">
      <div className="label-text">{label}</div>
      <div className="value-text">{value}</div>
    </div>
  );
}

export function ActionToolbar({ children }: { children: ReactNode }) {
  return <div className="enterprise-panel flex flex-wrap items-center gap-2 p-3">{children}</div>;
}

export function StickyActionFooter({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 z-20 border-t border-ace-border bg-white/95 p-3 shadow-ace backdrop-blur">{children}</div>;
}

export function ConfirmDialog({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-ace-border bg-white shadow-ace">{children}</div>;
}

export function ExceptionDialog({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 text-ace-danger shadow-ace">{children}</div>;
}

export function ScannerStatusPanel({ status = "Ready" }: { status?: string }) {
  return (
    <div className="rounded-lg border border-ace-border bg-slate-50 p-3 text-sm">
      <div className="font-bold text-ace-primary">Scanner Station</div>
      <div className="mt-1 flex items-center gap-2 text-ace-muted"><Circle className="h-3 w-3 fill-ace-success text-ace-success" /> {status}</div>
    </div>
  );
}

export function ChequeImageWorkspace({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-ace-border bg-slate-100 p-3 shadow-inner">{children}</section>;
}

export function SignatureViewer({ src }: { src: string }) {
  return <img alt="Synthetic signature specimen" className="h-24 w-full rounded border border-ace-border bg-white object-contain" src={src} />;
}

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="border-l-2 border-ace-border pl-3">
          <div className="text-xs text-ace-muted">{event.at} - {event.user}</div>
          <div className="font-bold text-ace-primary">{event.action}</div>
          <div className="text-sm text-ace-muted">{event.note}</div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title = "No items", message = "There is no work waiting in this queue." }: { title?: string; message?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ace-border bg-white p-8 text-center" role="status">
      <FileSearch className="h-8 w-8 text-ace-muted" />
      <div className="font-bold text-ace-primary">{title}</div>
      <div className="max-w-md text-sm text-ace-muted">{message}</div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div aria-label="Loading content" className="animate-pulse space-y-3" role="status">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="h-20 rounded bg-slate-100" />
      <div className="h-20 rounded bg-slate-100" />
    </div>
  );
}

export function ToastNotification({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-ace-border bg-white p-3 shadow-ace">{children}</div>;
}

export function ReportHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ace-border p-4">
      <div>
        <div className="text-xs font-bold uppercase text-ace-muted">ACE CTS Workspace</div>
        <div className="text-lg font-bold text-ace-primary">{title}</div>
      </div>
      <div className="text-right text-xs text-ace-muted">{new Date().toLocaleString()}</div>
    </div>
  );
}

export function ReportResultTable({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function ArchitectureCanvas({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-ace-border bg-white p-5 shadow-ace">{children}</div>;
}

export function ModuleSwitcher({ outwardHref = "/outward/dashboard", inwardHref = "/inward/dashboard" }) {
  return (
    <div className="inline-flex rounded-lg border border-ace-border bg-white p-1 text-sm font-bold">
      <Link className="rounded-md px-3 py-1.5 text-ace-primary hover:bg-slate-50" to={outwardHref}>Outward</Link>
      <Link className="rounded-md px-3 py-1.5 text-ace-primary hover:bg-slate-50" to={inwardHref}>Inward</Link>
    </div>
  );
}

export function TopCommandBarShell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-16 items-center justify-between border-b border-ace-border bg-white px-4 shadow-sm">{children}</div>;
}

export const UserProfileMenu = ({ children }: { children: ReactNode }) => <div className="relative">{children}</div>;
