import { createClient } from "@/lib/supabase/server";

export default async function CuentasPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type, provider, calculated_balance, real_balance")
    .order("created_at");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-medium">Cuentas</h1>

      {!accounts || accounts.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-muted text-sm">
            Todavía no has añadido ninguna cuenta (Imagin, Openbank,
            MyInvestor…). Esta pantalla se completa en la Fase 2.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {accounts.map((a) => {
            const balance = a.real_balance ?? a.calculated_balance;
            return (
              <li
                key={a.id}
                className="bg-surface border border-border rounded-xl px-4 py-3 flex justify-between items-center"
              >
                <p className="text-sm">{a.name}</p>
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
