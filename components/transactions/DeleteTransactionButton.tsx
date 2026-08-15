"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TransactionType } from "@/types";

export function DeleteTransactionButton({
  id,
  accountId,
  destinationAccountId,
  type,
  amount,
}: {
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

  async function handleDelete() {
    setLoading(true);

    // Revertir el efecto original en el saldo antes de borrar
    const revertOrigin =
      type === "expense" || type === "transfer" || type === "investment"
        ? amount
        : -amount;

    await adjustBalance(accountId, revertOrigin);
    if (destinationAccountId) {
      await adjustBalance(destinationAccountId, -amount);
    }

    await supabase.from("transactions").delete().eq("id", id);

    setLoading(false);
    router.refresh();
  }

  async function adjustBalance(accId: string, delta: number) {
    const { data: acc } = await supabase
      .from("accounts")
      .select("calculated_balance")
      .eq("id", accId)
      .single();
    if (!acc) return;
    await supabase
      .from("accounts")
      .update({ calculated_balance: Number(acc.calculated_balance) + delta })
      .eq("id", accId);
  }

  if (confirming) {
    return (
      <div className="flex gap-2 items-center">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-negative text-xs font-medium"
        >
          {loading ? "…" : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-muted text-xs"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-muted text-xs shrink-0 ml-3"
      aria-label="Borrar movimiento"
    >
      ✕
    </button>
  );
}
