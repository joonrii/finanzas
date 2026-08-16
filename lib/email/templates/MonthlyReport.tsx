"use client";

import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Button,
  Row,
  Column,
} from "@react-email/components";

interface MonthlyReportProps {
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
  appUrl: string;
}

export default function MonthlyReportEmail({
  userName,
  monthName,
  year,
  totalIncome,
  totalExpense,
  netBalance,
  topCategories,
  comparisons,
  insights,
  upcomingPayments,
  hasTransactions,
  appUrl,
}: MonthlyReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const monthYear = `${monthName} ${year}`;
  const isPositive = netBalance >= 0;

  if (!hasTransactions) {
    return (
      <Html>
        <Head />
        <Preview>Tu resumen de {monthYear} — Fint</Preview>
        <Body style={main}>
          <Container style={container}>
            <Section style={header}>
              <Text style={logo}>Fint</Text>
            </Section>

            <Section style={content}>
              <Heading style={h1}>Hola {userName} &#128075;</Heading>
              <Text style={paragraph}>
                Este es tu resumen de <strong>{monthYear}</strong>, pero parece que no registraste ningún movimiento en Fint durante este mes.
              </Text>
              <Text style={paragraph}>
                &#129300; ¿Todo bien? Recuerda que puedes añadir tus gastos e ingresos desde la app para tener un control completo de tus finanzas.
              </Text>
              <Text style={paragraph}>
                Cuantos más movimientos registres, más útil será tu resumen mensual. ¡Anímate a empezar!
              </Text>

              <Section style={ctaSection}>
                <Button style={button} href={appUrl}>
                  Abrir Fint
                </Button>
              </Section>
            </Section>

            <Hr style={hr} />
            <Section style={footer}>
              <Text style={footerText}>
                Fint — Tu app de finanzas personales
              </Text>
              <Text style={footerTextSmall}>
                <a href={`${appUrl}/ajustes`} style={link}>Gestionar preferencias de email</a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }

  return (
    <Html>
      <Head />
      <Preview>Tu resumen de {monthYear} — Fint</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Fint</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>
              {isPositive ? "¡Buen mes!" : "Resumen del mes"} &#128640;
            </Heading>
            <Text style={paragraph}>
              Hola <strong>{userName}</strong>, aquí está lo que pasó con tu dinero en <strong>{monthYear}</strong>.
            </Text>
          </Section>

          <Section style={balanceCard}>
            <Text style={balanceLabel}>Balance neto de {monthName}</Text>
            <Text
              style={{
                ...balanceAmount,
                color: isPositive ? "#10b981" : "#ef4444",
              }}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(netBalance)}
            </Text>
            <Row style={balanceRow}>
              <Column style={balanceCol}>
                <Text style={balanceColLabel}>Ingresos</Text>
                <Text style={{ ...balanceColValue, color: "#10b981" }}>
                  +{formatCurrency(totalIncome)}
                </Text>
              </Column>
              <Column style={balanceDivider}>
                <Text style={{ color: "#e5e5e5" }}>|</Text>
              </Column>
              <Column style={balanceCol}>
                <Text style={balanceColLabel}>Gastos</Text>
                <Text style={{ ...balanceColValue, color: "#ef4444" }}>
                  -{formatCurrency(totalExpense)}
                </Text>
              </Column>
            </Row>
          </Section>

          {topCategories.length > 0 && (
            <Section style={content}>
              <Heading style={h2}>Dónde se fue tu dinero</Heading>
              {topCategories.map((cat, i) => (
                <Row key={i} style={categoryRow}>
                  <Column style={{ width: "36px" }}>
                    <Text style={categoryEmoji}>{cat.emoji}</Text>
                  </Column>
                  <Column style={{ width: "100%" }}>
                    <Row>
                      <Column>
                        <Text style={categoryName}>{cat.name}</Text>
                      </Column>
                      <Column style={{ width: "80px" }}>
                        <Text style={categoryAmount}>
                          {formatCurrency(cat.amount)}
                        </Text>
                      </Column>
                    </Row>
                    <Section style={progressBarBg}>
                      <Section
                        style={{
                          ...progressBarFill,
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </Section>
                  </Column>
                  <Column style={{ width: "44px" }}>
                    <Text style={categoryPercent}>{cat.percentage}%</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          {comparisons.length > 0 && (
            <Section style={content}>
              <Heading style={h2}>Comparado con el mes pasado</Heading>
              {comparisons.map((comp, i) => (
                <Section
                  key={i}
                  style={{
                    ...comparisonBox,
                    backgroundColor:
                      comp.type === "positive"
                        ? "#f0fdf4"
                        : comp.type === "negative"
                        ? "#fef2f2"
                        : "#fafafa",
                    borderLeftColor:
                      comp.type === "positive"
                        ? "#10b981"
                        : comp.type === "negative"
                        ? "#ef4444"
                        : "#d4d4d4",
                  }}
                >
                  <Text style={comparisonText}>
                    {comp.emoji} {comp.text}
                  </Text>
                </Section>
              ))}
            </Section>
          )}

          {insights.length > 0 && (
            <Section style={content}>
              <Heading style={h2}>Datos curiosos del mes</Heading>
              {insights.map((insight, i) => (
                <Section key={i} style={insightBox}>
                  <Text style={insightText}>
                    {insight.emoji} {insight.text}
                  </Text>
                </Section>
              ))}
            </Section>
          )}

          {upcomingPayments.length > 0 && (
            <Section style={content}>
              <Heading style={h2}>Próximos pagos en {monthName}</Heading>
              {upcomingPayments.map((payment, i) => (
                <Section key={i} style={paymentRow}>
                  <Row>
                    <Column style={{ width: "32px" }}>
                      <Text style={paymentEmoji}>{payment.emoji}</Text>
                    </Column>
                    <Column>
                      <Text style={paymentName}>{payment.name}</Text>
                      <Text style={paymentDay}>Día {payment.day}</Text>
                    </Column>
                    <Column style={{ width: "80px" }}>
                      <Text style={paymentAmount}>
                        {formatCurrency(payment.amount)}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              ))}
            </Section>
          )}

          <Section style={ctaSection}>
            <Button style={button} href={appUrl}>
              Ver detalle completo en Fint
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Fint — Tu app de finanzas personales
            </Text>
            <Text style={footerTextSmall}>
              <a href={`${appUrl}/ajustes`} style={link}>
                Gestionar preferencias de email
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "480px",
  overflow: "hidden",
};

const header = {
  padding: "20px 24px",
  borderBottom: "1px solid #f0f0f0",
  textAlign: "center" as const,
};

const logo = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#111",
  margin: 0,
};

const content = {
  padding: "24px 24px 0",
};

const h1 = {
  fontSize: "22px",
  fontWeight: 500,
  color: "#111",
  margin: "0 0 8px",
  lineHeight: "28px",
};

const h2 = {
  fontSize: "15px",
  fontWeight: 500,
  color: "#333",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#555",
  margin: "0 0 12px",
};

const balanceCard = {
  padding: "24px",
  margin: "16px 24px",
  backgroundColor: "#fafafa",
  borderRadius: "12px",
  textAlign: "center" as const,
};

const balanceLabel = {
  fontSize: "13px",
  color: "#888",
  margin: "0 0 8px",
  textTransform: "none" as const,
  letterSpacing: "0",
};

const balanceAmount = {
  fontSize: "36px",
  fontWeight: 500,
  margin: "0 0 16px",
  fontVariantNumeric: "tabular-nums" as const,
};

const balanceRow = {
  display: "flex" as const,
  justifyContent: "center" as const,
};

const balanceCol = {
  textAlign: "center" as const,
  width: "50%",
};

const balanceColLabel = {
  fontSize: "12px",
  color: "#888",
  margin: "0 0 4px",
};

const balanceColValue = {
  fontSize: "16px",
  fontWeight: 500,
  margin: 0,
  fontVariantNumeric: "tabular-nums" as const,
};

const balanceDivider = {
  width: "1px",
  textAlign: "center" as const,
};

const categoryRow = {
  marginBottom: "12px",
};

const categoryEmoji = {
  fontSize: "16px",
  margin: 0,
  textAlign: "center" as const,
};

const categoryName = {
  fontSize: "14px",
  color: "#333",
  margin: "0 0 4px",
};

const categoryAmount = {
  fontSize: "14px",
  fontWeight: 500,
  color: "#333",
  margin: "0 0 4px",
  textAlign: "right" as const,
  fontVariantNumeric: "tabular-nums" as const,
};

const categoryPercent = {
  fontSize: "12px",
  color: "#888",
  margin: 0,
  textAlign: "right" as const,
};

const progressBarBg = {
  height: "6px",
  backgroundColor: "#f0f0f0",
  borderRadius: "3px",
  overflow: "hidden",
  margin: 0,
};

const progressBarFill = {
  height: "6px",
  borderRadius: "3px",
};

const comparisonBox = {
  padding: "12px 16px",
  borderRadius: "10px",
  borderLeft: "3px solid",
  marginBottom: "8px",
};

const comparisonText = {
  fontSize: "14px",
  color: "#333",
  margin: 0,
  lineHeight: "20px",
};

const insightBox = {
  padding: "10px 12px",
  backgroundColor: "#fafafa",
  borderRadius: "8px",
  marginBottom: "8px",
};

const insightText = {
  fontSize: "13px",
  color: "#555",
  margin: 0,
  lineHeight: "18px",
};

const paymentRow = {
  padding: "12px 16px",
  backgroundColor: "#fafafa",
  borderRadius: "10px",
  marginBottom: "8px",
};

const paymentEmoji = {
  fontSize: "14px",
  margin: 0,
};

const paymentName = {
  fontSize: "14px",
  color: "#333",
  fontWeight: 500,
  margin: "0 0 2px",
};

const paymentDay = {
  fontSize: "12px",
  color: "#888",
  margin: 0,
};

const paymentAmount = {
  fontSize: "14px",
  fontWeight: 500,
  color: "#333",
  margin: 0,
  textAlign: "right" as const,
  fontVariantNumeric: "tabular-nums" as const,
};

const ctaSection = {
  padding: "24px",
  textAlign: "center" as const,
};

const button = {
  display: "inline-block",
  padding: "14px 32px",
  backgroundColor: "#111",
  color: "#fff",
  textDecoration: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: 500,
};

const hr = {
  borderColor: "#f0f0f0",
  margin: "0 24px",
};

const footer = {
  padding: "20px 24px",
  textAlign: "center" as const,
  backgroundColor: "#fafafa",
};

const footerText = {
  fontSize: "12px",
  color: "#888",
  margin: "0 0 8px",
};

const footerTextSmall = {
  fontSize: "12px",
  color: "#aaa",
  margin: 0,
};

const link = {
  color: "#888",
  textDecoration: "underline",
};
