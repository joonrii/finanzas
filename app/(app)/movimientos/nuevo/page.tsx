import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewTransactionForm } from "@/components/transactions/NewTransactionForm";
import { ArrowLeft, Wallet } from "lucide-react";

export default async function NuevoMovimientoPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, provider")
      .eq("is_archived", false)
      .order("created_at"),
    supabase
      .from("categories")
      .select("id, name, icon, kind")
      .eq("is_archived", false)
      .order("sort_order"),
  ]);

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Link
            href="/movimientos"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-zinc-400 transition-all hover:text-white hover:bg-white/10 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Nuevo movimiento</h1>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-10 text-center">
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
            <div className="relative w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-zinc-500" />
            </div>
          </div>
          <p className="text-zinc-400 text-sm mb-6">
            Antes de añadir un movimiento necesitas al menos una cuenta.
          </p>
          <Link
            href="/cuentas/nueva"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-6 py-3 text-sm transition-all"
          >
            Añadir una cuenta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Link
          href="/movimientos"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-zinc-400 transition-all hover:text-white hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Nuevo movimiento</h1>
      </div>
      <NewTransactionForm accounts={accounts} categories={categories ?? []} />
    </div>
  );
}
