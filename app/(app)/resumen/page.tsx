import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { CategoryBreakdown } from "@/components/charts/CategoryBreakdown";
import { Wallet, TrendingDown, CreditCard, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function ResumenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accounts } = await supabase
    .from("accounts")
    .select("type, calculated_balance")
    .eq("user_id", user.id)
    .eq("is_archived", false);

  const bankTotal = (accounts ?? [])
    .filter((a) => a.type === "bank" || a.type === "cash")
    .reduce((sum, a) => sum + Number(a.calculated_balance), 0);
  const investmentTotal = (accounts ?? [])
    .filter((a) => a.type === "investment")
    .reduce((sum, a) => sum + Number(a.calculated_balance), 0);
  const netWorth = bankTotal + investmentTotal;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);
  const startOfLastMonthStr = startOfLastMonth.toISOString().slice(0, 10);

  const { data: monthTransactions } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", user.id)
    .gte("occurred_on", startOfMonthStr);

  const { data: lastMonthTransactions } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", user.id)
    .gte("occurred_on", startOfLastMonthStr)
    .lt("occurred_on", startOfMonthStr);

  const income = sumByType(monthTransactions, "income");
  const expenses = sumByType(monthTransactions, "expense");
  const invested = sumByType(monthTransactions, "investment");
  const lastMonthExpenses = sumByType(lastMonthTransactions, "expense");
  const expenseChangeLabel = buildComparisonLabel(expenses, lastMonthExpenses);

  const { data: categoryTransactions } = await supabase
    .from("transactions")
    .select("amount, categories:category_id(name, icon)")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("occurred_on", startOfMonthStr);

  const categoryTotals = groupByCategory(categoryTransactions ?? []);

  const { data: allFlowTransactions } = await supabase
    .from("transactions")
    .select("occurred_on, type, amount")
    .eq("user_id", user.id)
    .in("type", ["income", "expense"])
    .order("occurred_on", { ascending: true });

  const series = buildNetWorthSeries(allFlowTransactions ?? [], netWorth);

  const hasNoAccounts = !accounts || accounts.length === 0;
  const hasNoTransactions = !monthTransactions || monthTransactions.length === 0;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <header>
        <p className="text-zinc-500 text-sm">Hola de nuevo</p>
        <h1 className="text-2xl font-bold text-white truncate">{user?.email}</h1>
      </header>

      {hasNoAccounts ? (
        <EmptyState
          icon={<Wallet className="w-8 h-8 text-zinc-500" />}
          title="Empieza por anadir una cuenta"
          description="Necesitas al menos una cuenta para ver tu patrimonio y registrar movimientos."
          actionHref="/cuentas/nueva"
          actionLabel="Anadir cuenta"
        />
      ) : (
        <>
          {/* === PATRIMONIO TOTAL — ESTILO 3D === */}
          <div
            className="relative overflow-hidden rounded-2xl p-5 border border-white/[0.06]"
            style={{
              background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
              boxShadow: "0 8px 32px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Línea verde inferior */}
            <div className="absolute bottom-0 left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

            <p className="text-zinc-500 text-sm mb-1">Patrimonio total</p>
            <p
              className="money text-4xl font-bold text-white"
              style={{ textShadow: "0 0 20px rgba(16,185,129,0.3)" }}
            >
              {netWorth.toFixed(2)} €
            </p>

            <div className="flex gap-4 mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CreditCard className="w-3 h-3 text-emerald-400" />
                  <p className="text-zinc-500 text-xs">En bancos</p>
                </div>
                <p className="money text-sm font-medium text-white">
                  {bankTotal.toFixed(2)} €
                </p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <p className="text-zinc-500 text-xs">Inversiones</p>
                </div>
                <p className="money text-sm font-medium text-white">
                  {investmentTotal.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          <NetWorthChart series={series} />

          {hasNoTransactions ? (
            <EmptyState
              icon={<TrendingDown className="w-8 h-8 text-zinc-500" />}
              title="Aun no hay movimientos este mes"
              description="Registra tu primer gasto o ingreso para ver el resumen."
              actionHref="/movimientos/nuevo"
              actionLabel="Anadir movimiento"
            />
          ) : (
            <>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-sm font-medium text-white mb-3">Resumen del mes</p>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Ingresos</span>
                    <span className="money text-emerald-400">+{income.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Gastos</span>
                    <span className="money text-white">-{expenses.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Inversiones</span>
                    <span className="money text-white">-{invested.toFixed(2)} €</span>
                  </div>
                </div>
                {expenseChangeLabel && (
                  <p className="text-zinc-500 text-xs mt-3 pt-3 border-t border-white/[0.06]">
                    {expenseChangeLabel}
                  </p>
                )}
              </div>

              <CategoryBreakdown categories={categoryTotals} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-10 text-center">
      <div className="relative mb-6 inline-block">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
        <div className="relative w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto">
          {icon}
        </div>
      </div>
      <p className="text-white text-sm font-medium mb-1">{title}</p>
      <p className="text-zinc-500 text-xs mb-6">{description}</p>
      <Link
        href={actionHref}
        className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-6 py-3 text-sm transition-all"
      >
        {actionLabel}
      </Link>
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
  const direction = diff > 0 ? "mas" : "menos";
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
    const name = cat?.name ?? "Sin categoria";
    const icon = cat?.icon ?? "❓";
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
    (sum, t) =>
      sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0
  );
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
  const today = new Date().toISOString().slice(0, 10);
  if (lastDate !== today) {
    series.push({ date: today, value: currentNetWorth });
  }
  return series;
}
