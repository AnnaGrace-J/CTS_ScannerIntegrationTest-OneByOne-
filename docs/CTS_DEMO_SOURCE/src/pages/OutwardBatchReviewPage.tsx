import { AlertTriangle, Check, Clock3, PencilLine, StepBack, StepForward, Trash2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { DateField } from "../components/DateField";
import {
  AuditTimelinePanel,
  ChequeImageViewerV2,
  DangerActionButton,
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
  StatusPill,
  StickyActionBar,
  ValidationSummaryPanel,
  WorkItemDetailLayout
} from "../components/operations";
import { SearchGrid } from "../components/SearchGrid";
import { TextField } from "../components/TextField";
import { parseMICR } from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { Batch, ChequeItem } from "../types";

type Mode = "authorization" | "repair";
type BatchRow = {
  batch: Batch;
  cheques: ChequeItem[];
  maker: string;
  branch: string;
  calculatedAmount: number;
};

const blankFilters = {
  batchId: "",
  branchCode: "",
  chequeNo: "",
  micrAccountNo: "",
  routingNo: "",
  creditAccountNo: "",
  amount: "",
  endorsementNumber: "",
  batchType: "",
  valueDate: "",
  scanDate: ""
};

type ModalAction = "authorize" | "repair" | "discard" | "exit" | "complete" | "completeUnmodified" | null;

export function OutwardBatchReviewPage({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const {
    accounts,
    addAudit,
    audit,
    authorizeOutwardBatch,
    batches,
    branches,
    cheques,
    completeOutwardRepair,
    discardOutwardBatch,
    sendOutwardBatchToRepair,
    user,
    users
  } = useDemoStore();
  const [filters, setFilters] = useState(blankFilters);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedChequeId, setSelectedChequeId] = useState("");
  const [draftCheques, setDraftCheques] = useState<ChequeItem[]>([]);
  const [originalJson, setOriginalJson] = useState("");
  const [batchRemarks, setBatchRemarks] = useState(false);
  const [message, setMessage] = useState("");
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [repairNotes, setRepairNotes] = useState("");
  const [repairValidationItems, setRepairValidationItems] = useState<string[]>([]);

  const targetWorkstep = mode === "authorization" ? "OUTWARD_AUTHORIZATION" : "OUTWARD_REPAIR";
  const title = mode === "authorization" ? "Outward Authorization" : "Outward Repair";

  const rows = useMemo(() => {
    const grouped = new Map<string, ChequeItem[]>();
    cheques
      .filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === targetWorkstep)
      .forEach((cheque) => grouped.set(cheque.batchId, [...(grouped.get(cheque.batchId) ?? []), cheque]));

    return [...grouped.entries()]
      .map(([batchId, batchCheques]) => {
        const batch = batches.find((item) => item.id === batchId);
        if (!batch) return undefined;
        const branch = branches.find((item) => item.id === batch.branchId);
        const maker = users.find((item) => item.id === (batch.lastMakerId ?? batch.createdBy));
        return {
          batch,
          cheques: batchCheques,
          maker: maker?.username ?? batch.createdBy,
          branch: branch?.code ?? batch.branchId,
          calculatedAmount: batchCheques.filter((item) => !item.discarded).reduce((sum, item) => sum + item.amount, 0)
        };
      })
      .filter((row): row is BatchRow => Boolean(row))
      .filter((row) => matchesFilters(row, filters))
      .sort((a, b) => new Date(a.batch.createdAt).getTime() - new Date(b.batch.createdAt).getTime());
  }, [batches, branches, cheques, filters, targetWorkstep, users]);

  const selectedRow = rows.find((row) => row.batch.id === selectedBatchId) ?? rows[0];
  const selectedCheque = draftCheques.find((item) => item.id === selectedChequeId) ?? draftCheques[0];

  useEffect(() => {
    if (!selectedRow) {
      setDraftCheques([]);
      setSelectedBatchId("");
      setSelectedChequeId("");
      setOriginalJson("");
      return;
    }
    setSelectedBatchId(selectedRow.batch.id);
    setDraftCheques(selectedRow.cheques);
    setSelectedChequeId(selectedRow.cheques[0]?.id ?? "");
    setOriginalJson(JSON.stringify(selectedRow.cheques));
    setBatchRemarks(false);
    setRepairNotes("");
    setRepairValidationItems([]);
    setMessage("");
  }, [selectedRow?.batch.id]);

  const updateFilter = (key: keyof typeof filters, value: string) => setFilters((state) => ({ ...state, [key]: value }));
  const updateSelectedCheque = (patch: Partial<ChequeItem>) => {
    setDraftCheques((items) => items.map((item) => (item.id === selectedCheque?.id ? { ...item, ...patch } : item)));
  };

  const canAuthorizeSelected = () => {
    if (!selectedRow || !user) return false;
    return user.id !== selectedRow.batch.createdBy && user.id !== selectedRow.batch.lastMakerId;
  };
  const canAuthorizeRow = (row: BatchRow) => {
    if (!user) return false;
    return user.id !== row.batch.createdBy && user.id !== row.batch.lastMakerId;
  };

  const doAction = () => {
    if (!selectedRow) return;
    if (modalAction === "authorize") {
      if (!canAuthorizeSelected()) {
        setMessage("Maker/checker separation violation: this user scanned or repaired the batch and cannot authorize it.");
        setModalAction(null);
        return;
      }
      const acceptCount = draftCheques.filter((item) => !item.discarded).length;
      const discardCount = draftCheques.length - acceptCount;
      authorizeOutwardBatch(selectedRow.batch.id, draftCheques, `Accepted ${acceptCount}, discarded ${discardCount}`);
    }
    if (modalAction === "repair") {
      sendOutwardBatchToRepair(selectedRow.batch.id, draftCheques, "Checker sent entire batch to outward repair");
    }
    if (modalAction === "discard") {
      discardOutwardBatch(
        selectedRow.batch.id,
        draftCheques.map((item) => ({ ...item, discarded: true, remarks: item.remarks || "Discarded by checker" })),
        "Checker discarded outward batch"
      );
    }
    if (modalAction === "complete" || modalAction === "completeUnmodified") {
      completeOutwardRepair(selectedRow.batch.id, draftCheques, originalJson !== JSON.stringify(draftCheques));
    }
    if (modalAction === "exit") {
      if (reviewMode) {
        setReviewMode(false);
        setModalAction(null);
        return;
      }
      navigate("/outward/dashboard");
      return;
    }
    if (mode === "authorization") setReviewMode(false);
    setModalAction(null);
    setMessage("");
  };

  const saveRepairDraft = () => {
    if (!selectedRow) return;
    addAudit("Save Outward Repair Draft", `Repair draft retained for ${selectedRow.batch.batchNo}. ${repairNotes || "No repair notes entered."}`, selectedRow.batch.id);
    setMessage("Repair draft saved for this session.");
  };

  const requestCompleteRepair = () => {
    const items = repairValidation(draftCheques);
    setRepairValidationItems(items);
    setModalAction(modified ? "complete" : "completeUnmodified");
  };

  const acceptCount = draftCheques.filter((item) => !item.discarded).length;
  const discardCount = draftCheques.length - acceptCount;
  const modified = originalJson !== JSON.stringify(draftCheques);
  const parsed = selectedCheque ? parseMICR(selectedCheque.micrLine) : undefined;
  const account = accounts.find((item) => item.id === selectedCheque?.accountId);
  const branch = branches.find((item) => item.id === selectedRow?.batch.branchId);
  const oldestAge = rows[0] ? batchAgeLabel(rows[0].batch.createdAt) : "None";
  const queueTotal = rows.reduce((sum, row) => sum + row.calculatedAmount, 0);
  const queueExceptions = rows.filter((row) => row.cheques.some((cheque) => cheque.discarded || (cheque.imageQualityFlags?.length ?? 0) > 0)).length;
  const authValidationItems = [
    ...(selectedRow && !canAuthorizeSelected() ? ["Maker/checker separation blocks this user from authorizing the selected batch."] : []),
    ...(draftCheques.some((cheque) => cheque.discarded && !cheque.remarks?.trim()) ? ["Discarded cheques should include checker remarks before authorization."] : [])
  ];
  const selectedAudit = audit.filter((event) => {
    const text = `${event.action} ${event.note} ${event.entityId ?? ""}`.toLowerCase();
    return selectedRow ? text.includes(selectedRow.batch.id.toLowerCase()) || text.includes(selectedRow.batch.batchNo.toLowerCase()) : false;
  });
  const originalCheques = useMemo(() => {
    try {
      return JSON.parse(originalJson) as ChequeItem[];
    } catch {
      return [];
    }
  }, [originalJson]);
  const originalSelectedCheque = originalCheques.find((item) => item.id === selectedCheque?.id);
  const changedFieldCount = draftCheques.reduce((sum, cheque) => sum + repairChangedFields(cheque, originalCheques.find((item) => item.id === cheque.id)).length, 0);
  const selectedChangedFields = repairChangedFields(selectedCheque, originalSelectedCheque);
  const repairAuditEvent = selectedRow ? selectedAudit.find((event) => event.action === "Send Outward Batch To Repair") : undefined;
  const returnedBy = selectedRow ? users.find((item) => item.id === selectedRow.batch.lastCheckerId)?.username ?? selectedRow.batch.lastCheckerId ?? "Checker" : "Checker";
  const returnedAt = repairAuditEvent?.at ?? selectedRow?.batch.createdAt ?? "";
  const repairReason = repairAuditEvent?.note ?? selectedCheque?.remarks ?? "Returned for maker correction.";

  if (mode === "authorization") {
    if (!reviewMode) {
      return (
        <OperationsPage density="compact">
          <OperationsHeader
            breadcrumbs={["ACE CTS Workspace", "Outward", "Authorization"]}
            title="Outward Authorization"
            subtitle="Review and approve captured outward batches."
            branch={user?.branch ?? "All branches"}
            businessDate={new Date().toLocaleDateString()}
            role={user?.role ?? "CHECKER"}
            meta={[
              { label: "Queue", value: "FIFO batch review" },
              { label: "Last Refreshed", value: new Date().toLocaleTimeString() }
            ]}
          />

          <QueueSummaryStrip
            density="compact"
            items={[
              { label: "Pending Batches", value: rows.length, tone: rows.length ? "info" : "success", hint: "FIFO sorted" },
              { label: "Total Amount", value: `MMK ${queueTotal.toLocaleString()}`, tone: "success", hint: "Visible queue" },
              { label: "Exceptions", value: queueExceptions, tone: queueExceptions ? "danger" : "success", hint: "Discard or IQA flags" },
              { label: "Oldest Batch Age", value: oldestAge, tone: rows.length ? "warning" : "success", hint: rows[0]?.batch.batchNo ?? "No pending batches" }
            ]}
          />

          {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}

          <QueueFilterPanel title="Authorization Queue Filters" resultCount={rows.length}>
            <TextField label="Batch ID" value={filters.batchId} onChange={(value) => updateFilter("batchId", value)} />
            <TextField label="Branch Code" value={filters.branchCode} onChange={(value) => updateFilter("branchCode", value)} />
            <TextField label="Cheque No." value={filters.chequeNo} onChange={(value) => updateFilter("chequeNo", value)} />
            <TextField label="MICR Account No." value={filters.micrAccountNo} onChange={(value) => updateFilter("micrAccountNo", value)} />
            <TextField label="Routing No." value={filters.routingNo} onChange={(value) => updateFilter("routingNo", value)} />
            <TextField label="Credit Account No." value={filters.creditAccountNo} onChange={(value) => updateFilter("creditAccountNo", value)} />
            <TextField label="Amount" value={filters.amount} onChange={(value) => updateFilter("amount", value)} />
            <TextField label="Endorsement Number" value={filters.endorsementNumber} onChange={(value) => updateFilter("endorsementNumber", value)} />
            <TextField label="Batch Type" value={filters.batchType} onChange={(value) => updateFilter("batchType", value)} />
            <DateField label="Value Date" value={filters.valueDate} onChange={(value) => updateFilter("valueDate", value)} />
            <DateField label="Scan Date" value={filters.scanDate} onChange={(value) => updateFilter("scanDate", value)} />
          </QueueFilterPanel>

          <SearchGrid<BatchRow>
            title="Authorization Batch Queue"
            rows={rows}
            getRowKey={(row) => row.batch.id}
            onRowClick={(row) => {
              setSelectedBatchId(row.batch.id);
              setReviewMode(true);
            }}
            columns={[
              { key: "batch", header: "Batch ID", render: (row) => row.batch.id },
              { key: "branch", header: "Branch", render: (row) => row.branch },
              { key: "maker", header: "Maker", render: (row) => row.maker },
              { key: "count", header: "Total Cheques", render: (row) => row.cheques.length },
              { key: "batchAmount", header: "Batch Amount", render: (row) => row.batch.totalAmount.toLocaleString() },
              { key: "calc", header: "Calculated Amount", render: (row) => row.calculatedAmount.toLocaleString() },
              { key: "scan", header: "Scan Date/Time", render: (row) => row.batch.createdAt },
              { key: "status", header: "Status", render: () => <StatusPill status="Pending Authorization" /> },
              { key: "sla", header: "SLA Age", render: (row) => <span className="inline-flex items-center gap-1 font-bold text-ace-warning"><Clock3 className="h-3.5 w-3.5" /> {batchAgeLabel(row.batch.createdAt)}</span> },
              { key: "control", header: "Maker-Checker", render: (row) => canAuthorizeRow(row) ? <span className="font-bold text-ace-success">Clear</span> : <span className="inline-flex items-center gap-1 font-bold text-ace-danger"><AlertTriangle className="h-3.5 w-3.5" /> Blocked</span> },
              { key: "exception", header: "Exception", render: (row) => row.cheques.some((cheque) => cheque.discarded || (cheque.imageQualityFlags?.length ?? 0) > 0) ? <StatusPill status="Attention" /> : <StatusPill status="Clear" /> }
            ]}
          />

          <ConfirmModal
            open={Boolean(modalAction)}
            title="Confirm Action"
            message={modalMessage(modalAction, acceptCount, discardCount, draftCheques.reduce((sum, item) => (!item.discarded ? sum + item.amount : sum), 0))}
            confirmLabel="Yes"
            onCancel={() => setModalAction(null)}
            onConfirm={doAction}
          />
        </OperationsPage>
      );
    }

    return (
      <OperationsPage density="compact">
        <OperationsHeader
          breadcrumbs={["ACE CTS Workspace", "Outward", "Authorization", selectedRow?.batch.batchNo ?? "Review"]}
          title={`Batch Review ${selectedRow?.batch.batchNo ?? ""}`}
          subtitle="Verify captured instruments, maker details, and batch totals before authorization."
          branch={branch?.name ?? user?.branch ?? "All branches"}
          businessDate={new Date().toLocaleDateString()}
          role={user?.role ?? "CHECKER"}
          status={canAuthorizeSelected() ? "Ready" : "Blocked"}
          meta={[
            { label: "Batch ID", value: selectedRow?.batch.id ?? "None" },
            { label: "Batch Status", value: "Pending Authorization" },
            { label: "Maker", value: selectedRow?.maker ?? "Unknown" },
            { label: "SLA Age", value: selectedRow ? batchAgeLabel(selectedRow.batch.createdAt) : "None" }
          ]}
        />

        {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}

        {selectedRow ? (
          <div className="responsive-workspace-grid">
            <section className="space-y-3">
              <ChequeImageViewerV2
                frontSrc={selectedCheque?.imageFrontUrl ?? "/placeholders/cheque-001.svg"}
                rearSrc={selectedCheque?.imageRearUrl}
                reference={selectedCheque ? `Cheque ${selectedCheque.chequeNo} / ${selectedCheque.uic}` : "No cheque selected"}
                title="Authorization Image Review"
                badges={
                  <>
                    <StatusPill status={selectedCheque?.discarded ? "Discarded" : "Scanned"} />
                    <span className="rounded-full border border-ace-border bg-white px-2 py-1 text-xs font-bold text-ace-primary">UIC {selectedCheque?.uic ?? "None"}</span>
                  </>
                }
              />
            </section>

            <section className="space-y-3">
              <SearchGrid<ChequeItem>
                title="Instrument List"
                rows={draftCheques}
                getRowKey={(row) => row.id}
                onRowClick={(row) => setSelectedChequeId(row.id)}
                columns={[
                  { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
                  { key: "routing", header: "Routing No", render: (row) => parseMICR(row.micrLine).routingNumber },
                  { key: "account", header: "MICR Account", render: (row) => parseMICR(row.micrLine).accountNo },
                  { key: "amount", header: "Amount", render: (row) => row.amount.toLocaleString() },
                  { key: "status", header: "Status", render: (row) => <StatusPill status={row.discarded ? "Discarded" : "Scanned"} /> },
                  { key: "exception", header: "Flag", render: (row) => row.discarded || (row.imageQualityFlags?.length ?? 0) > 0 ? <span className="font-bold text-ace-warning">Review</span> : "Clear" }
                ]}
              />
              <AuditTimelinePanel events={selectedAudit.length ? selectedAudit : audit.slice(0, 5)} />
            </section>

            <aside className="space-y-3">
              <FormPanel title="Verification Summary" density="compact">
                <FieldGroup title="Credit Account">
                  <FieldRow label="Account No." value={selectedCheque?.accountNo ?? ""} />
                  <FieldRow label="Status" value={account?.status ?? ""} />
                  <FieldRow label="Customer ID" value={account?.id ?? ""} />
                  <FieldRow label="Account Branch" value={branch?.name ?? ""} />
                  <FieldRow label="Account Name" value={account?.customerName ?? selectedCheque?.payee ?? ""} />
                </FieldGroup>
                <FieldGroup title="Cheque Details">
                  <FieldRow label="Cheque No." value={selectedCheque?.chequeNo ?? ""} />
                  <FieldRow label="Routing No." value={parsed?.routingNumber ?? ""} />
                  <FieldRow label="MICR Account" value={parsed?.accountNo ?? ""} />
                  <FieldRow label="Amount" value={`MMK ${(selectedCheque?.amount ?? 0).toLocaleString()}`} />
                  <FieldRow label="Cheque Date" value={selectedCheque?.issueDate ?? ""} />
                </FieldGroup>
                <FieldGroup title="Batch Totals">
                  <FieldRow label="Total Cheques" value={draftCheques.length} />
                  <FieldRow label="Batch Amount" value={`MMK ${selectedRow.batch.totalAmount.toLocaleString()}`} />
                  <FieldRow label="Calculated" value={`MMK ${draftCheques.filter((item) => !item.discarded).reduce((sum, item) => sum + item.amount, 0).toLocaleString()}`} />
                  <FieldRow label="Accept Count" value={acceptCount} />
                  <FieldRow label="Discard Count" value={discardCount} />
                </FieldGroup>
                <FieldGroup title="Maker Details">
                  <FieldRow label="Maker" value={selectedRow.maker} />
                  <FieldRow label="Created At" value={selectedRow.batch.createdAt} />
                  <FieldRow label="Restriction" value={canAuthorizeSelected() ? "Clear" : <span className="font-bold text-ace-danger">Same maker cannot authorize</span>} />
                </FieldGroup>
              </FormPanel>

              <FormPanel title="Checker Decision" density="compact">
                <TextField label="Remarks" value={selectedCheque?.remarks ?? ""} onChange={(value) => updateSelectedCheque({ remarks: value })} />
                <label className="flex min-h-10 items-center gap-2 rounded-lg border border-ace-border bg-slate-50 px-3 text-sm font-bold text-slate-700">
                  <input checked={Boolean(selectedCheque?.discarded)} type="checkbox" onChange={(event) => updateSelectedCheque({ discarded: event.target.checked })} />
                  Discard Cheque
                </label>
                <label className="flex min-h-10 items-center gap-2 rounded-lg border border-ace-border bg-slate-50 px-3 text-sm font-bold text-slate-700">
                  <input checked={batchRemarks} type="checkbox" onChange={(event) => setBatchRemarks(event.target.checked)} />
                  Batch-level remarks
                </label>
              </FormPanel>

              <ValidationSummaryPanel items={authValidationItems} />
            </aside>
          </div>
        ) : null}

        <StickyActionBar>
          <SecondaryActionButton icon={<StepBack className="h-4 w-4" />} onClick={() => setSelectedChequeId(prevNextId(draftCheques, selectedCheque?.id, -1))}>
            Previous
          </SecondaryActionButton>
          <SecondaryActionButton icon={<StepForward className="h-4 w-4" />} onClick={() => setSelectedChequeId(prevNextId(draftCheques, selectedCheque?.id, 1))}>
            Next
          </SecondaryActionButton>
          <PrimaryActionButton icon={<Check className="h-4 w-4" />} onClick={() => setModalAction("authorize")}>
            Authorize Batch
          </PrimaryActionButton>
          <SecondaryActionButton icon={<PencilLine className="h-4 w-4" />} onClick={() => setModalAction("repair")}>
            Send to Repair
          </SecondaryActionButton>
          <DangerActionButton icon={<Trash2 className="h-4 w-4" />} onClick={() => setModalAction("discard")}>
            Discard Batch
          </DangerActionButton>
          <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={() => setModalAction("exit")}>
            Exit
          </SecondaryActionButton>
        </StickyActionBar>

        <ConfirmModal
          open={Boolean(modalAction)}
          title="Confirm Action"
          message={modalMessage(modalAction, acceptCount, discardCount, draftCheques.reduce((sum, item) => (!item.discarded ? sum + item.amount : sum), 0))}
          confirmLabel="Yes"
          onCancel={() => setModalAction(null)}
          onConfirm={doAction}
        />
      </OperationsPage>
    );
  }

  if (!reviewMode) {
    return (
      <OperationsPage density="compact">
        <OperationsHeader
          breadcrumbs={["ACE CTS Workspace", "Outward", "Repair"]}
          title="Outward Repair"
          subtitle="Correct batches returned by authorizer."
          branch={user?.branch ?? "All branches"}
          businessDate={new Date().toLocaleDateString()}
          role={user?.role ?? "MAKER"}
          meta={[
            { label: "Queue", value: "Correction worklist" },
            { label: "Last Refreshed", value: new Date().toLocaleTimeString() }
          ]}
        />

        <QueueSummaryStrip
          density="compact"
          items={[
            { label: "Repair Batches", value: rows.length, tone: rows.length ? "warning" : "success", hint: "Returned by checker" },
            { label: "Visible Instruments", value: rows.reduce((sum, row) => sum + row.cheques.length, 0), tone: "info", hint: "Filtered queue" },
            { label: "Total Amount", value: `MMK ${queueTotal.toLocaleString()}`, tone: "success", hint: "Visible amount" },
            { label: "Oldest Return Age", value: oldestAge, tone: rows.length ? "warning" : "success", hint: rows[0]?.batch.batchNo ?? "No repairs" }
          ]}
        />

        {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}

        <QueueFilterPanel title="Repair Queue Filters" resultCount={rows.length}>
          <TextField label="Batch ID" value={filters.batchId} onChange={(value) => updateFilter("batchId", value)} />
          <TextField label="Branch Code" value={filters.branchCode} onChange={(value) => updateFilter("branchCode", value)} />
          <TextField label="Cheque No." value={filters.chequeNo} onChange={(value) => updateFilter("chequeNo", value)} />
          <TextField label="MICR Account No." value={filters.micrAccountNo} onChange={(value) => updateFilter("micrAccountNo", value)} />
          <TextField label="Routing No." value={filters.routingNo} onChange={(value) => updateFilter("routingNo", value)} />
          <TextField label="Credit Account No." value={filters.creditAccountNo} onChange={(value) => updateFilter("creditAccountNo", value)} />
          <TextField label="Amount" value={filters.amount} onChange={(value) => updateFilter("amount", value)} />
          <TextField label="Endorsement Number" value={filters.endorsementNumber} onChange={(value) => updateFilter("endorsementNumber", value)} />
          <TextField label="Batch Type" value={filters.batchType} onChange={(value) => updateFilter("batchType", value)} />
          <DateField label="Value Date" value={filters.valueDate} onChange={(value) => updateFilter("valueDate", value)} />
          <DateField label="Scan Date" value={filters.scanDate} onChange={(value) => updateFilter("scanDate", value)} />
        </QueueFilterPanel>

        <SearchGrid<BatchRow>
          title="Repair Batch Queue"
          rows={rows}
          getRowKey={(row) => row.batch.id}
          onRowClick={(row) => {
            setSelectedBatchId(row.batch.id);
            setReviewMode(true);
          }}
          columns={[
            { key: "batch", header: "Batch ID", render: (row) => row.batch.id },
            { key: "branch", header: "Branch", render: (row) => row.branch },
            { key: "repairReason", header: "Repair Reason", render: (row) => repairReasonForRow(row, audit) },
            { key: "returnedBy", header: "Returned By", render: (row) => users.find((item) => item.id === row.batch.lastCheckerId)?.username ?? row.batch.lastCheckerId ?? "Checker" },
            { key: "returnedAt", header: "Returned Date/Time", render: (row) => repairReturnedAt(row, audit) },
            { key: "maker", header: "Maker", render: (row) => row.maker },
            { key: "status", header: "Status", render: () => <StatusPill status="Repair Required" /> }
          ]}
        />
      </OperationsPage>
    );
  }

  return (
    <OperationsPage density="compact">
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Outward", "Repair", selectedRow?.batch.batchNo ?? "Correction"]}
        title={`Repair Batch ${selectedRow?.batch.batchNo ?? ""}`}
        subtitle="Correct returned instrument data and send the batch back to authorization."
        branch={branch?.name ?? user?.branch ?? "All branches"}
        businessDate={new Date().toLocaleDateString()}
        role={user?.role ?? "MAKER"}
        status="Correction"
        meta={[
          { label: "Batch ID", value: selectedRow?.batch.id ?? "None" },
          { label: "Changed Fields", value: changedFieldCount },
          { label: "Returned By", value: returnedBy },
          { label: "Returned At", value: returnedAt }
        ]}
      />

      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}

      {selectedRow ? (
        <WorkItemDetailLayout
          aside={
            <div className="space-y-3">
              <FormPanel title="Returned for Repair Summary" density="compact">
                <FieldGroup>
                  <FieldRow label="Returned By" value={returnedBy} />
                  <FieldRow label="Return Date/Time" value={returnedAt} />
                  <FieldRow label="Repair Remarks" value={repairReason} />
                  <FieldRow label="Changed Fields" value={<span className={changedFieldCount ? "font-bold text-ace-warning" : "font-bold text-ace-success"}>{changedFieldCount}</span>} />
                </FieldGroup>
              </FormPanel>

              <FormPanel title="Editable MICR Fields" density="compact">
                <ChangedField changed={selectedChangedFields.includes("Cheque No")} label="Cheque No." original={originalSelectedCheque?.chequeNo ?? ""} updated={selectedCheque?.chequeNo ?? ""}>
                  <TextField label="Cheque No." value={selectedCheque?.chequeNo ?? ""} onChange={(value) => updateSelectedCheque({ chequeNo: value })} />
                </ChangedField>
                <ChangedField changed={selectedChangedFields.includes("MICR Account No")} label="MICR Account No." original={parseMICR(originalSelectedCheque?.micrLine ?? "").accountNo} updated={parsed?.accountNo ?? ""}>
                  <TextField label="MICR Account No." value={parsed?.accountNo ?? ""} onChange={(value) => updateMicr(selectedCheque, updateSelectedCheque, { accountNo: value })} />
                </ChangedField>
                <ChangedField changed={selectedChangedFields.includes("Routing No")} label="Routing No." original={parseMICR(originalSelectedCheque?.micrLine ?? "").routingNumber} updated={parsed?.routingNumber ?? ""}>
                  <TextField label="Routing No." value={parsed?.routingNumber ?? ""} onChange={(value) => updateMicr(selectedCheque, updateSelectedCheque, { routingNumber: value })} />
                </ChangedField>
                <ChangedField changed={selectedChangedFields.includes("Cheque Type")} label="Cheque Type" original={originalSelectedCheque?.chequeType ?? ""} updated={selectedCheque?.chequeType ?? ""}>
                  <TextField label="Cheque Type" value={selectedCheque?.chequeType ?? "Current Dated Normal"} onChange={(value) => updateSelectedCheque({ chequeType: value })} />
                </ChangedField>
                <ChangedField changed={selectedChangedFields.includes("Check Digit")} label="Check Digit" original={originalSelectedCheque?.checkDigit ?? ""} updated={selectedCheque?.checkDigit ?? ""}>
                  <TextField label="Check Digit" value={selectedCheque?.checkDigit ?? parsed?.transactionCode ?? ""} onChange={(value) => updateSelectedCheque({ checkDigit: value })} />
                </ChangedField>
              </FormPanel>

              <FormPanel title="Editable Amount / Date" density="compact">
                <ChangedField changed={selectedChangedFields.includes("Amount")} label="Amount" original={String(originalSelectedCheque?.amount ?? "")} updated={String(selectedCheque?.amount ?? "")}>
                  <TextField label="Amount" value={String(selectedCheque?.amount ?? "")} onChange={(value) => updateSelectedCheque({ amount: Number(value.replace(/\D/g, "") || 0) })} />
                </ChangedField>
                <ChangedField changed={selectedChangedFields.includes("Cheque Date")} label="Cheque Date" original={originalSelectedCheque?.issueDate ?? ""} updated={selectedCheque?.issueDate ?? ""}>
                  <DateField label="Cheque Date" value={selectedCheque?.issueDate ?? ""} onChange={(value) => updateSelectedCheque({ issueDate: value })} />
                </ChangedField>
              </FormPanel>

              <FormPanel title="Drawer / Remarks" density="compact">
                <ChangedField changed={selectedChangedFields.includes("Drawer Name")} label="Drawer Name" original={originalSelectedCheque?.drawerName ?? ""} updated={selectedCheque?.drawerName ?? ""}>
                  <TextField label="Drawer Name" value={selectedCheque?.drawerName ?? ""} onChange={(value) => updateSelectedCheque({ drawerName: value })} />
                </ChangedField>
                <ChangedField changed={selectedChangedFields.includes("Remarks")} label="Remarks" original={originalSelectedCheque?.remarks ?? ""} updated={selectedCheque?.remarks ?? ""}>
                  <TextField label="Remarks" value={selectedCheque?.remarks ?? ""} onChange={(value) => updateSelectedCheque({ remarks: value })} />
                </ChangedField>
                <ChangedField changed={selectedChangedFields.includes("Discard")} label="Discard" original={originalSelectedCheque?.discarded ? "Yes" : "No"} updated={selectedCheque?.discarded ? "Yes" : "No"}>
                  <label className="flex min-h-10 items-center gap-2 rounded-lg border border-ace-border bg-slate-50 px-3 text-sm font-bold text-slate-700">
                    <input checked={Boolean(selectedCheque?.discarded)} type="checkbox" onChange={(event) => updateSelectedCheque({ discarded: event.target.checked })} />
                    Discard Cheque
                  </label>
                </ChangedField>
                <TextField label="Repair Notes" value={repairNotes} onChange={setRepairNotes} />
              </FormPanel>

              <FormPanel title="Batch Summary" density="compact">
                <FieldGroup>
                  <FieldRow label="Batch ID" value={selectedRow.batch.id} />
                  <FieldRow label="Total Cheques" value={draftCheques.length} />
                  <FieldRow label="Batch Type" value={selectedRow.batch.batchType ?? "CDC"} />
                  <FieldRow label="Batch Amount" value={`MMK ${selectedRow.batch.totalAmount.toLocaleString()}`} />
                  <FieldRow label="Calculated" value={`MMK ${draftCheques.filter((item) => !item.discarded).reduce((sum, item) => sum + item.amount, 0).toLocaleString()}`} />
                </FieldGroup>
              </FormPanel>

              <ValidationSummaryPanel items={repairValidationItems} />
            </div>
          }
        >
          <div className="responsive-sidebar-grid">
            <ChequeImageViewerV2
              frontSrc={selectedCheque?.imageFrontUrl ?? "/placeholders/cheque-001.svg"}
              rearSrc={selectedCheque?.imageRearUrl}
              reference={selectedCheque ? `Cheque ${selectedCheque.chequeNo} / ${selectedCheque.uic}` : "No cheque selected"}
              title="Repair Image Review"
              badges={
                <>
                  <StatusPill status="Repair Required" />
                  <span className="rounded-full border border-ace-border bg-white px-2 py-1 text-xs font-bold text-ace-primary">Changed {selectedChangedFields.length}</span>
                </>
              }
            />
            <SearchGrid<ChequeItem>
              title="Batch Instrument List"
              rows={draftCheques}
              getRowKey={(row) => row.id}
              onRowClick={(row) => setSelectedChequeId(row.id)}
              columns={[
                { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
                { key: "routing", header: "Routing No", render: (row) => parseMICR(row.micrLine).routingNumber },
                { key: "account", header: "MICR Account", render: (row) => parseMICR(row.micrLine).accountNo },
                { key: "amount", header: "Amount", render: (row) => row.amount.toLocaleString() },
                { key: "changed", header: "Changed", render: (row) => repairChangedFields(row, originalCheques.find((item) => item.id === row.id)).length },
                { key: "discard", header: "Discard", render: (row) => (row.discarded ? "Yes" : "No") }
              ]}
            />
          </div>
        </WorkItemDetailLayout>
      ) : null}

      <StickyActionBar>
        <SecondaryActionButton icon={<StepBack className="h-4 w-4" />} onClick={() => setSelectedChequeId(prevNextId(draftCheques, selectedCheque?.id, -1))}>
          Previous
        </SecondaryActionButton>
        <SecondaryActionButton icon={<StepForward className="h-4 w-4" />} onClick={() => setSelectedChequeId(prevNextId(draftCheques, selectedCheque?.id, 1))}>
          Next
        </SecondaryActionButton>
        <PrimaryActionButton icon={<Check className="h-4 w-4" />} onClick={requestCompleteRepair}>
          Complete Repair
        </PrimaryActionButton>
        <SecondaryActionButton icon={<PencilLine className="h-4 w-4" />} onClick={saveRepairDraft}>
          Save Draft
        </SecondaryActionButton>
        <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={() => setModalAction("exit")}>
          Exit
        </SecondaryActionButton>
      </StickyActionBar>

      <ConfirmModal
        open={Boolean(modalAction)}
        title="Confirm Action"
        message={modalMessage(modalAction, acceptCount, discardCount)}
        confirmLabel="Yes"
        onCancel={() => setModalAction(null)}
        onConfirm={doAction}
      />
    </OperationsPage>
  );
}

function matchesFilters(row: BatchRow, filters: typeof blankFilters) {
  const text = (value: unknown) => String(value ?? "").toLowerCase();
  const cheques = row.cheques;
  const chequeMatches = (predicate: (cheque: ChequeItem) => boolean) => cheques.some(predicate);
  return (
    text(row.batch.id).includes(text(filters.batchId)) &&
    text(row.branch).includes(text(filters.branchCode)) &&
    (!filters.chequeNo || chequeMatches((cheque) => text(cheque.chequeNo).includes(text(filters.chequeNo)))) &&
    (!filters.micrAccountNo || chequeMatches((cheque) => text(parseMICR(cheque.micrLine).accountNo).includes(text(filters.micrAccountNo)))) &&
    (!filters.routingNo || chequeMatches((cheque) => text(parseMICR(cheque.micrLine).routingNumber).includes(text(filters.routingNo)))) &&
    (!filters.creditAccountNo || chequeMatches((cheque) => text(cheque.accountNo).includes(text(filters.creditAccountNo)))) &&
    (!filters.amount || chequeMatches((cheque) => text(cheque.amount).includes(text(filters.amount)))) &&
    (!filters.endorsementNumber || chequeMatches((cheque) => text(cheque.uic).includes(text(filters.endorsementNumber)))) &&
    text(row.batch.batchType ?? "CDC").includes(text(filters.batchType)) &&
    (!filters.valueDate || text(row.batch.valueDate).includes(text(filters.valueDate))) &&
    (!filters.scanDate || text(row.batch.createdAt).includes(text(filters.scanDate)))
  );
}

function updateMicr(
  cheque: ChequeItem | undefined,
  update: (patch: Partial<ChequeItem>) => void,
  patch: Partial<ReturnType<typeof parseMICR>>
) {
  if (!cheque) return;
  const parsed = parseMICR(cheque.micrLine);
  const next = { ...parsed, ...patch };
  update({ micrLine: `${next.chequeNo} ${next.routingNumber} ${next.accountNo} ${next.transactionCode}` });
}

function prevNextId(items: ChequeItem[], currentId: string | undefined, delta: number) {
  if (!items.length) return "";
  const current = Math.max(0, items.findIndex((item) => item.id === currentId));
  const next = (current + delta + items.length) % items.length;
  return items[next].id;
}

function ChangedField({ changed, children, label, original, updated }: { changed: boolean; children: ReactNode; label: string; original: ReactNode; updated: ReactNode }) {
  return (
    <div className={`rounded-lg border p-2 ${changed ? "border-ace-warning bg-amber-50" : "border-ace-border bg-white"}`}>
      {children}
      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <div className="font-bold uppercase tracking-wide text-ace-muted">Original {label}</div>
          <div className="mt-0.5 rounded border border-ace-border bg-white px-2 py-1 text-ace-text">{original || "-"}</div>
        </div>
        <div>
          <div className={`font-bold uppercase tracking-wide ${changed ? "text-ace-warning" : "text-ace-muted"}`}>Updated {label}</div>
          <div className="mt-0.5 rounded border border-ace-border bg-white px-2 py-1 text-ace-text">{updated || "-"}</div>
        </div>
      </div>
    </div>
  );
}

function repairChangedFields(current: ChequeItem | undefined, original: ChequeItem | undefined) {
  if (!current || !original) return [];
  const currentMicr = parseMICR(current.micrLine);
  const originalMicr = parseMICR(original.micrLine);
  const checks: Array<[string, unknown, unknown]> = [
    ["Cheque No", current.chequeNo, original.chequeNo],
    ["MICR Account No", currentMicr.accountNo, originalMicr.accountNo],
    ["Routing No", currentMicr.routingNumber, originalMicr.routingNumber],
    ["Cheque Type", current.chequeType ?? "", original.chequeType ?? ""],
    ["Check Digit", current.checkDigit ?? "", original.checkDigit ?? ""],
    ["Amount", current.amount, original.amount],
    ["Cheque Date", current.issueDate, original.issueDate],
    ["Drawer Name", current.drawerName ?? "", original.drawerName ?? ""],
    ["Remarks", current.remarks ?? "", original.remarks ?? ""],
    ["Discard", Boolean(current.discarded), Boolean(original.discarded)]
  ];
  return checks.filter(([, currentValue, originalValue]) => String(currentValue) !== String(originalValue)).map(([label]) => label);
}

function repairValidation(items: ChequeItem[]) {
  const messages: string[] = [];
  items.forEach((item) => {
    const parsed = parseMICR(item.micrLine);
    if (!item.chequeNo.trim()) messages.push(`${item.id}: cheque number is blank.`);
    if (!parsed.accountNo.trim()) messages.push(`${item.chequeNo}: MICR account number is blank.`);
    if (!parsed.routingNumber.trim()) messages.push(`${item.chequeNo}: routing number is blank.`);
    if (item.amount <= 0) messages.push(`${item.chequeNo}: amount should be greater than zero.`);
    if (!item.issueDate) messages.push(`${item.chequeNo}: cheque date is blank.`);
  });
  return messages;
}

function repairAuditForRow(row: BatchRow, audit: { action: string; at: string; entityId?: string; note: string }[]) {
  return audit.find((event) => event.action === "Send Outward Batch To Repair" && event.entityId === row.batch.id);
}

function repairReasonForRow(row: BatchRow, audit: { action: string; at: string; entityId?: string; note: string }[]) {
  return repairAuditForRow(row, audit)?.note ?? row.cheques.find((cheque) => cheque.remarks)?.remarks ?? "Returned for maker correction";
}

function repairReturnedAt(row: BatchRow, audit: { action: string; at: string; entityId?: string; note: string }[]) {
  return repairAuditForRow(row, audit)?.at ?? row.batch.createdAt;
}

function batchAgeLabel(createdAt: string) {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "Today";
  const minutes = Math.max(0, Math.floor((Date.now() - created.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function modalMessage(action: ModalAction, acceptCount: number, discardCount: number, totalAmount = 0) {
  if (action === "authorize") return `Do you want to accept this batch? AcceptCount: ${acceptCount} DiscardCount: ${discardCount} Total Amount: MMK ${totalAmount.toLocaleString()}`;
  if (action === "repair") return "Entire batch will be returned for maker correction. Do you want to send this batch to repair?";
  if (action === "discard") return "This sends the batch to the permanent discard path. Do you want to discard this batch?";
  if (action === "exit") return "Do you want to exit this review? Unsaved review selections will be cleared.";
  if (action === "completeUnmodified") return "You have not modified any field. Do you still want to complete this cheque?";
  if (action === "complete") return "Do you want to complete repair and return this batch to authorization?";
  return "";
}
