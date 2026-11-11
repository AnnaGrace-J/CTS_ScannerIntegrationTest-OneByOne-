import { Activity, AlertTriangle, Clock3, Gauge, RefreshCw, ServerCog } from "lucide-react";
import { DemoScenarioLauncher } from "../components/DemoScenarioLauncher";
import { SearchGrid } from "../components/SearchGrid";
import { WorkitemsChart } from "../components/WorkitemsChart";
import {
  AuditTimelinePanel,
  FieldGroup,
  FieldRow,
  OperationsHeader,
  OperationsPage,
  QueueSummaryStrip,
  ServiceRunPanel,
  StatusPill as OperationsStatusPill,
  WorkstepCard,
  WorkflowProgressBar
} from "../components/operations";
import { StatusPill } from "../design-system/components";
import { countFor, getChartWorkitems, getWorkstepCounts, workstepLabels } from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { AuditEvent, ChequeDirection, ChequeItem, Workstep } from "../types";

type StepConfig = {
  label: string;
  route: string;
  worksteps: Workstep[];
  exception?: boolean;
};

const outwardSteps: StepConfig[] = [
  { label: "Scanning & Data Entry", route: "/outward/scanning", worksteps: ["SCANNING_DATA_ENTRY"] },
  { label: "Authorization", route: "/outward/authorization", worksteps: ["OUTWARD_AUTHORIZATION"] },
  { label: "Repair", route: "/outward/repair", worksteps: ["OUTWARD_REPAIR"], exception: true },
  { label: "Hold for ICL", route: "/outward/hold-for-icl-generation", worksteps: ["HOLD_FOR_ICL_GENERATION"] },
  { label: "ICL Generation", route: "/outward/icl-generation", worksteps: ["ICL_FILE_GENERATION"] },
  { label: "Upload Response", route: "/outward/forward-upload-response", worksteps: ["FORWARD_UPLOAD_FILE_RESPONSE"] },
  { label: "NAK Repair", route: "/outward/nak-repair", worksteps: ["OUTWARD_NAK_REPAIR"], exception: true },
  { label: "Wait for Return", route: "/outward/wait-for-return", worksteps: ["WAIT_FOR_RETURN"] },
  { label: "Credit Posting", route: "/outward/credit-posting", worksteps: ["CREDIT_POSTING"] },
  { label: "Completed / Exit", route: "/search", worksteps: ["WORK_EXIT"] }
];

const inwardSteps: StepConfig[] = [
  { label: "Upload Forward Download ICL", route: "/inward/upload-icl", worksteps: ["READ_UPLOAD_FORWARD_DOWNLOAD_ICL"] },
  { label: "Technical Verification", route: "/inward/technical-verification", worksteps: ["TECHNICAL_VERIFICATION"] },
  { label: "Debit Posting", route: "/inward/debit-posting", worksteps: ["DEBIT_POSTING"] },
  { label: "Referral", route: "/inward/referral", worksteps: ["REFERRAL"], exception: true },
  { label: "Manual Return Maker", route: "/inward/manual-return-maker", worksteps: ["MANUAL_RETURN_MAKER"] },
  { label: "Manual Return Checker", route: "/inward/manual-return-checker", worksteps: ["MANUAL_RETURN_CHECKER"] },
  { label: "Return ICL Creation", route: "/inward/return-icl-generation", worksteps: ["RETURN_ICL_CREATION"] },
  { label: "Return Upload Response", route: "/inward/return-upload-response", worksteps: ["RETURN_UPLOAD_FILE_RESPONSE"] },
  { label: "Inward NAK Repair", route: "/inward/nak-repair", worksteps: ["INWARD_NAK_REPAIR"], exception: true },
  { label: "Inward Charge Posting", route: "/inward/charge-posting", worksteps: ["INWARD_CHARGE_POSTING"] },
  { label: "Completed / Work Exit", route: "/search", worksteps: ["WORK_EXIT"] }
];

function stepCount(direction: ChequeDirection, worksteps: Workstep[], counts: ReturnType<typeof getWorkstepCounts>) {
  return worksteps.reduce((sum, workstep) => sum + countFor(counts, direction, workstep), 0);
}

function nextAction(direction: "outward" | "inward", rows: ChequeItem[]) {
  if (direction === "outward") {
    if (rows.some((row) => row.workstep === "OUTWARD_AUTHORIZATION")) return "Review outward authorization queue";
    if (rows.some((row) => row.workstep === "ICL_FILE_GENERATION")) return "Run ICL generation service";
    if (rows.some((row) => row.workstep === "WAIT_FOR_RETURN")) return "Update return download status";
    return "Monitor capture and service queues";
  }
  if (rows.some((row) => row.workstep === "TECHNICAL_VERIFICATION")) return "Perform technical verification";
  if (rows.some((row) => row.workstep === "REFERRAL")) return "Review referral decisions";
  if (rows.some((row) => row.workstep === "RETURN_ICL_CREATION")) return "Generate return ICL file";
  return "Monitor inward clearing queues";
}

const outwardDescriptions: Record<string, string> = {
  "Scanning & Data Entry": "Capture branch instruments, validate MICR data, and prepare maker batches.",
  Authorization: "Checker review for scanned batches before outward file preparation.",
  Repair: "Maker correction queue for batches returned from checker review.",
  "Hold for ICL": "Value-date hold area before instruments are released to file generation.",
  "ICL Generation": "Service queue for collating approved instruments into forward upload files.",
  "Upload Response": "Manual CBM portal response update for generated forward files.",
  "NAK Repair": "Exception queue for rejected upload responses that require correction.",
  "Wait for Return": "Pending return download status before credit posting eligibility.",
  "Credit Posting": "Accepted instruments ready for credit posting file creation.",
  "Completed / Exit": "Archived outward instruments that have reached final workflow exit."
};

const outwardProgressWorksteps: Workstep[] = [
  "SCANNING_DATA_ENTRY",
  "OUTWARD_AUTHORIZATION",
  "OUTWARD_REPAIR",
  "HOLD_FOR_ICL_GENERATION",
  "ICL_FILE_GENERATION",
  "FORWARD_UPLOAD_FILE_RESPONSE",
  "OUTWARD_NAK_REPAIR",
  "WAIT_FOR_RETURN",
  "CREDIT_POSTING",
  "WORK_EXIT"
];

const inwardDescriptions: Record<string, string> = {
  "Upload Forward Download ICL": "Import forward download files and create inward instrument workitems.",
  "Technical Verification": "Review image, MICR, drawer account, signature, and pay/no-pay readiness.",
  "Debit Posting": "Service queue for accepted normal cheques awaiting debit posting file creation.",
  Referral: "Checker decision queue for referred inward instruments.",
  "Manual Return Maker": "Maker queue for updating final return decisions before cutoff.",
  "Manual Return Checker": "Checker queue for approving or rejecting manual return decisions.",
  "Return ICL Creation": "Service queue for collating pay/no-pay items into return upload files.",
  "Return Upload Response": "Manual clearing-house response update for return upload files.",
  "Inward NAK Repair": "Exception queue for rejected return uploads that need correction.",
  "Inward Charge Posting": "Service queue for generating inward charge posting output.",
  "Completed / Work Exit": "Finalized inward instruments available in search and archive."
};

const inwardProgressWorksteps: Workstep[] = [
  "READ_UPLOAD_FORWARD_DOWNLOAD_ICL",
  "TECHNICAL_VERIFICATION",
  "DEBIT_POSTING",
  "REFERRAL",
  "MANUAL_RETURN_MAKER",
  "MANUAL_RETURN_CHECKER",
  "RETURN_ICL_CREATION",
  "RETURN_UPLOAD_FILE_RESPONSE",
  "INWARD_NAK_REPAIR",
  "INWARD_CHARGE_POSTING",
  "WORK_EXIT"
];

function outwardAuditEvents(audit: AuditEvent[]) {
  const outwardHints = ["OUTWARD", "ICL forward", "forward upload", "credit posting", "Batch", "CBM"];
  const filtered = audit.filter((event) => outwardHints.some((hint) => `${event.action} ${event.note} ${event.entityId ?? ""}`.toLowerCase().includes(hint.toLowerCase())));
  return (filtered.length ? filtered : audit).slice(0, 5);
}

function inwardAuditEvents(audit: AuditEvent[]) {
  const inwardHints = ["INWARD", "technical", "debit posting", "return ICL", "return upload", "charge posting", "referral"];
  const filtered = audit.filter((event) => inwardHints.some((hint) => `${event.action} ${event.note} ${event.entityId ?? ""}`.toLowerCase().includes(hint.toLowerCase())));
  return (filtered.length ? filtered : audit).slice(0, 5);
}

function cutoffStatus(cutoffTime: string) {
  const [hour = "0", minute = "0"] = cutoffTime.split(":");
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(Number(hour), Number(minute), 0, 0);
  const diffMs = cutoff.getTime() - now.getTime();
  if (diffMs <= 0) {
    return { label: "Cutoff passed", tone: "Attention", detail: `Inward cutoff was ${cutoffTime}` };
  }
  const diffMinutes = Math.ceil(diffMs / 60000);
  return { label: "Before cutoff", tone: "Open", detail: `${diffMinutes} min remaining until ${cutoffTime}` };
}

export function DashboardPage({ direction }: { direction: "outward" | "inward" }) {
  const { audit, branches, cheques, settings, user } = useDemoStore();
  const counts = getWorkstepCounts(cheques);
  const directionKey: ChequeDirection = direction === "outward" ? "OUTWARD" : "INWARD";
  const visibleCheques = cheques.filter((cheque) => cheque.direction === directionKey);
  const steps = (direction === "outward" ? outwardSteps : inwardSteps).map((step) => ({
    ...step,
    count: stepCount(directionKey, step.worksteps, counts)
  }));
  const total = visibleCheques.reduce((sum, cheque) => sum + cheque.amount, 0);
  const exceptions = visibleCheques.filter((cheque) => cheque.workstep.includes("REPAIR") || cheque.workstep.includes("NAK") || cheque.workstep === "REFERRAL").length;
  const approvals = visibleCheques.filter((cheque) => ["OUTWARD_AUTHORIZATION", "MANUAL_RETURN_CHECKER", "REFERRAL"].includes(cheque.workstep)).length;
  const completed = visibleCheques.filter((cheque) => cheque.workstep === "WORK_EXIT").length;

  if (direction === "outward") {
    const branch = branches.find((item) => item.id === user?.branchId);
    const refreshedAt = new Date().toLocaleTimeString();
    const summaryItems = [
      {
        label: "Pending Scanning",
        value: countFor(counts, "OUTWARD", "SCANNING_DATA_ENTRY"),
        tone: "info" as const,
        hint: "Maker capture queue"
      },
      {
        label: "Awaiting Authorization",
        value: countFor(counts, "OUTWARD", "OUTWARD_AUTHORIZATION"),
        tone: approvals ? "warning" as const : "success" as const,
        hint: "Checker decision queue"
      },
      {
        label: "Exceptions",
        value: exceptions,
        tone: exceptions ? "danger" as const : "success" as const,
        hint: "Repair and NAK items"
      },
      {
        label: "Ready for File Generation",
        value: countFor(counts, "OUTWARD", "HOLD_FOR_ICL_GENERATION") + countFor(counts, "OUTWARD", "ICL_FILE_GENERATION"),
        tone: "info" as const,
        hint: "Hold plus ICL service"
      },
      {
        label: "Waiting Return",
        value: countFor(counts, "OUTWARD", "WAIT_FOR_RETURN"),
        tone: "warning" as const,
        hint: "CBM return status pending"
      },
      {
        label: "Completed Today",
        value: completed,
        tone: "success" as const,
        hint: "Final exit items"
      }
    ];
    const progressSteps = ["Scan", "Authorize", "Repair", "Hold", "Generate ICL", "Upload Response", "NAK Repair", "Wait Return", "Credit Posting", "Exit"].map((label, index) => {
      const workstep = outwardProgressWorksteps[index];
      const count = countFor(counts, "OUTWARD", workstep);
      return {
        label,
        active: count > 0 && workstep !== "WORK_EXIT",
        complete: workstep === "WORK_EXIT" && count > 0
      };
    });
    const totalPending = visibleCheques.filter((cheque) => cheque.workstep !== "WORK_EXIT" && cheque.workstep !== "DISCARD").length;
    const generatedFiles = countFor(counts, "OUTWARD", "FORWARD_UPLOAD_FILE_RESPONSE") + countFor(counts, "OUTWARD", "WAIT_FOR_RETURN");

    return (
      <OperationsPage density="compact">
        <OperationsHeader
          breadcrumbs={["ACE CTS Workspace", "Outward Clearing"]}
          title="Outward Clearing Workspace"
          subtitle="Monitor outward instruments from capture to credit posting."
          branch={branch?.name ?? user?.branch ?? "All branches"}
          businessDate={new Date().toLocaleDateString()}
          role={user?.role ?? "ADMIN"}
          meta={[{ label: "Last Refreshed", value: refreshedAt }]}
          actions={<button className="enterprise-button-secondary" type="button"><RefreshCw className="h-4 w-4" /> Refresh</button>}
        />

        <DemoScenarioLauncher compact />

        <QueueSummaryStrip density="compact" items={summaryItems} />

        <WorkflowProgressBar steps={progressSteps} />

        <div className="responsive-sidebar-grid">
          <section className="space-y-4">
            <div className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-ace-primary">Outward Workflow Queues</h2>
                  <p className="mt-1 text-sm text-ace-muted">Timeline view of active worksteps, exception queues, and service handoffs.</p>
                </div>
                <OperationsStatusPill status={exceptions ? "Attention" : "Healthy"} />
              </div>
              <div className="responsive-card-grid mt-4">
                {steps.map((step) => {
                  const count = step.count;
                  const status = step.exception && count > 0 ? "Exception" : count > 0 ? "Open" : "Clear";
                  const sla = step.exception && count > 0 ? "Priority review" : count > 0 ? "Within SLA" : "No pending items";
                  return (
                    <WorkstepCard
                      key={step.label}
                      actionLabel="Open workstep"
                      badge={step.exception && count > 0 ? "Exception" : undefined}
                      count={count}
                      description={outwardDescriptions[step.label]}
                      exception={step.exception && count > 0}
                      route={step.route}
                      sla={sla}
                      status={status}
                      title={step.label}
                    />
                  );
                })}
              </div>
            </div>

            <SearchGrid<ChequeItem>
              title="Recent Outward Workitems"
              rows={visibleCheques}
              getRowKey={(row) => row.id}
              columns={[
                { key: "id", header: "Item ID", render: (row) => row.id },
                { key: "batch", header: "Batch", render: (row) => row.batchNo },
                { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
                { key: "amount", header: "Amount", render: (row) => row.amount.toLocaleString() },
                { key: "workstep", header: "Workstep", render: (row) => workstepLabels[row.workstep] },
                { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
              ]}
            />
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
              <div className="flex items-center gap-2 text-sm font-bold text-ace-primary"><Gauge className="h-4 w-4 text-ace-accent" /> Queue Health</div>
              <div className="mt-3 grid gap-3">
                <FieldGroup>
                  <FieldRow label="Pending Items" value={totalPending} />
                  <FieldRow label="Total Amount" value={`MMK ${total.toLocaleString()}`} />
                  <FieldRow label="Exceptions" value={<span className={exceptions ? "font-bold text-ace-danger" : "font-bold text-ace-success"}>{exceptions}</span>} />
                  <FieldRow label="Files in Motion" value={generatedFiles} />
                </FieldGroup>
                <div className="rounded-lg border border-ace-border bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ace-muted"><Activity className="h-4 w-4" /> Workitems</div>
                  <div className="mt-2 h-72"><WorkitemsChart data={getChartWorkitems(counts)} /></div>
                </div>
              </div>
            </section>

            <ServiceRunPanel lastRun={refreshedAt} title="Outward service status">
              <OperationsStatusPill status="Online" />
              <span className="inline-flex items-center gap-1 rounded-md border border-ace-border bg-slate-50 px-2 py-1 text-xs font-bold text-ace-primary">
                <ServerCog className="h-3.5 w-3.5" /> Poll {settings.pollIntervalSeconds}s
              </span>
            </ServiceRunPanel>

            <section className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
              <div className="flex items-center gap-2 text-sm font-bold text-ace-primary"><Clock3 className="h-4 w-4 text-ace-accent" /> Next Suggested Action</div>
              <p className="mt-2 text-sm leading-6 text-ace-muted">{nextAction(direction, visibleCheques)}</p>
            </section>

            <AuditTimelinePanel events={outwardAuditEvents(audit)} />

            {exceptions ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-ace-danger">
                <div className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Exception queues need attention</div>
              </div>
            ) : null}
          </aside>
        </div>
      </OperationsPage>
    );
  }

  const branch = branches.find((item) => item.id === user?.branchId);
  const refreshedAt = new Date().toLocaleTimeString();
  const cutoff = cutoffStatus(settings.inwardCutoffTime);
  const totalPending = visibleCheques.filter((cheque) => cheque.workstep !== "WORK_EXIT" && cheque.workstep !== "DISCARD").length;
  const returnFileQueues = countFor(counts, "INWARD", "RETURN_ICL_CREATION") + countFor(counts, "INWARD", "RETURN_UPLOAD_FILE_RESPONSE");
  const postingQueues = countFor(counts, "INWARD", "DEBIT_POSTING") + countFor(counts, "INWARD", "INWARD_CHARGE_POSTING");
  const progressSteps = [
    "Upload ICL",
    "Technical Verification",
    "Debit Posting",
    "Referral",
    "Return Maker",
    "Return Checker",
    "Return ICL",
    "Upload Response",
    "NAK Repair",
    "Charge Posting",
    "Exit"
  ].map((label, index) => {
    const workstep = inwardProgressWorksteps[index];
    const count = countFor(counts, "INWARD", workstep);
    return {
      label,
      active: count > 0 && workstep !== "WORK_EXIT",
      complete: workstep === "WORK_EXIT" && count > 0
    };
  });
  const summaryItems = [
    {
      label: "Uploaded ICL Items",
      value: countFor(counts, "INWARD", "READ_UPLOAD_FORWARD_DOWNLOAD_ICL"),
      tone: "info" as const,
      hint: "Forward download imports"
    },
    {
      label: "Technical Review",
      value: countFor(counts, "INWARD", "TECHNICAL_VERIFICATION"),
      tone: "warning" as const,
      hint: "Image and account checks"
    },
    {
      label: "Posting Queues",
      value: postingQueues,
      tone: "info" as const,
      hint: "Debit and charge posting"
    },
    {
      label: "Return Decisions",
      value: countFor(counts, "INWARD", "MANUAL_RETURN_MAKER") + countFor(counts, "INWARD", "MANUAL_RETURN_CHECKER") + countFor(counts, "INWARD", "RETURN_ICL_CREATION"),
      tone: "info" as const,
      hint: "Manual and file creation"
    },
    {
      label: "Exceptions",
      value: exceptions,
      tone: exceptions ? "danger" as const : "success" as const,
      hint: "Referral and NAK items"
    },
    {
      label: "Completed Today",
      value: completed,
      tone: "success" as const,
      hint: "Final exit items"
    }
  ];

  return (
    <OperationsPage density="compact">
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Inward Clearing"]}
        title="Inward Clearing Workspace"
        subtitle="Review inward instruments, posting, returns, and clearing-house responses."
        branch={branch?.name ?? user?.branch ?? "All branches"}
        businessDate={new Date().toLocaleDateString()}
        role={user?.role ?? "ADMIN"}
        meta={[{ label: "Last Refreshed", value: refreshedAt }]}
        actions={<button className="enterprise-button-secondary" type="button"><RefreshCw className="h-4 w-4" /> Refresh</button>}
      />

      <DemoScenarioLauncher compact />

      <QueueSummaryStrip density="compact" items={summaryItems} />

      <WorkflowProgressBar steps={progressSteps} />

      <div className="responsive-sidebar-grid">
        <section className="space-y-4">
          <div className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-ace-primary">Inward Workflow Queues</h2>
                <p className="mt-1 text-sm text-ace-muted">Operational timeline for uploaded instruments, verification, posting, returns, and responses.</p>
              </div>
              <OperationsStatusPill status={exceptions ? "Attention" : "Healthy"} />
            </div>
            <div className="responsive-card-grid mt-4">
              {steps.map((step) => {
                const count = step.count;
                const status = step.exception && count > 0 ? "Exception" : count > 0 ? "Open" : "Clear";
                const sla = step.exception && count > 0 ? "Priority review" : count > 0 ? "Within SLA" : "No pending items";
                return (
                  <WorkstepCard
                    key={step.label}
                    actionLabel="Open workstep"
                    badge={step.exception && count > 0 ? "Exception" : undefined}
                    count={count}
                    description={inwardDescriptions[step.label]}
                    exception={step.exception && count > 0}
                    route={step.route}
                    sla={sla}
                    status={status}
                    title={step.label}
                  />
                );
              })}
            </div>
          </div>

          <SearchGrid<ChequeItem>
            title="Recent Inward Workitems"
            rows={visibleCheques}
            getRowKey={(row) => row.id}
            columns={[
              { key: "id", header: "Item ID", render: (row) => row.id },
              { key: "batch", header: "Batch", render: (row) => row.batchNo },
              { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
              { key: "amount", header: "Amount", render: (row) => row.amount.toLocaleString() },
              { key: "workstep", header: "Workstep", render: (row) => workstepLabels[row.workstep] },
              { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
            ]}
          />
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
            <div className="flex items-center gap-2 text-sm font-bold text-ace-primary"><Gauge className="h-4 w-4 text-ace-accent" /> Queue Health</div>
            <div className="mt-3 grid gap-3">
              <FieldGroup>
                <FieldRow label="Pending Items" value={totalPending} />
                <FieldRow label="Total Amount" value={`MMK ${total.toLocaleString()}`} />
                <FieldRow label="Approvals" value={approvals} />
                <FieldRow label="Return Files" value={returnFileQueues} />
                <FieldRow label="Exceptions" value={<span className={exceptions ? "font-bold text-ace-danger" : "font-bold text-ace-success"}>{exceptions}</span>} />
              </FieldGroup>
              <div className="rounded-lg border border-ace-border bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ace-muted"><Activity className="h-4 w-4" /> Inward Workitem Chart</div>
                <div className="mt-2 h-72"><WorkitemsChart data={getChartWorkitems(counts)} /></div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-ace-primary"><Clock3 className="h-4 w-4 text-ace-accent" /> Cutoff Status</div>
              <OperationsStatusPill status={cutoff.tone} />
            </div>
            <p className="mt-2 text-sm leading-6 text-ace-muted">{cutoff.detail}</p>
          </section>

          <ServiceRunPanel lastRun={refreshedAt} title="Inward service status">
            <OperationsStatusPill status="Online" />
            <span className="inline-flex items-center gap-1 rounded-md border border-ace-border bg-slate-50 px-2 py-1 text-xs font-bold text-ace-primary">
              <ServerCog className="h-3.5 w-3.5" /> Poll {settings.pollIntervalSeconds}s
            </span>
          </ServiceRunPanel>

          <section className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
            <div className="flex items-center gap-2 text-sm font-bold text-ace-primary"><Clock3 className="h-4 w-4 text-ace-accent" /> Next Suggested Action</div>
            <p className="mt-2 text-sm leading-6 text-ace-muted">{nextAction(direction, visibleCheques)}</p>
          </section>

          <AuditTimelinePanel events={inwardAuditEvents(audit)} />

          {exceptions ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-ace-danger">
              <div className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Inward exception queues need attention</div>
            </div>
          ) : null}
        </aside>
      </div>
    </OperationsPage>
  );
}
