import type { ReactNode } from "react";

export function TermTooltip({ children, text }: { children: ReactNode; text: string }) {
  return (
    <span className="cursor-help border-b border-dotted border-slate-500 font-bold text-ace-primary" title={text}>
      {children}
    </span>
  );
}
