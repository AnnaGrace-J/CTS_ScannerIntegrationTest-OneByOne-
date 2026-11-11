import type { ReactNode } from "react";
import { ChevronRight, FileSearch } from "lucide-react";
import { QueueDataGrid } from "./operations";

export type SearchGridColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type SearchGridProps<T> = {
  title?: string;
  rows: T[];
  columns: SearchGridColumn<T>[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
};

export function SearchGrid<T>({ title, rows, columns, getRowKey, onRowClick }: SearchGridProps<T>) {
  return (
    <QueueDataGrid title={title}>
      <div className="min-w-0 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="table-head-cell">
                  {column.header}
                </th>
              ))}
              {onRowClick ? <th className="table-head-cell w-10" aria-label="Open workitem" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={getRowKey(row)}
                className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} ${
                  onRowClick ? "cursor-pointer transition hover:bg-blue-50/80 focus:bg-blue-50/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ace-accent" : ""
                }`}
                aria-label={onRowClick ? "Open selected workitem" : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(event) => {
                  if (!onRowClick) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className="table-body-cell">
                    {column.render(row)}
                  </td>
                ))}
                {onRowClick ? (
                  <td className="table-body-cell text-right text-ace-muted">
                    <ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" />
                  </td>
                ) : null}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-10 text-center text-sm text-ace-muted" colSpan={columns.length + (onRowClick ? 1 : 0)}>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSearch className="h-8 w-8 text-ace-muted" aria-hidden="true" />
                    <span className="font-semibold">No records found</span>
                    <span className="max-w-sm text-xs">Adjust filters or run the relevant demo service to create workitems.</span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </QueueDataGrid>
  );
}
