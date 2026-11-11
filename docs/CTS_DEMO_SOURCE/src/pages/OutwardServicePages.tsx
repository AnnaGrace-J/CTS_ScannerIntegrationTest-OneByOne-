import { AlertTriangle, Check, Play, RotateCcw, Trash2, UploadCloud, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuditTimelinePanel,
  ChequeImageViewerV2,
  ExceptionBanner,
  FieldGroup,
  FieldRow,
  FileStatusCard,
  FormPanel,
  OperationsHeader,
  OperationsPage,
  PrimaryActionButton,
  QueueFilterPanel,
  QueueSummaryStrip,
  SecondaryActionButton,
  ServiceRunPanel,
  StatusPill,
  StickyActionBar,
  WorkItemDetailLayout
} from "../components/operations";
import { SearchGrid } from "../components/SearchGrid";
import { SelectField } from "../components/SelectField";
import { TextField } from "../components/TextField";
import { parseMICR, workstepLabels } from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { AuditEvent, ChequeItem, ICLFile, PostingFile } from "../types";

function money(value: number | undefined) {
  return Number(value ?? 0).toLocaleString();
}

function businessDate() {
  return new Date().toISOString().slice(0, 10);
}

function fileCheques(file: ICLFile | undefined, cheques: ChequeItem[]) {
  if (!file) return [];
  const ids = new Set(file.chequeIds ?? []);
  return cheques.filter((cheque) => ids.has(cheque.id));
}

function outwardAudit(audit: AuditEvent[]) {
  return audit
    .filter((event) => `${event.action} ${event.note}`.toLowerCase().includes("outward") || `${event.action} ${event.note}`.toLowerCase().includes("icl") || `${event.action} ${event.note}`.toLowerCase().includes("credit posting"))
    .slice(0, 8);
}

function ServiceOperationsPage({
  children,
  lastError = "None",
  lastResult = "Awaiting operator action",
  serviceStatus = "Online",
  title
}: {
  children: ReactNode;
  lastError?: ReactNode;
  lastResult?: ReactNode;
  serviceStatus?: string;
  title: string;
}) {
  const { audit, runOutwardServiceTick, settings, user } = useDemoStore();
  const [autoRun, setAutoRun] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState("Not run this session");
  const [result, setResult] = useState<ReactNode>(lastResult);
  const [error, setError] = useState<ReactNode>(lastError);

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      try {
        runOutwardServiceTick();
        setLastRun(new Date().toLocaleString());
        setResult("Service tick completed.");
        setError("None");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Service tick failed.");
      } finally {
        setRunning(false);
      }
    }, 350);
  };

  useEffect(() => {
    if (!autoRun) return;
    const timer = window.setInterval(run, settings.pollIntervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [autoRun, settings.pollIntervalSeconds]);

  return (
    <OperationsPage density="compact">
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Outward", "Service Operations"]}
        title={title}
        subtitle="Service Operations workspace for outward clearing automation and manual response handling."
        branch={user?.branch ?? "All branches"}
        businessDate={businessDate()}
        role={user?.role ?? "SERVICE"}
        status={serviceStatus}
        meta={[
          { label: "Last Run Time", value: lastRun },
          { label: "Poll Interval", value: `${settings.pollIntervalSeconds}s` }
        ]}
      />

      <ServiceRunPanel lastRun={lastRun} running={running} title="Service Operations Control">
        <PrimaryActionButton disabledReason="The mock service tick is already running." icon={<Play className="h-4 w-4" />} disabled={running} onClick={run}>
          {running ? "Running..." : "Run Service Tick"}
        </PrimaryActionButton>
        <label className="flex min-h-9 items-center gap-2 rounded-md border border-ace-border bg-white px-3 text-sm font-bold text-ace-primary">
          <input checked={autoRun} type="checkbox" onChange={(event) => setAutoRun(event.target.checked)} />
          Auto-run {autoRun ? "On" : "Off"}
        </label>
        <span className="rounded-md border border-ace-border bg-slate-50 px-3 py-2 text-xs font-bold text-ace-primary">Poll {settings.pollIntervalSeconds}s</span>
        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-ace-success">Last result: {result}</span>
        <span className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-ace-danger">Last error: {error}</span>
      </ServiceRunPanel>

      {children}

      <AuditTimelinePanel events={outwardAudit(audit)} />
    </OperationsPage>
  );
}

export function OutwardHoldForIclPage() {
  const { cheques } = useDemoStore();
  const rows = cheques.filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === "HOLD_FOR_ICL_GENERATION");
  const dueRows = rows.filter((row) => (row.valueDate ?? row.scanDate) <= businessDate());

  return (
    <ServiceOperationsPage lastResult={`${dueRows.length} cheque(s) ready for file generation.`} title="Hold for ICL File Generation">
      <QueueSummaryStrip
        density="compact"
        items={[
          { label: "Held Cheques", value: rows.length, tone: rows.length ? "warning" : "success", hint: "Value-date control" },
          { label: "Ready", value: dueRows.length, tone: dueRows.length ? "success" : "info", hint: "Business date reached" },
          { label: "Waiting", value: rows.length - dueRows.length, tone: rows.length - dueRows.length ? "warning" : "success", hint: "Future value date" },
          { label: "Total Amount", value: `MMK ${money(rows.reduce((sum, row) => sum + row.amount, 0))}`, tone: "info" }
        ]}
      />
      <SearchGrid<ChequeItem>
        title="Held Instruments"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
          { key: "batch", header: "Batch", render: (row) => row.batchNo },
          { key: "value", header: "Value Date", render: (row) => row.valueDate ?? row.scanDate },
          { key: "business", header: "Business Date", render: () => businessDate() },
          { key: "reason", header: "Hold Reason", render: (row) => ((row.valueDate ?? row.scanDate) <= businessDate() ? "Business date reached" : "Waiting for value date") },
          { key: "ready", header: "Ready / Waiting", render: (row) => <StatusPill status={(row.valueDate ?? row.scanDate) <= businessDate() ? "Ready" : "Waiting"} /> },
          { key: "amount", header: "Amount", render: (row) => money(row.amount) }
        ]}
      />
    </ServiceOperationsPage>
  );
}

export function OutwardIclGenerationPage() {
  const { cheques, iclFiles } = useDemoStore();
  const readyRows = cheques.filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === "ICL_FILE_GENERATION");
  const outwardFiles = iclFiles.filter((file) => file.direction === "OUTWARD");
  const latestFile = outwardFiles[0];

  return (
    <ServiceOperationsPage lastResult={`${readyRows.length} cheque(s) ready for forward upload file generation.`} title="ICL File Generation">
      <QueueSummaryStrip
        density="compact"
        items={[
          { label: "Ready Cheques", value: readyRows.length, tone: readyRows.length ? "info" : "success" },
          { label: "Ready Amount", value: `MMK ${money(readyRows.reduce((sum, row) => sum + row.amount, 0))}`, tone: "info" },
          { label: "Generated Files", value: outwardFiles.length, tone: "success" },
          { label: "File Path", value: latestFile?.localPath ?? "C:\\CTS\\Outward\\Upload\\", tone: "info" }
        ]}
      />
      {latestFile ? (
        <FileStatusCard
          count={latestFile.chequeCount ?? latestFile.chequeIds?.length ?? 0}
          path={latestFile.localPath ?? "C:\\CTS\\Outward\\Upload\\"}
          status={latestFile.status}
          title={latestFile.fileName}
          total={latestFile.totalAmount ?? 0}
        />
      ) : null}
      <SearchGrid<ChequeItem>
        title="ICL Generation Queue"
        rows={readyRows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
          { key: "batch", header: "Batch", render: (row) => row.batchNo },
          { key: "amount", header: "Amount", render: (row) => money(row.amount) },
          { key: "workstep", header: "Workstep", render: (row) => workstepLabels[row.workstep] }
        ]}
      />
      <SearchGrid<ICLFile>
        title="Generated Forward Upload Files"
        rows={outwardFiles}
        getRowKey={(row) => row.id}
        columns={[
          { key: "name", header: "ICL File Name", render: (row) => row.fileName },
          { key: "count", header: "Cheque Count", render: (row) => row.chequeCount ?? row.chequeIds?.length ?? 0 },
          { key: "amount", header: "Total Amount", render: (row) => money(row.totalAmount) },
          { key: "generated", header: "Generated Date/Time", render: (row) => row.createdAt },
          { key: "path", header: "Local Path", render: (row) => row.localPath ?? "C:\\CTS\\Outward\\Upload\\" },
          { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
        ]}
      />
    </ServiceOperationsPage>
  );
}

const blankFilters = {
  chequeNumber: "",
  amount: "",
  micrAccount: "",
  routing: "",
  creditAccount: "",
  fileName: ""
};

export function ForwardUploadResponsePage() {
  const { cheques, iclFiles, rejectReasons, updateForwardUploadResponse } = useDemoStore();
  const [filters, setFilters] = useState(blankFilters);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [exceptionMode, setExceptionMode] = useState(false);
  const [fileReason, setFileReason] = useState(rejectReasons[0]?.description ?? "");
  const [fileRemarks, setFileRemarks] = useState("");
  const [rowRemarks, setRowRemarks] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<Record<string, "Accepted" | "Rejected">>({});
  const [message, setMessage] = useState("");

  const files = useMemo(() => {
    const responseCheques = cheques.filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === "FORWARD_UPLOAD_FILE_RESPONSE");
    const fileIds = new Set(responseCheques.map((cheque) => cheque.iclFileId).filter(Boolean));
    return iclFiles
      .filter((file) => file.direction === "OUTWARD" && fileIds.has(file.id))
      .filter((file) => matchesUploadFilters(file, fileCheques(file, cheques), filters));
  }, [cheques, filters, iclFiles]);

  const selectedFile = files.find((file) => file.id === selectedFileId) ?? files[0];
  const rows = fileCheques(selectedFile, cheques).filter((cheque) => cheque.workstep === "FORWARD_UPLOAD_FILE_RESPONSE");
  const selectedTotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const setAll = (decision: "Accepted" | "Rejected") => Object.fromEntries(rows.map((row) => [row.id, decision]));
  const submit = (nextDecisions: Record<string, "Accepted" | "Rejected">) => {
    if (!selectedFile) {
      setMessage("No ICL file selected.");
      return;
    }
    const rejected = Object.values(nextDecisions).some((decision) => decision === "Rejected");
    if (rejected && (!fileReason.trim() || !fileRemarks.trim())) {
      setMessage("Reject reason and file-level remarks are required for rejected upload responses.");
      return;
    }
    updateForwardUploadResponse(selectedFile.id, Object.fromEntries(rows.map((row) => [row.id, nextDecisions[row.id] ?? "Accepted"])), fileReason, fileRemarks, rowRemarks);
    setDecisions({});
    setRowRemarks({});
    setMessage("");
  };

  return (
    <ServiceOperationsPage lastResult={`${files.length} forward upload file(s) awaiting response.`} title="Clearing House Response Review">
      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}
      <QueueFilterPanel title="Response Search Filters" resultCount={files.length}>
        <TextField label="Cheque Number" value={filters.chequeNumber} onChange={(value) => setFilters((state) => ({ ...state, chequeNumber: value }))} />
        <TextField label="Amount" value={filters.amount} onChange={(value) => setFilters((state) => ({ ...state, amount: value }))} />
        <TextField label="MICR Account Number" value={filters.micrAccount} onChange={(value) => setFilters((state) => ({ ...state, micrAccount: value }))} />
        <TextField label="Routing Number" value={filters.routing} onChange={(value) => setFilters((state) => ({ ...state, routing: value }))} />
        <TextField label="Credit Account Number" value={filters.creditAccount} onChange={(value) => setFilters((state) => ({ ...state, creditAccount: value }))} />
        <TextField label="ICL File Name" value={filters.fileName} onChange={(value) => setFilters((state) => ({ ...state, fileName: value }))} />
      </QueueFilterPanel>
      <div className="responsive-sidebar-grid">
        <SearchGrid<ICLFile>
          title="Files Awaiting Response"
          rows={files}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedFileId(row.id)}
          columns={[
            { key: "file", header: "ICL File Name", render: (row) => row.fileName },
            { key: "count", header: "Cheque Count", render: (row) => fileCheques(row, cheques).length },
            { key: "amount", header: "Total Amount", render: (row) => money(fileCheques(row, cheques).reduce((sum, cheque) => sum + cheque.amount, 0)) },
            { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
          ]}
        />
        <FormPanel title="Selected File Details" density="compact">
          <FieldGroup>
            <FieldRow label="File Name" value={selectedFile?.fileName ?? "None"} />
            <FieldRow label="Cheque Count" value={rows.length} />
            <FieldRow label="Total Amount" value={`MMK ${money(selectedTotal)}`} />
            <FieldRow label="Generated Path" value={selectedFile?.localPath ?? "C:\\CTS\\Outward\\Upload\\"} />
            <FieldRow label="Status" value={<StatusPill status={selectedFile?.status ?? "Pending"} />} />
          </FieldGroup>
          <SelectField label="File-level Reason" value={fileReason} onChange={setFileReason} options={rejectReasons.map((reason) => ({ label: reason.description, value: reason.description }))} />
          <TextField label="File-level Remarks" value={fileRemarks} onChange={setFileRemarks} />
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-ace-border bg-slate-50 px-3 text-sm font-bold text-slate-700">
            <input checked={exceptionMode} type="checkbox" onChange={(event) => setExceptionMode(event.target.checked)} />
            Accept with Exception mode
          </label>
          <div className="flex flex-wrap gap-2">
            <PrimaryActionButton icon={<Check className="h-4 w-4" />} onClick={() => submit(setAll("Accepted"))}>Accept All</PrimaryActionButton>
            <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={() => submit(setAll("Rejected"))}>Reject All</SecondaryActionButton>
            <SecondaryActionButton icon={<UploadCloud className="h-4 w-4" />} onClick={() => submit({ ...setAll("Accepted"), ...decisions })}>Accept with Exception</SecondaryActionButton>
          </div>
        </FormPanel>
      </div>
      <SearchGrid<ChequeItem>
        title="Per-Cheque Response"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
          { key: "amount", header: "Amount", render: (row) => money(row.amount) },
          { key: "micr", header: "MICR Account", render: (row) => parseMICR(row.micrLine).accountNo },
          { key: "routing", header: "Routing", render: (row) => parseMICR(row.micrLine).routingNumber },
          {
            key: "status",
            header: "Cheque Status",
            render: (row) => (
              <select className="enterprise-input h-8" disabled={!exceptionMode} value={decisions[row.id] ?? "Accepted"} onChange={(event) => setDecisions((state) => ({ ...state, [row.id]: event.target.value as "Accepted" | "Rejected" }))}>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            )
          },
          { key: "reason", header: "Reject Reason", render: () => fileReason },
          {
            key: "remarks",
            header: "Remarks",
            render: (row) => (
              <input className="enterprise-input h-8" disabled={!exceptionMode} value={rowRemarks[row.id] ?? row.remarks ?? ""} onChange={(event) => setRowRemarks((state) => ({ ...state, [row.id]: event.target.value }))} />
            )
          }
        ]}
      />
    </ServiceOperationsPage>
  );
}

export function OutwardNakRepairPage() {
  const navigate = useNavigate();
  const { accounts, acceptOutwardNakCheque, cheques, discardOutwardNakCheque } = useDemoStore();
  const [filters, setFilters] = useState({ chequeNo: "", amount: "", micrAccount: "", routing: "", creditAccount: "" });
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const rows = cheques.filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === "OUTWARD_NAK_REPAIR").filter((cheque) => {
    const micr = parseMICR(cheque.micrLine);
    return cheque.chequeNo.includes(filters.chequeNo) && String(cheque.amount).includes(filters.amount) && micr.accountNo.includes(filters.micrAccount) && micr.routingNumber.includes(filters.routing) && cheque.accountNo.includes(filters.creditAccount);
  });
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const [draft, setDraft] = useState<ChequeItem | undefined>(selected);
  const account = accounts.find((item) => item.id === draft?.accountId);

  if (selected && draft?.id !== selected.id) setDraft(selected);
  const updateMicr = (patch: Partial<ReturnType<typeof parseMICR>>) => {
    if (!draft) return;
    const micr = { ...parseMICR(draft.micrLine), ...patch };
    setDraft({ ...draft, micrLine: `${micr.chequeNo} ${micr.routingNumber} ${micr.accountNo} ${micr.transactionCode}` });
  };

  return (
    <ServiceOperationsPage lastResult={`${rows.length} NAK repair item(s) pending.`} title="Outward NAK Repair">
      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}
      {draft ? (
        <ExceptionBanner>
          <b>NAK reason:</b> {draft.nakReason ?? draft.rejectReason ?? draft.reason ?? "Rejected by clearing house"}; <b>remarks:</b> {draft.nakRemarks ?? "No remarks supplied"}
        </ExceptionBanner>
      ) : null}
      <QueueFilterPanel title="NAK Repair Filters" resultCount={rows.length}>
        <TextField label="Cheque No." value={filters.chequeNo} onChange={(value) => setFilters((state) => ({ ...state, chequeNo: value }))} />
        <TextField label="Amount" value={filters.amount} onChange={(value) => setFilters((state) => ({ ...state, amount: value }))} />
        <TextField label="MICR A/c No." value={filters.micrAccount} onChange={(value) => setFilters((state) => ({ ...state, micrAccount: value }))} />
        <TextField label="Routing No." value={filters.routing} onChange={(value) => setFilters((state) => ({ ...state, routing: value }))} />
        <TextField label="Credit A/c No." value={filters.creditAccount} onChange={(value) => setFilters((state) => ({ ...state, creditAccount: value }))} />
      </QueueFilterPanel>
      <WorkItemDetailLayout
        aside={
          <FormPanel title="Correction Workspace" density="compact">
            <FieldGroup title="Account Details">
              <FieldRow label="Account No." value={draft?.accountNo ?? ""} />
              <FieldRow label="Status" value={account?.status ?? ""} />
              <FieldRow label="Account Name" value={account?.customerName ?? draft?.payee ?? ""} />
              <FieldRow label="Branch" value={draft?.branch ?? ""} />
            </FieldGroup>
            <TextField label="Cheque No." value={draft?.chequeNo ?? ""} onChange={(value) => draft && setDraft({ ...draft, chequeNo: value })} />
            <TextField label="MICR Account No." value={draft ? parseMICR(draft.micrLine).accountNo : ""} onChange={(value) => updateMicr({ accountNo: value })} />
            <TextField label="Routing Number" value={draft ? parseMICR(draft.micrLine).routingNumber : ""} onChange={(value) => updateMicr({ routingNumber: value })} />
            <TextField label="Cheque Type" value={draft?.chequeType ?? "Current Dated Normal"} onChange={(value) => draft && setDraft({ ...draft, chequeType: value })} />
            <TextField label="Check Digit" value={draft?.checkDigit ?? ""} onChange={(value) => draft && setDraft({ ...draft, checkDigit: value })} />
            <TextField label="Remarks" value={draft?.remarks ?? ""} onChange={(value) => draft && setDraft({ ...draft, remarks: value })} />
            <TextField disabled label="NAK Reason" value={draft?.nakReason ?? draft?.rejectReason ?? ""} />
            <TextField disabled label="NAK Remarks" value={draft?.nakRemarks ?? ""} />
          </FormPanel>
        }
      >
        <div className="responsive-sidebar-grid">
          <ChequeImageViewerV2 frontSrc={draft?.imageFrontUrl ?? "/placeholders/cheque-001.svg"} rearSrc={draft?.imageRearUrl} reference={draft ? `Cheque ${draft.chequeNo}` : "No cheque selected"} title="NAK Repair Image Review" badges={<StatusPill status="NAK Repair" />} />
          <SearchGrid<ChequeItem>
            title="NAK Repair Queue"
            rows={rows}
            getRowKey={(row) => row.id}
            onRowClick={(row) => {
              setSelectedId(row.id);
              setDraft(row);
            }}
            columns={[
              { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
              { key: "amount", header: "Amount", render: (row) => money(row.amount) },
              { key: "reason", header: "NAK Reason", render: (row) => row.nakReason ?? row.rejectReason ?? row.reason ?? "Rejected by clearing house" },
              { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
            ]}
          />
        </div>
      </WorkItemDetailLayout>
      <StickyActionBar>
        <PrimaryActionButton disabledReason="Select a NAK repair cheque first." icon={<Check className="h-4 w-4" />} disabled={!draft} onClick={() => draft && acceptOutwardNakCheque(draft)}>Accept</PrimaryActionButton>
        <SecondaryActionButton
          disabledReason="Select a NAK repair cheque first."
          icon={<Trash2 className="h-4 w-4" />}
          disabled={!draft}
          onClick={() => {
            if (!draft) return;
            if (!discardOutwardNakCheque(draft)) setMessage("Remarks are mandatory before discarding a NAK repair cheque.");
          }}
        >
          Discard
        </SecondaryActionButton>
        <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={() => navigate("/outward/dashboard")}>Exit</SecondaryActionButton>
      </StickyActionBar>
    </ServiceOperationsPage>
  );
}

export function WaitForReturnPage() {
  const { cheques, settings, simulateCbmReturnDownload } = useDemoStore();
  const rows = cheques.filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === "WAIT_FOR_RETURN");
  const cutoff = cutoffStatus(settings.outwardCutoffTime);

  return (
    <ServiceOperationsPage lastResult={`${rows.length} cheque(s) waiting for return status.`} serviceStatus={cutoff.label} title="Wait for Return">
      <QueueSummaryStrip
        density="compact"
        items={[
          { label: "Waiting Items", value: rows.length, tone: rows.length ? "warning" : "success" },
          { label: "Cutoff Status", value: cutoff.label, tone: cutoff.tone, hint: cutoff.detail },
          { label: "Accepted Path", value: "Credit Posting", tone: "success" },
          { label: "Rejected Path", value: "Work Exit", tone: "danger" }
        ]}
      />
      <ServiceRunPanel title="Return Download Simulation">
        <PrimaryActionButton icon={<UploadCloud className="h-4 w-4" />} onClick={() => simulateCbmReturnDownload(true)}>Simulate Return Download: Accepted</PrimaryActionButton>
        <SecondaryActionButton icon={<RotateCcw className="h-4 w-4" />} onClick={() => simulateCbmReturnDownload(false)}>Simulate Return Download: Rejected</SecondaryActionButton>
        <span className="text-sm text-ace-muted">If no status is received by cutoff, use rejected simulation for this demo.</span>
      </ServiceRunPanel>
      <SearchGrid<ChequeItem>
        title="Waiting for Return Status"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
          { key: "amount", header: "Amount", render: (row) => money(row.amount) },
          { key: "file", header: "ICL File", render: (row) => row.iclFileId ?? "" },
          { key: "wait", header: "Return Wait Status", render: (row) => <StatusPill status={row.returnStatus ?? "Pending"} /> }
        ]}
      />
    </ServiceOperationsPage>
  );
}

export function CreditPostingPage() {
  const { cheques, postingFiles } = useDemoStore();
  const rows = cheques.filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === "CREDIT_POSTING");
  const outwardFiles = postingFiles.filter((file) => file.direction === "OUTWARD");
  const latestFile = outwardFiles[0];

  return (
    <ServiceOperationsPage lastResult={`${rows.length} cheque(s) ready for credit posting.`} title="Credit Posting">
      <ExceptionBanner>No response is read for the mock credit posting file. Network/connectivity exceptions are warnings only and are handled manually by the bank.</ExceptionBanner>
      <QueueSummaryStrip
        density="compact"
        items={[
          { label: "Posting Queue", value: rows.length, tone: rows.length ? "info" : "success" },
          { label: "Queue Amount", value: `MMK ${money(rows.reduce((sum, row) => sum + row.amount, 0))}`, tone: "info" },
          { label: "Posting Files", value: outwardFiles.length, tone: "success" },
          { label: "Response", value: "No response read", tone: "warning" }
        ]}
      />
      {latestFile ? <PostingFileStatusCard file={latestFile} /> : null}
      <SearchGrid<ChequeItem>
        title="Accepted Outward Cheques Awaiting Credit Posting"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
          { key: "account", header: "Credit Account", render: (row) => row.accountNo },
          { key: "amount", header: "Amount", render: (row) => money(row.amount) },
          { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
        ]}
      />
      <SearchGrid<PostingFile>
        title="Credit Posting Files"
        rows={outwardFiles}
        getRowKey={(row) => row.id}
        columns={[
          { key: "file", header: "Posting File Name", render: (row) => row.fileName },
          { key: "count", header: "Count", render: (row) => row.count ?? row.chequeIds.length },
          { key: "amount", header: "Amount", render: (row) => money(row.totalAmount) },
          { key: "path", header: "Generated Path", render: (row) => row.localPath ?? "C:\\CTS\\Outward\\Posting\\" },
          { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> },
          { key: "warning", header: "Warning", render: (row) => row.warning ?? "" }
        ]}
      />
    </ServiceOperationsPage>
  );
}

function PostingFileStatusCard({ file }: { file: PostingFile }) {
  return (
    <section className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ace-primary">{file.fileName}</h2>
        <StatusPill status={file.status} />
      </div>
      <dl className="responsive-card-grid">
        <FieldGroup title="Cheque Count"><div className="text-xl font-bold text-ace-primary">{file.count ?? file.chequeIds.length}</div></FieldGroup>
        <FieldGroup title="Total Amount"><div className="font-mono font-bold text-ace-primary">{money(file.totalAmount)}</div></FieldGroup>
        <FieldGroup title="Generated Path"><div className="text-soft-wrap text-sm text-ace-muted">{file.localPath ?? "C:\\CTS\\Outward\\Posting\\"}</div></FieldGroup>
        <FieldGroup title="Status"><StatusPill status={file.status} /></FieldGroup>
      </dl>
    </section>
  );
}

function cutoffStatus(cutoffTime: string): { label: string; tone: "info" | "success" | "warning" | "danger"; detail: string } {
  const [hour = "0", minute = "0"] = cutoffTime.split(":");
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(Number(hour), Number(minute), 0, 0);
  const diff = cutoff.getTime() - now.getTime();
  if (diff <= 0) return { label: "Cutoff passed", tone: "danger", detail: `Cutoff was ${cutoffTime}` };
  return { label: "Before cutoff", tone: "success", detail: `${Math.ceil(diff / 60000)} min remaining` };
}

function matchesUploadFilters(file: ICLFile, rows: ChequeItem[], filters: typeof blankFilters) {
  const lower = (value: unknown) => String(value ?? "").toLowerCase();
  const has = (predicate: (cheque: ChequeItem) => boolean) => rows.some(predicate);
  return (
    lower(file.fileName).includes(lower(filters.fileName)) &&
    (!filters.chequeNumber || has((cheque) => lower(cheque.chequeNo).includes(lower(filters.chequeNumber)))) &&
    (!filters.amount || has((cheque) => lower(cheque.amount).includes(lower(filters.amount)))) &&
    (!filters.micrAccount || has((cheque) => lower(parseMICR(cheque.micrLine).accountNo).includes(lower(filters.micrAccount)))) &&
    (!filters.routing || has((cheque) => lower(parseMICR(cheque.micrLine).routingNumber).includes(lower(filters.routing)))) &&
    (!filters.creditAccount || has((cheque) => lower(cheque.accountNo).includes(lower(filters.creditAccount))))
  );
}
