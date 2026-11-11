import { Check, ChevronLeft, ChevronRight, Send, ShieldCheck, X } from "lucide-react";
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
import type { Account, ChequeItem } from "../types";

const filtersBlank = {
  chequeNo: "",
  amount: "",
  micrAccount: "",
  routing: "",
  customerAccount: ""
};

type Decision = "accept" | "reject" | "refer";
type ConfirmAction = Decision | "exit" | null;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function cbsLookup(accounts: Account[], cheque: ChequeItem | undefined) {
  if (!cheque) return undefined;
  const micrAccount = parseMICR(cheque.micrLine).accountNo;
  const drawerAccount = onlyDigits(micrAccount).slice(-15);
  return accounts.find((account) => onlyDigits(account.accountNo).slice(-15) === drawerAccount);
}

function cutoffStatus(cutoffTime: string) {
  const [hour, minute] = cutoffTime.split(":").map(Number);
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(hour || 0, minute || 0, 0, 0);
  const minutes = Math.round((cutoff.getTime() - now.getTime()) / 60000);
  if (minutes < 0) return { label: "Cutoff passed", tone: "danger" as const, detail: "Pending items may be auto-returned." };
  if (minutes <= 60) return { label: "Cutoff risk", tone: "warning" as const, detail: `${minutes} min remaining.` };
  return { label: "Within SLA", tone: "success" as const, detail: `${minutes} min remaining.` };
}

function isPoCheque(cheque: ChequeItem | undefined) {
  return cheque?.chequeType === "2" || cheque?.chequeType?.toUpperCase() === "PO";
}

export function InwardTechnicalVerificationPage() {
  const navigate = useNavigate();
  const {
    accounts,
    audit,
    branches,
    cheques,
    rejectReasons,
    runInwardCutoffCheck,
    settings,
    technicalAccept,
    technicalRefer,
    technicalReject
  } = useDemoStore();
  const [filters, setFilters] = useState(filtersBlank);
  const [selectedId, setSelectedId] = useState("");
  const [signatureIndex, setSignatureIndex] = useState(0);
  const [reason, setReason] = useState(rejectReasons[0]?.description ?? "");
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const [decision, setDecision] = useState<Decision>("accept");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const rows = useMemo(
    () =>
      cheques
        .filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === "TECHNICAL_VERIFICATION")
        .filter((cheque) => {
          const micr = parseMICR(cheque.micrLine);
          return (
            cheque.chequeNo.includes(filters.chequeNo) &&
            String(cheque.amount).includes(filters.amount) &&
            micr.accountNo.includes(filters.micrAccount) &&
            micr.routingNumber.includes(filters.routing) &&
            (cheque.accountNo ?? "").includes(filters.customerAccount)
          );
        }),
    [cheques, filters]
  );

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const micr = selected ? parseMICR(selected.micrLine) : undefined;
  const account = cbsLookup(accounts, selected);
  const branch = branches.find((item) => item.id === account?.branchId);
  const isPo = isPoCheque(selected);
  const cutoff = cutoffStatus(settings.inwardCutoffTime);
  const cbsAvailable = settings.cbsMockMode !== "Failure";
  const cbsStatus = !cbsAvailable ? "CBS mock failure" : account ? "Account fetched" : "Account not found";
  const signatures = [selected?.signatureUrl ?? "/placeholders/signature.svg", "/placeholders/signature.svg"];
  const selectedAudit = audit.filter((event) => event.entityId === selected?.id || event.action.includes("Technical Verification")).slice(0, 7);
  const validationItems = [
    !selected ? "Select an inward cheque for verification." : "",
    cbsAvailable && !account && !isPo ? "Drawer account was not matched by CBS mock lookup." : "",
    selected && !micr?.routingNumber ? "Routing number is missing from MICR line." : "",
    selected && !micr?.accountNo ? "MICR account number is missing." : "",
    selected && decision !== "accept" && (!reason.trim() || !remarks.trim()) ? "Reject/Refer decisions require reason and remarks." : "",
    cutoff.tone === "danger" ? "Inward cutoff has passed; pending items are at auto-return risk." : ""
  ].filter(Boolean);

  const openDecision = (nextDecision: Decision) => {
    setDecision(nextDecision);
    setMessage("");
    if (nextDecision !== "accept" && (!reason.trim() || !remarks.trim())) {
      setMessage(`${nextDecision === "refer" ? "Refer" : "Reject"} decision selected. Enter reason and remarks, then click ${nextDecision === "refer" ? "Refer" : "Reject"} again.`);
      return;
    }
    setConfirmAction(nextDecision);
  };

  const performAction = () => {
    if (!selected) return;
    if (confirmAction === "accept") {
      technicalAccept(selected.id);
    }
    if (confirmAction === "reject") {
      if (!technicalReject(selected.id, reason, remarks)) {
        setMessage("Reject reason and remarks are required.");
        setConfirmAction(null);
        return;
      }
    }
    if (confirmAction === "refer") {
      if (!technicalRefer(selected.id, reason, remarks)) {
        setMessage("Reject reason and remarks are required.");
        setConfirmAction(null);
        return;
      }
    }
    if (confirmAction === "exit") {
      navigate("/inward/dashboard");
      return;
    }
    setConfirmAction(null);
    setMessage("");
    setRemarks("");
    setDecision("accept");
  };

  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Inward", "Technical Verification"]}
        title="Technical Verification"
        subtitle="Verify cheque image, MICR, drawer account, and signature."
        businessDate={new Date().toISOString().slice(0, 10)}
        status={cutoff.label}
        meta={[
          { label: "Queue Items", value: rows.length },
          { label: "Selected Cheque", value: selected?.chequeNo ?? "None" },
          { label: "Inward Cutoff", value: settings.inwardCutoffTime },
          { label: "CBS Result", value: cbsStatus }
        ]}
        actions={
          <SecondaryActionButton onClick={runInwardCutoffCheck}>
            Run Cutoff Check
          </SecondaryActionButton>
        }
      />

      <QueueSummaryStrip
        items={[
          { label: "Pending Verification", value: rows.length, tone: rows.length ? "info" : "success" },
          { label: "Referred Candidates", value: rows.filter((row) => /signature|refer/i.test(row.reason ?? "")).length, tone: "warning" },
          { label: "Rejected Candidates", value: rows.filter((row) => Boolean(row.reason)).length, tone: "danger" },
          { label: "Cutoff Risk", value: cutoff.label, tone: cutoff.tone, hint: cutoff.detail }
        ]}
      />

      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}
      {isPo ? <ExceptionBanner>PO-specific handling: balance and signature specimen are hidden; an accepted PO routes to Return ICL Creation.</ExceptionBanner> : null}
      {!cbsAvailable ? <ExceptionBanner>CBS mock is configured to Failure. Account data is shown as unavailable for this demo decision.</ExceptionBanner> : null}

      <QueueFilterPanel title="Technical Verification Filters" resultCount={rows.length} defaultCollapsed>
        <TextField label="Cheque No." value={filters.chequeNo} onChange={(value) => setFilters((state) => ({ ...state, chequeNo: value }))} />
        <TextField label="Amount" value={filters.amount} onChange={(value) => setFilters((state) => ({ ...state, amount: value }))} />
        <TextField label="MICR A/c No." value={filters.micrAccount} onChange={(value) => setFilters((state) => ({ ...state, micrAccount: value }))} />
        <TextField label="Routing No." value={filters.routing} onChange={(value) => setFilters((state) => ({ ...state, routing: value }))} />
        <TextField label="Customer A/c No." value={filters.customerAccount} onChange={(value) => setFilters((state) => ({ ...state, customerAccount: value }))} />
      </QueueFilterPanel>

      <SearchGrid<ChequeItem>
        title="Technical Verification Queue"
        rows={rows}
        getRowKey={(row) => row.id}
        onRowClick={(row) => {
          setSelectedId(row.id);
          setDecision("accept");
          setMessage("");
          setSignatureIndex(0);
        }}
        columns={[
          { key: "cheque", header: "Cheque Number", render: (row) => row.chequeNo },
          { key: "routing", header: "Routing Number", render: (row) => parseMICR(row.micrLine).routingNumber },
          { key: "micr", header: "MICR Account Number", render: (row) => parseMICR(row.micrLine).accountNo },
          { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.amount} /> },
          { key: "customer", header: "Customer A/c No.", render: (row) => (row.accountNo || parseMICR(row.micrLine).accountNo.slice(-15)) },
          { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
        ]}
      />

      {selected ? (
        <section className="responsive-workspace-grid">
          <ChequeImageViewerV2
            frontSrc={selected.imageFrontUrl}
            rearSrc={selected.imageRearUrl}
            reference={`Cheque ${selected.chequeNo} | UIC ${selected.uic}`}
            title="Cheque Image Review"
            badges={
              <>
                <StatusPill status={selected.status} />
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-ace-info">Routing {micr?.routingNumber}</span>
              </>
            }
          />

          <FormPanel
            title="Account & Signature Workspace"
            actions={
              !isPo ? (
                <div className="flex gap-1">
                  <SecondaryActionButton aria-label="Previous signature" className="h-8 w-8 p-0" disabled={signatureIndex === 0} disabledReason="This is the first available signature." onClick={() => setSignatureIndex((value) => Math.max(0, value - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </SecondaryActionButton>
                  <SecondaryActionButton aria-label="Next signature" className="h-8 w-8 p-0" disabled={signatureIndex === signatures.length - 1} disabledReason="This is the last available signature." onClick={() => setSignatureIndex((value) => Math.min(signatures.length - 1, value + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </SecondaryActionButton>
                </div>
              ) : null
            }
            density="compact"
          >
            <FieldGroup title="CBS Fetch Result">
              <FieldRow label="Result" value={<StatusPill status={cbsStatus} />} />
              <FieldRow label="Drawer A/C" value={micr?.accountNo.slice(-15) ?? ""} />
              <FieldRow label="Status" value={account?.status ?? "Not Found"} />
            </FieldGroup>
            <FieldGroup title="Drawer Account Details">
              <FieldRow label="Name" value={account?.customerName ?? selected.payee ?? "Unavailable"} />
              <FieldRow label="Branch" value={branch?.name ?? selected.branch ?? ""} />
              {!isPo ? <FieldRow label="Balance" value={account ? <AmountDisplay value={account.balance} /> : "Unavailable"} /> : null}
              {!isPo ? <FieldRow label="Mandate" value="Either one signature, active mandate, no stop payment flag" /> : null}
            </FieldGroup>
            {!isPo ? (
              <div className="col-span-full">
                <SignatureViewerV2 src={signatures[signatureIndex]} />
                <div className="mt-2 text-xs font-semibold text-ace-muted">Signature {signatureIndex + 1} of {signatures.length}</div>
              </div>
            ) : (
              <div className="col-span-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-ace-warning">
                PO item: signature and balance are intentionally hidden.
              </div>
            )}
          </FormPanel>

          <FormPanel title="Decision Panel" density="compact">
            <FieldGroup title="Cheque Details">
              <FieldRow label="Cheque No." value={selected.chequeNo} />
              <FieldRow label="Routing No." value={micr?.routingNumber ?? ""} />
              <FieldRow label="MICR A/c No." value={micr?.accountNo ?? ""} />
              <FieldRow label="Check Digit" value={selected.checkDigit ?? micr?.transactionCode ?? ""} />
              <FieldRow label="Amount" value={<AmountDisplay value={selected.amount} />} />
              <FieldRow label="PB Details" value={`${selected.presentingBank} (${selected.presentingBankCode})`} />
              <FieldRow label="Cheque Type" value={isPo ? "2 / PO" : selected.chequeType ?? "1 / Normal"} />
              <FieldRow label="Settlement Date" value={selected.valueDate ?? selected.scanDate} />
            </FieldGroup>
            <FieldGroup title="Decision Guidance">
              <FieldRow label="Selected" value={<StatusPill status={decision === "accept" ? "Accept" : decision === "refer" ? "Refer" : "Reject"} />} />
              <FieldRow label="Accept Target" value={isPo ? "Return ICL Creation" : "Debit Posting"} />
              <FieldRow label="Reject Target" value="Return ICL Creation" />
              <FieldRow label="Refer Target" value="Referral" />
            </FieldGroup>
            {decision !== "accept" ? (
              <div className="col-span-full grid gap-3 rounded-lg border border-ace-border bg-slate-50 p-3 md:grid-cols-2">
                <SelectField
                  label="Reject Reason"
                  value={reason}
                  onChange={setReason}
                  options={rejectReasons.map((item) => ({ label: item.description, value: item.description }))}
                />
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-slate-600">Remarks</span>
                  <textarea className="enterprise-input min-h-20 py-2" value={remarks} onChange={(event) => setRemarks(event.target.value)} />
                </label>
              </div>
            ) : null}
            <div className="col-span-full">
              <ValidationSummaryPanel items={validationItems} />
            </div>
          </FormPanel>
        </section>
      ) : (
        <ExceptionBanner>No technical verification item matches the current filter.</ExceptionBanner>
      )}

      <div className="responsive-sidebar-grid">
        <div className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-ace-accent" />
            <div>
              <div className="text-sm font-bold text-ace-primary">CBS/account fetch result</div>
              <p className="mt-1 text-sm leading-6 text-ace-muted">
                Drawer account is derived from the last 15 digits of the MICR account number. This is demo data only; no live CBS integration is used.
              </p>
            </div>
          </div>
        </div>
        <AuditTimelinePanel events={selectedAudit} />
      </div>

      <StickyActionBar>
        <PrimaryActionButton disabledReason="Select a technical verification workitem first." icon={<Check className="h-4 w-4" />} disabled={!selected} onClick={() => openDecision("accept")}>
          Accept
        </PrimaryActionButton>
        <SecondaryActionButton disabledReason="Select a technical verification workitem first." icon={<X className="h-4 w-4" />} disabled={!selected} onClick={() => openDecision("reject")}>
          Reject
        </SecondaryActionButton>
        <SecondaryActionButton disabledReason="Select a technical verification workitem first." icon={<Send className="h-4 w-4" />} disabled={!selected} onClick={() => openDecision("refer")}>
          Refer
        </SecondaryActionButton>
        <SecondaryActionButton onClick={() => setConfirmAction("exit")}>Exit</SecondaryActionButton>
      </StickyActionBar>

      <ConfirmModal
        open={Boolean(confirmAction)}
        title="Confirm Technical Verification"
        message={
          confirmAction === "accept"
            ? `Accept cheque ${selected?.chequeNo} and route it to ${isPo ? "Return ICL Creation" : "Debit Posting"}?`
            : confirmAction === "exit"
              ? "Exit technical verification and return to the inward dashboard?"
              : `${confirmAction === "refer" ? "Refer" : "Reject"} cheque ${selected?.chequeNo} with reason "${reason}"?`
        }
        confirmLabel={confirmAction === "exit" ? "Exit" : "Confirm"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={performAction}
      />
    </OperationsPage>
  );
}
