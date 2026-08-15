import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Landmark, Plus } from "lucide-react";

const PROVIDER_LABEL: Record<string, string> = {
  imaginn: "🏦",
  openbank: "🏦",
  myinvestor: "📈",
};

export default async function CuentasPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type, provider, calculated_balance, real_balance")
    .eq("is_archived", false)
    .order("created_at");

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Cuentas</h1>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-10 text-center">
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
            <div className="relative w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <Landmark className="w-8 h-8 text-zinc-500" />
            </div>
          </div>
          <p className="text-white text-sm font-medium mb-1">Todavia no has anadido ninguna cuenta</p>
          <p className="text-zinc-500 text-xs mb-6">Anade tu cuenta bancaria, de ahorros o de inversion.</p>
          <Link
            href="/cuentas/nueva"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-6 py-3 text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Anadir primera cuenta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Cuentas</h1>
        <Link
          href="/cuentas/nueva"
          className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Anadir
        </Link>
      </div>

      <ul className="flex flex-col gap-2">
        {accounts.map((a) => {
          const balance = a.calculated_balance;
          return (
            <li key={a.id}>
              <Link
                href={`/cuentas/${a.id}`}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 flex justify-between items-center transition-all hover:bg-white/[0.04] active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {PROVIDER_LABEL[a.provider ?? ""] ??
                      (a.type === "cash" ? "💵" : "🏛")}
                  </span>
                  <p className="text-sm text-white">{a.name}</p>
                </div>
                <p className="money text-sm font-medium text-white">
                  {Number(balance).toFixed(2)} €
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
