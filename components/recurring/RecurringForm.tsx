"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colorForLabel } from "@/lib/colors";

type Account = { id: string; name: string };
type Category = { id: string; name: string; icon: string; kind: string };

const FREQUENCIES = [
  { value: "daily", label: "Diaria" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "yearly", label: "Anual" },
];

const TYPES = [
  { value: "expense", label: "Gasto", color: "text-negative" },
  { value: "income", label: "Ingreso", color: "text-positive" },
  { value: "transfer", label: "Transferencia", color: "text-sky-400" },
  { value: "investment", label: "Inversión", color: "text-amber-400" },
];

export default function RecurringForm({
  accounts,
  categories,
  initialData,
}: {
  accounts: Account[];
  categories: Category[];
  initialData?: any;
}) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!initialData;

  const [type, setType] = useState(initialData?.type ?? "income");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [accountId, setAccountId] = useState(initialData?.account_id ?? "");
  const [destinationAccountId, setDestinationAccountId] = useState(
    initialData?.destination_account_id ?? ""
  );
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "");
  const [frequency, setFrequency] = useState(initialData?.frequency ?? "monthly");
  const [dayOfMonth, setDayOfMonth] = useState(
    initialData?.day_of_month?.toString() ?? "1"
  );
  const [startDate, setStartDate] = useState(
    initialData?.start_date ?? new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(initialData?.end_date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsCategory = type === "expense" || type === "income" || type === "investment";
  const needsDestination = type === "transfer";

  const visibleCategories = categories.filter((c) =>
    type === "income" ? c.kind === "income" : c.kind === "expense"
  );

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
      frequency,
      day_of_month: frequency === "monthly" ? parseInt(dayOfMonth) || null : null,
      start_date: startDate,
      end_date: endDate || null,
      is_active: true,
    };

    if (isEdit) {
      await supabase.from("recurring_transactions").update(payload).eq("id", initialData.id);
    } else {
      await supabase.from("recurring_transactions").insert(payload);
    }

    setSaving(false);
    router.push("/recurrentes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
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

      {/* Monto */}
      <div>
        <label className="block text-sm text-muted mb-2">Importe</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          className="w-full bg-surface border border-border rounded-2xl px-4 py-5 text-4xl font-semibold text-white text-center outline-none focus:border-positive money"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm text-muted mb-2">Descripción</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej. Nómina, Alquiler, Netflix..."
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
        />
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

      {/* Frecuencia */}
      <div>
        <label className="block text-sm text-muted mb-2">Frecuencia</label>
        <div className="grid grid-cols-2 gap-2">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFrequency(f.value)}
              className={`rounded-xl px-4 py-3 text-sm font-medium border transition ${
                frequency === f.value
                  ? "border-positive bg-positive/10 text-positive"
                  : "border-border bg-surface text-muted hover:border-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Día del mes (solo mensual) */}
      {frequency === "monthly" && (
        <div>
          <label className="block text-sm text-muted mb-2">Día del mes</label>
          <input
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
          />
          <p className="text-xs text-muted mt-1">Si el mes no tiene ese día, se usará el último día.</p>
        </div>
      )}

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-muted mb-2">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-2">Hasta (opcional)</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-negative/10 border border-negative/30 px-4 py-3 text-sm text-negative">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-positive text-base font-semibold text-black rounded-xl py-4 transition hover:brightness-110 disabled:opacity-50"
      >
        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear recurrente"}
      </button>
    </form>
  );
}
