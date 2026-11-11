import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useEffect } from "react";
import { useDemoStore } from "../store/useDemoStore";

const icons = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert
};

const tones = {
  success: "border-emerald-500 bg-emerald-50 text-emerald-900",
  info: "border-blue-500 bg-blue-50 text-blue-900",
  warning: "border-amber-500 bg-amber-50 text-amber-900"
};

export function ToastStack() {
  const { dismissToast, toasts } = useDemoStore();

  useEffect(() => {
    if (!toasts.length) return;
    const id = window.setTimeout(() => dismissToast(toasts[toasts.length - 1].id), 4200);
    return () => window.clearTimeout(id);
  }, [dismissToast, toasts]);

  if (!toasts.length) return null;

  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" role="status">
      {toasts.map((toast) => {
        const Icon = icons[toast.tone];
        return (
          <div key={toast.id} className={`flex items-start gap-2 rounded-lg border p-3 text-sm font-semibold shadow-enterprise ${tones[toast.tone]}`}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">{toast.message}</div>
            <button aria-label="Dismiss notification" className="rounded p-0.5 hover:bg-white/70" type="button" onClick={() => dismissToast(toast.id)} title="Dismiss notification">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
