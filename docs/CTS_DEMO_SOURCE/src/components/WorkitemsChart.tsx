import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WorkitemPoint } from "../types";

export function WorkitemsChart({ data }: { data: WorkitemPoint[] }) {
  return (
    <section className="enterprise-panel h-full min-h-80">
      <div className="enterprise-header">Workitems</div>
      <div className="h-72 p-3">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 10, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={70} />
            <Tooltip />
            <Legend />
            <Bar dataKey="outward" fill="#1d5fa7" name="Outward" />
            <Bar dataKey="inward" fill="#00927f" name="Inward" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
