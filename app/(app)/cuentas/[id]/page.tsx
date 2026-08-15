import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BalanceAdjustmentForm } from "@/components/accounts/BalanceAdjustmentForm";

export default async function CuentaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, calculated_balance, real_balance, real_balance_updated_at")
    .eq("id", id)
    .single();

  if (!account) notFound();

  const { data: snapshots } = await supabase
    .from("balance_snapshots")
    .select("balance, snapshot_date")
    .eq("account_id", id)
    .order("snapshot_date", { ascending: false })
    .limit(5);

  const calculatedBalance = Number(account.calculated_balance);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium">{account.name}</h1>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-muted text-sm mb-1">Saldo calculado</p>
        <p className="money text-3xl font-semibold">
          {calculatedBalance.toFixed(2)} €
        </p>
        <p className="text-muted text-xs mt-1">
          Calculado a partir de tus movimientos registrados.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-sm font-medium mb-3">Cuadrar saldo</p>
        <BalanceAdjustmentForm
          accountId={account.id}
          calculatedBalance={calculatedBalance}
        />
      </div>

      {snapshots && snapshots.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-sm font-medium mb-3">Historial de saldo real</p>
          <ul className="flex flex-col gap-2">
            {snapshots.map((s, i) => (
              <li
                key={i}
                className="flex justify-between text-sm text-muted"
              >
                <span>
                  {new Date(s.snapshot_date + "T00:00:00").toLocaleDateString(
                    "es-ES"
                  )}
                </span>
                <span className="money text-white">
                  {Number(s.balance).toFixed(2)} €
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
