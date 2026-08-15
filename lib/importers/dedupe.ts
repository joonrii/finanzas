// Genera un identificador estable a partir de los datos del movimiento,
// para poder detectar si ya se importó antes (mismo importe, fecha,
// descripción y cuenta) aunque se suba el mismo CSV dos veces.

export function buildDedupeHash(params: {
  accountId: string;
  date: string;
  amount: number;
  description: string;
}) {
  const normalizedDescription = params.description
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  return `${params.accountId}|${params.date}|${params.amount.toFixed(
    2
  )}|${normalizedDescription}`;
}
