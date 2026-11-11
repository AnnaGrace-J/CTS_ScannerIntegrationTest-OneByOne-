import type { ReactNode } from "react";

type OperationsLayoutProps = {
  children: ReactNode;
  rail?: ReactNode;
  density?: "compact" | "comfortable";
};

export function OperationsLayout({ children, density = "comfortable", rail }: OperationsLayoutProps) {
  return (
    <div className={density === "compact" ? "space-y-3 text-ace-text" : "space-y-4 text-ace-text"}>
      {rail ? <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">{children}<aside>{rail}</aside></div> : children}
    </div>
  );
}
