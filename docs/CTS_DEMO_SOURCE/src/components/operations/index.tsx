import type { ButtonHTMLAttributes, CSSProperties, MouseEventHandler, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  FileSearch,
  Loader2,
  RotateCw,
  ShieldAlert
} from "lucide-react";
import {
  ArchitectureCanvas as BaseArchitectureCanvas,
  AuditTimeline,
  Breadcrumbs,
  EmptyState as BaseEmptyState,
  LoadingSkeleton as BaseLoadingSkeleton,
  ReportHeader as BaseReportHeader,
  ReportResultTable as BaseReportResultTable,
  StatusPill as BaseStatusPill,
  ToastNotification as BaseToastNotification
} from "../../design-system/components";
import { useDemoStore } from "../../store/useDemoStore";
import type { AuditEvent, ChequeStatus } from "../../types";

type Tone = "info" | "success" | "warning" | "danger";
type Density = "compact" | "comfortable";

const densityGap: Record<Density, string> = {
  compact: "space-y-3",
  comfortable: "space-y-4"
};

const DEMO_BUSINESS_DATE = "2026-06-23";

function pathBreadcrumbs() {
  const pathname = typeof window === "undefined" ? "" : window.location.pathname;
  if (pathname.includes("/outward")) return ["ACE CTS Workspace", "Outward Clearing"];
  if (pathname.includes("/inward")) return ["ACE CTS Workspace", "Inward Clearing"];
  if (pathname.includes("/admin")) return ["ACE CTS Workspace", "Administration"];
  if (pathname.includes("/search")) return ["ACE CTS Workspace", "Cheque Search"];
  if (pathname.includes("/architecture")) return ["ACE CTS Workspace", "Architecture"];
  if (pathname.includes("/change-password")) return ["ACE CTS Workspace", "Security"];
  return ["ACE CTS Workspace"];
}

function readableText(value: ReactNode): string | undefined {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return undefined;
}

function preferenceKey(scope: string, username: string | undefined, suffix: string) {
  const pathname = typeof window === "undefined" ? "app" : window.location.pathname;
  const normalized = `${pathname}:${suffix}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return username ? `ace-cts:${scope}:${username}:${normalized}` : `ace-cts:${scope}:${normalized}`;
}

function useCollapsedPreference(scope: string, username: string | undefined, suffix: string, defaultCollapsed = true) {
  const key = preferenceKey(scope, username, suffix);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(key);
    setCollapsed(stored === null ? defaultCollapsed : stored === "true");
  }, [defaultCollapsed, key]);

  const setPreference = (nextValue: boolean) => {
    setCollapsed(nextValue);
    if (typeof window !== "undefined") window.localStorage.setItem(key, String(nextValue));
  };

  return [collapsed, setPreference] as const;
}

function CompactInfoChip({
  label,
  tone = "info",
  value
}: {
  label: string;
  tone?: Tone;
  value: ReactNode;
}) {
  const tones = {
    danger: "border-red-200 bg-red-50 text-ace-danger",
    info: "border-blue-100 bg-blue-50 text-ace-info",
    success: "border-emerald-100 bg-emerald-50 text-ace-success",
    warning: "border-amber-100 bg-amber-50 text-ace-warning"
  };
  return (
    <span className={`status-pill inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      <span className="shrink-0 uppercase tracking-wide opacity-75">{label}</span>
      <span className="text-ellipsis max-w-52 text-ace-primary" title={readableText(value)}>{value}</span>
    </span>
  );
}

export function OperationsPage({ children, density = "comfortable" }: { children: ReactNode; density?: Density }) {
  return <div className={`${densityGap[density]} min-w-0 overflow-x-hidden text-ace-text`}>{children}</div>;
}

export function BreadcrumbTrail({ items }: { items: string[] }) {
  return <Breadcrumbs items={items} />;
}

export function OperationsHeader({
  actions,
  breadcrumbs,
  meta,
  metaLayout = "inline",
  branch,
  businessDate,
  density = "comfortable",
  lastUpdated,
  role,
  status,
  subtitle,
  title
}: {
  actions?: ReactNode;
  branch?: ReactNode;
  breadcrumbs?: string[];
  businessDate?: ReactNode;
  density?: Density;
  lastUpdated?: ReactNode;
  meta?: Array<{ label: string; value: ReactNode }>;
  metaLayout?: "cards" | "inline";
  role?: ReactNode;
  status?: ReactNode;
  subtitle?: ReactNode;
  title: string;
}) {
  const { user } = useDemoStore();
  const effectiveBranch = branch ?? user?.branch ?? "All branches";
  const effectiveRole = role ?? user?.role ?? "Operator";
  const effectiveBusinessDate = businessDate ?? DEMO_BUSINESS_DATE;
  const effectiveLastUpdated = lastUpdated ?? new Date().toLocaleString();
  const effectiveBreadcrumbs = breadcrumbs ?? pathBreadcrumbs();
  const headerMeta = [
    { label: "Branch", value: effectiveBranch },
    { label: "Role", value: effectiveRole },
    { label: "Business Date", value: effectiveBusinessDate },
    { label: "Last Updated", value: effectiveLastUpdated },
    ...(status ? [{ label: "Status", value: readableText(status) ? <StatusPill status={String(status)} /> : status }] : []),
    ...(meta ?? [])
  ];
  const hasToggleInfo = Boolean(subtitle) || headerMeta.length > 0;
  const [infoCollapsed, setInfoCollapsed] = useCollapsedPreference("header-info-collapsed", user?.username, title, true);
  const effectiveMetaLayout = metaLayout;

  if (hasToggleInfo && infoCollapsed) {
    return (
      <header aria-label={`${title} page header`} className="rounded-lg border border-ace-border bg-white px-3 py-2 shadow-enterprise">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="text-sm font-bold leading-5 text-ace-primary">{title}</h1>
            {status ? <StatusPill status={readableText(status) ?? "Open"} /> : null}
            <CompactInfoChip label="Branch" value={effectiveBranch} />
            <CompactInfoChip label="Role" value={effectiveRole} />
            <CompactInfoChip label="Date" value={effectiveBusinessDate} />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {actions}
            <SecondaryActionButton className="min-h-7 px-2 py-1 text-xs" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setInfoCollapsed(false)}>
              Show Info
            </SecondaryActionButton>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header aria-label={`${title} page header`} className={`rounded-xl border border-ace-border bg-white shadow-enterprise ${density === "compact" ? "p-3" : "p-4"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <BreadcrumbTrail items={effectiveBreadcrumbs} />
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ace-primary">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-ace-muted">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {actions}
          {hasToggleInfo ? (
            <SecondaryActionButton className="min-h-8 px-2 py-1 text-xs" icon={<EyeOff className="h-4 w-4" />} onClick={() => setInfoCollapsed(true)}>
              Hide Info
            </SecondaryActionButton>
          ) : null}
        </div>
      </div>
      {headerMeta.length && effectiveMetaLayout === "inline" ? (
        <dl className={`flex min-w-0 flex-wrap gap-1.5 ${density === "compact" ? "mt-2" : "mt-3"}`}>
          {headerMeta.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex max-w-full items-center gap-1.5 rounded-full border border-ace-border bg-slate-50 px-2 py-1 text-xs">
              <dt className="label-text shrink-0 uppercase tracking-wide">{item.label}</dt>
              <dd className="text-ellipsis max-w-56 font-semibold text-ace-primary" title={readableText(item.value)}>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {headerMeta.length && effectiveMetaLayout === "cards" ? (
        <dl className={`responsive-compact-card-grid ${density === "compact" ? "mt-3" : "mt-4"}`}>
          {headerMeta.map((item, index) => (
            <div key={`${item.label}-${index}`} className="min-w-0 rounded-lg border border-ace-border bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-ace-muted">{item.label}</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-ace-primary" title={readableText(item.value)}>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}

export function ProcessStageHeader({ children, eyebrow, title }: { children?: ReactNode; eyebrow?: string; title: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ace-border bg-white px-4 py-3 shadow-enterprise">
      <div>
        {eyebrow ? <div className="text-[11px] font-bold uppercase tracking-wide text-ace-muted">{eyebrow}</div> : null}
        <h2 className="text-base font-bold text-ace-primary">{title}</h2>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function QueueSummaryStrip({ density = "comfortable", items }: { density?: Density; items: Array<{ label: string; value: ReactNode; tone?: Tone; hint?: ReactNode }> }) {
  const { user } = useDemoStore();
  const [collapsed, setCollapsed] = useCollapsedPreference("summary-strip-collapsed", user?.username, items.map((item) => item.label).join("-"), true);
  const tones = {
    info: "border-blue-100 bg-blue-50 text-ace-info",
    success: "border-emerald-100 bg-emerald-50 text-ace-success",
    warning: "border-amber-100 bg-amber-50 text-ace-warning",
    danger: "border-red-100 bg-red-50 text-ace-danger"
  };
  if (collapsed) {
    return (
      <section className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-ace-border bg-white px-3 py-2 shadow-enterprise" aria-label="Compact queue summary">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {items.map((item) => (
            <CompactInfoChip key={item.label} label={item.label} tone={item.tone ?? "info"} value={item.value} />
          ))}
        </div>
        <SecondaryActionButton className="min-h-7 px-2 py-1 text-xs" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setCollapsed(false)}>
          Show Summary
        </SecondaryActionButton>
      </section>
    );
  }
  return (
    <section className="space-y-2" aria-label="Queue summary">
      <div className="flex justify-end">
        <SecondaryActionButton className="min-h-7 px-2 py-1 text-xs" icon={<EyeOff className="h-3.5 w-3.5" />} onClick={() => setCollapsed(true)}>
          Hide Summary
        </SecondaryActionButton>
      </div>
      <div className="responsive-metric-grid min-w-0">
        {items.map((item) => (
          <div key={item.label} className={`rounded-lg border shadow-enterprise ${density === "compact" ? "p-2.5" : "p-3"} ${tones[item.tone ?? "info"]}`}>
            <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">{item.label}</div>
            <div className={`${density === "compact" ? "mt-0.5 text-xl" : "mt-1 text-2xl"} font-bold`}>{item.value}</div>
            {item.hint ? <div className="mt-1 text-xs font-medium opacity-80">{item.hint}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function WorkflowProgressBar({ steps }: { steps: Array<{ label: string; active?: boolean; complete?: boolean }> }) {
  return (
    <ol className="flex min-w-0 overflow-x-auto rounded-lg border border-ace-border bg-white p-3 shadow-enterprise" aria-label="Workflow progress">
      {steps.map((step, index) => (
        <li key={step.label} className="flex min-w-40 flex-1 items-center">
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
              step.complete ? "border-ace-success bg-ace-success text-white" : step.active ? "border-ace-accent bg-ace-accent text-white" : "border-ace-border bg-slate-50 text-ace-muted"
            }`}>
              {step.complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </span>
            <span className="text-sm font-semibold text-ace-primary">{step.label}</span>
          </div>
          {index < steps.length - 1 ? <span className="mx-3 h-px flex-1 bg-ace-border" /> : null}
        </li>
      ))}
    </ol>
  );
}

export function WorkflowSwimlane({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="min-w-0 rounded-xl border border-ace-border bg-white shadow-enterprise">
      <div className="border-b border-ace-border px-4 py-3 text-sm font-bold text-ace-primary">{title}</div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function WorkstepCard({
  actionLabel = "Open queue",
  badge,
  count,
  description,
  exception,
  onClick,
  route,
  sla,
  status,
  title
}: {
  actionLabel?: ReactNode;
  badge?: ReactNode;
  count: ReactNode;
  description?: ReactNode;
  exception?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  route?: string;
  sla?: ReactNode;
  status?: ReactNode;
  title: string;
}) {
  const className = `group flex h-full min-w-0 flex-col rounded-xl border bg-white p-4 text-left shadow-enterprise transition hover:-translate-y-0.5 hover:shadow-ace focus:outline-none focus:ring-2 focus:ring-ace-accent ${
    exception ? "border-ace-danger" : "border-ace-border"
  }`;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-ace-primary">{title}</div>
          {description ? <p className="mt-1 text-xs leading-5 text-ace-muted">{description}</p> : null}
        </div>
        <span className={`rounded-full p-2 ${exception ? "bg-red-50 text-ace-danger" : "bg-teal-50 text-ace-accent"}`}>
          {exception ? <ShieldAlert className="h-5 w-5" /> : <FileCheck2 className="h-5 w-5" />}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="text-3xl font-bold text-ace-primary">{count}</span>
        <div className="flex flex-col items-end gap-1 text-xs">
          {status ? <span className="font-bold text-ace-primary">{status}</span> : null}
          {sla ? <span className="text-ace-muted">{sla}</span> : null}
          {badge ? <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-ace-warning">{badge}</span> : null}
        </div>
      </div>
      {(route || onClick) ? (
        <div className="mt-4 flex items-center justify-between border-t border-ace-border pt-3 text-xs font-bold text-ace-primary">
          <span>{actionLabel}</span>
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      ) : null}
    </>
  );

  if (route) {
    return <Link aria-label={`Open ${title}`} className={className} to={route}>{body}</Link>;
  }
  if (onClick) {
    return <button aria-label={`Open ${title}`} className={className} type="button" onClick={onClick}>{body}</button>;
  }
  return (
    <div className={className}>{body}</div>
  );
}

export function WorkQueueLayout({ detail, queue, rail }: { detail: ReactNode; queue: ReactNode; rail?: ReactNode }) {
  if (rail) {
    return <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(320px,0.85fr)_minmax(420px,1.25fr)_minmax(320px,0.7fr)]">{queue}{detail}<aside className="min-w-0">{rail}</aside></div>;
  }
  return <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(320px,0.95fr)_minmax(420px,1.35fr)]">{queue}{detail}</div>;
}

export function QueueFilterPanel({
  actions,
  children,
  defaultCollapsed = false,
  resultCount,
  title = "Search and Filters"
}: {
  actions?: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
  resultCount?: ReactNode;
  title?: string;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const filterId = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-filters`;
  return (
    <section className="min-w-0 rounded-xl border border-ace-border bg-white shadow-enterprise">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ace-border px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-ace-primary">{title}</h2>
          {resultCount !== undefined ? <div className="mt-0.5 text-xs text-ace-muted">{resultCount} matching records</div> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <SecondaryActionButton aria-controls={filterId} aria-expanded={!collapsed} type="button" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {collapsed ? "Show Filters" : "Hide Filters"}
          </SecondaryActionButton>
        </div>
      </div>
      {!collapsed ? <div id={filterId} className="responsive-field-grid min-w-0 p-4">{children}</div> : null}
    </section>
  );
}

export function QueueDataGrid({ actions, children, density = "comfortable", title }: { actions?: ReactNode; children: ReactNode; density?: Density; title?: string }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-ace-border bg-white shadow-enterprise">
      {title || actions ? (
        <div className={`flex items-center justify-between gap-3 border-b border-ace-border ${density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}>
          {title ? <h2 className="text-sm font-bold text-ace-primary">{title}</h2> : <span />}
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function WorkItemDetailLayout({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  return aside ? <div className="responsive-two-card-grid min-w-0">{children}<aside className="min-w-0">{aside}</aside></div> : <div className="min-w-0 space-y-4">{children}</div>;
}

export function ChequeReviewWorkspace({ actions, children, reference, title = "Cheque Review Workspace" }: { actions?: ReactNode; children: ReactNode; reference?: ReactNode; title?: string }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-ace-border bg-white shadow-enterprise">
      <div className="flex items-center justify-between gap-3 border-b border-ace-border px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-ace-primary">{title}</h2>
          {reference ? <div className="mt-0.5 text-xs text-ace-muted">{reference}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="bg-[radial-gradient(circle_at_1px_1px,#d8dee6_1px,transparent_0)] bg-[length:18px_18px] p-3">{children}</div>
    </section>
  );
}

export function ChequeImageViewerV2({
  actions,
  alt = "Synthetic cheque image",
  badges,
  frontSrc,
  imageStyle,
  rearSrc,
  reference,
  title = "Cheque Image",
  variant = "front"
}: {
  actions?: ReactNode;
  alt?: string;
  badges?: ReactNode;
  frontSrc: string;
  imageStyle?: CSSProperties;
  rearSrc?: string;
  reference?: ReactNode;
  title?: string;
  variant?: "front" | "rear";
}) {
  const src = variant === "rear" && rearSrc ? rearSrc : frontSrc;
  return (
    <ChequeReviewWorkspace actions={actions} reference={reference} title={title}>
      {badges ? <div className="mb-3 flex flex-wrap gap-2">{badges}</div> : null}
      <div className="flex min-h-72 items-center justify-center">
        <div className="min-w-0 rounded-xl border border-ace-border bg-white p-3 shadow-ace">
          <img alt={alt} className="max-h-80 w-full max-w-4xl rounded border border-slate-300 bg-white object-contain transition-transform" src={src} style={imageStyle} />
        </div>
      </div>
    </ChequeReviewWorkspace>
  );
}

export function SignatureViewerV2({ src }: { src: string }) {
  return <img alt="Synthetic signature specimen" className="h-24 w-full rounded-lg border border-ace-border bg-white object-contain" src={src} />;
}

export function FormPanel({ actions, children, defaultCollapsed = false, density = "comfortable", optional, title }: { actions?: ReactNode; children: ReactNode; defaultCollapsed?: boolean; density?: Density; optional?: boolean; title: string }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <section className="min-w-0 rounded-xl border border-ace-border bg-white shadow-enterprise">
      <div className="flex items-center justify-between gap-3 border-b border-ace-border px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-ace-primary">{title}</h2>
          {optional ? <div className="text-xs text-ace-muted">Optional details</div> : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {optional ? (
            <SecondaryActionButton aria-expanded={!collapsed} type="button" onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              {collapsed ? "Expand" : "Collapse"}
            </SecondaryActionButton>
          ) : null}
        </div>
      </div>
      {!collapsed ? <div className={`responsive-field-grid min-w-0 ${density === "compact" ? "p-3" : "p-4"}`}>{children}</div> : null}
    </section>
  );
}

export function FieldGroup({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="key-value-container min-w-0 rounded-lg border border-ace-border bg-slate-50 p-3">
      {title ? <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ace-muted">{title}</div> : null}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function KeyValueRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="key-value-row text-sm">
      <div className="label-text">{label}</div>
      <div className="value-text">{value}</div>
    </div>
  );
}

export const FieldRow = KeyValueRow;

export function ValidationSummaryPanel({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-ace-danger" role="alert" aria-live="polite">
      <div className="mb-1 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Validation summary</div>
      <ul className="list-disc space-y-1 pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

export function ExceptionBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-ace-warning">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function AuditTimelinePanel({ defaultCollapsed = false, events, title = "Audit Timeline" }: { defaultCollapsed?: boolean; events: AuditEvent[]; title?: string }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <section className="min-w-0 rounded-xl border border-ace-border bg-white shadow-enterprise" aria-label={title}>
      <div className="flex items-center justify-between gap-3 border-b border-ace-border px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-ace-primary">{title}</h2>
          <div className="mt-0.5 text-xs text-ace-muted">{events.length} audit event(s)</div>
        </div>
        <SecondaryActionButton aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          {collapsed ? "Open Audit" : "Close Audit"}
        </SecondaryActionButton>
      </div>
      {!collapsed ? <div className="p-4"><AuditTimeline events={events} /></div> : null}
    </section>
  );
}

export function StickyActionBar({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 z-20 flex min-w-0 flex-wrap gap-2 rounded-xl border border-ace-border bg-white/95 p-3 shadow-ace backdrop-blur" role="toolbar" aria-label="Workitem actions">{children}</div>;
}

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  disabledReason?: string;
  icon?: ReactNode;
};

function actionButtonClass(tone: "primary" | "secondary" | "danger", className?: string) {
  const base = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-ace-accent focus:ring-offset-1 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-500";
  const tones = {
    primary: "border-ace-primary bg-ace-primary text-white hover:bg-ace-primaryLight",
    secondary: "border-ace-border bg-white text-ace-primary hover:bg-slate-50",
    danger: "border-ace-danger bg-ace-danger text-white hover:bg-red-800"
  };
  return `${base} ${tones[tone]} ${className ?? ""}`;
}

function actionButtonProps({ children, disabled, disabledReason, title, ...props }: ActionButtonProps) {
  const label = props["aria-label"] ?? readableText(children);
  return {
    ...props,
    "aria-label": label,
    disabled,
    title: disabled && disabledReason ? disabledReason : title
  };
}

export function PrimaryActionButton({ children, className, disabledReason, icon, type = "button", ...props }: ActionButtonProps) {
  return <button className={actionButtonClass("primary", className)} type={type} {...actionButtonProps({ children, disabledReason, ...props })}>{icon}{children}</button>;
}

export function SecondaryActionButton({ children, className, disabledReason, icon, type = "button", ...props }: ActionButtonProps) {
  return <button className={actionButtonClass("secondary", className)} type={type} {...actionButtonProps({ children, disabledReason, ...props })}>{icon}{children}</button>;
}

export function DangerActionButton({ children, className, disabledReason, icon, type = "button", ...props }: ActionButtonProps) {
  return <button className={actionButtonClass("danger", className)} type={type} {...actionButtonProps({ children, disabledReason, ...props })}>{icon}{children}</button>;
}

export function StatusPill({ status }: { status: ChequeStatus | string }) {
  return <BaseStatusPill status={status} />;
}

export function AmountDisplay({ value }: { value: number }) {
  return <span className="font-mono font-bold text-ace-primary">{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
}

export function FileStatusCard({ count, path, status, title, total }: { count: number; path: string; status: string; title: string; total: number }) {
  return (
    <section className="min-w-0 rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ace-primary">{title}</h2>
        <StatusPill status={status} />
      </div>
      <dl className="responsive-card-grid mt-4">
        <FieldGroup title="Cheque Count"><div className="text-xl font-bold text-ace-primary">{count}</div></FieldGroup>
        <FieldGroup title="Total Amount"><AmountDisplay value={total} /></FieldGroup>
        <FieldGroup title="Path"><div className="text-soft-wrap text-sm text-ace-muted">{path}</div></FieldGroup>
      </dl>
    </section>
  );
}

export function ServiceRunPanel({ children, lastRun, running, title = "Mock service console" }: { children: ReactNode; lastRun?: ReactNode; running?: boolean; title?: string }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
      <div>
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ace-primary">
          {running ? <Loader2 className="h-4 w-4 animate-spin text-ace-info" /> : <Clock3 className="h-4 w-4 text-ace-accent" />}
          {title}
        </div>
        {lastRun ? <div className="text-soft-wrap mt-1 text-xs text-ace-muted">Last run: {lastRun}</div> : null}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

export const ReportFilterPanel = QueueFilterPanel;
export const ReportPreviewPanel = QueueDataGrid;
export const ReportHeader = BaseReportHeader;
export const ReportResultTable = BaseReportResultTable;
export const AdminSettingsSection = FormPanel;
export const ArchitectureCanvas = BaseArchitectureCanvas;
export const EmptyState = BaseEmptyState;
export const LoadingSkeleton = BaseLoadingSkeleton;

export function ConfirmDialogV2({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-ace-border bg-white shadow-ace">{children}</div>;
}

export function ExceptionDialogV2({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 text-ace-danger shadow-ace">{children}</div>;
}

export const ToastNotification = BaseToastNotification;

export function SuccessState({ children, title = "Completed" }: { children?: ReactNode; title?: string }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-ace-success">
      <div className="flex items-center gap-2 font-bold"><Check className="h-4 w-4" /> {title}</div>
      {children ? <div className="mt-1 text-sm">{children}</div> : null}
    </div>
  );
}

export function ErrorState({ children, title = "Action required" }: { children?: ReactNode; title?: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-ace-danger">
      <div className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> {title}</div>
      {children ? <div className="mt-1 text-sm">{children}</div> : null}
    </div>
  );
}

export function LoadingState({ title = "Loading workitems" }: { title?: string }) {
  return (
    <div className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ace-primary"><Loader2 className="h-4 w-4 animate-spin text-ace-info" /> {title}</div>
      <BaseLoadingSkeleton />
    </div>
  );
}

export function ExportActionButton(props: Omit<ActionButtonProps, "icon">) {
  return <SecondaryActionButton icon={<Download className="h-4 w-4" />} {...props} />;
}

export function RefreshActionButton(props: Omit<ActionButtonProps, "icon">) {
  return <SecondaryActionButton icon={<RotateCw className="h-4 w-4" />} {...props} />;
}
