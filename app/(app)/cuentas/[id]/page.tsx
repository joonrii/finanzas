import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BalanceAdjustmentForm } from "@/components/accounts/BalanceAdjustmentForm";
import { InvestmentSnapshotForm } from "@/components/accounts/InvestmentSnapshotForm";

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
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-medium">{account.name}</h1>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-muted text-sm mb-1">Valor actual</p>
          <p className="money text-3xl font-semibold">
            {currentValue.toFixed(2)} €
          </p>

          <div className="flex gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex-1">
              <p className="text-muted text-xs mb-0.5">Total aportado</p>
              <p className="money text-sm font-medium">
                {totalContributed.toFixed(2)} €
              </p>
            </div>
            <div className="flex-1">
              <p className="text-muted text-xs mb-0.5">Rentabilidad</p>
              <p
                className={
                  "money text-sm font-medium " +
                  (returnAmount >= 0 ? "text-positive" : "text-negative")
                }
              >
                {returnAmount >= 0 ? "+" : ""}
                {returnAmount.toFixed(2)} € ({returnPct >= 0 ? "+" : ""}
                {returnPct.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-sm font-medium mb-3">Actualizar valor de cartera</p>
          <InvestmentSnapshotForm
            accountId={account.id}
            calculatedBalance={calculatedBalance}
          />
        </div>

        {byMonth.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-sm font-medium mb-3">Aportaciones por mes</p>
            <ul className="flex flex-col gap-2">
              {byMonth.map((m) => (
                <li
                  key={m.month}
                  className="flex justify-between text-sm text-muted"
                >
                  <span className="capitalize">{m.label}</span>
                  <span className="money text-white">
                    {m.total.toFixed(2)} €
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(!contributions || contributions.length === 0) && (
          <div className="bg-surface border border-border rounded-2xl p-5 text-center">
            <p className="text-muted text-sm">
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
              <li key={i} className="flex justify-between text-sm text-muted">
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

function groupContributionsByMonth(
  contributions: { amount: number; occurred_on: string }[]
) {
  const map = new Map<string, number>();
  for (const c of contributions) {
    const month = c.occurred_on.slice(0, 7); // YYYY-MM
    map.set(month, (map.get(month) ?? 0) + Number(c.amount));
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12)
    .map(([month, total]) => ({
      month,
      total,
      label: new Date(month + "-01T00:00:00").toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      }),
    }));
}
