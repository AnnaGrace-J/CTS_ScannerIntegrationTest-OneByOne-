import { Archive, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AmountDisplay,
  AuditTimelinePanel,
  ChequeImageViewerV2,
  FieldGroup,
  FieldRow,
  FormPanel,
  OperationsHeader,
  OperationsPage,
  PrimaryActionButton,
  QueueFilterPanel,
  QueueSummaryStrip,
  SecondaryActionButton,
  StatusPill
} from "../components/operations";
import { SearchGrid } from "../components/SearchGrid";
import { SelectField } from "../components/SelectField";
import { TextField } from "../components/TextField";
import { parseMICR, workstepLabels } from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { ArchiveRecord } from "../types";

export function ArchivePage() {
  const { archive, rebuildArchive } = useDemoStore();
  const [process, setProcess] = useState("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [imageSide, setImageSide] = useState<"front" | "rear">("front");

  const rows = useMemo(
    () =>
      archive.filter((record) => {
        const cheque = record.cheque;
        const micr = parseMICR(cheque.micrLine);
        const haystack = `${record.id} ${cheque.id} ${cheque.chequeNo} ${cheque.accountNo} ${micr.accountNo} ${micr.routingNumber} ${cheque.batchId}`.toLowerCase();
        return (process === "ALL" || cheque.direction === process) && haystack.includes(query.toLowerCase());
      }),
    [archive, process, query]
  );
  const selected = rows.find((record) => record.id === selectedId) ?? rows[0];

  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Administration", "Archive"]}
        title="Archive Browser"
        subtitle="Search terminal cheque records with images, data snapshots, and audit trail history."
        businessDate={new Date().toISOString().slice(0, 10)}
        status="Admin only"
        meta={[
          { label: "Archive Records", value: archive.length },
          { label: "Filtered Rows", value: rows.length },
          { label: "Selected Reference", value: selected?.id ?? "None" },
          { label: "Storage", value: "Local browser state" }
        ]}
        actions={
          <PrimaryActionButton icon={<RotateCcw className="h-4 w-4" />} onClick={rebuildArchive}>
            Rebuild Archive
          </PrimaryActionButton>
        }
      />

      <QueueSummaryStrip
        items={[
          { label: "Outward Archive", value: rows.filter((row) => row.cheque.direction === "OUTWARD").length, tone: "info" },
          { label: "Inward Archive", value: rows.filter((row) => row.cheque.direction === "INWARD").length, tone: "info" },
          { label: "Discarded", value: rows.filter((row) => row.cheque.workstep === "DISCARD").length, tone: "warning" },
          { label: "Exited", value: rows.filter((row) => row.cheque.workstep === "WORK_EXIT").length, tone: "success" }
        ]}
      />

      <QueueFilterPanel
        title="Archive Search"
        resultCount={rows.length}
        actions={<SecondaryActionButton icon={<Search className="h-4 w-4" />} onClick={() => setSelectedId(rows[0]?.id ?? "")}>Select First Match</SecondaryActionButton>}
      >
        <SelectField
          label="Process"
          value={process}
          options={[
            { label: "All", value: "ALL" },
            { label: "Outward", value: "OUTWARD" },
            { label: "Inward", value: "INWARD" }
          ]}
          onChange={setProcess}
        />
        <TextField label="Reference / Cheque / Account" value={query} onChange={setQuery} />
        <TextField disabled label="Archive Count" value={String(archive.length)} />
        <TextField disabled label="Storage" value="LocalStorage demo archive" />
      </QueueFilterPanel>

      <div className="responsive-sidebar-grid">
        <SearchGrid<ArchiveRecord>
          title="Archived Cheques"
          rows={rows}
          getRowKey={(row) => row.id}
          onRowClick={(record) => {
            setSelectedId(record.id);
            setImageSide("front");
          }}
          columns={[
            { key: "archive", header: "Archive Ref", render: (row) => row.id },
            { key: "date", header: "Archived At", render: (row) => row.archivedAt },
            { key: "process", header: "Process", render: (row) => <StatusPill status={row.cheque.direction} /> },
            { key: "cheque", header: "Cheque No.", render: (row) => row.cheque.chequeNo },
            { key: "routing", header: "Routing No.", render: (row) => parseMICR(row.cheque.micrLine).routingNumber },
            { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.cheque.amount} /> },
            { key: "terminal", header: "Terminal State", render: (row) => workstepLabels[row.cheque.workstep] }
          ]}
        />

        <aside className="space-y-4">
          <FormPanel title="Archive Detail Drawer" density="compact">
            <FieldGroup title="Data Snapshot">
              <FieldRow label="Archive Ref" value={selected?.id ?? "None"} />
              <FieldRow label="Reference" value={selected?.cheque.id ?? ""} />
              <FieldRow label="Batch" value={selected?.cheque.batchId ?? ""} />
              <FieldRow label="Cheque" value={selected?.cheque.chequeNo ?? ""} />
              <FieldRow label="Amount" value={selected ? <AmountDisplay value={selected.cheque.amount} /> : ""} />
              <FieldRow label="Status" value={selected ? <StatusPill status={selected.cheque.status} /> : ""} />
              <FieldRow label="Archived" value={selected?.archivedAt ?? ""} />
            </FieldGroup>
            <FieldGroup title="MICR">
              <FieldRow label="Routing No." value={selected ? parseMICR(selected.cheque.micrLine).routingNumber : ""} />
              <FieldRow label="MICR A/c" value={selected ? parseMICR(selected.cheque.micrLine).accountNo : ""} />
              <FieldRow label="Customer A/c" value={selected?.cheque.accountNo ?? ""} />
            </FieldGroup>
          </FormPanel>
          <div className="rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-ace-primary">
                <Archive className="h-4 w-4 text-ace-accent" />
                Cheque Image Preview
              </div>
              <div className="flex gap-2">
                <SecondaryActionButton className={imageSide === "front" ? "bg-slate-100" : ""} onClick={() => setImageSide("front")}>Front</SecondaryActionButton>
                <SecondaryActionButton className={imageSide === "rear" ? "bg-slate-100" : ""} onClick={() => setImageSide("rear")}>Rear</SecondaryActionButton>
              </div>
            </div>
            {selected ? (
              <img
                alt="Archived cheque preview"
                className="w-full rounded-lg border border-ace-border bg-white"
                src={imageSide === "front" ? selected.frontImageUrl : selected.rearImageUrl}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-ace-border p-8 text-center text-sm text-ace-muted">No archive record selected.</div>
            )}
          </div>
        </aside>
      </div>

      {selected ? (
        <div className="responsive-sidebar-grid">
          <ChequeImageViewerV2
            frontSrc={selected.frontImageUrl}
            rearSrc={selected.rearImageUrl}
            variant={imageSide}
            title="Archived Cheque Workspace"
            reference={`${selected.cheque.direction} | ${selected.cheque.id} | ${selected.cheque.uic}`}
            badges={
              <>
                <StatusPill status={selected.cheque.status} />
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-ace-info">{workstepLabels[selected.cheque.workstep]}</span>
              </>
            }
          />
          <AuditTimelinePanel events={selected.auditTrail} />
        </div>
      ) : null}
    </OperationsPage>
  );
}
