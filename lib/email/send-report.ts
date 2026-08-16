import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface Category {
  name: string;
  amount: number;
  percentage: number;
  emoji: string;
  color: string;
}

interface Comparison {
  text: string;
  type: "positive" | "negative" | "neutral";
  emoji: string;
}

interface Insight {
  text: string;
  emoji: string;
}

interface UpcomingPayment {
  name: string;
  amount: number;
  day: number;
  emoji: string;
}

interface SendReportParams {
  to: string;
  userName: string;
  monthName: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  topCategories: Category[];
  comparisons: Comparison[];
  insights: Insight[];
  upcomingPayments: UpcomingPayment[];
  hasTransactions: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

function generateNoTransactionsHTML(params: SendReportParams, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu resumen de ${params.monthName} — Fint</title>
</head>
<body style="margin:0;padding:24px 0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;border-bottom:1px solid #f0f0f0;text-align:center;">
      <p style="font-size:20px;font-weight:600;color:#111;margin:0;">Fint</p>
    </div>
    <div style="padding:32px 24px 24px;">
      <h1 style="font-size:22px;font-weight:500;color:#111;margin:0 0 8px;line-height:28px;">Hola ${params.userName} 👋</h1>
      <p style="font-size:15px;line-height:24px;color:#555;margin:0 0 12px;">Este es tu resumen de <strong>${params.monthName} ${params.year}</strong>, pero parece que no registraste ningún movimiento en Fint durante este mes.</p>
      <p style="font-size:15px;line-height:24px;color:#555;margin:0 0 12px;">🤔 ¿Todo bien? Recuerda que puedes añadir tus gastos e ingresos desde la app para tener un control completo de tus finanzas.</p>
      <p style="font-size:15px;line-height:24px;color:#555;margin:0 0 24px;">Cuantos más movimientos registres, más útil será tu resumen mensual. ¡Anímate a empezar!</p>
      <div style="text-align:center;padding:0 0 24px;">
        <a href="${appUrl}" style="display:inline-block;padding:14px 32px;background:#111;color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:500;">Abrir Fint</a>
      </div>
    </div>
    <hr style="border:0;border-top:1px solid #f0f0f0;margin:0 24px;">
    <div style="padding:20px 24px;text-align:center;background:#fafafa;">
      <p style="font-size:12px;color:#888;margin:0 0 8px;">Fint — Tu app de finanzas personales</p>
      <p style="font-size:12px;color:#aaa;margin:0;"><a href="${appUrl}/ajustes" style="color:#888;text-decoration:underline;">Gestionar preferencias de email</a></p>
    </div>
  </div>
</body>
</html>`;
}

function generateFullHTML(params: SendReportParams, appUrl: string): string {
  const monthYear = `${params.monthName} ${params.year}`;
  const isPositive = params.netBalance >= 0;
  const balanceColor = isPositive ? "#10b981" : "#ef4444";

  let categoriesHTML = "";
  if (params.topCategories.length > 0) {
    categoriesHTML = `<div style="padding:0 24px 24px;">
      <h2 style="font-size:15px;font-weight:500;color:#333;margin:0 0 16px;">Dónde se fue tu dinero</h2>`;
    for (const cat of params.topCategories) {
      categoriesHTML += `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:32px;height:32px;border-radius:8px;background:${cat.color}15;display:flex;align-items:center;justify-content:center;font-size:16px;">${cat.emoji}</div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:14px;color:#333;">${cat.name}</span>
            <span style="font-size:14px;font-weight:500;color:#333;font-variant-numeric:tabular-nums;">${formatCurrency(cat.amount)}</span>
          </div>
          <div style="height:6px;background:#f0f0f0;border-radius:3px;overflow:hidden;">
            <div style="width:${cat.percentage}%;height:100%;background:${cat.color};border-radius:3px;"></div>
          </div>
        </div>
        <span style="font-size:12px;color:#888;width:36px;text-align:right;">${cat.percentage}%</span>
      </div>`;
    }
    categoriesHTML += `</div>`;
  }

  let comparisonsHTML = "";
  if (params.comparisons.length > 0) {
    comparisonsHTML = `<div style="padding:0 24px 24px;">
      <h2 style="font-size:15px;font-weight:500;color:#333;margin:0 0 12px;">Comparado con el mes pasado</h2>`;
    for (const comp of params.comparisons) {
      const bgColor = comp.type === "positive" ? "#f0fdf4" : comp.type === "negative" ? "#fef2f2" : "#fafafa";
      const borderColor = comp.type === "positive" ? "#10b981" : comp.type === "negative" ? "#ef4444" : "#d4d4d4";
      comparisonsHTML += `
      <div style="padding:12px 16px;border-radius:10px;border-left:3px solid ${borderColor};background:${bgColor};margin-bottom:8px;">
        <p style="font-size:14px;color:#333;margin:0;line-height:20px;">${comp.emoji} ${comp.text}</p>
      </div>`;
    }
    comparisonsHTML += `</div>`;
  }

  let insightsHTML = "";
  if (params.insights.length > 0) {
    insightsHTML = `<div style="padding:0 24px 24px;">
      <h2 style="font-size:15px;font-weight:500;color:#333;margin:0 0 12px;">Datos curiosos del mes</h2>`;
    for (const insight of params.insights) {
      insightsHTML += `
      <div style="padding:10px 12px;background:#fafafa;border-radius:8px;margin-bottom:8px;">
        <p style="font-size:13px;color:#555;margin:0;line-height:18px;">${insight.emoji} ${insight.text}</p>
      </div>`;
    }
    insightsHTML += `</div>`;
  }

  let upcomingHTML = "";
  if (params.upcomingPayments.length > 0) {
    upcomingHTML = `<div style="padding:0 24px 24px;">
      <h2 style="font-size:15px;font-weight:500;color:#333;margin:0 0 12px;">Próximos pagos en ${params.monthName}</h2>`;
    for (const payment of params.upcomingPayments) {
      upcomingHTML += `
      <div style="padding:12px 16px;background:#fafafa;border-radius:10px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:14px;">${payment.emoji}</span>
            <div>
              <div style="font-size:14px;color:#333;font-weight:500;">${payment.name}</div>
              <div style="font-size:12px;color:#888;">Día ${payment.day}</div>
            </div>
          </div>
          <span style="font-size:14px;font-weight:500;color:#333;font-variant-numeric:tabular-nums;">${formatCurrency(payment.amount)}</span>
        </div>
      </div>`;
    }
    upcomingHTML += `</div>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu resumen de ${monthYear} — Fint</title>
</head>
<body style="margin:0;padding:24px 0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;border-bottom:1px solid #f0f0f0;text-align:center;">
      <p style="font-size:20px;font-weight:600;color:#111;margin:0;">Fint</p>
    </div>

    <div style="padding:32px 24px 24px;">
      <h1 style="font-size:22px;font-weight:500;color:#111;margin:0 0 8px;line-height:28px;">${isPositive ? "¡Buen mes!" : "Resumen del mes"} 🚀</h1>
      <p style="font-size:15px;line-height:24px;color:#555;margin:0 0 12px;">Hola <strong>${params.userName}</strong>, aquí está lo que pasó con tu dinero en <strong>${monthYear}</strong>.</p>
    </div>

    <div style="padding:24px;margin:16px 24px;background:#fafafa;border-radius:12px;text-align:center;">
      <div style="font-size:13px;color:#888;margin-bottom:8px;">Balance neto de ${params.monthName}</div>
      <div style="font-size:36px;font-weight:500;color:${balanceColor};margin:0 0 16px;font-variant-numeric:tabular-nums;">${isPositive ? "+" : ""}${formatCurrency(params.netBalance)}</div>
      <div style="display:flex;justify-content:center;gap:32px;">
        <div style="text-align:center;">
          <div style="font-size:12px;color:#888;margin-bottom:4px;">Ingresos</div>
          <div style="font-size:16px;font-weight:500;color:#10b981;font-variant-numeric:tabular-nums;">+${formatCurrency(params.totalIncome)}</div>
        </div>
        <div style="width:1px;background:#e5e5e5;"></div>
        <div style="text-align:center;">
          <div style="font-size:12px;color:#888;margin-bottom:4px;">Gastos</div>
          <div style="font-size:16px;font-weight:500;color:#ef4444;font-variant-numeric:tabular-nums;">-${formatCurrency(params.totalExpense)}</div>
        </div>
      </div>
    </div>

    ${categoriesHTML}
    ${comparisonsHTML}
    ${insightsHTML}
    ${upcomingHTML}

    <div style="padding:0 24px 24px;text-align:center;">
      <a href="${appUrl}" style="display:inline-block;padding:14px 32px;background:#111;color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:500;">Ver detalle completo en Fint</a>
    </div>

    <hr style="border:0;border-top:1px solid #f0f0f0;margin:0 24px;">

    <div style="padding:20px 24px;text-align:center;background:#fafafa;">
      <p style="font-size:12px;color:#888;margin:0 0 8px;">Fint — Tu app de finanzas personales</p>
      <p style="font-size:12px;color:#aaa;margin:0;"><a href="${appUrl}/ajustes" style="color:#888;text-decoration:underline;">Gestionar preferencias de email</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendMonthlyReport(params: SendReportParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://finanzas-one-virid.vercel.app";

  const html = params.hasTransactions
    ? generateFullHTML(params, appUrl)
    : generateNoTransactionsHTML(params, appUrl);

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
