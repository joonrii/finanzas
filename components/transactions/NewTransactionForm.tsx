"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { suggestCategory, learnFromMerchant } from "@/lib/categorizer";
import { colorForLabel } from "@/lib/colors";
import { toast } from "@/lib/toast";
import TagInput from "@/components/tags/TagInput";
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
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const needsCategory = type === "expense" || type === "income";
  const needsDestination = type === "transfer" || type === "investment";

  async function handleDescriptionBlur() {
    if (!description.trim() || categoryId) return;
    const suggestion = await suggestCategory(supabase, description, categories);
    if (suggestion.categoryId) {
      setCategoryId(suggestion.categoryId);
      if (suggestion.accountId) setAccountId(suggestion.accountId);
      setSuggestionNote(
        suggestion.source === "rule"
          ? "Sugerido a partir de movimientos anteriores"
          : "Sugerido automáticamente"
      );
    }
  }

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

    const { data: inserted, error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: accountId,
        destination_account_id: needsDestination ? destinationAccountId : null,
        type,
        category_id: needsCategory ? categoryId : null,
        amount: parsedAmount,
        description: description || null,
        merchant: description || null,
        occurred_on: date,
        source: "manual",
      })
      .select();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Guardar tags
    if (inserted && inserted[0] && selectedTagIds.length > 0) {
      await supabase.from("transaction_tags").insert(
        selectedTagIds.map((tagId) => ({
          transaction_id: inserted[0].id,
          tag_id: tagId,
        }))
      );
    }

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

    if (needsCategory && categoryId && description.trim()) {
      await learnFromMerchant(
        supabase,
        user.id,
        description,
        categoryId,
        accountId
      );
    }

    setLoading(false);
    router.push("/movimientos");
    router.refresh();
    toast("Movimiento guardado");
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

      <div>
        <label className="text-sm text-muted mb-1 block">
          Descripción / comercio
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSuggestionNote(null);
          }}
          onBlur={handleDescriptionBlur}
          placeholder="Ej. Mercadona, cena con amigos…"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
        />
        {suggestionNote && (
          <p className="text-positive text-xs mt-1">✨ {suggestionNote}</p>
        )}
      </div>

      {needsCategory && (
        <div>
          <p className="text-sm text-muted mb-2">Categoría</p>
          <div className="grid grid-cols-4 gap-2">
            {visibleCategories.map((c) => {
              const color = colorForLabel(c.name);
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    setCategoryId(c.id);
                    setSuggestionNote(null);
                  }}
                  className={clsx(
                    "flex flex-col items-center gap-1 rounded-xl py-3 border text-[11px]",
                    categoryId === c.id
                      ? "bg-positive/10 border-positive text-positive"
                      : "bg-surface border-border text-muted"
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

      <TagInput onTagsChange={setSelectedTagIds} />

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
