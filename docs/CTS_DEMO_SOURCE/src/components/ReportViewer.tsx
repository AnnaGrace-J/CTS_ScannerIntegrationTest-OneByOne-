import { Download, Printer, RefreshCw } from "lucide-react";
import { ReportHeader, ReportResultTable } from "./operations";

const rows = [
  ["Outward clearing summary", "2026-06-01", "79 items", "Ready"],
  ["Inward technical verification", "2026-06-01", "21 items", "Draft"],
  ["Return reason distribution", "2026-05-31", "8 items", "Ready"]
];

export function ReportViewer({ title = "Reports" }: { title?: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-ace-border bg-white shadow-enterprise">
      <div className="flex items-center justify-between gap-3 border-b border-ace-border px-4 py-3">
        <span className="text-sm font-bold text-ace-primary">{title}</span>
        <div className="flex gap-2">
          <button aria-label="Refresh report preview" className="enterprise-button-secondary h-8 w-8 p-0" title="Refresh" type="button">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button aria-label="Print report preview" className="enterprise-button-secondary h-8 w-8 p-0" title="Print" type="button">
            <Printer className="h-4 w-4" />
          </button>
          <button aria-label="Download report preview" className="enterprise-button h-8 w-8 p-0" title="Download" type="button">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ReportHeader title={title} />
      <div className="p-4">
        <div className="mb-3 rounded-lg border border-ace-border bg-slate-50 p-3 text-sm leading-6 text-ace-muted">
          Demo report viewer. These reports are local mock summaries and do not connect to clearing, core banking, or data warehouse services.
        </div>
        <ReportResultTable>
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                {["Report", "Business Date", "Scope", "Status"].map((heading) => (
                  <th key={heading} className="table-head-cell">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="odd:bg-white even:bg-slate-50">
                  {row.map((cell) => (
                    <td key={cell} className="table-body-cell">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ReportResultTable>
      </div>
    </section>
  );
}
