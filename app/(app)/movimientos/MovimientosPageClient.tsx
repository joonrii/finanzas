"use client";

import Link from "next/link";
import { useState } from "react";
import { DeleteTransactionButton } from "@/components/transactions/DeleteTransactionButton";
import { Pencil, Download, Receipt, Repeat } from "lucide-react";
import { colorForLabel } from "@/lib/colors";
import type { TransactionType } from "@/types";

interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  merchant: string | null;
  occurred_on: string;
  account_id: string;
  destination_account_id: string | null;
  accounts: { name: string }[] | { name: string } | null;
  categories: { name: string; icon: string }[] | { name: string; icon: string } | null;
}

export default function MovimientosPageClient({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [exporting, setExporting] = useState(false);

  const grouped = groupByDate(transactions);

  function handleExport() {
    setExporting(true);
    const headers = ["Fecha", "Tipo", "Descripcion", "Categoria", "Cuenta", "Importe"];
    const rows = transactions.map((t) => {
      const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
      const acc = Array.isArray(t.accounts) ? t.accounts[0] : t.accounts;
      return [
        t.occurred_on,
        t.type,
        t.merchant || t.description || "",
        cat?.name || "",
        acc?.name || "",
        t.type === "income" ? t.amount : -t.amount,
      ];
    });

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '\\"')}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movimientos_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Movimientos</h1>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-10 text-center">
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
            <div className="relative w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <Receipt className="w-8 h-8 text-zinc-500" />
            </div>
          </div>
          <p className="text-zinc-400 text-sm mb-2">Aun no tienes movimientos.</p>
          <p className="text-zinc-600 text-xs mb-6">Empieza registrando tu primer gasto o ingreso.</p>
          <Link
            href="/movimientos/nuevo"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-6 py-3 text-sm transition-all"
          >
            Anadir movimiento
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Movimientos</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/recurrentes"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 text-xs font-medium px-3 py-2 rounded-lg bg-white/5 border border-white/10 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/20 active:scale-95"
          >
            <Repeat className="w-3.5 h-3.5" />
            Recurrentes
          </Link>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 text-xs font-medium px-3 py-2 rounded-lg bg-white/5 border border-white/10 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exportando..." : "CSV"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">
              {formatDate(date)}
            </p>
            <ul className="flex flex-col gap-2">
              {items.map((t) => {
                const category = Array.isArray(t.categories)
                  ? t.categories[0]
                  : t.categories;
                const account = Array.isArray(t.accounts)
                  ? t.accounts[0]
                  : t.accounts;
                const isPositive =
                  t.type === "income" ||
                  (t.type === "balance_adjustment" && Number(t.amount) > 0);
                const sign =
                  t.type === "balance_adjustment"
                    ? Number(t.amount) >= 0
                      ? "+"
                      : "-"
                    : t.type === "expense" ||
                      t.type === "transfer" ||
                      t.type === "investment"
                    ? "-"
                    : "+";
                const displayAmount =
                  t.type === "balance_adjustment"
                    ? Math.abs(Number(t.amount))
                    : Number(t.amount);

                return (
                  <li
                    key={t.id}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={
                          "w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 " +
                          colorForLabel(category?.name || t.type).bg
                        }
                      >
                        {category?.icon ??
                          (t.type === "transfer"
                            ? "↔"
                            : t.type === "investment"
                            ? "📈"
                            : t.type === "balance_adjustment"
                            ? "⚖"
                            : "💰")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm truncate text-white">
                          {t.type === "balance_adjustment"
                            ? "Ajuste de saldo"
                            : t.merchant ||
                              t.description ||
                              category?.name ||
                              "Movimiento"}
                        </p>
                        <p className="text-zinc-500 text-xs truncate">
                          {account?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <p
                        className={
                          "money text-sm font-medium " +
                          (isPositive ? "text-emerald-400" : "text-white")
                        }
                      >
                        {sign}
                        {displayAmount.toFixed(2)} €
                      </p>
                      <div className="flex items-center gap-1 ml-2">
                        <Link
                          href={`/movimientos/${t.id}`}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 transition-all hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90"
                          aria-label="Editar movimiento"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={2} />
                        </Link>
                        <DeleteTransactionButton
                          id={t.id}
                          accountId={t.account_id}
                          destinationAccountId={t.destination_account_id}
                          type={t.type}
                          amount={Number(t.amount)}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByDate<T extends { occurred_on: string }>(items: T[]) {
  return items.reduce((acc, item) => {
    (acc[item.occurred_on] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}
