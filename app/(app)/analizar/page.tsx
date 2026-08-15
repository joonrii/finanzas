import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { CategoryBreakdown } from "@/components/charts/CategoryBreakdown";
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default async function AnalizarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // --- Transacciones últimos 6 meses ---
  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount, occurred_on, category_id, categories:category_id(name, icon)")
    .eq("user_id", user.id)
    .gte("occurred_on", sixMonthsAgo.toISOString().slice(0, 10))
    .order("occurred_on", { ascending: true });

  // --- Cuentas para patrimonio ---
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

  // --- Serie de patrimonio ---
  const { data: allFlows } = await supabase
    .from("transactions")
    .select("occurred_on, type, amount")
    .in("type", ["income", "expense"])
    .order("occurred_on", { ascending: true });

  const series = buildNetWorthSeries(allFlows ?? [], netWorth);

  // --- Gastos por mes (últimos 6) ---
  const monthlyData = buildMonthlyData(transactions ?? []);

  // --- Gastos por categoría (mes actual) ---
  const currentMonthStr = currentMonthStart.toISOString().slice(0, 7);
  const categoryTotals = buildCategoryTotals(
    transactions ?? [],
    currentMonthStr
  );

  // --- Resumen del mes actual ---
  const currentMonthTrans = (transactions ?? []).filter((t) =>
    t.occurred_on.startsWith(currentMonthStr)
  );
  const monthIncome = sumByType(currentMonthTrans, "income");
  const monthExpenses = sumByType(currentMonthTrans, "expense");
  const monthInvested = sumByType(currentMonthTrans, "investment");

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-white">Analizar</h1>

      {/* Resumen del mes */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          label="Ingresos"
          value={monthIncome}
          positive
        />
        <SummaryCard
          icon={<TrendingDown className="w-4 h-4 text-red-400" />}
          label="Gastos"
          value={monthExpenses}
        />
        <SummaryCard
          icon={<Wallet className="w-4 h-4 text-blue-400" />}
          label="Invertido"
          value={monthInvested}
        />
      </div>

      {/* Gráfico de barras: gastos por mes */}
      <MonthlyBarChart data={monthlyData} />

      {/* Evolución del patrimonio */}
      <NetWorthChart series={series} />

      {/* Gastos por categoría */}
      <CategoryBreakdown categories={categoryTotals} />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  positive?: boolean;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p
        className={`text-lg font-bold money ${
          positive ? "text-emerald-400" : "text-white"
        }`}
      >
        {value.toFixed(2)} €
      </p>
    </div>
  );
}

function sumByType(
  items: { type: string; amount: number }[],
  type: string
) {
  return items
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

function buildNetWorthSeries(
  flows: { occurred_on: string; type: string; amount: number }[],
  currentNetWorth: number
) {
  if (flows.length === 0) return [];
  const totalDelta = flows.reduce(
    (sum, t) =>
      sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0
  );
  let running = currentNetWorth - totalDelta;
  const series: { date: string; value: number }[] = [];
  let lastDate: string | null = null;

  for (const flow of flows) {
    running +=
      flow.type === "income" ? Number(flow.amount) : -Number(flow.amount);
    if (flow.occurred_on === lastDate) {
      series[series.length - 1].value = running;
    } else {
      series.push({ date: flow.occurred_on, value: running });
      lastDate = flow.occurred_on;
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  if (lastDate !== today) {
    series.push({ date: today, value: currentNetWorth });
  }
  return series;
}

function buildMonthlyData(
  transactions: { type: string; amount: number; occurred_on: string }[]
) {
  const months: Record<string, { month: string; income: number; expense: number }> = {};

  for (const t of transactions) {
    const monthKey = t.occurred_on.slice(0, 7);
    const monthLabel = new Date(monthKey + "-01").toLocaleDateString("es-ES", {
      month: "short",
    });
    if (!months[monthKey]) {
      months[monthKey] = { month: monthLabel, income: 0, expense: 0 };
    }
    if (t.type === "income") months[monthKey].income += Number(t.amount);
    if (t.type === "expense") months[monthKey].expense += Number(t.amount);
  }

  return Object.values(months);
}

function buildCategoryTotals(
  transactions: { type: string; amount: number; occurred_on: string; categories: unknown }[],
  monthStr: string
) {
  const map = new Map<string, { name: string; icon: string; total: number }>();

  for (const t of transactions) {
    if (t.type !== "expense" || !t.occurred_on.startsWith(monthStr)) continue;
    const cat = Array.isArray(t.categories)
      ? t.categories[0]
      : (t.categories as { name: string; icon: string } | null);
    const name = cat?.name ?? "Sin categoría";
    const icon = cat?.icon ?? "❓";
    const existing = map.get(name);
    if (existing) {
      existing.total += Number(t.amount);
    } else {
      map.set(name, { name, icon, total: Number(t.amount) });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}
