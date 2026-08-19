"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { colorForLabel } from "@/lib/colors";
import { toast } from "@/lib/toast";
import { ArrowLeft, Save } from "lucide-react";
import type { Account, Category, TransactionType } from "@/types";

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transferencia" },
  { value: "investment", label: "Inversión" },
];

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  merchant: string | null;
  occurred_on: string;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
}

export function EditTransactionForm({ transaction, accounts, categories }: {
  transaction: Transaction;
  accounts: Pick<Account, "id" | "name" | "type" | "provider">[];
  categories: Category[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [categoryId, setCategoryId] = useState<string | null>(transaction.category_id);
  const [accountId, setAccountId] = useState(transaction.account_id);
  const [destinationAccountId, setDestinationAccountId] = useState(transaction.destination_account_id ?? (accounts[1]?.id ?? ""));
  const [date, setDate] = useState(transaction.occurred_on);
  const [description, setDescription] = useState(transaction.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsCategory = type === "expense" || type === "income";
  const needsDestination = type === "transfer" || type === "investment";
  const visibleCategories = categories.filter((c) => type === "income" ? c.kind === "income" : c.kind === "expense");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Introduce un importe válido."); return;
    }
    if (!accountId) { setError("Selecciona una cuenta."); return; }
    if (needsDestination && (!destinationAccountId || destinationAccountId === accountId)) {
      setError("La cuenta de destino debe ser distinta."); return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sesión no válida."); setLoading(false); return; }

    const { error: updateError } = await supabase.rpc("update_financial_transaction", {
      p_transaction_id: transaction.id,
      p_user_id: user.id,
      p_account_id: accountId,
      p_destination_account_id: needsDestination ? destinationAccountId : null,
      p_type: type,
      p_category_id: needsCategory ? categoryId : null,
      p_amount: parsedAmount,
      p_description: description,
      p_merchant: description,
      p_occurred_on: date,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/movimientos");
    router.refresh();
    toast("Movimiento actualizado");
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Link href="/movimientos" className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-zinc-400 transition-all hover:text-white hover:bg-white/10 active:scale-95"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-semibold text-white">Editar movimiento</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <input type="number" inputMode="decimal" step="0.01" required autoFocus placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-5 text-4xl font-semibold text-white text-center outline-none transition-all focus:border-emerald-500/40 focus:ring-[3px] focus:ring-emerald-500/10 money" />

        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((t) => <button type="button" key={t.value} onClick={() => setType(t.value)}
            className={clsx("rounded-xl py-2.5 text-xs font-medium border transition-all", type === t.value ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-zinc-500")}>{t.label}</button>)}
        </div>

        <div><label className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">Descripción / comercio</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Mercadona, cena con amigos…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/40 focus:ring-[3px] focus:ring-emerald-500/10" /></div>

        {needsCategory && <div><p className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">Categoría</p>
          <div className="grid grid-cols-4 gap-2">{visibleCategories.map((c) => { const color = colorForLabel(c.name); return <button type="button" key={c.id} onClick={() => setCategoryId(c.id)}
            className={clsx("flex flex-col items-center gap-1 rounded-xl py-3 border text-[11px] transition-all", categoryId === c.id ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-zinc-500")}>
            <span className={"w-7 h-7 rounded-full flex items-center justify-center text-sm " + color.bg}>{c.icon}</span>{c.name}</button>; })}</div></div>}

        <div><label className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">{needsDestination ? "Cuenta de origen" : "Cuenta"}</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-emerald-500/40 appearance-none">{accounts.map((a) => <option key={a.id} value={a.id} className="bg-[#0a0a0a]">{a.name}</option>)}</select></div>

        {needsDestination && <div><label className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">Cuenta de destino</label>
          <select value={destinationAccountId} onChange={(e) => setDestinationAccountId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-emerald-500/40 appearance-none">{accounts.map((a) => <option key={a.id} value={a.id} className="bg-[#0a0a0a]">{a.name}</option>)}</select></div>}

        <div><label className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-emerald-500/40" /></div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{error}</p></div>}
        <button type="submit" disabled={loading} className="group relative w-full overflow-hidden rounded-xl py-4 font-bold text-black transition-all disabled:opacity-60">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-[length:200%_auto]" />
          <span className="relative flex items-center justify-center gap-2 text-base">{loading ? "Guardando..." : <><Save className="w-4 h-4" />Guardar cambios</>}</span>
        </button>
      </form>
    </div>
  );
}
