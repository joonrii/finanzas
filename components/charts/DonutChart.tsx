"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { colorForLabel } from "@/lib/colors";

type CategoryTotal = {
  name: string;
  icon: string;
  total: number;
};

const COLOR_MAP: Record<string, string> = {
  "bg-emerald-500/80": "#10b981",
  "bg-sky-500/80": "#0ea5e9",
  "bg-amber-500/80": "#f59e0b",
  "bg-rose-500/80": "#f43f5e",
  "bg-violet-500/80": "#8b5cf6",
  "bg-orange-500/80": "#f97316",
  "bg-cyan-500/80": "#06b6d4",
  "bg-pink-500/80": "#ec4899",
  "bg-lime-500/80": "#84cc16",
  "bg-teal-500/80": "#14b8a6",
  "bg-indigo-500/80": "#6366f1",
  "bg-red-500/80": "#ef4444",
  "bg-yellow-500/80": "#eab308",
  "bg-green-500/80": "#22c55e",
  "bg-blue-500/80": "#3b82f6",
  "bg-purple-500/80": "#a855f7",
};

function getHexColor(barClass: string): string {
  return COLOR_MAP[barClass] || "#3ECF8E";
}

export function DonutChart({ categories }: { categories: CategoryTotal[] }) {
  if (categories.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <p className="text-sm font-medium text-white mb-1">Gastos por categoría</p>
        <p className="text-zinc-500 text-sm">Todavía no hay gastos este mes.</p>
      </div>
    );
  }

  const total = categories.reduce((sum, c) => sum + c.total, 0);
  const data = categories.map((c) => ({
    name: c.name,
    value: c.total,
    icon: c.icon,
    color: getHexColor(colorForLabel(c.name).bar),
  }));

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white">Gastos por categoría</p>
        <span className="text-xs text-zinc-500">{total.toFixed(2)} €</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-[140px] h-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0a0a0a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  fontSize: 11,
                  color: "#fff",
                }}
                formatter={(value: number) => [`${value.toFixed(2)} €`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {categories.slice(0, 4).map((c) => {
            const color = colorForLabel(c.name);
            const percent = ((c.total / total) * 100).toFixed(0);
            return (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${color.bg}`}>
                    {c.icon}
                  </span>
                  <span className="text-zinc-300 text-[11px]">{c.name}</span>
                </div>
                <span className="text-zinc-400 text-[11px] money">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
