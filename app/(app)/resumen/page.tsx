import { createClient } from "@/lib/supabase/server";

export default async function ResumenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: accountsCount } = await supabase
    .from("accounts")
    .select("*", { count: "exact", head: true });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-muted text-sm">Hola de nuevo</p>
        <h1 className="text-xl font-medium truncate">{user?.email}</h1>
      </header>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-muted text-sm mb-1">Patrimonio total</p>
        <p className="money text-4xl font-semibold">0,00 €</p>
        <p className="text-muted text-sm mt-2">
          Añade tus cuentas para empezar a ver tu patrimonio real aquí.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-sm text-muted">
          {accountsCount === 0
            ? "Todavía no tienes cuentas creadas."
            : `Tienes ${accountsCount} cuenta(s) configurada(s).`}
        </p>
      </div>

      <p className="text-muted text-xs text-center mt-4">
        El dashboard completo (evolución, gastos por categoría) llega en la
        Fase 3.
      </p>
    </div>
  );
}
