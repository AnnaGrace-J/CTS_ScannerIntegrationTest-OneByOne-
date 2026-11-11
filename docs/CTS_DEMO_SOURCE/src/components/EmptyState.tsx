import { FileClock } from "lucide-react";

export function EmptyState({ title = "Coming next", message }: { title?: string; message?: string }) {
  return (
    <div className="enterprise-panel flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
      <FileClock className="h-10 w-10 text-cts-blue" aria-hidden="true" />
      <div>
        <h2 className="text-lg font-bold text-ace-primary">{title}</h2>
        <p className="mt-1 max-w-xl text-sm text-slate-600">
          {message ??
            "This demo route is wired and ready for the next workflow detail. Use the navigation above to continue through the clearing journey."}
        </p>
      </div>
    </div>
  );
}
