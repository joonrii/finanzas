import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { CategoryBreakdown } from "@/components/charts/CategoryBreakdown";
import { DonutChart } from "@/components/charts/DonutChart";
import { NewsFeed } from "@/components/dashboard/NewsFeed";
import { TipsWidget } from "@/components/dashboard/TipsWidget";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import InvestmentReminder from "@/components/investments/InvestmentReminder";
import { Wallet, TrendingDown, CreditCard, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function ResumenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type, calculated_balance, real_balance, is_archived")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, type, amount, occurred_on, created_at, account_id, destination_account_id, category_id, categories:category_id(icon, name)")
    .eq("user_id", user.id)
    .order("occurred_on", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: recurrings } = await supabase
    .from("recurring_transactions")
    .select("id, description, amount, type, day_of_month, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const bankAccounts = (accounts ?? []).filter((a) => a.type === "bank" || a.type === "cash");
  const investmentAccounts = (accounts ?? []).filter((a) => a.type === "investment");
  const bankTotal = bankAccounts.reduce((sum, a) => sum + Number(a.calculated_balance), 0);
  const investmentTotal = investmentAccounts.reduce((sum, a) => sum + Number(a.calculated_balance), 0);
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
    <main className="max-w-lg mx-auto px-5 pt-6 pb-28 safe-bottom lg:max-w-none lg:!mx-0 lg:px-6 lg:pb-8">
      <div className="lg:grid lg:grid-cols-[280px_1fr_300px] lg:gap-6 lg:pt-6 lg:items-start">

        {/* ========== COLUMNA IZQUIERDA (solo desktop) ========== */}
        <div className="hidden lg:flex lg:flex-col lg:gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center font-extrabold text-[#0B0D10] text-sm">F</div>
            <span className="text-white font-bold text-sm">Fint</span>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-3">Tus cuentas</p>
            <div className="flex flex-col gap-2">
              {accounts?.map((a) => (
                <div key={a.id} className="flex justify-between items-center p-2 bg-white/[0.03] rounded-xl">
                  <span className="text-white text-[11px]">{a.name}</span>
                  <span className={`text-[11px] font-semibold money ${a.type === "investment" ? "text-amber-400" : "text-white"}`}>
                    {Number(a.calculated_balance).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
          </div>

          <TipsWidget />
        </div>

        {/* ========== COLUMNA CENTRO ========== */}
        <div className="flex flex-col gap-5">
          <div className="lg:hidden">
            <p className="text-zinc-500 text-sm">Hola de nuevo</p>
            <h1 className="text-2xl font-bold text-white truncate">{user?.email}</h1>
          </div>

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
              {/* Patrimonio con fondo verde sutil */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/15 rounded-2xl p-5">
                <p className="text-zinc-400 text-sm mb-1">Patrimonio total</p>
                <p className="money text-4xl font-bold text-white">
                  {netWorth.toFixed(2)} €
                </p>
                <div className="flex gap-4 mt-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <CreditCard className="w-3 h-3 text-emerald-400" />
                      <p className="text-zinc-500 text-xs">En bancos</p>
                    </div>
                    <p className="money text-sm font-medium text-white">{bankTotal.toFixed(2)} €</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <p className="text-zinc-500 text-xs">Inversiones</p>
                    </div>
                    <p className="money text-sm font-medium text-white">{investmentTotal.toFixed(2)} €</p>
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
                  <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-5">
                    <div className="lg:hidden">
                      <CategoryBreakdown categories={categoryTotals} />
                    </div>
                    <div className="hidden lg:block">
                      <DonutChart categories={categoryTotals} />
                    </div>

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
                        <p className="text-zinc-500 text-xs mt-3 pt-3 border-t border-white/[0.06]">{expenseChangeLabel}</p>
                      )}
                    </div>
                  </div>

                  <div className="lg:hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
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
                      <p className="text-zinc-500 text-xs mt-3 pt-3 border-t border-white/[0.06]">{expenseChangeLabel}</p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ========== COLUMNA DERECHA (solo desktop) ========== */}
        <div className="hidden lg:flex lg:flex-col lg:gap-4">
          <InvestmentReminder />
          <UpcomingPayments recurrings={recurrings ?? []} />
          <NewsFeed />
        </div>

      </div>
    </main>
  );
}

function EmptyState({ icon, title, description, actionHref, actionLabel }: {
  icon: React.ReactNode; title: string; description: string; actionHref: string; actionLabel: string;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-10 text-center">
      <div className="relative mb-6 inline-block">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
        <div className="relative w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto">{icon}</div>
      </div>
      <p className="text-white text-sm font-medium mb-1">{title}</p>
      <p className="text-zinc-500 text-xs mb-6">{description}</p>
      <Link href={actionHref} className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-6 py-3 text-sm transition-all">{actionLabel}</Link>
    </div>
  );
}

function sumByType(transactions: { type: string; amount: number }[] | null, type: string) {
  return (transactions ?? []).filter((t) => t.type === type).reduce((sum, t) => sum + Number(t.amount), 0);
}

function buildComparisonLabel(current: number, previous: number) {
  if (previous === 0) return null;
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 1) return "Gasto similar al mes pasado.";
  const direction = diff > 0 ? "mas" : "menos";
  return `${Math.abs(diff).toFixed(0)}% ${direction} que el mes pasado.`;
}

function groupByCategory(rows: { amount: number; categories: unknown }[]): { name: string; icon: string; total: number }[] {
  const map = new Map<string, { name: string; icon: string; total: number }>();
  for (const row of rows) {
    const cat = Array.isArray(row.categories) ? row.categories[0] : (row.categories as { name: string; icon: string } | null);
    const name = cat?.name ?? "Sin categoria";
    const icon = cat?.icon ?? "❓";
    const existing = map.get(name);
    if (existing) existing.total += Number(row.amount);
    else map.set(name, { name, icon, total: Number(row.amount) });
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function buildNetWorthSeries(
  flows: { occurred_on: string; type: string; amount: number }[],
  currentNetWorth: number
): { date: string; value: number }[] {
  if (flows.length === 0) return [];
  const totalDelta = flows.reduce((sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);
  let runningValue = currentNetWorth - totalDelta;
  const series: { date: string; value: number }[] = [];
  let lastDate: string | null = null;
  for (const flow of flows) {
    runningValue += flow.type === "income" ? Number(flow.amount) : -Number(flow.amount);
    if (flow.occurred_on !== lastDate) {
      series.push({ date: flow.occurred_on, value: runningValue });
      lastDate = flow.occurred_on;
    } else {
      series[series.length - 1].value = runningValue;
    }
  }
  return series;
}
