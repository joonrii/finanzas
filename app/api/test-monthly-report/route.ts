import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMonthlyReport } from "@/lib/email/send-report";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-test-secret");
    if (authHeader !== process.env.TEST_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: "Faltan userId o email" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const userName = userData?.full_name?.split(" ")[0] || "amigo";
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthName = MONTH_NAMES[month];

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_on", startOfMonth.toISOString().slice(0, 10))
      .lte("occurred_on", endOfMonth.toISOString().slice(0, 10));

    const hasTransactions = transactions && transactions.length > 0;
    let totalIncome = 0, totalExpense = 0;
    let topCategories: any[] = [], insights: any[] = [];

    if (hasTransactions) {
      totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0);
      totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      const categoryMap = new Map<string, number>();
      transactions.filter((t) => t.type === "expense").forEach((t) => {
        const cat = t.category || "Otros";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Math.abs(t.amount || 0));
      });

      const sorted = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
      topCategories = sorted.map(([name, amount], i) => ({
        name, amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        emoji: "&#128230;",
        color: ["#3b82f6", "#ef4444", "#10b981"][i % 3],
      }));

      insights = [{ text: `Hiciste ${transactions.length} transacciones este mes.`, emoji: "&#128200;" }];
    }

    await sendMonthlyReport({
      to: email, userName, monthName, year,
      totalIncome, totalExpense, netBalance: totalIncome - totalExpense,
      topCategories, comparisons: [], insights, upcomingPayments: [], hasTransactions: !!hasTransactions,
    });

    return NextResponse.json({ success: true, message: `Email de prueba enviado a ${email}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
