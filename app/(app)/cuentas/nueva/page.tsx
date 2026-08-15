"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AccountType, Provider } from "@/types";

const PRESETS: { label: string; type: AccountType; provider: Provider }[] = [
  { label: "Imagin", type: "bank", provider: "imagin" },
  { label: "Openbank", type: "bank", provider: "openbank" },
  { label: "MyInvestor", type: "investment", provider: "myinvestor" },
  { label: "Efectivo", type: "cash", provider: null },
  { label: "Otra", type: "other", provider: null },
];

export default function NuevaCuentaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [preset, setPreset] = useState(PRESETS[0]);
  const [name, setName] = useState(PRESETS[0].label);
  const [initialBalance, setInitialBalance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function selectPreset(p: (typeof PRESETS)[number]) {
    setPreset(p);
    setName(p.label);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesión no válida, vuelve a entrar.");
      setLoading(false);
      return;
    }

    const balance = initialBalance ? parseFloat(initialBalance) : 0;

    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name,
      type: preset.type,
      provider: preset.provider,
      calculated_balance: balance,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/cuentas");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium">Nueva cuenta</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <p className="text-sm text-muted mb-2">Tipo</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.label}
                onClick={() => selectPreset(p)}
                className={
                  "rounded-xl px-4 py-3 text-sm border " +
                  (preset.label === p.label
                    ? "bg-positive/10 border-positive text-positive"
                    : "bg-surface border-border text-white")
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-muted mb-1 block">
            Nombre de la cuenta
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
          />
        </div>

        <div>
          <label className="text-sm text-muted mb-1 block">
            Saldo actual (opcional, puedes ajustarlo luego)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0,00"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive money"
          />
        </div>

        {error && <p className="text-negative text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-positive text-base font-medium rounded-xl py-3 disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
