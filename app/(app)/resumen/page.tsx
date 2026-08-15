import { createClient } from "@/lib/supabase/server";

export default async function ResumenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("type, calculated_balance")
    .eq("is_archived", false);

  const bankTotal = (accounts ?? [])
    .filter((a) => a.type === "bank" || a.type === "cash")
    .reduce((sum, a) => sum + Number(a.calculated_balance), 0);

  const investmentTotal = (accounts ?? [])
    .filter((a) => a.type === "investment")
    .reduce((sum, a) => sum + Number(a.calculated_balance), 0);

  const netWorth = bankTotal + investmentTotal;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);

  const { data: monthTransactions } = await supabase
    .from("transactions")
    .select("type, amount")
    .gte("occurred_on", startOfMonthStr);

  const income = (monthTransactions ?? [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = (monthTransactions ?? [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const invested = (monthTransactions ?? [])
    .filter((t) => t.type === "investment")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-muted text-sm">Hola de nuevo</p>
        <h1 className="text-xl font-medium truncate">{user?.email}</h1>
      </header>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-muted text-sm mb-1">Patrimonio total</p>
        <p className="money text-4xl font-semibold">
          {netWorth.toFixed(2)} €
        </p>

        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex-1">
            <p className="text-muted text-xs mb-0.5">🏦 En bancos</p>
            <p className="money text-sm font-medium">
              {bankTotal.toFixed(2)} €
            </p>
          </div>
          <div className="flex-1">
            <p className="text-muted text-xs mb-0.5">📈 Inversiones</p>
            <p className="money text-sm font-medium">
              {investmentTotal.toFixed(2)} €
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-sm font-medium mb-3">Resumen del mes</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Ingresos</span>
            <span className="money text-positive">+{income.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Gastos</span>
            <span className="money">-{expenses.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Inversiones</span>
            <span className="money">-{invested.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {(!accounts || accounts.length === 0) && (
        <div className="bg-surface border border-border rounded-2xl p-5 text-center">
          <p className="text-muted text-sm">
            Añade tus cuentas para que el patrimonio se calcule solo.
          </p>
        </div>
      )}

      <p className="text-muted text-xs text-center mt-2">
        El gráfico de evolución llega en la Fase 3.
      </p>
    </div>
  );
}
