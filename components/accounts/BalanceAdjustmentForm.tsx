"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function BalanceAdjustmentForm({
  accountId,
  calculatedBalance,
}: {
  accountId: string;
  calculatedBalance: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [realBalance, setRealBalance] = useState(calculatedBalance.toFixed(2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseFloat(realBalance.replace(",", "."));
  const diff = isNaN(parsed) ? 0 : parsed - calculatedBalance;
  const hasDiff = Math.abs(diff) >= 0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isNaN(parsed)) {
      setError("Introduce un saldo válido.");
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

    // Solo se crea un movimiento de ajuste si de verdad hay diferencia,
    // y no se toca ningún movimiento anterior.
    if (hasDiff) {
      await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: accountId,
        type: "balance_adjustment",
        amount: diff,
        description: "Ajuste de saldo",
        occurred_on: today,
        source: "manual",
      });

      await supabase
        .from("accounts")
        .update({
          calculated_balance: calculatedBalance + diff,
        })
        .eq("id", accountId);
    }

    await supabase.from("accounts").update({
      real_balance: parsed,
      real_balance_updated_at: new Date().toISOString(),
    }).eq("id", accountId);

    await supabase.from("balance_snapshots").insert({
      user_id: user.id,
      account_id: accountId,
      balance: parsed,
      snapshot_date: today,
    });

    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-sm text-muted mb-1 block">
          Saldo real (el que ves en el banco ahora mismo)
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={realBalance}
          onChange={(e) => setRealBalance(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive money"
        />
      </div>

      {hasDiff && (
        <p
          className={
            "text-sm " + (diff > 0 ? "text-positive" : "text-negative")
          }
        >
          ⚠️ Existe una diferencia de {diff > 0 ? "+" : ""}
          {diff.toFixed(2)} € respecto al saldo calculado.
        </p>
      )}

      {error && <p className="text-negative text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-positive text-base font-medium rounded-xl py-3 disabled:opacity-50"
      >
        {saving ? "Guardando…" : hasDiff ? "Cuadrar saldo" : "Guardar"}
      </button>
    </form>
  );
}
