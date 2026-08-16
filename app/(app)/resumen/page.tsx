import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryBreakdown } from "@/components/charts/CategoryBreakdown";
import { DonutChart } from "@/components/charts/DonutChart";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { NetWorthSummary } from "@/components/charts/NetWorthSummary";
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart";
import { NewsFeed } from "@/components/dashboard/NewsFeed";
import { TipsWidget } from "@/components/dashboard/TipsWidget";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import InvestmentReminder from "@/components/investments/InvestmentReminder";
import { buildNetWorthSeries } from "@/lib/networth";
import { getMonthlyTotals } from "@/lib/monthly";

export default async function ResumenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const bankAccounts =
    accounts?.filter(
      (a) => a.type !== "investment" && a.type !== "crypto"
    ) ?? [];
  const investmentAccounts =
    accounts?.filter(
      (a) => a.type === "investment" || a.type === "crypto"
    ) ?? [];

  const bankBalance = bankAccounts.reduce(
    (sum, a) => sum + Number(a.calculated_balance),
    0
  );
  const investmentBalance = investmentAccounts.reduce(
    (sum, a) => sum + Number(a.calculated_balance),
    0
  );
  const totalBalance = bankBalance + investmentBalance;

  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = today.slice(0, 8) + "01";

  const monthTx =
    transactions?.filter((t) => t.occurred_on >= firstDayOfMonth) ?? [];

  const monthIncome = monthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthExpense = monthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthInvestment = monthTx
    .filter((t) => t.type === "investment")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenseCategories: Record<
    string,
    { name: string; icon: string; total: number }
  > = {};

  for (const t of monthTx) {
    if (t.type !== "expense") continue;
    const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    if (!cat) continue;
    const key = cat.name;
    if (!expenseCategories[key]) {
      expenseCategories[key] = { name: cat.name, icon: cat.icon, total: 0 };
    }
    expenseCategories[key].total += Number(t.amount);
  }

  const sortedCategories = Object.values(expenseCategories).sort(
    (a, b) => b.total - a.total
  );

  const netWorthSeries = buildNetWorthSeries(
    transactions ?? [],
    accounts ?? []
  );

  const monthlyTotals = getMonthlyTotals(transactions ?? []);

  return (
    <main className="max-w-lg mx-auto px-5 pt-6 pb-28 safe-bottom lg:max-w-none lg:px-0 lg:pb-8">
      <div className="lg:grid lg:grid-cols-[260px_1fr_280px] lg:gap-5 lg:px-6 lg:pt-6 lg:max-w-[1280px] lg:mx-auto">

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
            <p className="text-zinc-400 text-sm">Hola de nuevo</p>
            <h1 className="text-xl font-bold text-white">{user.email}</h1>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/15 rounded-2xl p-5">
            <p className="text-zinc-400 text-sm mb-1">Patrimonio total</p>
            <p className="text-3xl font-bold text-white money">
              {totalBalance.toFixed(2)} €
            </p>
            <div className="flex gap-6 mt-3">
              <div>
                <p className="text-zinc-500 text-xs">En bancos</p>
                <p className="text-white font-semibold money">
                  {bankBalance.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Inversiones</p>
                <p className="text-amber-400 font-semibold money">
                  {investmentBalance.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          <NetWorthChart series={netWorthSeries} />

          <div className="lg:grid lg:grid-cols-2 lg:gap-4">
            <div className="lg:hidden">
              <CategoryBreakdown categories={sortedCategories} />
            </div>
            <div className="hidden lg:block">
              <DonutChart categories={sortedCategories} />
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-sm font-medium text-white mb-3">Resumen del mes</p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Ingresos</span>
                  <span className="text-emerald-400 money">+{monthIncome.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Gastos</span>
                  <span className="text-white money">-{monthExpense.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Inversiones</span>
                  <span className="text-amber-400 money">-{monthInvestment.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-sm font-medium text-white mb-3">Resumen del mes</p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Ingresos</span>
                <span className="text-emerald-400 money">+{monthIncome.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Gastos</span>
                <span className="text-white money">-{monthExpense.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Inversiones</span>
                <span className="text-amber-400 money">-{monthInvestment.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <MonthlyBarChart data={monthlyTotals} />
          <NetWorthSummary accounts={accounts ?? []} />
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
