"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import type { Account, Category, TransactionType } from "@/types";

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transferencia" },
  { value: "investment", label: "Inversión" },
];

export function NewTransactionForm({
  accounts,
  categories,
}: {
  accounts: Pick<Account, "id" | "name" | "type" | "provider">[];
  categories: Category[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [destinationAccountId, setDestinationAccountId] = useState(
    accounts[1]?.id ?? ""
  );
  const [date, setDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsCategory = type === "expense" || type === "income";
  const needsDestination = type === "transfer" || type === "investment";

  const visibleCategories = useMemo(
    () =>
      categories.filter((c) =>
        type === "income" ? c.kind === "income" : c.kind === "expense"
      ),
    [categories, type]
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
      setError("La cuenta de destino debe ser distinta de la de origen.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesión no válida, vuelve a entrar.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: user.id,
      account_id: accountId,
      destination_account_id: needsDestination ? destinationAccountId : null,
      type,
      category_id: needsCategory ? categoryId : null,
      amount: parsedAmount,
      description: description || null,
      occurred_on: date,
      source: "manual",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Actualiza el saldo calculado de la(s) cuenta(s) implicadas
    await applyBalanceChange(
      supabase,
      accountId,
      type === "expense" || type === "transfer" || type === "investment"
        ? -parsedAmount
        : parsedAmount
    );

    if (needsDestination) {
      await applyBalanceChange(supabase, destinationAccountId, parsedAmount);
    }

    setLoading(false);
    router.push("/movimientos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          className="w-full bg-surface border border-border rounded-2xl px-4 py-5 text-4xl font-semibold text-white text-center outline-none focus:border-positive money"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TYPES.map((t) => (
          <button
            type="button"
            key={t.value}
            onClick={() => setType(t.value)}
            className={clsx(
              "rounded-xl py-2.5 text-xs font-medium border",
              type === t.value
                ? "bg-positive/10 border-positive text-positive"
                : "bg-surface border-border text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {needsCategory && (
        <div>
          <p className="text-sm text-muted mb-2">Categoría</p>
          <div className="grid grid-cols-4 gap-2">
            {visibleCategories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-xl py-3 border text-[11px]",
                  categoryId === c.id
                    ? "bg-positive/10 border-positive text-positive"
                    : "bg-surface border-border text-muted"
                )}
              >
                <span className="text-lg">{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-sm text-muted mb-1 block">
          {needsDestination ? "Cuenta de origen" : "Cuenta"}
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {needsDestination && (
        <div>
          <label className="text-sm text-muted mb-1 block">
            Cuenta de destino
          </label>
          <select
            value={destinationAccountId}
            onChange={(e) => setDestinationAccountId(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm text-muted mb-1 block">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
        />
      </div>

      <div>
        <label className="text-sm text-muted mb-1 block">
          Descripción (opcional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej. Cena con amigos"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
        />
      </div>

      {error && <p className="text-negative text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-positive text-base font-medium rounded-xl py-3 disabled:opacity-50"
      >
        {loading ? "Guardando…" : "Guardar movimiento"}
      </button>
    </form>
  );
}

async function applyBalanceChange(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  delta: number
) {
  const { data: account } = await supabase
    .from("accounts")
    .select("calculated_balance")
    .eq("id", accountId)
    .single();

  if (!account) return;

  await supabase
    .from("accounts")
    .update({
      calculated_balance: Number(account.calculated_balance) + delta,
    })
    .eq("id", accountId);
}
