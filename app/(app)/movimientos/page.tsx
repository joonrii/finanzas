import { createClient } from "@/lib/supabase/server";

export default async function MovimientosPage() {
  const supabase = await createClient();
  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, amount, type, description, merchant, occurred_on")
    .order("occurred_on", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-medium">Movimientos</h1>

      {!transactions || transactions.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-muted text-sm">
            Aún no tienes movimientos. Pulsa + para añadir el primero.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {transactions.map((t) => (
            <li
              key={t.id}
              className="bg-surface border border-border rounded-xl px-4 py-3 flex justify-between items-center"
            >
              <div>
                <p className="text-sm">{t.merchant || t.description || "—"}</p>
                <p className="text-muted text-xs">{t.occurred_on}</p>
              </div>
              <p
                className={
                  "money text-sm font-medium " +
                  (t.type === "income" ? "text-positive" : "text-white")
                }
              >
                {t.type === "expense" ? "-" : "+"}
                {Number(t.amount).toFixed(2)} €
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
