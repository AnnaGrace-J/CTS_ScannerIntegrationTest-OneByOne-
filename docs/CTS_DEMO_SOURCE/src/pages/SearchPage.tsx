import { Archive, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DateField } from "../components/DateField";
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
  QueueSummaryStrip,
  SecondaryActionButton,
  StatusPill,
  StickyActionBar
} from "../components/operations";
import { SearchGrid } from "../components/SearchGrid";
import { SelectField } from "../components/SelectField";
import { TextField } from "../components/TextField";
import { parseMICR, workstepLabels } from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { ChequeItem } from "../types";

type SearchFilters = {
  processName: string;
  routingNo: string;
  micrAccountNo: string;
  chequeNo: string;
  customerAccountNo: string;
  amount: string;
  chequeDate: string;
  endorsementNumber: string;
};

function money(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function defaultFilters(cheque?: ChequeItem): SearchFilters {
  const micr = parseMICR(cheque?.micrLine ?? "");
  return {
    processName: cheque?.direction ?? "OUTWARD",
    routingNo: micr.routingNumber,
    micrAccountNo: micr.accountNo,
    chequeNo: cheque?.chequeNo ?? "",
    customerAccountNo: cheque?.accountNo ?? "",
    amount: cheque ? String(cheque.amount) : "",
    chequeDate: cheque?.issueDate ?? new Date().toISOString().slice(0, 10),
    endorsementNumber: cheque?.uic ?? ""
  };
}

export function SearchPage() {
  const { addAudit, archive, audit, cheques } = useDemoStore();
  const seedCheque = cheques.find((cheque) => cheque.direction === "OUTWARD") ?? cheques[0];
  const [filters, setFilters] = useState<SearchFilters>(() => defaultFilters(seedCheque));
  const [submitted, setSubmitted] = useState(true);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<ChequeItem | undefined>(seedCheque);
  const [imageSide, setImageSide] = useState<"front" | "rear">("front");

  const rows = useMemo(() => {
    if (!submitted) return [];
    if (!filters.processName || !filters.chequeNo || !filters.amount || !filters.chequeDate) return [];
    return cheques.filter((cheque) => {
      const micr = parseMICR(cheque.micrLine);
      const amountMatches = Number(filters.amount) === cheque.amount;
      return (
        (filters.processName === "ALL" || cheque.direction === filters.processName) &&
        cheque.chequeNo.includes(filters.chequeNo) &&
        amountMatches &&
        cheque.issueDate === filters.chequeDate &&
        (!filters.routingNo || micr.routingNumber.includes(filters.routingNo)) &&
        (!filters.micrAccountNo || micr.accountNo.includes(filters.micrAccountNo)) &&
        (!filters.customerAccountNo || cheque.accountNo.includes(filters.customerAccountNo)) &&
        (!filters.endorsementNumber || cheque.uic.toLowerCase().includes(filters.endorsementNumber.toLowerCase()))
      );
    });
  }, [cheques, filters, submitted]);

  const selectedAudit = audit.filter((event) => event.entityId === selected?.id).slice(0, 8);
  const selectedArchive = archive.find((record) => record.cheque.id === selected?.id);

  const runSearch = () => {
    if (!filters.processName || !filters.chequeNo || !filters.amount || !filters.chequeDate) {
      setMessage("Process Name, Cheque No., Amount, and Cheque Date are required.");
      setSubmitted(false);
      return;
    }
    setMessage("");
    setSubmitted(true);
    addAudit("Cheque Search", `Search executed for ${filters.processName} cheque ${filters.chequeNo}.`);
    const first = cheques.find((cheque) => {
      const micr = parseMICR(cheque.micrLine);
      return (
        (filters.processName === "ALL" || cheque.direction === filters.processName) &&
        cheque.chequeNo.includes(filters.chequeNo) &&
        cheque.amount === Number(filters.amount) &&
        cheque.issueDate === filters.chequeDate &&
        (!filters.routingNo || micr.routingNumber.includes(filters.routingNo))
      );
    });
    setSelected(first);
    setImageSide("front");
  };

  const clear = () => {
    setFilters(defaultFilters(seedCheque));
    setSubmitted(true);
    setMessage("");
    setSelected(seedCheque);
    setImageSide("front");
    addAudit("Clear Cheque Search", "Cheque search filters restored to demo defaults.");
  };

  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Search"]}
        title="Cheque Search Workspace"
        subtitle="Search outward and inward instruments and retrieve front/rear synthetic cheque images."
        businessDate={new Date().toISOString().slice(0, 10)}
        status={submitted ? "Results ready" : "Draft"}
        meta={[
          { label: "Process", value: filters.processName || "All" },
          { label: "Result Rows", value: rows.length },
          { label: "Selected Cheque", value: selected?.chequeNo ?? "None" },
          { label: "Image Mode", value: imageSide === "front" ? "Front" : "Rear" }
        ]}
      />

      <QueueSummaryStrip
        items={[
          { label: "Results", value: rows.length, tone: rows.length ? "info" : "warning" },
          { label: "Outward Matches", value: rows.filter((row) => row.direction === "OUTWARD").length, tone: "info" },
          { label: "Inward Matches", value: rows.filter((row) => row.direction === "INWARD").length, tone: "info" },
          { label: "Selected Amount", value: selected ? money(selected.amount) : "0", tone: "success" }
        ]}
      />

      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}

      <div className="responsive-sidebar-grid">
        <FormPanel title="Search Filters" density="compact">
          <SelectField
            label="Process Name *"
            value={filters.processName}
            options={[
              { label: "Outward", value: "OUTWARD" },
              { label: "Inward", value: "INWARD" },
              { label: "All", value: "ALL" }
            ]}
            onChange={(processName) => setFilters((current) => ({ ...current, processName }))}
          />
          <TextField label="Routing No." value={filters.routingNo} onChange={(routingNo) => setFilters((current) => ({ ...current, routingNo }))} />
          <TextField label="MICR A/c No." value={filters.micrAccountNo} onChange={(micrAccountNo) => setFilters((current) => ({ ...current, micrAccountNo }))} />
          <TextField label="Cheque No. *" value={filters.chequeNo} onChange={(chequeNo) => setFilters((current) => ({ ...current, chequeNo }))} />
          <TextField label="Customer A/c No." value={filters.customerAccountNo} onChange={(customerAccountNo) => setFilters((current) => ({ ...current, customerAccountNo }))} />
          <TextField label="Amount *" value={filters.amount} onChange={(amount) => setFilters((current) => ({ ...current, amount }))} />
          <DateField label="Cheque Date *" value={filters.chequeDate} onChange={(chequeDate) => setFilters((current) => ({ ...current, chequeDate }))} />
          <TextField label="Endorsement Number" value={filters.endorsementNumber} onChange={(endorsementNumber) => setFilters((current) => ({ ...current, endorsementNumber }))} />
          <div className="col-span-full">
            <StickyActionBar>
              <PrimaryActionButton icon={<Search className="h-4 w-4" />} onClick={runSearch}>Search</PrimaryActionButton>
              <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={clear}>Clear</SecondaryActionButton>
            </StickyActionBar>
          </div>
        </FormPanel>

        <SearchGrid
          title="Cheque Search Results"
          rows={rows}
          getRowKey={(row) => row.id}
          onRowClick={(row) => {
            setSelected(row);
            setImageSide("front");
          }}
          columns={[
            { key: "image", header: "Image Index / Reference No.", render: (row) => row.id },
            { key: "doc", header: "Doc Name", render: (row) => `${row.direction} Cheque Image` },
            { key: "baRouting", header: "BA Routing No.", render: (row) => row.presentingBankCode },
            { key: "baName", header: "BA Account Name", render: (row) => row.payee },
            { key: "cheque", header: "Cheque No.", render: (row) => row.chequeNo },
            { key: "routing", header: "Routing No.", render: (row) => parseMICR(row.micrLine).routingNumber },
            { key: "micr", header: "MICR Account No.", render: (row) => parseMICR(row.micrLine).accountNo },
            { key: "amount", header: "Amount", render: (row) => <AmountDisplay value={row.amount} /> },
            { key: "value", header: "Value Date", render: (row) => row.valueDate ?? row.scanDate },
            { key: "scan", header: "Scan Date", render: (row) => row.scanDate },
            { key: "chequeDate", header: "Cheque Date", render: (row) => row.issueDate },
            { key: "customerUnit", header: "Customer Unit", render: (row) => row.branch },
            { key: "scanUnit", header: "Scanning Unit", render: (row) => row.branchCode }
          ]}
        />
      </div>

      <div className="responsive-sidebar-grid">
        {selected ? (
          <ChequeImageViewerV2
            frontSrc={selected.imageFrontUrl}
            rearSrc={selected.imageRearUrl}
            variant={imageSide}
            reference={`${selected.direction} | ${selected.id} | UIC ${selected.uic}`}
            title="Selected Cheque Preview"
            actions={
              <>
                <SecondaryActionButton className={imageSide === "front" ? "bg-slate-100" : ""} onClick={() => setImageSide("front")}>Front</SecondaryActionButton>
                <SecondaryActionButton className={imageSide === "rear" ? "bg-slate-100" : ""} onClick={() => setImageSide("rear")}>Rear</SecondaryActionButton>
              </>
            }
            badges={
              <>
                <StatusPill status={selected.status} />
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-ace-info">{workstepLabels[selected.workstep]}</span>
              </>
            }
          />
        ) : (
          <ExceptionBanner>Click a search result to open the image preview drawer.</ExceptionBanner>
        )}

        <aside className="space-y-4">
          <FormPanel title="Cheque Details" density="compact">
            <FieldGroup title="Identity">
              <FieldRow label="Reference" value={selected?.id ?? "None"} />
              <FieldRow label="Process" value={selected ? <StatusPill status={selected.direction} /> : "None"} />
              <FieldRow label="Status" value={selected ? <StatusPill status={selected.status} /> : "None"} />
              <FieldRow label="Workstep" value={selected ? workstepLabels[selected.workstep] : "None"} />
            </FieldGroup>
            <FieldGroup title="Cheque / MICR">
              <FieldRow label="Cheque No." value={selected?.chequeNo ?? ""} />
              <FieldRow label="Routing No." value={selected ? parseMICR(selected.micrLine).routingNumber : ""} />
              <FieldRow label="MICR A/c" value={selected ? parseMICR(selected.micrLine).accountNo : ""} />
              <FieldRow label="Amount" value={selected ? <AmountDisplay value={selected.amount} /> : ""} />
            </FieldGroup>
            <FieldGroup title="Archive">
              <FieldRow label="Archived" value={selectedArchive ? <StatusPill status="Archived" /> : "Not archived"} />
              <FieldRow label="Archived At" value={selectedArchive?.archivedAt ?? "-"} />
              <FieldRow label="Audit Records" value={selectedArchive?.auditTrail.length ?? selectedAudit.length} />
            </FieldGroup>
            {selectedArchive ? (
              <div className="col-span-full flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-ace-success">
                <Archive className="h-4 w-4" />
                Archive image and audit snapshot available.
              </div>
            ) : null}
          </FormPanel>
          <AuditTimelinePanel events={selectedArchive?.auditTrail ?? selectedAudit} />
        </aside>
      </div>
    </OperationsPage>
  );
}
