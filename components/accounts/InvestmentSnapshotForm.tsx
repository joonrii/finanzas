"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function InvestmentSnapshotForm({
  accountId,
  calculatedBalance,
}: {
  accountId: string;
  calculatedBalance: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState(calculatedBalance.toFixed(2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseFloat(value.replace(",", "."));
  const diff = isNaN(parsed) ? 0 : parsed - calculatedBalance;
  const hasDiff = Math.abs(diff) >= 0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isNaN(parsed)) {
      setError("Introduce un valor válido.");
      return;
    }
    setError(null);
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión no válida, vuelve a entrar.");
      setSaving(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (hasDiff) {
      await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: accountId,
        type: "balance_adjustment",
        amount: diff,
        description: "Actualización valor de cartera",
        occurred_on: today,
        source: "manual",
      });

      await supabase
        .from("accounts")
        .update({ calculated_balance: calculatedBalance + diff })
        .eq("id", accountId);
    }

    await supabase.from("investment_snapshots").insert({
      user_id: user.id,
      account_id: accountId,
      portfolio_value: parsed,
      snapshot_date: today,
    });

    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-sm text-muted mb-1 block">
          Valor actual de la cartera (el que ves en MyInvestor)
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive money"
        />
      </div>

      {hasDiff && (
        <p
          className={
            "text-sm " + (diff > 0 ? "text-positive" : "text-negative")
          }
        >
          {diff > 0 ? "📈" : "📉"} Diferencia de {diff > 0 ? "+" : ""}
          {diff.toFixed(2)} € respecto al valor anterior registrado.
        </p>
      )}

      {error && <p className="text-negative text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-positive text-base font-medium rounded-xl py-3 disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Actualizar valor de cartera"}
      </button>
    </form>
  );
}
