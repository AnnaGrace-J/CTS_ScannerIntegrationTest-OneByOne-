type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Yes",
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" role="presentation">
      <div
        aria-describedby="confirm-modal-message"
        aria-labelledby="confirm-modal-title"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-xl border border-ace-border bg-white shadow-ace"
        role="dialog"
      >
        <div className="border-b border-ace-border bg-white px-4 py-3">
          <div id="confirm-modal-title" className="text-base font-bold text-ace-primary">{title}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-ace-muted">Confirmation required</div>
        </div>
        <div id="confirm-modal-message" className="p-4 text-sm leading-6 text-ace-text">{message}</div>
        <div className="flex justify-end gap-2 border-t border-ace-border bg-slate-50 p-3">
          <button aria-label="No, cancel confirmation" className="enterprise-button-secondary" type="button" onClick={onCancel}>
            No
          </button>
          <button aria-label={confirmLabel} className="enterprise-button" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
