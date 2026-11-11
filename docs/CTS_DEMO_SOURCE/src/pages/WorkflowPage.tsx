import { Upload, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AuditTrailPanel } from "../components/AuditTrailPanel";
import { ChequeImageViewer } from "../components/ChequeImageViewer";
import { ConfirmModal } from "../components/ConfirmModal";
import { DateField } from "../components/DateField";
import { EmptyState } from "../components/EmptyState";
import { FormSection } from "../components/FormSection";
import { OperationsHeader, OperationsPage, PrimaryActionButton } from "../components/operations";
import { SearchGrid } from "../components/SearchGrid";
import { SelectField } from "../components/SelectField";
import { StatusBadge } from "../components/StatusBadge";
import { TextField } from "../components/TextField";
import { canRoleAccessWorkstep } from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { ChequeItem, Workstep } from "../types";

type WorkflowPageProps = {
  title: string;
  direction: "outward" | "inward";
  mode:
    | "scanning"
    | "authorization"
    | "repair"
    | "icl"
    | "upload-response"
    | "nak"
    | "return-wait"
    | "posting"
    | "upload-icl"
    | "technical"
    | "referral"
    | "return-maker"
    | "return-checker"
    | "charge";
};

const modeWorksteps: Record<WorkflowPageProps["mode"], Workstep[]> = {
  scanning: ["SCANNING_DATA_ENTRY"],
  authorization: ["OUTWARD_AUTHORIZATION"],
  repair: ["OUTWARD_REPAIR"],
  icl: ["HOLD_FOR_ICL_GENERATION", "ICL_FILE_GENERATION", "RETURN_ICL_CREATION"],
  "upload-response": ["FORWARD_UPLOAD_FILE_RESPONSE", "RETURN_UPLOAD_FILE_RESPONSE"],
  nak: ["OUTWARD_NAK_REPAIR", "INWARD_NAK_REPAIR"],
  "return-wait": ["WAIT_FOR_RETURN"],
  posting: ["CREDIT_POSTING", "DEBIT_POSTING"],
  "upload-icl": ["READ_UPLOAD_FORWARD_DOWNLOAD_ICL"],
  technical: ["TECHNICAL_VERIFICATION"],
  referral: ["REFERRAL"],
  "return-maker": ["MANUAL_RETURN_MAKER"],
  "return-checker": ["MANUAL_RETURN_CHECKER"],
  charge: ["INWARD_CHARGE_POSTING"]
};

function nextWorkstepFor(workstep: Workstep, direction: "outward" | "inward"): Workstep {
  const next: Partial<Record<Workstep, Workstep>> = {
    SCANNING_DATA_ENTRY: "OUTWARD_AUTHORIZATION",
    OUTWARD_AUTHORIZATION: "HOLD_FOR_ICL_GENERATION",
    OUTWARD_REPAIR: "OUTWARD_AUTHORIZATION",
    HOLD_FOR_ICL_GENERATION: "ICL_FILE_GENERATION",
    ICL_FILE_GENERATION: "FORWARD_UPLOAD_FILE_RESPONSE",
    FORWARD_UPLOAD_FILE_RESPONSE: "CREDIT_POSTING",
    OUTWARD_NAK_REPAIR: "OUTWARD_AUTHORIZATION",
    WAIT_FOR_RETURN: "WORK_EXIT",
    CREDIT_POSTING: "WORK_EXIT",
    READ_UPLOAD_FORWARD_DOWNLOAD_ICL: "TECHNICAL_VERIFICATION",
    TECHNICAL_VERIFICATION: "DEBIT_POSTING",
    DEBIT_POSTING: "WORK_EXIT",
    REFERRAL: "MANUAL_RETURN_MAKER",
    MANUAL_RETURN_MAKER: "MANUAL_RETURN_CHECKER",
    MANUAL_RETURN_CHECKER: "RETURN_ICL_CREATION",
    RETURN_ICL_CREATION: "RETURN_UPLOAD_FILE_RESPONSE",
    RETURN_UPLOAD_FILE_RESPONSE: "INWARD_CHARGE_POSTING",
    INWARD_NAK_REPAIR: "TECHNICAL_VERIFICATION",
    INWARD_CHARGE_POSTING: "WORK_EXIT"
  };
  return next[workstep] ?? (direction === "outward" ? "WORK_EXIT" : "WORK_EXIT");
}

export function WorkflowPage({ title, direction, mode }: WorkflowPageProps) {
  const { audit, branches, cheques, moveChequeToWorkstep, user } = useDemoStore();
  const [selected, setSelected] = useState<ChequeItem | undefined>(cheques[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("2026-06-01");

  const rows = useMemo(() => {
    const directionKey = direction === "outward" ? "OUTWARD" : "INWARD";
    const allowed = modeWorksteps[mode].filter((workstep) => {
      if (direction === "outward") return !workstep.startsWith("READ_") && !workstep.startsWith("TECHNICAL") && !workstep.startsWith("DEBIT") && !workstep.startsWith("REFERRAL") && !workstep.startsWith("MANUAL") && !workstep.startsWith("RETURN_") && !workstep.startsWith("INWARD");
      return !workstep.startsWith("OUTWARD") && workstep !== "SCANNING_DATA_ENTRY" && workstep !== "HOLD_FOR_ICL_GENERATION" && workstep !== "FORWARD_UPLOAD_FILE_RESPONSE" && workstep !== "WAIT_FOR_RETURN" && workstep !== "CREDIT_POSTING";
    });
    const base = cheques.filter((cheque) => cheque.direction === directionKey);
    return base.filter((row) => {
      const matchesStatus = allowed.includes(row.workstep);
      const matchesQuery = `${row.id} ${row.batchNo} ${row.chequeNo} ${row.payee}`.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [cheques, direction, mode, query]);

  const activeSelected = selected && rows.some((row) => row.id === selected.id) ? selected : rows[0];
  const actionLabel = mode === "scanning" || mode === "upload-icl" ? "Capture Batch" : "Authorize";
  const canPerformAction = user ? modeWorksteps[mode].some((workstep) => canRoleAccessWorkstep(user.role, workstep)) : false;

  if (["upload-response", "return-wait"].includes(mode) && rows.length === 0) {
    return (
      <OperationsPage>
        <PageTitle direction={direction} title={title} />
        <EmptyState message="No pending response items for the selected business date." />
      </OperationsPage>
    );
  }

  return (
    <OperationsPage>
      <PageTitle direction={direction} title={title} />
      <FormSection
        actions={
          <PrimaryActionButton
            disabled={!canPerformAction || !activeSelected}
            disabledReason={!canPerformAction ? "Your role cannot perform this action." : "Select a workitem before continuing."}
            icon={mode === "scanning" || mode === "upload-icl" ? <Wand2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            onClick={() => setModalOpen(true)}
          >
            {actionLabel}
          </PrimaryActionButton>
        }
        title="Search Criteria"
      >
        <TextField label="Batch / Cheque" value={query} onChange={setQuery} />
        <DateField label="Business Date" value={date} onChange={setDate} />
        <SelectField
          label="Branch"
          value="Yangon Main"
          options={[
            ...branches.map((branch) => ({ label: branch.name, value: branch.name }))
          ]}
        />
        <TextField disabled label="Clearing House" value="CBM Demo Clearing" />
      </FormSection>

      <div className="responsive-sidebar-grid">
        <div className="space-y-4">
          <SearchGrid<ChequeItem>
            title="Search Results"
            rows={rows}
            getRowKey={(row) => row.id}
            onRowClick={setSelected}
            columns={[
              { key: "id", header: "Item ID", render: (row) => row.id },
              { key: "batch", header: "Batch No", render: (row) => row.batchNo },
              { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
              { key: "uic", header: "UIC", render: (row) => row.uic },
              { key: "payee", header: "Payee", render: (row) => row.payee },
              { key: "amount", header: "Amount", render: (row) => `${row.currency} ${row.amount.toLocaleString()}` },
              { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> }
            ]}
          />
          <AuditTrailPanel events={audit.slice(0, 5)} />
        </div>
        <ChequeImageViewer cheques={rows.length ? rows : cheques} selectedId={activeSelected?.id} onSelect={setSelected} />
      </div>

      <ConfirmModal
        open={modalOpen}
        title="Confirm Action"
        message={`Proceed with ${actionLabel.toLowerCase()} for ${activeSelected?.id ?? "the selected item"}?`}
        confirmLabel="Yes"
        onCancel={() => setModalOpen(false)}
        onConfirm={() => {
          if (activeSelected) {
            const next = nextWorkstepFor(activeSelected.workstep, direction);
            moveChequeToWorkstep(activeSelected.id, next, `${title} completed in local demo state`);
          }
          setModalOpen(false);
        }}
      />
    </OperationsPage>
  );
}

function PageTitle({ direction, title }: { direction: "outward" | "inward"; title: string }) {
  return (
    <OperationsHeader
      breadcrumbs={["ACE CTS Workspace", direction === "outward" ? "Outward" : "Inward", title]}
      title={title}
      subtitle={direction === "outward" ? "Outward clearing work queue" : "Inward clearing work queue"}
      meta={[
        { label: "Module", value: direction === "outward" ? "Outward" : "Inward" },
        { label: "Mode", value: "Queue workspace" },
        { label: "Action", value: "Local demo transition" },
        { label: "Storage", value: "Local browser state" }
      ]}
    />
  );
}
