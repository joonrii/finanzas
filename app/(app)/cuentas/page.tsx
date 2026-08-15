import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const PROVIDER_LABEL: Record<string, string> = {
  imagin: "🏦",
  openbank: "🏦",
  myinvestor: "📈",
};

export default async function CuentasPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type, provider, calculated_balance, real_balance")
    .eq("is_archived", false)
    .order("created_at");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Cuentas</h1>
        <Link
          href="/cuentas/nueva"
          className="text-positive text-sm font-medium"
        >
          + Añadir
        </Link>
      </div>

      {!accounts || accounts.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-muted text-sm mb-4">
            Todavía no has añadido ninguna cuenta.
          </p>
          <Link
            href="/cuentas/nueva"
            className="inline-block bg-positive text-base font-medium rounded-xl px-5 py-2.5 text-sm"
          >
            Añadir tu primera cuenta
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {accounts.map((a) => {
            const balance = a.calculated_balance;
            return (
              <li
                key={a.id}
                className="bg-surface border border-border rounded-xl px-4 py-3 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {PROVIDER_LABEL[a.provider ?? ""] ??
                      (a.type === "cash" ? "💵" : "🏛️")}
                  </span>
                  <p className="text-sm">{a.name}</p>
                </div>
                <p className="money text-sm font-medium">
                  {Number(balance).toFixed(2)} €
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
