"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { colorForLabel } from "@/lib/colors";
import { toast } from "@/lib/toast";
import { ArrowLeft, Save } from "lucide-react";
import type { Account, Category, TransactionType } from "@/types";

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transferencia" },
  { value: "investment", label: "Inversión" },
];

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  merchant: string | null;
  occurred_on: string;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
}

export function EditTransactionForm({
  transaction,
  accounts,
  categories,
}: {
  transaction: Transaction;
  accounts: Pick<Account, "id" | "name" | "type" | "provider">[];
  categories: Category[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [categoryId, setCategoryId] = useState<string | null>(
    transaction.category_id
  );
  const [accountId, setAccountId] = useState(transaction.account_id);
  const [destinationAccountId, setDestinationAccountId] = useState(
    transaction.destination_account_id ?? (accounts[1]?.id ?? "")
  );
  const [date, setDate] = useState(transaction.occurred_on);
  const [description, setDescription] = useState(
    transaction.description ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsCategory = type === "expense" || type === "income";
  const needsDestination = type === "transfer" || type === "investment";

  const visibleCategories = categories.filter((c) =>
    type === "income" ? c.kind === "income" : c.kind === "expense"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Introduce un importe válido.");
      return;
    }
    if (needsDestination && destinationAccountId === accountId) {
      setError("La cuenta de destino debe ser distinta.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión no válida.");
      setLoading(false);
      return;
    }

    // 1. Revertir el balance del movimiento original
    await revertOriginalBalance(transaction);

    // 2. Borrar el movimiento original
    await supabase.from("transactions").delete().eq("id", transaction.id);

    // 3. Insertar el movimiento actualizado
    const { error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: accountId,
        destination_account_id: needsDestination
          ? destinationAccountId
          : null,
        type,
        category_id: needsCategory ? categoryId : null,
        amount: parsedAmount,
        description: description || null,
        merchant: description || null,
        occurred_on: date,
        source: "manual",
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // 4. Aplicar el nuevo balance
    await applyBalanceChange(
      accountId,
      type === "expense" || type === "transfer" || type === "investment"
        ? -parsedAmount
        : parsedAmount
    );
    if (needsDestination) {
      await applyBalanceChange(destinationAccountId, parsedAmount);
    }

    setLoading(false);
    router.push("/movimientos");
    router.refresh();
    toast("Movimiento actualizado");
  }

  async function revertOriginalBalance(tx: Transaction) {
    const revert =
      tx.type === "expense" || tx.type === "transfer" || tx.type === "investment"
        ? tx.amount
        : -tx.amount;
    await applyBalanceChange(tx.account_id, revert);
    if (tx.destination_account_id) {
      await applyBalanceChange(tx.destination_account_id, -tx.amount);
    }
  }

  async function applyBalanceChange(accId: string, delta: number) {
    const { data: acc } = await supabase
      .from("accounts")
      .select("calculated_balance")
      .eq("id", accId)
      .single();
    if (!acc) return;
    await supabase
      .from("accounts")
      .update({
        calculated_balance: Number(acc.calculated_balance) + delta,
      })
      .eq("id", accId);
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header con vuelta atrás */}
      <div className="flex items-center gap-3">
        <Link
          href="/movimientos"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-zinc-400 transition-all hover:text-white hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold text-white">
          Editar movimiento
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Importe */}
        <div>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            autoFocus
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-5 text-4xl font-semibold text-white text-center outline-none transition-all focus:border-emerald-500/40 focus:ring-[3px] focus:ring-emerald-500/10 money"
          />
        </div>

        {/* Tipo */}
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setType(t.value)}
              className={clsx(
                "rounded-xl py-2.5 text-xs font-medium border transition-all",
                type === t.value
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 text-zinc-500"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Descripción */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">
            Descripción / comercio
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Mercadona, cena con amigos…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/40 focus:ring-[3px] focus:ring-emerald-500/10"
          />
        </div>

        {/* Categoría */}
        {needsCategory && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">
              Categoría
            </p>
            <div className="grid grid-cols-4 gap-2">
              {visibleCategories.map((c) => {
                const color = colorForLabel(c.name);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={clsx(
                      "flex flex-col items-center gap-1 rounded-xl py-3 border text-[11px] transition-all",
                      categoryId === c.id
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-white/5 border-white/10 text-zinc-500"
                    )}
                  >
                    <span
                      className={
                        "w-7 h-7 rounded-full flex items-center justify-center text-sm " +
                        color.bg
                      }
                    >
                      {c.icon}
                    </span>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cuenta origen */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">
            {needsDestination ? "Cuenta de origen" : "Cuenta"}
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none transition-all focus:border-emerald-500/40 focus:ring-[3px] focus:ring-emerald-500/10 appearance-none"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#0a0a0a]">
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cuenta destino */}
        {needsDestination && (
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">
              Cuenta de destino
            </label>
            <select
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none transition-all focus:border-emerald-500/40 focus:ring-[3px] focus:ring-emerald-500/10 appearance-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#0a0a0a]">
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Fecha */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none transition-all focus:border-emerald-500/40 focus:ring-[3px] focus:ring-emerald-500/10"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Botón guardar */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl py-4 font-bold text-black transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-[length:200%_auto] transition-all duration-500 group-hover:bg-[length:300%_auto]" />
          <span className="relative flex items-center justify-center gap-2 text-base">
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar cambios
              </>
            )}
          </span>
        </button>
      </form>
    </div>
  );
}
