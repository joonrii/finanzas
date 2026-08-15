"use client";

import { colorForLabel } from "@/lib/colors";

type CategoryTotal = {
  name: string;
  icon: string;
  total: number;
};

export function CategoryBreakdown({
  categories,
}: {
  categories: CategoryTotal[];
}) {
  if (categories.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <p className="text-sm font-medium text-white mb-1">Gastos por categoría</p>
        <p className="text-zinc-500 text-sm">
          Todavía no hay gastos este mes.
        </p>
      </div>
    );
  }

  const max = Math.max(...categories.map((c) => c.total));
  const total = categories.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white">Gastos por categoría</p>
        <span className="text-xs text-zinc-500">{total.toFixed(2)} € este mes</span>
      </div>
      <div className="flex flex-col gap-3">
        {categories.map((c) => {
          const color = colorForLabel(c.name);
          const percent = ((c.total / total) * 100).toFixed(0);
          return (
            <div key={c.name}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="flex items-center gap-2 text-zinc-300">
                  <span
                    className={
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs " +
                      color.bg
                    }
                  >
                    {c.icon}
                  </span>
                  {c.name}
                </span>
                <span className="text-zinc-400 money">
                  {c.total.toFixed(2)} € ({percent}%)
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={"h-full rounded-full " + color.bar}
                  style={{ width: `${(c.total / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
