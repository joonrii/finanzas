"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";

interface Recurring {
  id: string;
  description: string;
  amount: number;
  type: string;
  day_of_month: number | null;
  is_active: boolean;
}

export function UpcomingPayments({ recurrings }: { recurrings: Recurring[] }) {
  const active = recurrings.filter((r) => r.is_active);

  if (active.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Próximos pagos</p>
        </div>
        <p className="text-zinc-600 text-xs">No tienes pagos recurrentes.</p>
        <Link href="/recurrentes/nuevo" className="text-emerald-400 text-[11px] mt-2 inline-block hover:underline">
          Crear uno
        </Link>
      </div>
    );
  }

  const today = new Date().getDate();

  const upcoming = active
    .map((r) => {
      const day = r.day_of_month ?? 1;
      let daysUntil = day - today;
      if (daysUntil < 0) daysUntil += 30;
      return { ...r, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
        <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Próximos pagos</p>
      </div>
      <div className="flex flex-col gap-2">
        {upcoming.map((r) => (
          <div key={r.id} className="flex justify-between items-center p-2 bg-white/[0.03] rounded-xl">
            <div>
              <p className="text-white text-[11px] font-medium">{r.description || "Sin nombre"}</p>
              <p className="text-zinc-600 text-[9px]">
                {r.daysUntil === 0 ? "Hoy" : r.daysUntil === 1 ? "Mañana" : `En ${r.daysUntil} días`}
              </p>
            </div>
            <span className={`text-[11px] font-semibold money ${r.type === "income" ? "text-emerald-400" : "text-white"}`}>
              {r.type === "income" ? "+" : "-"}
              {r.amount.toFixed(2)} €
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
