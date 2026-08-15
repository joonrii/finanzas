"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

type MonthData = {
  month: string;
  income: number;
  expense: number;
};

export function MonthlyBarChart({ data }: { data: MonthData[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <p className="text-sm font-medium text-white mb-1">Gastos por mes</p>
        <p className="text-zinc-500 text-sm">
          Registra movimientos para ver el histórico mensual.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white">Últimos meses</p>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
            Ingresos
          </span>
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-red-500/60" />
            Gastos
          </span>
        </div>
      </div>

      <div className="h-48 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <XAxis
              dataKey="month"
              tick={{ fill: "#52525b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              hide
              domain={[0, "dataMax + 100"]}
            />
            <Tooltip
              contentStyle={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                fontSize: 12,
                color: "#fff",
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)} €`,
                name === "income" ? "Ingresos" : "Gastos",
              ]}
            />
            <Bar dataKey="income" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {data.map((_, i) => (
                <Cell key={`inc-${i}`} fill="rgba(16,185,129,0.5)" />
              ))}
            </Bar>
            <Bar dataKey="expense" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {data.map((_, i) => (
                <Cell key={`exp-${i}`} fill="rgba(239,68,68,0.5)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
