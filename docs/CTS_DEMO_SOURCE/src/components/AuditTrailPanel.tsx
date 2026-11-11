import type { AuditEvent } from "../types";

export function AuditTrailPanel({ events }: { events: AuditEvent[] }) {
  return (
    <section className="enterprise-panel">
      <div className="enterprise-header">Audit Trail</div>
      <div className="max-h-72 overflow-auto p-3">
        {events.map((event) => (
          <div key={event.id} className="border-b border-slate-200 py-2 last:border-b-0">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>{event.at}</span>
              <span>{event.user}</span>
            </div>
            <div className="mt-1 text-sm font-bold text-ace-primary">{event.action}</div>
            <div className="text-sm text-slate-600">{event.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
