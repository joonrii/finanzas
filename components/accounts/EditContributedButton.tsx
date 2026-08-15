"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EditContributedButton({
  accountId,
  currentTotal,
}: {
  accountId: string;
  currentTotal: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentTotal.toFixed(2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const parsed = parseFloat(value.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) {
      setError("Introduce un importe válido.");
      return;
    }
    setError(null);
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión no válida.");
      setSaving(false);
      return;
    }

    const diff = parsed - currentTotal;

    if (Math.abs(diff) >= 0.01) {
      // Solo corrige el histórico de aportaciones, sin tocar el saldo
      // de la cuenta (el valor de cartera ya se gestiona aparte).
      await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: accountId,
        type: "investment",
        amount: diff,
        description: "Ajuste manual de aportaciones previas",
        occurred_on: new Date().toISOString().slice(0, 10),
        source: "manual",
      });
    }

    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        aria-label="Editar total aportado"
        className="text-muted text-xs"
      >
        ✏️
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 bg-surface2 border border-border rounded-lg px-2 py-1 text-xs text-white outline-none money"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-positive text-xs font-medium"
      >
        {saving ? "…" : "OK"}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-muted text-xs"
      >
        ✕
      </button>
      {error && <p className="text-negative text-xs">{error}</p>}
    </div>
  );
}
