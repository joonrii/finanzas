import { Resend } from "resend";
import { renderAsync } from "@react-email/render";
import MonthlyReportEmail from "./templates/MonthlyReport";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendReportParams {
  to: string;
  userName: string;
  monthName: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
    emoji: string;
    color: string;
  }>;
  comparisons: Array<{
    text: string;
    type: "positive" | "negative" | "neutral";
    emoji: string;
  }>;
  insights: Array<{
    text: string;
    emoji: string;
  }>;
  upcomingPayments: Array<{
    name: string;
    amount: number;
    day: number;
    emoji: string;
  }>;
  hasTransactions: boolean;
}

export async function sendMonthlyReport(params: SendReportParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://finanzas-one-virid.vercel.app";

  const html = await renderAsync(
    MonthlyReportEmail({
      ...params,
      appUrl,
    })
  );

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Fint <onboarding@resend.dev>",
    to: params.to,
    subject: `Tu resumen de ${params.monthName} — Fint`,
    html,
  });

  if (error) {
    console.error("Error enviando email:", error);
    throw error;
  }

  return data;
}
