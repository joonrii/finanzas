import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteTransactionButton } from "@/components/transactions/DeleteTransactionButton";

export default async function MovimientosPage() {
  const supabase = await createClient();
  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, amount, type, description, merchant, occurred_on, account_id, destination_account_id, accounts:account_id(name), categories:category_id(icon, name)"
    )
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const grouped = groupByDate(transactions ?? []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Movimientos</h1>
        <Link
          href="/movimientos/importar"
          className="text-positive text-sm font-medium"
        >
          Importar CSV
        </Link>
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-muted text-sm">
            Aún no tienes movimientos. Pulsa + para añadir el primero.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-muted text-xs uppercase tracking-wide mb-2">
                {formatDate(date)}
              </p>
              <ul className="flex flex-col gap-2">
                {items.map((t) => {
                  const category = Array.isArray(t.categories)
                    ? t.categories[0]
                    : t.categories;
                  const account = Array.isArray(t.accounts)
                    ? t.accounts[0]
                    : t.accounts;
                  const isPositive = t.type === "income";
                  const sign =
                    t.type === "expense" ||
                    t.type === "transfer" ||
                    t.type === "investment"
                      ? "-"
                      : "+";

                  return (
                    <li
                      key={t.id}
                      className="bg-surface border border-border rounded-xl px-4 py-3 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg shrink-0">
                          {category?.icon ??
                            (t.type === "transfer"
                              ? "↔️"
                              : t.type === "investment"
                              ? "📈"
                              : "💳")}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm truncate">
                            {t.merchant ||
                              t.description ||
                              category?.name ||
                              "Movimiento"}
                          </p>
                          <p className="text-muted text-xs truncate">
                            {account?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        <p
                          className={
                            "money text-sm font-medium " +
                            (isPositive ? "text-positive" : "text-white")
                          }
                        >
                          {sign}
                          {Number(t.amount).toFixed(2)} €
                        </p>
                        <DeleteTransactionButton
                          id={t.id}
                          accountId={t.account_id}
                          destinationAccountId={t.destination_account_id}
                          type={t.type}
                          amount={Number(t.amount)}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByDate<T extends { occurred_on: string }>(items: T[]) {
  return items.reduce((acc, item) => {
    (acc[item.occurred_on] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}
