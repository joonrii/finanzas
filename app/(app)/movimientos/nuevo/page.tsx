import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewTransactionForm } from "@/components/transactions/NewTransactionForm";

export default async function NuevoMovimientoPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, provider")
      .eq("is_archived", false)
      .order("created_at"),
    supabase
      .from("categories")
      .select("id, name, icon, kind")
      .eq("is_archived", false)
      .order("sort_order"),
  ]);

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-medium">Nuevo movimiento</h1>
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-muted text-sm mb-4">
            Antes de añadir un movimiento necesitas al menos una cuenta.
          </p>
          <Link
            href="/cuentas/nueva"
            className="inline-block bg-positive text-base font-medium rounded-xl px-5 py-2.5 text-sm"
          >
            Añadir una cuenta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-medium">Nuevo movimiento</h1>
      <NewTransactionForm accounts={accounts} categories={categories ?? []} />
    </div>
  );
}
