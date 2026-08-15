"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import clsx from "clsx";

type Point = { date: string; value: number };

const RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1A", days: 365 },
  { label: "Todo", days: Infinity },
];

export function NetWorthChart({ series }: { series: Point[] }) {
  const [range, setRange] = useState(RANGES[1]);

  const filtered = useMemo(() => {
    if (series.length === 0) return [];
    if (range.days === Infinity) return series;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const inRange = series.filter((p) => p.date >= cutoffStr);
    if (inRange.length === series.length) return series;
    const firstIndex = series.findIndex((p) => p.date >= cutoffStr);
    return firstIndex > 0 ? series.slice(firstIndex - 1) : inRange;
  }, [series, range]);

  if (series.length < 2) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <p className="text-sm font-medium text-white mb-1">Evolución del patrimonio</p>
        <p className="text-zinc-500 text-sm">
          Registra movimientos durante unos días para ver la evolución.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white">Evolución del patrimonio</p>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r)}
              className={clsx(
                "text-[11px] px-2 py-1 rounded-lg transition-all",
                range.label === r.label
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "#52525b", fontSize: 10 }}
              tickFormatter={(d: string) =>
                new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                })
              }
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              hide
              domain={["dataMin - 50", "dataMax + 50"]}
            />
            <Tooltip
              contentStyle={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                fontSize: 12,
                color: "#fff",
              }}
              labelFormatter={(d: string) =>
                new Date(d + "T00:00:00").toLocaleDateString("es-ES")
              }
              formatter={(value: number) => [`${value.toFixed(2)} €`, ""]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#netWorthFill)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
