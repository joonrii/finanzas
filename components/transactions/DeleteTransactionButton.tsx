"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TransactionType } from "@/types";
import { toast } from "@/lib/toast";
import { X, Trash2 } from "lucide-react";

export function DeleteTransactionButton({ id }: {
  id: string;
  accountId: string;
  destinationAccountId: string | null;
  type: TransactionType;
  amount: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión no válida.");
      setLoading(false);
      return;
    }

    const { error: deleteError } = await supabase.rpc("delete_financial_transaction", {
      p_transaction_id: id,
      p_user_id: user.id,
    });

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
    toast("Movimiento eliminado");
  }

  if (confirming) {
    return <div className="flex items-center gap-2 animate-fade-in-up">
      <button onClick={handleDelete} disabled={loading} className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-red-500/20 active:scale-95">
        {loading ? <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Borrar
      </button>
      <button onClick={() => setConfirming(false)} className="text-zinc-500 text-xs font-medium px-2 py-1.5 transition-colors hover:text-zinc-300">Cancelar</button>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>;
  }

  return <button onClick={() => setConfirming(true)} className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 transition-all duration-200 hover:text-red-400 hover:bg-red-500/10 active:scale-90" aria-label="Borrar movimiento">
    <X className="w-4 h-4" strokeWidth={2.5} />
  </button>;
}
