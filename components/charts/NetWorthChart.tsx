"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
    // Si el rango no tiene suficientes puntos, incluye al menos el último
    // punto anterior para que la línea no empiece de la nada.
    if (inRange.length === series.length) return series;
    const firstIndex = series.findIndex((p) => p.date >= cutoffStr);
    return firstIndex > 0 ? series.slice(firstIndex - 1) : inRange;
  }, [series, range]);

  if (series.length < 2) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-sm font-medium mb-1">Evolución del patrimonio</p>
        <p className="text-muted text-sm">
          Registra movimientos durante unos días para ver aquí la evolución.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">Evolución del patrimonio</p>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r)}
              className={clsx(
                "text-[11px] px-2 py-1 rounded-lg",
                range.label === r.label
                  ? "bg-positive/10 text-positive"
                  : "text-muted"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered}>
            <XAxis
              dataKey="date"
              tick={{ fill: "#8B939C", fontSize: 10 }}
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
            <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
            <Tooltip
              contentStyle={{
                background: "#1D2126",
                border: "1px solid #262B31",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(d: string) =>
                new Date(d + "T00:00:00").toLocaleDateString("es-ES")
              }
              formatter={(value: number) => [`${value.toFixed(2)} €`, ""]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3ECF8E"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
