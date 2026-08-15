"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { Trash2, X } from "lucide-react";

export function DeleteAccountButton({ accountId }: { accountId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setLoading(true);

    // 1. Borrar transacciones asociadas a esta cuenta
    await supabase
      .from("transactions")
      .delete()
      .eq("account_id", accountId);

    // 2. Borrar transacciones donde esta cuenta es destino
    await supabase
      .from("transactions")
      .delete()
      .eq("destination_account_id", accountId);

    // 3. Borrar snapshots de saldo
    await supabase
      .from("balance_snapshots")
      .delete()
      .eq("account_id", accountId);

    // 4. Borrar la cuenta
    await supabase
      .from("accounts")
      .delete()
      .eq("id", accountId);

    setLoading(false);
    toast("Cuenta eliminada");
    router.push("/cuentas");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 animate-fade-in-up">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-red-500/20 active:scale-95"
        >
          {loading ? (
            <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          Borrar cuenta
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-zinc-500 text-xs font-medium px-2 py-1.5 transition-colors hover:text-zinc-300"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 text-xs font-medium px-3 py-2 rounded-lg bg-white/5 border border-white/10 transition-all hover:bg-red-500/10 hover:border-red-500/20 active:scale-95"
      aria-label="Borrar cuenta"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Borrar
    </button>
  );
}
