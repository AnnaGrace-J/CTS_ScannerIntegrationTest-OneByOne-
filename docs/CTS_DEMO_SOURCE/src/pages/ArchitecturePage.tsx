import type { ReactNode } from "react";
import {
  Archive,
  Building2,
  CloudCog,
  Database,
  FileCheck2,
  FileStack,
  Fingerprint,
  Globe2,
  HardDrive,
  Monitor,
  Network,
  RadioTower,
  ScanLine,
  ServerCog,
  ShieldCheck,
  Workflow
} from "lucide-react";
import {
  ArchitectureCanvas,
  FieldGroup,
  OperationsHeader,
  OperationsPage,
  QueueSummaryStrip,
  StatusPill
} from "../components/operations";

type NodeTone = "primary" | "accent" | "info" | "success" | "warning" | "neutral";

type ArchitectureNode = {
  id: string;
  title: string;
  detail: string;
  icon: ReactNode;
  tone: NodeTone;
  className: string;
};

const toneClasses: Record<NodeTone, string> = {
  primary: "border-ace-primary/25 bg-slate-50 text-ace-primary",
  accent: "border-teal-200 bg-teal-50 text-ace-accent",
  info: "border-blue-200 bg-blue-50 text-ace-info",
  success: "border-emerald-200 bg-emerald-50 text-ace-success",
  warning: "border-amber-200 bg-amber-50 text-ace-warning",
  neutral: "border-ace-border bg-white text-ace-primary"
};

const nodes: ArchitectureNode[] = [
  {
    id: "users",
    title: "Branch / CPC Users",
    detail: "Maker, checker, operations, and administration users.",
    icon: <Building2 className="h-5 w-5" />,
    tone: "primary",
    className: "lg:col-start-1 lg:row-start-1"
  },
  {
    id: "browser",
    title: "Browser Access",
    detail: "HTTPS workspace entry with role-based navigation.",
    icon: <Globe2 className="h-5 w-5" />,
    tone: "primary",
    className: "lg:col-start-2 lg:row-start-1"
  },
  {
    id: "workspace",
    title: "ACE CTS Workspace",
    detail: "Outward, inward, search, reports, and admin console.",
    icon: <Monitor className="h-5 w-5" />,
    tone: "accent",
    className: "lg:col-start-3 lg:row-start-1"
  },
  {
    id: "api",
    title: "Web/API Layer",
    detail: "Application entry layer for screens, session policy, and workflow requests.",
    icon: <ServerCog className="h-5 w-5" />,
    tone: "info",
    className: "lg:col-start-3 lg:row-start-2"
  },
  {
    id: "services",
    title: "Workflow & Business Services",
    detail: "Validation, maker-checker control, file generation, posting, and queues.",
    icon: <Workflow className="h-5 w-5" />,
    tone: "accent",
    className: "lg:col-start-3 lg:row-start-3"
  },
  {
    id: "database",
    title: "Database",
    detail: "Operational records, batches, instruments, files, users, and settings.",
    icon: <Database className="h-5 w-5" />,
    tone: "neutral",
    className: "lg:col-start-2 lg:row-start-4"
  },
  {
    id: "repository",
    title: "Cheque Image / Document Repository",
    detail: "Front/rear cheque images, signatures, and generated document snapshots.",
    icon: <FileStack className="h-5 w-5" />,
    tone: "neutral",
    className: "lg:col-start-3 lg:row-start-4"
  },
  {
    id: "scannerAgent",
    title: "Local Scanner Agent",
    detail: "Local workstation bridge for scanner capture and endorsement handling.",
    icon: <ScanLine className="h-5 w-5" />,
    tone: "warning",
    className: "lg:col-start-1 lg:row-start-2"
  },
  {
    id: "scannerHardware",
    title: "FB30U Scanner / Scanner Hardware",
    detail: "Physical capture device connected through the local agent.",
    icon: <HardDrive className="h-5 w-5" />,
    tone: "warning",
    className: "lg:col-start-1 lg:row-start-3"
  },
  {
    id: "cbs",
    title: "CBS Integration",
    detail: "Account validation and debit, credit, and charge posting interfaces.",
    icon: <Network className="h-5 w-5" />,
    tone: "info",
    className: "lg:col-start-5 lg:row-start-2"
  },
  {
    id: "signature",
    title: "Signature/Account Interface",
    detail: "Drawer account, mandate, balance, and signature retrieval.",
    icon: <Fingerprint className="h-5 w-5" />,
    tone: "info",
    className: "lg:col-start-5 lg:row-start-3"
  },
  {
    id: "clearingHouse",
    title: "CBM / Clearing House File Exchange",
    detail: "Forward download, forward upload, return upload, ACK, and NAK files.",
    icon: <RadioTower className="h-5 w-5" />,
    tone: "success",
    className: "lg:col-start-4 lg:row-start-2"
  },
  {
    id: "posting",
    title: "Posting File Services",
    detail: "Generated debit, credit, and charge posting files for handoff.",
    icon: <FileCheck2 className="h-5 w-5" />,
    tone: "success",
    className: "lg:col-start-4 lg:row-start-3"
  },
  {
    id: "audit",
    title: "Audit & Archive",
    detail: "Immutable operational trail and archived cheque snapshots.",
    icon: <Archive className="h-5 w-5" />,
    tone: "neutral",
    className: "lg:col-start-4 lg:row-start-4"
  },
  {
    id: "dr",
    title: "DR Environment",
    detail: "Recovery environment and replication boundary for final deployment design.",
    icon: <ShieldCheck className="h-5 w-5" />,
    tone: "primary",
    className: "lg:col-start-5 lg:row-start-4"
  }
];

const explanatoryCards = [
  {
    title: "Scanner integration through local agent",
    body: "Scanner stations use a local agent boundary so capture, image quality checks, and endorsement handling remain isolated from the browser session."
  },
  {
    title: "CBS interfaces finalized with bank",
    body: "CBS account lookup, signature retrieval, and posting handoffs are integration contracts to be confirmed during implementation planning."
  },
  {
    title: "File-based clearing-house exchange",
    body: "Forward, return, ACK, and NAK flows are represented as controlled file exchange channels with review and repair points."
  },
  {
    title: "DR and HA subject to final deployment design",
    body: "The DR boundary is shown as a planning placeholder; replication, RTO, RPO, firewall policy, and HA topology remain bank-approved design items."
  }
];

function ArchitectureCard({ node }: { node: ArchitectureNode }) {
  return (
    <article className={`relative z-10 min-h-32 rounded-xl border p-4 shadow-enterprise ${toneClasses[node.tone]}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">{node.icon}</div>
        <div>
          <h2 className="text-sm font-bold text-ace-primary">{node.title}</h2>
          <p className="mt-2 text-sm leading-5 text-ace-muted">{node.detail}</p>
        </div>
      </div>
    </article>
  );
}

function ConnectorLayer() {
  return (
    <svg aria-hidden="true" className="absolute inset-0 hidden h-full w-full lg:block" preserveAspectRatio="none" viewBox="0 0 1000 650">
      <defs>
        <marker id="aceArrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
          <path d="M0,0 L8,4 L0,8 Z" fill="#1E4E79" />
        </marker>
        <marker id="aceArrowAccent" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
          <path d="M0,0 L8,4 L0,8 Z" fill="#0E9488" />
        </marker>
      </defs>
      <g fill="none" strokeLinecap="round" strokeWidth="2.6">
        <path d="M180 82 H350" markerEnd="url(#aceArrow)" stroke="#1E4E79" />
        <path d="M530 82 H612" markerEnd="url(#aceArrowAccent)" stroke="#0E9488" />
        <path d="M700 128 V206" markerEnd="url(#aceArrowAccent)" stroke="#0E9488" />
        <path d="M700 286 V366" markerEnd="url(#aceArrowAccent)" stroke="#0E9488" />
        <path d="M603 438 H430" markerEnd="url(#aceArrow)" stroke="#1E4E79" />
        <path d="M698 438 H805" markerEnd="url(#aceArrow)" stroke="#1E4E79" />
        <path d="M214 208 C310 214 330 260 590 260" markerEnd="url(#aceArrowAccent)" stroke="#0E9488" />
        <path d="M120 286 V212" markerEnd="url(#aceArrow)" stroke="#B45309" />
        <path d="M783 210 H828" markerEnd="url(#aceArrow)" stroke="#2563EB" />
        <path d="M783 286 H828" markerEnd="url(#aceArrow)" stroke="#2563EB" />
        <path d="M781 260 C820 300 820 360 783 398" markerEnd="url(#aceArrow)" stroke="#15803D" />
        <path d="M700 360 C738 395 748 420 820 438" markerEnd="url(#aceArrow)" stroke="#667085" />
      </g>
    </svg>
  );
}

export function ArchitecturePage() {
  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Architecture"]}
        title="ACE CTS Architecture Canvas"
        subtitle="Original reference topology for SRS discussion, showing browser access, workflow services, storage, integration boundaries, scanner capture, audit/archive, and DR planning."
        status="SRS Ready"
        meta={[
          { label: "Diagram Type", value: "React / SVG / CSS" },
          { label: "Data Classification", value: "Synthetic demo only" },
          { label: "External Systems", value: "Interface boundaries shown" }
        ]}
      />

      <QueueSummaryStrip
        items={[
          { label: "User Entry", value: "Browser", tone: "info", hint: "Branch and CPC access" },
          { label: "Core Runtime", value: "Workflow Services", tone: "success", hint: "Rules, queues, audit" },
          { label: "Storage", value: "DB + Repository", tone: "info", hint: "Records and images" },
          { label: "Interfaces", value: "Scanner / CBS / CBM", tone: "warning", hint: "Final specs with bank" }
        ]}
      />

      <ArchitectureCanvas>
        <div className="relative overflow-hidden rounded-2xl border border-ace-border bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_54%,#F5F7FA_100%)] p-5">
          <ConnectorLayer />

          <div className="absolute left-[44%] top-6 z-0 h-[75%] w-[22%] rounded-3xl border border-dashed border-teal-300 bg-teal-50/40" />
          <div className="absolute right-4 top-24 z-0 h-[62%] w-[20%] rounded-3xl border border-dashed border-blue-300 bg-blue-50/40" />
          <div className="absolute bottom-4 left-4 z-0 h-[42%] w-[19%] rounded-3xl border border-dashed border-amber-300 bg-amber-50/35" />

          <div className="relative z-10 mb-4 grid gap-3 text-xs font-bold uppercase text-ace-muted md:grid-cols-3">
            <div className="rounded-full border border-amber-200 bg-white px-3 py-2">Scanner station boundary</div>
            <div className="rounded-full border border-teal-200 bg-white px-3 py-2">ACE CTS application boundary</div>
            <div className="rounded-full border border-blue-200 bg-white px-3 py-2">Bank and clearing interfaces</div>
          </div>

          <div className="responsive-card-grid relative z-10">
            {nodes.map((node) => <ArchitectureCard key={node.id} node={node} />)}
          </div>
        </div>
      </ArchitectureCanvas>

      <section className="responsive-sidebar-grid">
        <div className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ace-primary">
            <CloudCog className="h-4 w-4 text-ace-accent" />
            Architecture Notes for SRS
          </div>
          <div className="responsive-card-grid">
            {explanatoryCards.map((card) => (
              <div key={card.title} className="rounded-lg border border-ace-border bg-slate-50 p-4">
                <div className="text-sm font-bold text-ace-primary">{card.title}</div>
                <p className="mt-2 text-sm leading-6 text-ace-muted">{card.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-sm font-bold text-ace-primary">Deployment Readiness</div>
            <StatusPill status="Indicative" />
          </div>
          <div className="grid gap-3">
            <FieldGroup title="No legacy diagram asset">
              <div className="text-sm text-ace-muted">Rendered from React components, SVG connector paths, and ACE design tokens.</div>
            </FieldGroup>
            <FieldGroup title="Mock boundaries">
              <div className="text-sm text-ace-muted">Scanner, CBS, clearing-house, and posting integrations are shown as planning interfaces, not live connections.</div>
            </FieldGroup>
            <FieldGroup title="SRS screenshot mode">
              <div className="text-sm text-ace-muted">Use <span className="font-mono">/architecture?srsMode=true</span> for a clean screenshot without demo launcher overlays.</div>
            </FieldGroup>
          </div>
        </div>
      </section>
    </OperationsPage>
  );
}
