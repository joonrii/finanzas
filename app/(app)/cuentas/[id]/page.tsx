import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BalanceAdjustmentForm } from "@/components/accounts/BalanceAdjustmentForm";
import { InvestmentSnapshotForm } from "@/components/accounts/InvestmentSnapshotForm";
import { EditContributedButton } from "@/components/accounts/EditContributedButton";
import { DeleteAccountButton } from "@/components/accounts/DeleteAccountButton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CuentaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, type, calculated_balance")
    .eq("id", id)
    .single();

  if (!account) notFound();

  const calculatedBalance = Number(account.calculated_balance);
  const isInvestment = account.type === "investment";

  if (isInvestment) {
    const { data: contributions } = await supabase
      .from("transactions")
      .select("amount, occurred_on")
      .eq("account_id", id)
      .eq("type", "investment")
      .order("occurred_on", { ascending: false });

    const totalContributed = (contributions ?? []).reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    const currentValue = calculatedBalance;
    const returnAmount = currentValue - totalContributed;
    const returnPct =
      totalContributed > 0 ? (returnAmount / totalContributed) * 100 : 0;

    const byMonth = groupContributionsByMonth(contributions ?? []);

    return (
      <div className="flex flex-col gap-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/cuentas"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-zinc-400 transition-all hover:text-white hover:bg-white/10 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">{account.name}</h1>
          </div>
          <DeleteAccountButton accountId={account.id} />
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-zinc-500 text-sm mb-1">Valor actual</p>
          <p className="money text-3xl font-bold text-white">
            {currentValue.toFixed(2)} €
          </p>

          <div className="flex gap-4 mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-zinc-500 text-xs">Total aportado</p>
                <EditContributedButton
                  accountId={account.id}
                  currentTotal={totalContributed}
                />
              </div>
              <p className="money text-sm font-medium text-white">
                {totalContributed.toFixed(2)} €
              </p>
            </div>
            <div className="flex-1">
              <p className="text-zinc-500 text-xs mb-0.5">Rentabilidad</p>
              <p
                className={
                  "money text-sm font-medium " +
                  (returnAmount >= 0 ? "text-emerald-400" : "text-red-400")
                }
              >
                {returnAmount >= 0 ? "+" : ""}
                {returnAmount.toFixed(2)} € ({returnPct >= 0 ? "+" : ""}
                {returnPct.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-sm font-medium text-white mb-3">Actualizar valor de cartera</p>
          <InvestmentSnapshotForm
            accountId={account.id}
            calculatedBalance={calculatedBalance}
          />
        </div>

        {byMonth.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-sm font-medium text-white mb-3">Aportaciones por mes</p>
            <ul className="flex flex-col gap-2">
              {byMonth.map((m) => (
                <li
                  key={m.month}
                  className="flex justify-between text-sm"
                >
                  <span className="capitalize text-zinc-400">{m.label}</span>
                  <span className="money text-white">
                    {m.total.toFixed(2)} €
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(!contributions || contributions.length === 0) && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-center">
            <p className="text-zinc-500 text-sm">
              Registra tus aportaciones como movimientos de tipo "Inversión"
              para ver aquí la rentabilidad real.
            </p>
          </div>
        )}
      </div>
    );
  }

  // --- Cuentas normales (banco / efectivo): saldo real vs calculado ---
  const { data: snapshots } = await supabase
    .from("balance_snapshots")
    .select("balance, snapshot_date")
    .eq("account_id", id)
    .order("snapshot_date", { ascending: false })
    .limit(5);

  return (
    <div className="flex flex-col
