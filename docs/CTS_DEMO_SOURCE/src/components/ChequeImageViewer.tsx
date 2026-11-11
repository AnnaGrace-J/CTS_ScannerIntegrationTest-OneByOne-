import { ChevronLeft, ChevronRight, ImageIcon, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChequeItem } from "../types";

type ChequeImageViewerProps = {
  cheques: ChequeItem[];
  selectedId?: string;
  onSelect?: (cheque: ChequeItem) => void;
};

export function ChequeImageViewer({ cheques, selectedId, onSelect }: ChequeImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const selectedIndex = Math.max(
    0,
    cheques.findIndex((item) => item.id === selectedId)
  );
  const selected = cheques[selectedIndex] ?? cheques[0];

  const imageStyle = useMemo(
    () => ({
      transform: `scale(${zoom}) rotate(${rotation}deg)`
    }),
    [rotation, zoom]
  );

  const move = (delta: number) => {
    if (!cheques.length) return;
    const nextIndex = (selectedIndex + delta + cheques.length) % cheques.length;
    onSelect?.(cheques[nextIndex]);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-ace-border bg-white shadow-enterprise">
      <div className="flex items-center justify-between gap-3 border-b border-ace-border bg-white px-4 py-3">
        <div>
          <div className="text-sm font-bold text-ace-primary">Cheque Review Workspace</div>
          <div className="text-xs text-ace-muted">Synthetic front image and signature specimen</div>
        </div>
        <span className="rounded-full border border-ace-border bg-slate-50 px-2 py-1 text-xs font-semibold text-ace-muted">{selected?.id ?? "No cheque"}</span>
      </div>
      <div className="flex min-h-80">
        <div className="flex w-14 flex-col items-center gap-2 border-r border-ace-border bg-slate-50 py-3">
          <button aria-label="Zoom in cheque image" className="enterprise-button-secondary h-8 w-8 p-0" title="Zoom in" type="button" onClick={() => setZoom((value) => Math.min(1.7, value + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </button>
          <button aria-label="Zoom out cheque image" className="enterprise-button-secondary h-8 w-8 p-0" title="Zoom out" type="button" onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </button>
          <button aria-label="Rotate cheque image" className="enterprise-button-secondary h-8 w-8 p-0" title="Rotate" type="button" onClick={() => setRotation((value) => value + 90)}>
            <RotateCw className="h-4 w-4" />
          </button>
          <button aria-label="Previous cheque image" className="enterprise-button-secondary h-8 w-8 p-0" title="Previous" type="button" onClick={() => move(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button aria-label="Next cheque image" className="enterprise-button-secondary h-8 w-8 p-0" title="Next" type="button" onClick={() => move(1)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden bg-[radial-gradient(circle_at_1px_1px,#d8dee6_1px,transparent_0)] bg-[length:18px_18px] p-5">
          {selected ? (
            <div className="rounded-xl border border-ace-border bg-white p-3 shadow-ace transition-transform duration-200" style={imageStyle}>
              <img
                alt="Generated placeholder cheque"
                className="max-h-64 w-[620px] max-w-full rounded border border-slate-300 bg-white"
                src={selected.imageFrontUrl}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-sm text-ace-muted">
              <ImageIcon className="h-8 w-8" aria-hidden="true" />
              No image selected
            </div>
          )}
          <div className="w-full max-w-sm rounded-lg border border-ace-border bg-white p-3 shadow-enterprise">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ace-muted">Signature Specimen</div>
            <img alt="Generated placeholder signature" className="h-16 w-full object-contain" src={selected?.signatureUrl ?? "/placeholders/signature.svg"} />
          </div>
        </div>
      </div>
    </section>
  );
}
