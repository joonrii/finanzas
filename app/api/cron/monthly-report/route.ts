import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMonthlyReport } from "@/lib/email/send-report";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const CATEGORY_EMOJIS: Record<string, string> = {
  "alimentación": "&#127860;", "transporte": "&#128663;", "vivienda": "&#127969;", "ocio": "&#127918;",
  "salud": "&#128137;", "educación": "&#127891;", "ropa": "&#128084;", "tecnología": "&#128241;",
  "mascotas": "&#128054;", "viajes": "&#9992;", "regalos": "&#127873;", "ahorro": "&#128176;",
  "inversión": "&#128200;", "otros": "&#128230;",
};

const CATEGORY_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#f59e0b",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

const PAYMENT_EMOJIS: Record<string, string> = {
  "alquiler": "&#127969;", "hipoteca": "&#127969;", "netflix": "&#127909;", "spotify": "&#127911;",
  "gimnasio": "&#127947;", "seguro": "&#128736;", "luz": "&#9889;", "agua": "&#128167;",
  "gas": "&#128293;", "internet": "&#128225;", "móvil": "&#128241;", "nómina": "&#128176;",
  "suscripción": "&#128260;",
};

function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "&#128230;";
}

function getPaymentEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(PAYMENT_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "&#128179;";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthName = MONTH_NAMES[prevMonth];

    const startOfPrevMonth = new Date(prevYear, prevMonth, 1);
    const endOfPrevMonth = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59);

    const prevPrevMonth = prevMonth === 0 ? 11 : prevMonth - 1;
    const prevPrevYear = prevMonth === 0 ? prevYear - 1 : prevYear;
    const startOfPrevPrevMonth = new Date(prevPrevYear, prevPrevMonth, 1);
    const endOfPrevPrevMonth = new Date(prevPrevYear, prevPrevMonth + 1, 0, 23, 59, 59);

    const { data: preferences, error: prefError } = await supabase
      .from("user_preferences")
      .select("user_id")
      .eq("monthly_report_email", true);

    if (prefError) {
      return NextResponse.json({ error: prefError.message }, { status: 500 });
    }

    if (!preferences || preferences.length === 0) {
      return NextResponse.json({ message: "No hay usuarios suscritos" }, { status: 200 });
    }

    const results = { sent: 0, failed: 0, skipped: 0, errors: [] as string[] };

    for (const pref of preferences) {
      try {
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", pref.user_id)
          .single();

        if (userError || !userData?.email) {
          results.skipped++;
          continue;
        }

        const userName = userData.full_name?.split(" ")[0] || "amigo";

        const { data: transactions, error: txError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", pref.user_id)
          .gte("occurred_on", startOfPrevMonth.toISOString().slice(0, 10))
          .lte("occurred_on", endOfPrevMonth.toISOString().slice(0, 10))
          .order("occurred_on", { ascending: false });

        if (txError) {
          results.errors.push(`Error transacciones ${pref.user_id}: ${txError.message}`);
          results.failed++;
          continue;
        }

        const hasTransactions = transactions && transactions.length > 0;

        if (!hasTransactions) {
          await sendMonthlyReport({
            to: userData.email,
            userName,
            monthName: prevMonthName,
            year: prevYear,
            totalIncome: 0,
            totalExpense: 0,
            netBalance: 0,
            topCategories: [],
            comparisons: [],
            insights: [],
            upcomingPayments: [],
            hasTransactions: false,
          });
          results.sent++;
          continue;
        }

        const totalIncome = transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalExpense = transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

        const netBalance = totalIncome - totalExpense;

        const categoryMap = new Map<string, number>();
        transactions
          .filter((t) => t.type === "expense")
          .forEach((t) => {
            const cat = t.category || "Otros";
            categoryMap.set(cat, (categoryMap.get(cat) || 0) + Math.abs(t.amount || 0));
          });

        const sortedCategories = Array.from(categoryMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        const topCategories = sortedCategories.map(([name, amount], i) => ({
          name,
          amount,
          percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
          emoji: getCategoryEmoji(name),
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        }));

        const comparisons: Array<{ text: string; type: "positive" | "negative" | "neutral"; emoji: string }> = [];

        const { data: prevPrevTransactions } = await supabase
          .from("transactions")
          .select("amount, type, category")
          .eq("user_id", pref.user_id)
          .gte("occurred_on", startOfPrevPrevMonth.toISOString().slice(0, 10))
          .lte("occurred_on", endOfPrevPrevMonth.toISOString().slice(0, 10));

        if (prevPrevTransactions && prevPrevTransactions.length > 0) {
          const prevPrevExpense = prevPrevTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

          if (prevPrevExpense > 0) {
            const expenseDiff = ((totalExpense - prevPrevExpense) / prevPrevExpense) * 100;
            if (expenseDiff < -5) {
              comparisons.push({
                text: `Gastaste un ${Math.abs(Math.round(expenseDiff))}% menos que en ${MONTH_NAMES[prevPrevMonth]}. ¡Buen trabajo!`,
                type: "positive", emoji: "&#128077;",
              });
            } else if (expenseDiff > 5) {
              comparisons.push({
                text: `Gastaste un ${Math.round(expenseDiff)}% más que en ${MONTH_NAMES[prevPrevMonth]}.`,
                type: "negative", emoji: "&#128293;",
              });
            }
          }

          const prevPrevCategoryMap = new Map<string, number>();
          prevPrevTransactions
            .filter((t) => t.type === "expense")
            .forEach((t) => {
              const cat = t.category || "Otros";
              prevPrevCategoryMap.set(cat, (prevPrevCategoryMap.get(cat) || 0) + Math.abs(t.amount || 0));
            });

          for (const [catName, currentAmount] of categoryMap.entries()) {
            const prevAmount = prevPrevCategoryMap.get(catName) || 0;
            if (prevAmount > 0 && currentAmount > 0) {
              const diff = ((currentAmount - prevAmount) / prevAmount) * 100;
              if (Math.abs(diff) > 20 && currentAmount > 50) {
                const direction = diff > 0 ? "subió" : "bajó";
                const type = diff > 0 ? "negative" : "positive";
                comparisons.push({
                  text: `Tu gasto en ${catName.toLowerCase()} ${direction} un ${Math.round(Math.abs(diff))}% respecto al mes pasado.`,
                  type, emoji: diff > 0 ? "&#9889;" : "&#127881;",
                });
              }
            }
          }
        }

        const insights: Array<{ text: string; emoji: string }> = [];

        const biggestExpense = transactions
          .filter((t) => t.type === "expense")
          .sort((a, b) => Math.abs(b.amount || 0) - Math.abs(a.amount || 0))[0];

        if (biggestExpense) {
          const day = new Date(biggestExpense.occurred_on).getDate();
          insights.push({
            text: `Tu mayor gasto fue de ${formatCurrency(Math.abs(biggestExpense.amount))} en "${biggestExpense.merchant || biggestExpense.category || "desconocido"}" el día ${day}.`,
            emoji: "&#127941;",
          });
        }

        insights.push({
          text: `Hiciste ${transactions.length} transacciones este mes.`,
          emoji: "&#128200;",
        });

        const dayMap = new Map<number, { count: number; total: number }>();
        transactions
          .filter((t) => t.type === "expense")
          .forEach((t) => {
            const day = new Date(t.occurred_on).getDate();
            const existing = dayMap.get(day) || { count: 0, total: 0 };
            existing.count++;
            existing.total += Math.abs(t.amount || 0);
            dayMap.set(day, existing);
          });

        const busiestDay = Array.from(dayMap.entries()).sort((a, b) => b[1].count - a[1].count)[0];
        if (busiestDay && busiestDay[1].count >= 3) {
          const dayName = new Date(prevYear, prevMonth, busiestDay[0]).toLocaleDateString("es-ES", {
            weekday: "long", day: "numeric",
          });
          insights.push({
            text: `Tu día con más actividad fue el ${dayName} — ${busiestDay[1].count} compras.`,
            emoji: "&#128197;",
          });
        }

        const { data: recurrentes } = await supabase
          .from("recurring_payments")
          .select("*")
          .eq("user_id", pref.user_id)
          .eq("is_paused", false)
          .order("day_of_month", { ascending: true });

        const upcomingPayments = (recurrentes || [])
          .slice(0, 5)
          .map((r) => ({ name: r.name, amount: Math.abs(r.amount), day: r.day_of_month, emoji: getPaymentEmoji(r.name) }));

        await sendMonthlyReport({
          to: userData.email, userName, monthName: prevMonthName, year: prevYear,
          totalIncome, totalExpense, netBalance, topCategories, comparisons, insights, upcomingPayments,
          hasTransactions: true,
        });

        results.sent++;
      } catch (err: any) {
        console.error(`Error usuario ${pref.user_id}:`, err);
        results.errors.push(`Usuario ${pref.user_id}: ${err.message}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Enviados: ${results.sent}, fallidos: ${results.failed}, omitidos: ${results.skipped}`,
      details: results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
