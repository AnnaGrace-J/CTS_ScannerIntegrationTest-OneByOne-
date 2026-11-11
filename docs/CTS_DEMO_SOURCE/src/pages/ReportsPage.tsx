import { Download, FileSpreadsheet, FileText, RefreshCw, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateField } from "../components/DateField";
import {
  AmountDisplay,
  ExceptionBanner,
  OperationsHeader,
  OperationsPage,
  PrimaryActionButton,
  QueueSummaryStrip,
  ReportFilterPanel,
  ReportHeader,
  ReportPreviewPanel,
  ReportResultTable,
  SecondaryActionButton,
  StatusPill,
  StickyActionBar
} from "../components/operations";
import { SelectField } from "../components/SelectField";
import { TextField } from "../components/TextField";
import { parseMICR, workstepLabels } from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { ChequeDirection, ChequeItem } from "../types";

const outwardReports = [
  "Outward Summary Report",
  "Outward Return Report",
  "Negative Acknowledgement Report",
  "Outward Discard Cheques Report",
  "Cheque Introduced in the System",
  "Outward Cheque Honored",
  "CB Accepted Cheques",
  "Return Advice Generation"
];

const inwardReports = [
  "Inward Introduction Report",
  "Inward Summary Report",
  "Inward Clearing Report Referral",
  "Inward Clearing Report",
  "Inward Return Report",
  "Auto Return Report",
  "Inward NAK Report",
  "Inward Pending Report"
];

type Filters = {
  report: string;
  batchId: string;
  makerId: string;
  branch: string;
  bank: string;
  cutoff: string;
  fromDate: string;
  toDate: string;
};

function money(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function matchesReport(report: string, cheque: ChequeItem) {
  if (!report) return true;
  if (report.includes("Discard")) return cheque.workstep === "DISCARD";
  if (report.includes("Negative") || report.includes("NAK")) return cheque.workstep.includes("NAK");
  if (report.includes("Honored")) return cheque.workstep === "WORK_EXIT" && cheque.returnStatus !== "Rejected";
  if (report.includes("CB Accepted")) return ["WAIT_FOR_RETURN", "CREDIT_POSTING", "WORK_EXIT"].includes(cheque.workstep);
  if (report.includes("Outward Return") || report.includes("Return Advice")) return cheque.returnStatus === "Rejected";
  if (report.includes("Referral")) return cheque.workstep === "REFERRAL";
  if (report.includes("Pending")) return !["WORK_EXIT", "DISCARD"].includes(cheque.workstep);
  if (report.includes("Auto Return")) return cheque.remarks?.toLowerCase().includes("auto") ?? false;
  if (report.includes("Inward Return")) return cheque.returnStatus === "Rejected";
  return true;
}

function dateInRange(value: string, fromDate: string, toDate: string) {
  return (!fromDate || value >= fromDate) && (!toDate || value <= toDate);
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function ExportToolbar({
  disabled,
  onClear,
  onCsv,
  onExcel,
  onExit,
  onGenerate,
  onPdf
}: {
  disabled: boolean;
  onClear: () => void;
  onCsv: () => void;
  onExcel: () => void;
  onExit: () => void;
  onGenerate: () => void;
  onPdf: () => void;
}) {
  return (
    <StickyActionBar>
      <PrimaryActionButton icon={<RefreshCw className="h-4 w-4" />} onClick={onGenerate}>
        Generate
      </PrimaryActionButton>
      <SecondaryActionButton onClick={onClear}>Clear</SecondaryActionButton>
      <SecondaryActionButton disabledReason="Generate a report before downloading CSV." icon={<Download className="h-4 w-4" />} disabled={disabled} onClick={onCsv}>
        Download CSV
      </SecondaryActionButton>
      <SecondaryActionButton disabledReason="Generate a report before creating the demo PDF export." icon={<FileText className="h-4 w-4" />} disabled={disabled} onClick={onPdf}>
        PDF Demo
      </SecondaryActionButton>
      <SecondaryActionButton disabledReason="Generate a report before creating the demo Excel export." icon={<FileSpreadsheet className="h-4 w-4" />} disabled={disabled} onClick={onExcel}>
        Excel Demo
      </SecondaryActionButton>
      <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={onExit}>
        Exit
      </SecondaryActionButton>
    </StickyActionBar>
  );
}

function ReportMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-ace-border bg-slate-50 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-ace-muted">{label}</div>
      <div className="mt-1 text-lg font-bold text-ace-primary">{value}</div>
    </div>
  );
}

export function ReportsPage({ direction }: { direction: "outward" | "inward" }) {
  const navigate = useNavigate();
  const { addAudit, batches, branches, cheques, user } = useDemoStore();
  const today = new Date().toISOString().slice(0, 10);
  const reportOptions = direction === "outward" ? outwardReports : inwardReports;
  const [filters, setFilters] = useState<Filters>({
    report: "",
    batchId: "",
    makerId: "",
    branch: "",
    bank: "",
    cutoff: "",
    fromDate: today,
    toDate: today
  });
  const [generated, setGenerated] = useState(false);
  const [message, setMessage] = useState("");

  const directionKey: ChequeDirection = direction === "outward" ? "OUTWARD" : "INWARD";
  const rows = useMemo(() => {
    if (!generated || !filters.report) return [];
    return cheques
      .filter((cheque) => cheque.direction === directionKey)
      .filter((cheque) => matchesReport(filters.report, cheque))
      .filter((cheque) => !filters.batchId || cheque.batchId.toLowerCase().includes(filters.batchId.toLowerCase()))
      .filter((cheque) => !filters.branch || cheque.branch === filters.branch)
      .filter((cheque) => !filters.bank || `${cheque.presentingBank} ${cheque.payingBank}`.toLowerCase().includes(filters.bank.toLowerCase()))
      .filter((cheque) => dateInRange(cheque.scanDate, filters.fromDate, filters.toDate))
      .filter((cheque) => {
        if (!filters.makerId) return true;
        const batch = batches.find((item) => item.id === cheque.batchId);
        return [batch?.createdBy, batch?.lastMakerId].some((value) => value?.toLowerCase().includes(filters.makerId.toLowerCase()));
      });
  }, [batches, cheques, directionKey, filters, generated]);

  const totals = useMemo(
    () => ({
      count: rows.length,
      amount: rows.reduce((sum, cheque) => sum + cheque.amount, 0),
      discarded: rows.filter((cheque) => cheque.workstep === "DISCARD").length,
      rejected: rows.filter((cheque) => cheque.returnStatus === "Rejected" || cheque.workstep.includes("NAK")).length
    }),
    [rows]
  );

  const generate = () => {
    if (!filters.report) {
      setMessage("Select Report is required.");
      setGenerated(false);
      return;
    }
    setMessage("");
    setGenerated(true);
    addAudit("Generate Report", `${filters.report} generated for ${direction} clearing.`);
  };

  const clear = () => {
    setFilters({ report: "", batchId: "", makerId: "", branch: "", bank: "", cutoff: "", fromDate: today, toDate: today });
    setGenerated(false);
    setMessage("");
    addAudit("Clear Report Filters", `${direction} report criteria cleared.`);
  };

  const exportRows = () => {
    const header = ["Reference No", "Batch ID", "Branch", "Bank", "Cheque No", "Routing No", "MICR Account No", "Amount", "Status", "Workstep", "Scan Date"];
    const body = rows.map((cheque) => {
      const micr = parseMICR(cheque.micrLine);
      return [
        cheque.id,
        cheque.batchId,
        cheque.branch,
        cheque.payingBank,
        cheque.chequeNo,
        micr.routingNumber,
        micr.accountNo,
        cheque.amount,
        cheque.status,
        workstepLabels[cheque.workstep],
        cheque.scanDate
      ];
    });
    return [header, ...body].map((line) => line.map(csvEscape).join(",")).join("\n");
  };

  const fileSlug = `${direction}-${filters.report || "report"}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", direction === "outward" ? "Outward" : "Inward", "Reports"]}
        title={`${direction === "outward" ? "Outward" : "Inward"} Reporting Workspace`}
        subtitle="Generate bank-style demo reports from current local clearing state, archive, and audit data."
        businessDate={today}
        status={generated ? "Generated" : "Draft"}
        meta={[
          { label: "Selected Report", value: filters.report || "Not selected" },
          { label: "Generated Rows", value: rows.length },
          { label: "User", value: user?.username ?? "demo" },
          { label: "Branch", value: filters.branch || "All Branches" }
        ]}
      />

      <QueueSummaryStrip
        items={[
          { label: "Rows", value: totals.count, tone: totals.count ? "info" : "warning" },
          { label: "Total Amount", value: money(totals.amount), tone: "success" },
          { label: "Rejected / NAK", value: totals.rejected, tone: totals.rejected ? "danger" : "success" },
          { label: "Discarded", value: totals.discarded, tone: totals.discarded ? "warning" : "success" }
        ]}
      />

      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}

      <div className="responsive-sidebar-grid">
        <aside className="space-y-4">
          <ReportFilterPanel title="Report Filters" resultCount={rows.length}>
            <SelectField
              label="Select Report *"
              value={filters.report}
              options={[{ label: "Select", value: "" }, ...reportOptions.map((report) => ({ label: report, value: report }))]}
              onChange={(report) => setFilters((current) => ({ ...current, report }))}
            />
            {direction === "outward" ? <TextField label="Batch ID" value={filters.batchId} onChange={(batchId) => setFilters((current) => ({ ...current, batchId }))} /> : null}
            {direction === "outward" ? <TextField label="Maker ID" value={filters.makerId} onChange={(makerId) => setFilters((current) => ({ ...current, makerId }))} /> : null}
            <SelectField
              label="Branch"
              value={filters.branch}
              options={[{ label: "All Branches", value: "" }, ...branches.map((branch) => ({ label: branch.name, value: branch.name }))]}
              onChange={(branch) => setFilters((current) => ({ ...current, branch }))}
            />
            <TextField label="Bank" value={filters.bank} onChange={(bank) => setFilters((current) => ({ ...current, bank }))} />
            {direction === "outward" ? (
              <TextField label="Presenting Cut Off" value={filters.cutoff} placeholder="15:00" onChange={(cutoff) => setFilters((current) => ({ ...current, cutoff }))} />
            ) : null}
            <DateField label="From Date" value={filters.fromDate} onChange={(fromDate) => setFilters((current) => ({ ...current, fromDate }))} />
            <DateField label="To Date" value={filters.toDate} onChange={(toDate) => setFilters((current) => ({ ...current, toDate }))} />
          </ReportFilterPanel>
        </aside>

        <ReportPreviewPanel title="Report Preview">
          <ReportHeader title={filters.report || "Report Preview"} />
          <div className="space-y-4 p-4">
            <div className="responsive-metric-grid">
              <ReportMetric label="Branch" value={filters.branch || user?.branch || "All"} />
              <ReportMetric label="Generated" value={generated ? new Date().toLocaleString() : "-"} />
              <ReportMetric label="Count" value={totals.count} />
              <ReportMetric label="Total Amount" value={<AmountDisplay value={totals.amount} />} />
            </div>
            <ReportResultTable>
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {["Reference No", "Batch ID", "Branch", "Cheque No", "Routing No", "Amount", "Status", "Workstep"].map((heading) => (
                      <th key={heading} className="table-head-cell">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="table-body-cell">{row.id}</td>
                      <td className="table-body-cell">{row.batchId}</td>
                      <td className="table-body-cell">{row.branch}</td>
                      <td className="table-body-cell">{row.chequeNo}</td>
                      <td className="table-body-cell">{parseMICR(row.micrLine).routingNumber}</td>
                      <td className="table-body-cell"><AmountDisplay value={row.amount} /></td>
                      <td className="table-body-cell"><StatusPill status={row.status} /></td>
                      <td className="table-body-cell">{workstepLabels[row.workstep]}</td>
                    </tr>
                  ))}
                  {!rows.length ? (
                    <tr>
                      <td className="px-3 py-10 text-center text-sm font-semibold text-ace-muted" colSpan={8}>
                        Generate a report to preview results.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </ReportResultTable>
          </div>
        </ReportPreviewPanel>
      </div>

      <ExportToolbar
        disabled={!generated}
        onGenerate={generate}
        onClear={clear}
        onExit={() => navigate(direction === "outward" ? "/outward/dashboard" : "/inward/dashboard")}
        onCsv={() => {
          downloadFile(`${fileSlug}.csv`, exportRows(), "text/csv");
          addAudit("Download Report CSV", `${filters.report} CSV demo export downloaded.`);
        }}
        onPdf={() => {
          downloadFile(`${fileSlug}-demo.pdf`, `ACE CTS demo PDF export\n${filters.report}\nRows: ${rows.length}`, "application/pdf");
          addAudit("Download Report PDF", `${filters.report} PDF demo export downloaded.`);
        }}
        onExcel={() => {
          downloadFile(`${fileSlug}-demo.xls`, exportRows(), "application/vnd.ms-excel");
          addAudit("Download Report Excel", `${filters.report} Excel demo export downloaded.`);
        }}
      />
    </OperationsPage>
  );
}
