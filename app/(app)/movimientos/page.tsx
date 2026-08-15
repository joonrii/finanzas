import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteTransactionButton } from "@/components/transactions/DeleteTransactionButton";
import { Pencil } from "lucide-react";
import { colorForLabel } from "@/lib/colors";

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
                  const isPositive =
                    t.type === "income" ||
                    (t.type === "balance_adjustment" && Number(t.amount) > 0);
                  const sign =
                    t.type === "balance_adjustment"
                      ? Number(t.amount) >= 0
                        ? "+"
                        : "-"
                      : t.type === "expense" ||
                        t.type === "transfer" ||
                        t.type === "investment"
                      ? "-"
                      : "+";
                  const displayAmount =
                    t.type === "balance_adjustment"
                      ? Math.abs(Number(t.amount))
                      : Number(t.amount);

                  return (
                    <li
                      key={t.id}
                      className="bg-surface border border-border rounded-xl px-4 py-3 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={
                            "w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 " +
                            colorForLabel(category?.name || t.type).bg
                          }
                        >
                          {category?.icon ??
                            (t.type === "transfer"
                              ? "↔️"
                              : t.type === "investment"
                              ? "📈"
                              : t.type === "balance_adjustment"
                              ? "⚖️"
                              : "💳")}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm truncate">
                            {t.type === "balance_adjustment"
                              ? "Ajuste de saldo"
                              : t.merchant ||
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
                          {displayAmount.toFixed(2)} €
                        </p>
                                              <div className="flex items-center gap-1">
                        <Link
                          href={`/movimientos/${t.id}`}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 transition-all duration-200 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90"
                          aria-label="Editar movimiento"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={2} />
                        </Link>
                        <DeleteTransactionButton
                          id={t.id}
                          accountId={t.account_id}
                          destinationAccountId={t.destination_account_id}
                          type={t.type}
                          amount={Number(t.amount)}
                        />
                      </div>
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
