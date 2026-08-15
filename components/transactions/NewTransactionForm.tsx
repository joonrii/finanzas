"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colorForLabel } from "@/lib/colors";
import { suggestCategory, learnFromMerchant } from "@/lib/categorizer";
import TagInput from "@/components/tags/TagInput";

const TYPES = [
  { value: "expense", label: "Gasto", color: "text-negative" },
  { value: "income", label: "Ingreso", color: "text-positive" },
  { value: "transfer", label: "Transferencia", color: "text-sky-400" },
  { value: "investment", label: "Inversión", color: "text-amber-400" },
];

type Account = { id: string; name: string };
type Category = { id: string; name: string; icon: string; kind: string };

export default function NewTransactionForm({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const needsCategory = type === "expense" || type === "income" || type === "investment";
  const needsDestination = type === "transfer";

  const visibleCategories = categories.filter((c) =>
    type === "income" ? c.kind === "income" : c.kind === "expense"
  );

  async function handleDescriptionBlur() {
    if (!description.trim() || !needsCategory) return;
    const suggestion = await suggestCategory(supabase, description, categories);
    if (suggestion.categoryId && suggestion.source) {
      setCategoryId(suggestion.categoryId);
      if (suggestion.accountId && !accountId) {
        setAccountId(suggestion.accountId);
      }
      setSuggestionNote(
        suggestion.source === "rule"
          ? "Categoría sugerida por una regla tuya"
          : "Categoría sugerida automáticamente"
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Introduce un importe válido.");
      return;
    }
    if (!accountId) {
      setError("Selecciona una cuenta.");
      return;
    }
    if (needsDestination && !destinationAccountId) {
      setError("Selecciona una cuenta de destino.");
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión no válida.");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      account_id: accountId,
      destination_account_id: needsDestination ? destinationAccountId : null,
      category_id: needsCategory ? categoryId || null : null,
      type,
      amount: parsedAmount,
      description: description || null,
      merchant: description ? description.toUpperCase().slice(0, 40) : null,
      occurred_on: date,
      source: "manual" as const,
    };

    const { data, error: insertError } = await supabase
      .from("transactions")
      .insert(payload)
      .select();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const newTransactionId = data?.[0]?.id;

    // Guardar tags si hay
    if (selectedTagIds.length > 0 && newTransactionId) {
      const tagRelations = selectedTagIds.map((tagId) => ({
        transaction_id: newTransactionId,
        tag_id: tagId,
      }));
      await supabase.from("transaction_tags").insert(tagRelations);
    }

    // Aprender de esta categorización
    if (needsCategory && categoryId && description) {
      await learnFromMerchant(supabase, user.id, description, categoryId, accountId);
    }

    setSaving(false);
    router.push("/movimientos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Monto */}
      <div>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          className="w-full bg-surface border border-border rounded-2xl px-4 py-5 text-4xl font-semibold text-white text-center outline-none focus:border-positive money"
        />
      </div>

      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setType(t.value);
              setCategoryId("");
            }}
            className={`rounded-xl px-4 py-3 text-sm font-medium border transition ${
              type === t.value
                ? "border-positive bg-positive/10 text-positive"
                : "border-border bg-surface text-muted hover:border-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm text-muted mb-2">Descripción / comercio</label>
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
          <p className="text-xs text-positive mt-1.5 flex items-center gap-1">
            ✨ {suggestionNote}
          </p>
        )}
      </div>

      {/* Categoría */}
      {needsCategory && (
        <div>
          <label className="block text-sm text-muted mb-2">Categoría</label>
          <div className="grid grid-cols-2 gap-2">
            {visibleCategories.map((c) => {
              const color = colorForLabel(c.name);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm border transition ${
                    categoryId === c.id
                      ? "border-positive bg-positive/10"
                      : "border-border bg-surface hover:border-muted"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${color.bg} ${color.text}`}>
                    {c.icon}
                  </span>
                  <span className="text-white">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cuenta origen */}
      <div>
        <label className="block text-sm text-muted mb-2">
          {needsDestination ? "Cuenta de origen" : "Cuenta"}
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
        >
          <option value="">Selecciona...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Cuenta destino */}
      {needsDestination && (
        <div>
          <label className="block text-sm text-muted mb-2">Cuenta de destino</label>
          <select
            value={destinationAccountId}
            onChange={(e) => setDestinationAccountId(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
          >
            <option value="">Selecciona...</option>
            {accounts
              .filter((a) => a.id !== accountId)
              .map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
          </select>
        </div>
      )}

      {/* Fecha */}
      <div>
        <label className="block text-sm text-muted mb-2">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
        />
      </div>

      {/* Tags - NUEVO */}
      <TagInput onTagsChange={setSelectedTagIds} />

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-negative/10 border border-negative/30 px-4 py-3 text-sm text-negative">
          {error}
        </div>
      )}

      {/* Botón */}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-positive text-base font-semibold text-black rounded-xl py-4 transition hover:brightness-110 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar movimiento"}
      </button>
    </form>
  );
}
