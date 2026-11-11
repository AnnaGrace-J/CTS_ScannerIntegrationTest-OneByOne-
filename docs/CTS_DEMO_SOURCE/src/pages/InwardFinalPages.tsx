import { Check, FileText, Play, RotateCcw, UploadCloud, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AmountDisplay,
  AuditTimelinePanel,
  ChequeImageViewerV2,
  ExceptionBanner,
  FieldGroup,
  FieldRow,
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
  ValidationSummaryPanel
} from "../components/operations";
import { SearchGrid } from "../components/SearchGrid";
import { SelectField } from "../components/SelectField";
import { TextField } from "../components/TextField";
import { parseMICR } from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { AuditEvent, ChequeItem, ICLFile, PostingFile, RejectReason } from "../types";

function money(value: number | undefined) {
  return Number(value ?? 0).toLocaleString();
}

function fileCheques(file: ICLFile | undefined, cheques: ChequeItem[]) {
  if (!file) return [];
  const ids = new Set(file.chequeIds ?? []);
  return cheques.filter((cheque) => ids.has(cheque.id));
}

function auditFor(events: AuditEvent[], terms: string[]) {
  return events.filter((event) => terms.some((term) => event.action.includes(term))).slice(0, 8);
}

function routeTotal(rows: ChequeItem[]) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function ServiceOperationsPage({
  auditEvents,
  children,
  lastRun,
  onRun,
  runLabel = "Run Service",
  serviceStatus,
  subtitle,
  title
}: {
  auditEvents: AuditEvent[];
  children: ReactNode;
  lastRun?: ReactNode;
  onRun?: () => void;
  runLabel?: string;
  serviceStatus: string;
  subtitle: string;
  title: string;
}) {
  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Inward", title]}
        title={title}
        subtitle={subtitle}
        businessDate={new Date().toISOString().slice(0, 10)}
        status={serviceStatus}
        meta={[
          { label: "Service Status", value: serviceStatus },
          { label: "Last Run Time", value: lastRun ?? "Not run in this session" },
          { label: "Mode", value: "Mock local service" },
          { label: "Persistence", value: "Local state" }
        ]}
      />
      {onRun ? (
        <ServiceRunPanel lastRun={lastRun} title={`${title} Control`}>
          <PrimaryActionButton icon={<Play className="h-4 w-4" />} onClick={onRun}>
            {runLabel}
          </PrimaryActionButton>
        </ServiceRunPanel>
      ) : null}
      {children}
      <AuditTimelinePanel events={auditEvents} />
    </OperationsPage>
  );
}

function FileSummaryCard({
  amountLabel = "Total Amount",
  count,
  file,
  path,
  title,
  total
}: {
  amountLabel?: string;
  count: number;
  file?: ICLFile | PostingFile;
  path: string;
  title: string;
  total: number;
}) {
  return (
    <section className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-ace-primary">{title}</h2>
          <p className="mt-1 text-sm text-ace-muted">Generated file metadata and output location.</p>
        </div>
        <StatusPill status={file?.status ?? (count ? "Pending" : "Idle")} />
      </div>
      <dl className="responsive-card-grid mt-4">
        <FieldGroup title="File Name"><div className="text-soft-wrap text-sm font-bold text-ace-primary">{file?.fileName ?? "Not generated"}</div></FieldGroup>
        <FieldGroup title="Count"><div className="text-xl font-bold text-ace-primary">{"count" in (file ?? {}) ? (file as PostingFile).count ?? count : (file as ICLFile | undefined)?.chequeCount ?? count}</div></FieldGroup>
        <FieldGroup title={amountLabel}><AmountDisplay value={("totalAmount" in (file ?? {}) ? file?.totalAmount : undefined) ?? total} /></FieldGroup>
        <FieldGroup title="Path"><div className="text-soft-wrap text-sm text-ace-muted">{file?.localPath ?? path}</div></FieldGroup>
        <FieldGroup title="Generated Time"><div className="text-sm font-semibold text-ace-primary">{file?.createdAt ?? "Pending"}</div></FieldGroup>
      </dl>
    </section>
  );
}

export function ReturnIclCreationPage() {
  const { audit, cheques, generateReturnIclFile, iclFiles } = useDemoStore();
  const rows = cheques.filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === "RETURN_ICL_CREATION");
  const files = iclFiles.filter((file) => file.direction === "INWARD" && file.fileName.includes("RETURN"));
  const latestFile = files[0];

  return (
    <ServiceOperationsPage
      auditEvents={auditFor(audit, ["Return ICL", "Return Upload"])}
      lastRun={latestFile?.createdAt}
      onRun={generateReturnIclFile}
      runLabel="Run Return ICL Service"
      serviceStatus={rows.length ? "Ready to generate" : "Idle"}
      subtitle="Collate Pay / No Pay inward instruments and create the clearing-house return upload file."
      title="Return ICL Creation"
    >
      <QueueSummaryStrip
        items={[
          { label: "Eligible Instruments", value: rows.length, tone: rows.length ? "warning" : "success" },
          { label: "Eligible Amount", value: money(routeTotal(rows)), tone: "info" },
          { label: "Generated Files", value: files.length, tone: "success" },
          { label: "Target", value: "Return Upload Response", tone: "info" }
        ]}
      />
      <FileSummaryCard count={rows.length} file={latestFile} path="C:\\CTS\\Inward\\ReturnUpload\\" title="Generated Return Upload File" total={routeTotal(rows)} />
      <SearchGrid<ChequeItem>
        title="Eligible Instruments"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
          { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.amount} /> },
          { key: "return", header: "Pay / No Pay", render: (row) => <StatusPill status={row.returnStatus ?? (row.rejectReason ? "No Pay" : "Pay")} /> },
          { key: "reason", header: "Reason", render: (row) => row.rejectReason ?? row.reason ?? "" }
        ]}
      />
      <SearchGrid<ICLFile>
        title="Generated Return Upload Files"
        rows={files}
        getRowKey={(row) => row.id}
        columns={[
          { key: "file", header: "ICL File Name", render: (row) => row.fileName },
          { key: "count", header: "Cheque Count", render: (row) => row.chequeCount ?? row.chequeIds?.length ?? 0 },
          { key: "amount", header: "Total Amount", render: (row) => <AmountDisplay value={row.totalAmount ?? 0} /> },
          { key: "time", header: "Generated Time", render: (row) => row.createdAt },
          { key: "path", header: "File Path", render: (row) => row.localPath ?? "C:\\CTS\\Inward\\ReturnUpload\\" },
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
  customerAccount: "",
  fileName: ""
};

export function ReturnUploadResponsePage() {
  const { audit, cheques, iclFiles, rejectReasons, settings, updateReturnUploadResponse } = useDemoStore();
  const [filters, setFilters] = useState(blankFilters);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [exceptionMode, setExceptionMode] = useState(false);
  const [fileReason, setFileReason] = useState(rejectReasons[0]?.description ?? "");
  const [fileRemarks, setFileRemarks] = useState("");
  const [rowReasons, setRowReasons] = useState<Record<string, string>>({});
  const [rowRemarks, setRowRemarks] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<Record<string, "Accepted" | "Rejected">>({});
  const [message, setMessage] = useState("");

  const files = useMemo(() => {
    const responseCheques = cheques.filter((cheque) => cheque.workstep === "RETURN_UPLOAD_FILE_RESPONSE");
    const ids = new Set(responseCheques.map((cheque) => cheque.iclFileId).filter(Boolean));
    return iclFiles
      .filter((file) => file.direction === "INWARD" && ids.has(file.id))
      .filter((file) => matchesFilters(file, fileCheques(file, cheques), filters));
  }, [cheques, filters, iclFiles]);
  const selectedFile = files.find((file) => file.id === selectedFileId) ?? files[0];
  const rows = fileCheques(selectedFile, cheques).filter((cheque) => cheque.workstep === "RETURN_UPLOAD_FILE_RESPONSE");
  const selectedTotal = routeTotal(rows);
  const acceptTarget = settings.inwardChargePostingRequired ? "Inward Charge Posting" : "Work Exit";

  const setAll = (decision: "Accepted" | "Rejected") => Object.fromEntries(rows.map((row) => [row.id, decision]));
  const submit = (next: Record<string, "Accepted" | "Rejected">) => {
    if (!selectedFile) {
      setMessage("No return ICL file selected.");
      return;
    }
    const rejectedRows = rows.filter((row) => (next[row.id] ?? "Accepted") === "Rejected");
    const missingRowDetail = rejectedRows.some((row) => !(rowReasons[row.id] ?? fileReason).trim() || !(rowRemarks[row.id] ?? fileRemarks).trim());
    if (rejectedRows.length && (!fileReason.trim() || !fileRemarks.trim() || missingRowDetail)) {
      setMessage("Reject reason and remarks are required for rejected return upload responses.");
      return;
    }
    updateReturnUploadResponse(selectedFile.id, next, fileReason, fileRemarks, rowReasons, rowRemarks);
    setMessage("");
    setDecisions({});
    setRowReasons({});
    setRowRemarks({});
  };

  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Inward", "Return Upload Response"]}
        title="Return Upload Response Review"
        subtitle={`Review clearing-house status. Accepted items route to ${acceptTarget}; rejected items route to Inward NAK Repair.`}
        businessDate={new Date().toISOString().slice(0, 10)}
        status={files.length ? "Response pending" : "Queue clear"}
        meta={[
          { label: "Files Awaiting Response", value: files.length },
          { label: "Selected File", value: selectedFile?.fileName ?? "None" },
          { label: "Cheque Rows", value: rows.length },
          { label: "Accepted Target", value: acceptTarget }
        ]}
      />
      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}
      <QueueFilterPanel title="Return Response Filters" resultCount={files.length} defaultCollapsed>
        <TextField label="Cheque Number" value={filters.chequeNumber} onChange={(value) => setFilters((state) => ({ ...state, chequeNumber: value }))} />
        <TextField label="Amount" value={filters.amount} onChange={(value) => setFilters((state) => ({ ...state, amount: value }))} />
        <TextField label="MICR Account Number" value={filters.micrAccount} onChange={(value) => setFilters((state) => ({ ...state, micrAccount: value }))} />
        <TextField label="Routing Number" value={filters.routing} onChange={(value) => setFilters((state) => ({ ...state, routing: value }))} />
        <TextField label="Customer Account Number" value={filters.customerAccount} onChange={(value) => setFilters((state) => ({ ...state, customerAccount: value }))} />
        <TextField label="ICL File Name" value={filters.fileName} onChange={(value) => setFilters((state) => ({ ...state, fileName: value }))} />
      </QueueFilterPanel>
      <div className="responsive-sidebar-grid">
        <SearchGrid<ICLFile>
          title="Return Files Awaiting Response"
          rows={files}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedFileId(row.id)}
          columns={[
            { key: "file", header: "ICL File Name", render: (row) => row.fileName },
            { key: "count", header: "Cheque Count", render: (row) => fileCheques(row, cheques).length },
            { key: "amount", header: "Total Amount", render: (row) => <AmountDisplay value={routeTotal(fileCheques(row, cheques))} /> }
          ]}
        />
        <FormPanel title="File Details and Response Actions" density="compact">
          <FieldGroup title="Selected File">
            <FieldRow label="File Name" value={selectedFile?.fileName ?? "None"} />
            <FieldRow label="Cheque Count" value={rows.length} />
            <FieldRow label="Total Amount" value={<AmountDisplay value={selectedTotal} />} />
            <FieldRow label="Path" value={selectedFile?.localPath ?? "C:\\CTS\\Inward\\ReturnUpload\\"} />
          </FieldGroup>
          <FieldGroup title="Routing Outcome">
            <FieldRow label="Accept" value={acceptTarget} />
            <FieldRow label="Reject" value="Inward NAK Repair" />
            <FieldRow label="Exception Mode" value={exceptionMode ? "Enabled" : "Disabled"} />
          </FieldGroup>
          <SelectField label="File-level Reason" value={fileReason} onChange={setFileReason} options={rejectReasons.map((reason) => ({ label: reason.description, value: reason.description }))} />
          <TextField label="File-level Remarks" value={fileRemarks} onChange={setFileRemarks} />
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-ace-border bg-slate-50 px-3 text-sm font-bold text-slate-700">
            <input checked={exceptionMode} type="checkbox" onChange={(event) => setExceptionMode(event.target.checked)} />
            Accept with Exception mode
          </label>
          <div className="flex flex-wrap gap-2 col-span-full">
            <PrimaryActionButton icon={<Check className="h-4 w-4" />} onClick={() => submit(setAll("Accepted"))}>Accept All</PrimaryActionButton>
            <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={() => submit(setAll("Rejected"))}>Reject All</SecondaryActionButton>
            <SecondaryActionButton icon={<UploadCloud className="h-4 w-4" />} onClick={() => submit({ ...setAll("Accepted"), ...decisions })}>Accept with Exception</SecondaryActionButton>
          </div>
        </FormPanel>
      </div>
      <SearchGrid<ChequeItem>
        title="Per-Cheque Return Response"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "cheque", header: "Cheque Number", render: (row) => row.chequeNo },
          { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.amount} /> },
          { key: "micr", header: "MICR Account Number", render: (row) => parseMICR(row.micrLine).accountNo },
          { key: "routing", header: "Routing Number", render: (row) => parseMICR(row.micrLine).routingNumber },
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
          {
            key: "reason",
            header: "Reject Reason",
            render: (row) => (
              <select className="enterprise-input h-8" disabled={!exceptionMode || (decisions[row.id] ?? "Accepted") !== "Rejected"} value={rowReasons[row.id] ?? fileReason} onChange={(event) => setRowReasons((state) => ({ ...state, [row.id]: event.target.value }))}>
                {rejectReasons.map((reason) => <option key={reason.code} value={reason.description}>{reason.description}</option>)}
              </select>
            )
          },
          {
            key: "remarks",
            header: "Remarks",
            render: (row) => (
              <input className="enterprise-input h-8" disabled={!exceptionMode || (decisions[row.id] ?? "Accepted") !== "Rejected"} value={rowRemarks[row.id] ?? ""} onChange={(event) => setRowRemarks((state) => ({ ...state, [row.id]: event.target.value }))} />
            )
          }
        ]}
      />
      <AuditTimelinePanel events={auditFor(audit, ["Return Upload"])} />
    </OperationsPage>
  );
}

export function InwardNakRepairPage() {
  const navigate = useNavigate();
  const { accounts, audit, branches, cheques, completeInwardNakRepair } = useDemoStore();
  const [filters, setFilters] = useState({ chequeNo: "", amount: "", micrAccount: "", routing: "", customerAccount: "" });
  const [selectedId, setSelectedId] = useState("");
  const rows = cheques
    .filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === "INWARD_NAK_REPAIR")
    .filter((cheque) => {
      const micr = parseMICR(cheque.micrLine);
      return (
        cheque.chequeNo.includes(filters.chequeNo) &&
        String(cheque.amount).includes(filters.amount) &&
        micr.accountNo.includes(filters.micrAccount) &&
        micr.routingNumber.includes(filters.routing) &&
        (cheque.accountNo ?? "").includes(filters.customerAccount)
      );
    });
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const account = accounts.find((item) => item.id === selected?.accountId);
  const branch = branches.find((item) => item.id === account?.branchId);
  const micr = selected ? parseMICR(selected.micrLine) : undefined;

  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Inward", "NAK Repair"]}
        title="Inward NAK Repair"
        subtitle="Repair rejected return upload responses and send items back to return file creation."
        businessDate={new Date().toISOString().slice(0, 10)}
        status={rows.length ? "Repair required" : "Queue clear"}
        meta={[
          { label: "Queue Items", value: rows.length },
          { label: "Selected Cheque", value: selected?.chequeNo ?? "None" },
          { label: "Outcome", value: "Return ICL Creation" },
          { label: "Mode", value: "Manual correction" }
        ]}
      />
      {selected ? (
        <ExceptionBanner>
          <b>NAK reason:</b> {selected.nakReason ?? selected.rejectReason ?? "Rejected by clearing house"}; <b>remarks:</b> {selected.nakRemarks ?? selected.remarks ?? "No remarks supplied"}
        </ExceptionBanner>
      ) : null}
      <QueueFilterPanel title="Inward NAK Repair Filters" resultCount={rows.length} defaultCollapsed>
        <TextField label="Cheque No." value={filters.chequeNo} onChange={(value) => setFilters((state) => ({ ...state, chequeNo: value }))} />
        <TextField label="Amount" value={filters.amount} onChange={(value) => setFilters((state) => ({ ...state, amount: value }))} />
        <TextField label="MICR A/c No." value={filters.micrAccount} onChange={(value) => setFilters((state) => ({ ...state, micrAccount: value }))} />
        <TextField label="Routing No." value={filters.routing} onChange={(value) => setFilters((state) => ({ ...state, routing: value }))} />
        <TextField label="Customer A/c No." value={filters.customerAccount} onChange={(value) => setFilters((state) => ({ ...state, customerAccount: value }))} />
      </QueueFilterPanel>
      <div className="responsive-sidebar-grid">
        <SearchGrid<ChequeItem>
          title="Inward NAK Repair Queue"
          rows={rows}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedId(row.id)}
          columns={[
            { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
            { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.amount} /> },
            { key: "reason", header: "NAK Reason", render: (row) => row.nakReason ?? row.rejectReason ?? "" },
            { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
          ]}
        />
        {selected ? (
          <section className="responsive-workspace-grid">
            <ChequeImageViewerV2 frontSrc={selected.imageFrontUrl} rearSrc={selected.imageRearUrl} reference={`Cheque ${selected.chequeNo} | UIC ${selected.uic}`} title="NAK Repair Image Review" badges={<StatusPill status={selected.status} />} />
            <FormPanel title="Cheque / Account Details" density="compact">
              <FieldGroup title="Cheque Data">
                <FieldRow label="Cheque No." value={selected.chequeNo} />
                <FieldRow label="MICR Account" value={micr?.accountNo ?? ""} />
                <FieldRow label="Routing Number" value={micr?.routingNumber ?? ""} />
                <FieldRow label="Amount" value={<AmountDisplay value={selected.amount} />} />
                <FieldRow label="Check Digit" value={selected.checkDigit ?? micr?.transactionCode ?? ""} />
              </FieldGroup>
              <FieldGroup title="Account Data">
                <FieldRow label="Account Name" value={account?.customerName ?? selected.payee ?? ""} />
                <FieldRow label="Account Branch" value={branch?.name ?? selected.branch ?? ""} />
                <FieldRow label="Customer Account" value={selected.accountNo} />
                <FieldRow label="Return Target" value="Return ICL Creation" />
              </FieldGroup>
              <FieldGroup title="Read-only Exception">
                <FieldRow label="NAK Reason" value={selected.nakReason ?? selected.rejectReason ?? ""} />
                <FieldRow label="NAK Remarks" value={selected.nakRemarks ?? selected.remarks ?? ""} />
              </FieldGroup>
              <div className="col-span-full">
                <StickyActionBar>
                  <PrimaryActionButton icon={<Check className="h-4 w-4" />} onClick={() => completeInwardNakRepair(selected)}>
                    Complete
                  </PrimaryActionButton>
                  <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={() => navigate("/inward/dashboard")}>
                    Exit
                  </SecondaryActionButton>
                </StickyActionBar>
              </div>
            </FormPanel>
          </section>
        ) : (
          <ExceptionBanner>No inward NAK repair items match the current filters.</ExceptionBanner>
        )}
      </div>
      <AuditTimelinePanel events={auditFor(audit, ["Inward NAK", "Complete Inward NAK"])} />
    </OperationsPage>
  );
}

export function InwardChargePostingPage() {
  const { audit, cheques, postingFiles, runInwardChargePosting } = useDemoStore();
  const rows = cheques.filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === "INWARD_CHARGE_POSTING");
  const files = postingFiles.filter((file) => file.direction === "INWARD" && file.fileName.includes("charge"));
  const latestFile = files[0];
  const totalCharge = rows.length * 1000;

  return (
    <ServiceOperationsPage
      auditEvents={auditFor(audit, ["Inward Charge"])}
      lastRun={latestFile?.createdAt}
      onRun={runInwardChargePosting}
      runLabel="Run Charge Posting"
      serviceStatus={rows.length ? "Ready to post charges" : "Idle"}
      subtitle="Generate mock charge posting files for accepted and rejected inward return responses."
      title="Inward Charge Posting"
    >
      <QueueSummaryStrip
        items={[
          { label: "Charge Queue", value: rows.length, tone: rows.length ? "warning" : "success" },
          { label: "Total Charge Amount", value: money(totalCharge), tone: "info" },
          { label: "Generated Files", value: files.length, tone: "success" },
          { label: "Target", value: "Work Exit", tone: "info" }
        ]}
      />
      <FileSummaryCard amountLabel="Total Charge Amount" count={rows.length} file={latestFile} path="C:\\CTS\\Inward\\ChargePosting\\" title="Charge Posting File" total={totalCharge} />
      <SearchGrid<ChequeItem>
        title="Items Awaiting Charge Posting"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
          { key: "amount", header: "Cheque Amount", render: (row) => <AmountDisplay value={row.amount} /> },
          { key: "charge", header: "Charge Amount", render: () => <AmountDisplay value={1000} /> },
          { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
        ]}
      />
      <SearchGrid<PostingFile>
        title="Charge Posting Files"
        rows={files}
        getRowKey={(row) => row.id}
        columns={[
          { key: "file", header: "File Name", render: (row) => row.fileName },
          { key: "count", header: "Count", render: (row) => row.count ?? row.chequeIds.length },
          { key: "amount", header: "Total Charge Amount", render: (row) => <AmountDisplay value={row.totalAmount ?? 0} /> },
          { key: "path", header: "File Path", render: (row) => row.localPath ?? "C:\\CTS\\Inward\\ChargePosting\\" },
          { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
        ]}
      />
    </ServiceOperationsPage>
  );
}

function matchesFilters(file: ICLFile, rows: ChequeItem[], filters: typeof blankFilters) {
  const lower = (value: unknown) => String(value ?? "").toLowerCase();
  const has = (predicate: (cheque: ChequeItem) => boolean) => rows.some(predicate);
  return (
    lower(file.fileName).includes(lower(filters.fileName)) &&
    (!filters.chequeNumber || has((cheque) => lower(cheque.chequeNo).includes(lower(filters.chequeNumber)))) &&
    (!filters.amount || has((cheque) => lower(cheque.amount).includes(lower(filters.amount)))) &&
    (!filters.micrAccount || has((cheque) => lower(parseMICR(cheque.micrLine).accountNo).includes(lower(filters.micrAccount)))) &&
    (!filters.routing || has((cheque) => lower(parseMICR(cheque.micrLine).routingNumber).includes(lower(filters.routing)))) &&
    (!filters.customerAccount || has((cheque) => lower(cheque.accountNo).includes(lower(filters.customerAccount))))
  );
}
