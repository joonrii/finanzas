"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { X, Trash2 } from "lucide-react";

export function DeleteAccountButton({ accountId }: { accountId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setLoading(true);

    // Borrar la cuenta (las transacciones quedan huérfanas en la DB,
    // pero como es cuenta de ejemplo no importa. Para producción
    // podrías marcar is_archived = true en su lugar)
    await supabase.from("accounts").delete().eq("id", accountId);

    setLoading(false);
    router.push("/cuentas");
    router.refresh();
    toast("Cuenta eliminada");
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
          Borrar
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
      className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 transition-all duration-200 hover:text-red-400 hover:bg-red-500/10 active:scale-90"
      aria-label="Borrar cuenta"
    >
      <X className="w-4 h-4" strokeWidth={2.5} />
    </button>
  );
}
