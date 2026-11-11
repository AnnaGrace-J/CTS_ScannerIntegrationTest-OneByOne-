import { Check, Clock3, FileText, Play, Send, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
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
  SignatureViewerV2,
  StatusPill,
  StickyActionBar,
  ValidationSummaryPanel
} from "../components/operations";
import { SearchGrid } from "../components/SearchGrid";
import { SelectField } from "../components/SelectField";
import { TextField } from "../components/TextField";
import { parseMICR } from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { Account, AuditEvent, ChequeItem, PostingFile, RejectReason } from "../types";

const blankFilters = {
  chequeNo: "",
  amount: "",
  micrAccount: "",
  routing: "",
  customerAccount: ""
};

type FilterState = typeof blankFilters;

function money(value: number | undefined) {
  return Number(value ?? 0).toLocaleString();
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function drawerAccount(accounts: Account[], cheque: ChequeItem | undefined) {
  if (!cheque) return undefined;
  const micrAccount = parseMICR(cheque.micrLine).accountNo;
  return accounts.find((account) => digits(account.accountNo).slice(-15) === digits(micrAccount).slice(-15));
}

function filterCheques(rows: ChequeItem[], filters: FilterState) {
  return rows.filter((cheque) => {
    const micr = parseMICR(cheque.micrLine);
    return (
      cheque.chequeNo.includes(filters.chequeNo) &&
      String(cheque.amount).includes(filters.amount) &&
      micr.accountNo.includes(filters.micrAccount) &&
      micr.routingNumber.includes(filters.routing) &&
      (cheque.accountNo ?? "").includes(filters.customerAccount)
    );
  });
}

function ageLabel(date: string | undefined) {
  if (!date) return "Unknown";
  const age = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  if (age === 0) return "Today";
  if (age === 1) return "1 day";
  return `${age} days`;
}

function cutoffStatus(cutoffTime: string) {
  const [hour, minute] = cutoffTime.split(":").map(Number);
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(hour || 0, minute || 0, 0, 0);
  const minutes = Math.round((cutoff.getTime() - now.getTime()) / 60000);
  if (minutes < 0) return { label: "Cutoff passed", tone: "danger" as const, detail: "Manual return decisions are at cutoff risk." };
  if (minutes <= 60) return { label: "Cutoff risk", tone: "warning" as const, detail: `${minutes} min remaining.` };
  return { label: "Within cutoff", tone: "success" as const, detail: `${minutes} min remaining.` };
}

function isPo(cheque: ChequeItem | undefined) {
  return cheque?.chequeType === "2" || cheque?.chequeType?.toUpperCase() === "PO";
}

function serviceAudit(events: AuditEvent[], terms: string[]) {
  return events.filter((event) => terms.some((term) => event.action.includes(term))).slice(0, 8);
}

function FilterPanel({
  filters,
  resultCount,
  setFilters,
  title
}: {
  filters: FilterState;
  resultCount: number;
  setFilters: (filters: FilterState) => void;
  title: string;
}) {
  return (
    <QueueFilterPanel title={title} resultCount={resultCount} defaultCollapsed>
      <TextField label="Cheque No." value={filters.chequeNo} onChange={(value) => setFilters({ ...filters, chequeNo: value })} />
      <TextField label="Amount" value={filters.amount} onChange={(value) => setFilters({ ...filters, amount: value })} />
      <TextField label="MICR A/c No." value={filters.micrAccount} onChange={(value) => setFilters({ ...filters, micrAccount: value })} />
      <TextField label="Routing No." value={filters.routing} onChange={(value) => setFilters({ ...filters, routing: value })} />
      <TextField label="Customer A/c No." value={filters.customerAccount} onChange={(value) => setFilters({ ...filters, customerAccount: value })} />
    </QueueFilterPanel>
  );
}

function ServiceOperationsPage({
  auditEvents,
  children,
  lastFile,
  queueCount,
  run,
  title
}: {
  auditEvents: AuditEvent[];
  children: ReactNode;
  lastFile?: PostingFile;
  queueCount: number;
  run: () => void;
  title: string;
}) {
  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Inward", title]}
        title={title}
        subtitle="Automated inward posting operation using synthetic CBS posting files."
        businessDate={new Date().toISOString().slice(0, 10)}
        status={queueCount ? "Work available" : "Idle"}
        meta={[
          { label: "Service Status", value: queueCount ? "Ready to run" : "No pending work" },
          { label: "Last Run Time", value: lastFile?.createdAt ?? "Not run in this session" },
          { label: "Posting Files", value: lastFile ? "Generated" : "None" },
          { label: "Response Handling", value: "No response read" }
        ]}
      />
      <ServiceRunPanel lastRun={lastFile?.createdAt} title="Debit Posting Service Control">
        <PrimaryActionButton icon={<Play className="h-4 w-4" />} onClick={run}>
          Run Service
        </PrimaryActionButton>
      </ServiceRunPanel>
      {children}
      <AuditTimelinePanel events={auditEvents} />
    </OperationsPage>
  );
}

function PostingFileSummary({ file, queueCount, queueTotal }: { file?: PostingFile; queueCount: number; queueTotal: number }) {
  return (
    <section className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-ace-primary">Posting File Status</h2>
          <p className="mt-1 text-sm text-ace-muted">Generated file metadata for the CBS mock handoff.</p>
        </div>
        <StatusPill status={file?.status ?? (queueCount ? "Pending" : "Idle")} />
      </div>
      <dl className="responsive-card-grid mt-4">
        <FieldGroup title="File Name"><div className="text-soft-wrap text-sm font-bold text-ace-primary">{file?.fileName ?? "Not generated"}</div></FieldGroup>
        <FieldGroup title="Count"><div className="text-xl font-bold text-ace-primary">{file?.count ?? file?.chequeIds.length ?? queueCount}</div></FieldGroup>
        <FieldGroup title="Amount"><AmountDisplay value={file?.totalAmount ?? queueTotal} /></FieldGroup>
        <FieldGroup title="Path"><div className="text-soft-wrap text-sm text-ace-muted">{file?.localPath ?? "C:\\CTS\\Inward\\Posting\\"}</div></FieldGroup>
        <FieldGroup title="Generated Time"><div className="text-sm font-semibold text-ace-primary">{file?.createdAt ?? "Pending"}</div></FieldGroup>
      </dl>
    </section>
  );
}

export function InwardDebitPostingPage() {
  const { audit, cheques, postingFiles, runInwardDebitPosting } = useDemoStore();
  const rows = cheques.filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === "DEBIT_POSTING");
  const files = postingFiles.filter((file) => file.direction === "INWARD");
  const latestFile = files[0];
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <ServiceOperationsPage
      auditEvents={serviceAudit(audit, ["Inward Debit", "Debit Posting"])}
      lastFile={latestFile}
      queueCount={rows.length}
      run={runInwardDebitPosting}
      title="Debit Posting Service"
    >
      <QueueSummaryStrip
        items={[
          { label: "Posting Queue", value: rows.length, tone: rows.length ? "warning" : "success" },
          { label: "Queue Amount", value: money(total), tone: "info" },
          { label: "Generated Files", value: files.length, tone: "success" },
          { label: "Next Workstep", value: "Manual Return Maker", tone: "info" }
        ]}
      />
      <PostingFileSummary file={latestFile} queueCount={rows.length} queueTotal={total} />
      <SearchGrid<ChequeItem>
        title="Accepted Inward Cheques Awaiting Debit Posting"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
          { key: "account", header: "Customer Account", render: (row) => parseMICR(row.micrLine).accountNo.slice(-15) },
          { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.amount} /> },
          { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
        ]}
      />
      <SearchGrid<PostingFile>
        title="Debit Posting Files"
        rows={files}
        getRowKey={(row) => row.id}
        columns={[
          { key: "file", header: "Posting File Name", render: (row) => row.fileName },
          { key: "count", header: "Count", render: (row) => row.count ?? row.chequeIds.length },
          { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.totalAmount ?? 0} /> },
          { key: "path", header: "Path", render: (row) => row.localPath ?? "C:\\CTS\\Inward\\Posting\\" },
          { key: "created", header: "Generated Time", render: (row) => row.createdAt },
          { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
        ]}
      />
    </ServiceOperationsPage>
  );
}

export function InwardReferralPage() {
  const navigate = useNavigate();
  const { accounts, audit, branches, cheques, referralAccept, referralReject, rejectReasons, user, users } = useDemoStore();
  const userBranch = branches.find((branch) => branch.id === user?.branchId);
  const assignedRouting = user?.role === "ADMIN" ? "" : userBranch?.clearingCode ?? "";
  const [filters, setFilters] = useState(blankFilters);
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState(rejectReasons[0]?.description ?? "");
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<"accept" | "reject" | "exit" | null>(null);

  const rows = useMemo(() => {
    const scoped = cheques.filter((cheque) => {
      const routing = parseMICR(cheque.micrLine).routingNumber;
      return cheque.direction === "INWARD" && cheque.workstep === "REFERRAL" && (!assignedRouting || routing === assignedRouting);
    });
    return filterCheques(scoped, filters);
  }, [assignedRouting, cheques, filters]);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const account = drawerAccount(accounts, selected);
  const branch = branches.find((item) => item.id === account?.branchId);
  const hideSensitive = isPo(selected);

  const perform = () => {
    if (!selected) return;
    if (action === "accept") referralAccept(selected.id);
    if (action === "reject" && !referralReject(selected.id, reason, remarks)) {
      setMessage("Reject reason and remarks are required.");
      setAction(null);
      return;
    }
    if (action === "exit") {
      navigate("/inward/dashboard");
      return;
    }
    setMessage("");
    setRemarks("");
    setAction(null);
  };

  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Inward", "Referral"]}
        title="Referral Review"
        subtitle={`Checker review for referred inward instruments. Assigned branch: ${userBranch?.name ?? "All branches"} ${assignedRouting ? `(${assignedRouting})` : ""}.`}
        businessDate={new Date().toISOString().slice(0, 10)}
        status={rows.length ? "Review required" : "Queue clear"}
        meta={[
          { label: "Queue Items", value: rows.length },
          { label: "Selected Cheque", value: selected?.chequeNo ?? "None" },
          { label: "Routing Scope", value: assignedRouting || "All" },
          { label: "Role", value: user?.role ?? "Unknown" }
        ]}
      />
      <QueueSummaryStrip
        items={[
          { label: "Referral Items", value: rows.length, tone: rows.length ? "warning" : "success" },
          { label: "Total Amount", value: money(rows.reduce((sum, row) => sum + row.amount, 0)), tone: "info" },
          { label: "Oldest Age", value: rows[0] ? ageLabel(rows[0].scanDate) : "None", tone: rows.length ? "warning" : "success" },
          { label: "PO Hidden Views", value: rows.filter((row) => isPo(row)).length, tone: "info" }
        ]}
      />
      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}
      <FilterPanel title="Referral Filters" filters={filters} setFilters={setFilters} resultCount={rows.length} />
      <SearchGrid<ChequeItem>
        title="Referral Queue"
        rows={rows}
        getRowKey={(row) => row.id}
        onRowClick={(row) => setSelectedId(row.id)}
        columns={[
          { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
          { key: "drawer", header: "Drawer Account", render: (row) => parseMICR(row.micrLine).accountNo.slice(-15) },
          { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.amount} /> },
          { key: "reason", header: "Reject/Referral Reason", render: (row) => row.rejectReason ?? row.reason ?? "Referred for checker review" },
          { key: "by", header: "Referred By", render: (row) => users.find((item) => item.id === row.lastMakerId)?.username ?? row.lastUserDetails ?? "Technical verifier" },
          { key: "age", header: "Age", render: (row) => ageLabel(row.scanDate) }
        ]}
      />
      {selected ? (
        <ReviewCockpit
          account={account}
          branchName={branch?.name ?? selected.branch}
          hideSensitive={hideSensitive}
          selected={selected}
          centerTitle="Signature / Account Verification"
          rightTitle="Referral Decision Panel"
          reason={reason}
          setReason={setReason}
          remarks={remarks}
          setRemarks={setRemarks}
          rejectReasons={rejectReasons}
          guidance={[
            ["Accept Target", hideSensitive ? "Return ICL Creation" : "Debit Posting"],
            ["Reject Target", "Return ICL Creation"],
            ["Referral Reason", selected.rejectReason ?? selected.reason ?? "Checker review required"]
          ]}
          actions={
            <>
              <PrimaryActionButton icon={<Check className="h-4 w-4" />} onClick={() => setAction("accept")}>
                Accept
              </PrimaryActionButton>
              <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={() => setAction("reject")}>
                Reject
              </SecondaryActionButton>
              <SecondaryActionButton onClick={() => setAction("exit")}>Exit</SecondaryActionButton>
            </>
          }
        />
      ) : null}
      <AuditTimelinePanel events={serviceAudit(audit, ["Referral"]).filter((event) => !selected || !event.entityId || event.entityId === selected.id)} />
      <ConfirmModal
        open={Boolean(action)}
        title="Confirm Referral Decision"
        message={action === "accept" ? "Accept this referred cheque?" : action === "reject" ? "Reject this referred cheque?" : "Exit referral review?"}
        onCancel={() => setAction(null)}
        onConfirm={perform}
      />
    </OperationsPage>
  );
}

export function ManualReturnPage({ mode }: { mode: "maker" | "checker" }) {
  const navigate = useNavigate();
  const {
    accounts,
    audit,
    branches,
    cheques,
    manualReturnCheckerAccept,
    manualReturnCheckerReject,
    manualReturnMakerReject,
    rejectReasons,
    runManualReturnCheckerCutoff,
    settings
  } = useDemoStore();
  const [filters, setFilters] = useState(blankFilters);
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState(rejectReasons[0]?.description ?? "");
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<"makerReject" | "checkerAccept" | "checkerReject" | "exit" | null>(null);
  const workstep = mode === "maker" ? "MANUAL_RETURN_MAKER" : "MANUAL_RETURN_CHECKER";
  const rows = filterCheques(cheques.filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === workstep), filters);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const account = drawerAccount(accounts, selected);
  const branch = branches.find((item) => item.id === account?.branchId);
  const cutoff = cutoffStatus(settings.inwardCutoffTime);

  const perform = () => {
    if (!selected) return;
    if (action === "makerReject" && !manualReturnMakerReject(selected.id, reason, remarks)) {
      setMessage("Reject reason and remarks are required.");
      setAction(null);
      return;
    }
    if (action === "checkerAccept" && !manualReturnCheckerAccept(selected.id)) {
      setMessage("Maker/checker control: the same user cannot check their own return decision.");
      setAction(null);
      return;
    }
    if (action === "checkerReject" && !manualReturnCheckerReject(selected.id)) {
      setMessage("Maker/checker control: the same user cannot check their own return decision.");
      setAction(null);
      return;
    }
    if (action === "exit") {
      navigate("/inward/dashboard");
      return;
    }
    setMessage("");
    setRemarks("");
    setAction(null);
  };

  const title = mode === "maker" ? "Manual Return Maker" : "Manual Return Checker";

  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Inward", title]}
        title={title}
        subtitle={mode === "maker" ? "Initiate manual return before cutoff." : "Approve or reject manual return requests."}
        businessDate={new Date().toISOString().slice(0, 10)}
        status={cutoff.label}
        meta={[
          { label: "Queue Items", value: rows.length },
          { label: "Selected Cheque", value: selected?.chequeNo ?? "None" },
          { label: "Cutoff", value: settings.inwardCutoffTime },
          { label: "Control", value: mode === "maker" ? "Maker decision" : "Checker approval" }
        ]}
        actions={mode === "checker" ? (
          <SecondaryActionButton icon={<Clock3 className="h-4 w-4" />} onClick={runManualReturnCheckerCutoff}>
            Run Cutoff Auto-Accept
          </SecondaryActionButton>
        ) : null}
      />
      <QueueSummaryStrip
        items={[
          { label: "Queue Items", value: rows.length, tone: rows.length ? "warning" : "success" },
          { label: "Total Amount", value: money(rows.reduce((sum, row) => sum + row.amount, 0)), tone: "info" },
          { label: "Cutoff Status", value: cutoff.label, tone: cutoff.tone, hint: cutoff.detail },
          { label: mode === "maker" ? "Target Queue" : "Approve Target", value: mode === "maker" ? "Manual Return Checker" : "Return ICL Creation", tone: "info" }
        ]}
      />
      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}
      <FilterPanel title={`${title} Filters`} filters={filters} setFilters={setFilters} resultCount={rows.length} />
      <SearchGrid<ChequeItem>
        title={`${title} Queue`}
        rows={rows}
        getRowKey={(row) => row.id}
        onRowClick={(row) => setSelectedId(row.id)}
        columns={
          mode === "maker"
            ? [
                { key: "cheque", header: "Cheque Number", render: (row) => row.chequeNo },
                { key: "routing", header: "Routing Number", render: (row) => parseMICR(row.micrLine).routingNumber },
                { key: "micr", header: "MICR Account Number", render: (row) => parseMICR(row.micrLine).accountNo },
                { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.amount} /> },
                { key: "customer", header: "Customer Account Number", render: (row) => row.accountNo }
              ]
            : [
                { key: "cheque", header: "Cheque Number", render: (row) => row.chequeNo },
                { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.amount} /> },
                { key: "maker", header: "Maker Decision", render: () => <StatusPill status="Manual Return Requested" /> },
                { key: "reason", header: "Reason", render: (row) => row.rejectReason ?? "" },
                { key: "remarks", header: "Remarks", render: (row) => row.remarks ?? "" },
                { key: "time", header: "Requested Time", render: (row) => row.lastUserDetails ?? ageLabel(row.scanDate) }
              ]
        }
      />
      {selected ? (
        <ReviewCockpit
          account={account}
          branchName={branch?.name ?? selected.branch}
          hideSensitive={false}
          selected={selected}
          centerTitle="Cheque / Account Summary"
          rightTitle={mode === "maker" ? "Return Initiation Panel" : "Checker Decision Panel"}
          reason={mode === "checker" ? selected.rejectReason ?? reason : reason}
          setReason={setReason}
          remarks={mode === "checker" ? selected.remarks ?? remarks : remarks}
          setRemarks={setRemarks}
          rejectReasons={rejectReasons}
          readOnlyReason={mode === "checker"}
          showLastUser
          guidance={
            mode === "maker"
              ? [
                  ["Submit Target", "Manual Return Checker"],
                  ["Cutoff Status", cutoff.label],
                  ["Last User Details", selected.lastUserDetails ?? "None"]
                ]
              : [
                  ["Maker Reason", selected.rejectReason ?? "Not supplied"],
                  ["Approve Target", "Return ICL Creation"],
                  ["Reject Target", "Manual Return Maker / Accepted"]
                ]
          }
          actions={
            mode === "maker" ? (
              <>
                <PrimaryActionButton icon={<Send className="h-4 w-4" />} onClick={() => setAction("makerReject")}>
                  Submit Return Request / Reject
                </PrimaryActionButton>
                <SecondaryActionButton onClick={() => setAction("exit")}>Exit</SecondaryActionButton>
              </>
            ) : (
              <>
                <PrimaryActionButton icon={<Check className="h-4 w-4" />} onClick={() => setAction("checkerAccept")}>
                  Approve Return
                </PrimaryActionButton>
                <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={() => setAction("checkerReject")}>
                  Reject Return Request
                </SecondaryActionButton>
                <SecondaryActionButton onClick={() => setAction("exit")}>Exit</SecondaryActionButton>
              </>
            )
          }
        />
      ) : null}
      <AuditTimelinePanel events={serviceAudit(audit, ["Manual Return"]).filter((event) => !selected || !event.entityId || event.entityId === selected.id)} />
      <ConfirmModal
        open={Boolean(action)}
        title="Confirm Manual Return Action"
        message={
          action === "makerReject"
            ? "Submit this manual return request to checker?"
            : action === "checkerAccept"
              ? "Approve the maker return request and route to Return ICL Creation?"
              : action === "checkerReject"
                ? "Reject the maker request and return the item to Manual Return Maker as accepted?"
                : "Exit manual return workflow?"
        }
        onCancel={() => setAction(null)}
        onConfirm={perform}
      />
    </OperationsPage>
  );
}

function ReviewCockpit({
  account,
  actions,
  branchName,
  centerTitle,
  guidance,
  hideSensitive,
  readOnlyReason,
  reason,
  rejectReasons,
  remarks,
  rightTitle,
  selected,
  setReason,
  setRemarks,
  showLastUser
}: {
  account: Account | undefined;
  actions: ReactNode;
  branchName: string;
  centerTitle: string;
  guidance: Array<[string, ReactNode]>;
  hideSensitive: boolean;
  readOnlyReason?: boolean;
  reason: string;
  rejectReasons: RejectReason[];
  remarks: string;
  rightTitle: string;
  selected: ChequeItem;
  setReason: (value: string) => void;
  setRemarks: (value: string) => void;
  showLastUser?: boolean;
}) {
  const micr = parseMICR(selected.micrLine);
  const validation = [
    !readOnlyReason && !reason.trim() ? "Reject reason is required before a reject/return decision." : "",
    !readOnlyReason && !remarks.trim() ? "Remarks are required before a reject/return decision." : ""
  ].filter(Boolean);

  return (
    <section className="responsive-workspace-grid">
      <ChequeImageViewerV2
        frontSrc={selected.imageFrontUrl}
        rearSrc={selected.imageRearUrl}
        reference={`Cheque ${selected.chequeNo} | UIC ${selected.uic}`}
        title="Cheque Image Review"
        badges={
          <>
            <StatusPill status={selected.status} />
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-ace-info">Routing {micr.routingNumber}</span>
          </>
        }
      />
      <FormPanel title={centerTitle} density="compact">
        <FieldGroup title="Drawer Account">
          <FieldRow label="Drawer A/C" value={micr.accountNo.slice(-15)} />
          <FieldRow label="Name" value={account?.customerName ?? selected.payee} />
          <FieldRow label="Branch" value={branchName} />
          <FieldRow label="Status" value={<StatusPill status={account?.status ?? "Not Found"} />} />
          {!hideSensitive ? <FieldRow label="Balance" value={account ? <AmountDisplay value={account.balance} /> : "Unavailable"} /> : null}
        </FieldGroup>
        <FieldGroup title="Cheque Summary">
          <FieldRow label="Cheque No." value={selected.chequeNo} />
          <FieldRow label="Routing No." value={micr.routingNumber} />
          <FieldRow label="MICR A/c No." value={micr.accountNo} />
          <FieldRow label="Amount" value={<AmountDisplay value={selected.amount} />} />
          <FieldRow label="Cheque Type" value={hideSensitive ? "2 / PO" : selected.chequeType ?? "1 / Normal"} />
          {showLastUser ? <FieldRow label="Last User" value={selected.lastUserDetails ?? "None"} /> : null}
        </FieldGroup>
        {!hideSensitive ? (
          <div className="col-span-full">
            <SignatureViewerV2 src={selected.signatureUrl ?? "/placeholders/signature.svg"} />
            <div className="mt-2 text-xs font-semibold text-ace-muted">Synthetic signature specimen visible for demo review.</div>
          </div>
        ) : (
          <div className="col-span-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-ace-warning">
            PO item: signature and balance are intentionally hidden.
          </div>
        )}
      </FormPanel>
      <FormPanel title={rightTitle} actions={<FileText className="h-4 w-4 text-ace-accent" />} density="compact">
        <FieldGroup title="Decision Context">
          {guidance.map(([label, value]) => <FieldRow key={label} label={label} value={value} />)}
        </FieldGroup>
        <div className="col-span-full grid gap-3 rounded-lg border border-ace-border bg-slate-50 p-3 md:grid-cols-2">
          {readOnlyReason ? (
            <TextField disabled label="Maker Reason" value={reason} />
          ) : (
            <SelectField
              label="Reject Reason"
              value={reason}
              onChange={setReason}
              options={rejectReasons.map((item) => ({ label: item.description, value: item.description }))}
            />
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-slate-600">{readOnlyReason ? "Maker / Checker Remarks" : "Remarks"}</span>
            <textarea className="enterprise-input min-h-20 py-2" disabled={readOnlyReason} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
          </label>
        </div>
        <div className="col-span-full">
          <ValidationSummaryPanel items={validation} />
        </div>
        <div className="col-span-full">
          <StickyActionBar>{actions}</StickyActionBar>
        </div>
      </FormPanel>
    </section>
  );
}
