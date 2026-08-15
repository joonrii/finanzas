import { createClient } from "@/lib/supabase/server";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { CategoryBreakdown } from "@/components/charts/CategoryBreakdown";

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

  // --- Movimientos de este mes y el anterior ---
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);
  const startOfLastMonthStr = startOfLastMonth.toISOString().slice(0, 10);

  const { data: monthTransactions } = await supabase
    .from("transactions")
    .select("type, amount")
    .gte("occurred_on", startOfMonthStr);

  const { data: lastMonthTransactions } = await supabase
    .from("transactions")
    .select("type, amount")
    .gte("occurred_on", startOfLastMonthStr)
    .lt("occurred_on", startOfMonthStr);

  const income = sumByType(monthTransactions, "income");
  const expenses = sumByType(monthTransactions, "expense");
  const invested = sumByType(monthTransactions, "investment");
  const lastMonthExpenses = sumByType(lastMonthTransactions, "expense");

  const expenseChangeLabel = buildComparisonLabel(expenses, lastMonthExpenses);

  // --- Gastos por categoría (este mes) ---
  const { data: categoryTransactions } = await supabase
    .from("transactions")
    .select("amount, categories:category_id(name, icon)")
    .eq("type", "expense")
    .gte("occurred_on", startOfMonthStr);

  const categoryTotals = groupByCategory(categoryTransactions ?? []);

  // --- Serie histórica de patrimonio, reconstruida a partir de ingresos/gastos ---
  const { data: allFlowTransactions } = await supabase
    .from("transactions")
    .select("occurred_on, type, amount")
    .in("type", ["income", "expense"])
    .order("occurred_on", { ascending: true });

  const series = buildNetWorthSeries(allFlowTransactions ?? [], netWorth);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-muted text-sm">Hola de nuevo</p>
        <h1 className="text-xl font-medium truncate">{user?.email}</h1>
      </header>

      <div className="relative overflow-hidden bg-surface border border-border rounded-2xl p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-positive via-sky-400 to-fuchsia-400" />
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

      <NetWorthChart series={series} />

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
        {expenseChangeLabel && (
          <p className="text-muted text-xs mt-3 pt-3 border-t border-border">
            {expenseChangeLabel}
          </p>
        )}
      </div>

      <CategoryBreakdown categories={categoryTotals} />

      {(!accounts || accounts.length === 0) && (
        <div className="bg-surface border border-border rounded-2xl p-5 text-center">
          <p className="text-muted text-sm">
            Añade tus cuentas para que el patrimonio se calcule solo.
          </p>
        </div>
      )}
    </div>
  );
}

function sumByType(
  transactions: { type: string; amount: number }[] | null,
  type: string
) {
  return (transactions ?? [])
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

function buildComparisonLabel(current: number, previous: number) {
  if (previous === 0) return null;
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 1) return "Gasto similar al mes pasado.";
  const direction = diff > 0 ? "más" : "menos";
  return `${Math.abs(diff).toFixed(0)}% ${direction} que el mes pasado.`;
}

function groupByCategory(
  rows: { amount: number; categories: unknown }[]
): { name: string; icon: string; total: number }[] {
  const map = new Map<string, { name: string; icon: string; total: number }>();

  for (const row of rows) {
    const cat = Array.isArray(row.categories)
      ? row.categories[0]
      : (row.categories as { name: string; icon: string } | null);
    const name = cat?.name ?? "Sin categoría";
    const icon = cat?.icon ?? "📦";
    const existing = map.get(name);
    if (existing) {
      existing.total += Number(row.amount);
    } else {
      map.set(name, { name, icon, total: Number(row.amount) });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function buildNetWorthSeries(
  flows: { occurred_on: string; type: string; amount: number }[],
  currentNetWorth: number
): { date: string; value: number }[] {
  if (flows.length === 0) return [];

  const totalDelta = flows.reduce(
    (sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0
  );

  // Valor de partida implícito antes del primer movimiento registrado
  let runningValue = currentNetWorth - totalDelta;

  const series: { date: string; value: number }[] = [];
  let lastDate: string | null = null;

  for (const flow of flows) {
    runningValue +=
      flow.type === "income" ? Number(flow.amount) : -Number(flow.amount);

    if (flow.occurred_on === lastDate) {
      series[series.length - 1].value = runningValue;
    } else {
      series.push({ date: flow.occurred_on, value: runningValue });
      lastDate = flow.occurred_on;
    }
  }

  // Añade el punto de hoy para que la línea llegue hasta el valor actual
  const today = new Date().toISOString().slice(0, 10);
  if (lastDate !== today) {
    series.push({ date: today, value: currentNetWorth });
  }

  return series;
}
