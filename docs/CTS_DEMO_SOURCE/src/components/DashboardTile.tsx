import { Link } from "react-router-dom";
import type { WorkflowTile } from "../types";

const toneClasses: Record<WorkflowTile["tone"], string> = {
  blue: "border-blue-500 bg-blue-50 text-blue-900",
  green: "border-emerald-500 bg-emerald-50 text-emerald-900",
  amber: "border-amber-500 bg-amber-50 text-amber-950",
  red: "border-red-500 bg-red-50 text-red-900",
  gray: "border-slate-400 bg-slate-50 text-slate-800"
};

export function DashboardTile({ tile }: { tile: WorkflowTile }) {
  return (
    <Link
      className={`block min-h-24 border-l-4 p-3 shadow-enterprise hover:outline hover:outline-2 hover:outline-blue-300 ${toneClasses[tile.tone]}`}
      to={tile.route}
    >
      <div className="text-2xl font-bold">{tile.count}</div>
      <div className="mt-2 text-sm font-bold">{tile.label}</div>
      <div className="mt-1 text-xs text-slate-600">Open workitems</div>
    </Link>
  );
}
