import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Repeat, Pause, Play, Trash2 } from "lucide-react";
import { colorForLabel } from "@/lib/colors";

export default async function RecurrentesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: recurrings } = await supabase
    .from("recurring_transactions")
    .select("*, accounts:account_id(name), categories:category_id(name, icon)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-lg mx-auto px-5 pt-6 pb-28 safe-bottom">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Recurrentes</h1>
        <Link
          href="/recurrentes/nuevo"
          className="flex items-center gap-1.5 bg-positive text-black text-sm font-semibold rounded-xl px-4 py-2.5 hover:brightness-110 transition"
        >
          <Plus size={16} />
          Nueva
        </Link>
      </div>

      {(!recurrings || recurrings.length === 0) && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mx-auto mb-4">
            <Repeat className="text-muted" size={28} />
          </div>
          <h3 className="text-white font-semibold mb-1">Sin recurrentes</h3>
          <p className="text-muted text-sm mb-6">
            Crea tu nómina, alquiler o suscripciones para que se generen solas.
          </p>
          <Link
            href="/recurrentes/nuevo"
            className="inline-flex items-center gap-1.5 bg-surface2 border border-border text-white text-sm font-medium rounded-xl px-5 py-2.5 hover:border-muted transition"
          >
            <Plus size={16} />
            Crear primera recurrente
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {recurrings?.map((r: any) => {
          const color = colorForLabel(r.categories?.name ?? "Otro");
          const freqLabel =
            r.frequency === "daily"
              ? "Cada día"
              : r.frequency === "weekly"
              ? "Cada semana"
              : r.frequency === "monthly"
              ? `Día ${r.day_of_month ?? 1} de cada mes`
              : "Cada año";

          return (
            <div
              key={r.id}
              className={`bg-surface border rounded-2xl p-4 transition ${
                r.is_active ? "border-border" : "border-border/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color.bg} ${color.text}`}
                  >
                    {r.categories?.icon ?? "📦"}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {r.description || "Sin descripción"}
                    </p>
                    <p className="text-muted text-xs mt-0.5">
                      {r.accounts?.name} · {freqLabel}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold money ${
                    r.type === "income" ? "text-positive" : "text-white"
                  }`}
                >
                  {r.type === "income" ? "+" : "-"}
                  {Number(r.amount).toFixed(2)} €
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <ToggleRecurringButton id={r.id} isActive={r.is_active} />
                <form
                  action={async () => {
                    "use server";
                    const supabase = await createClient();
                    await supabase.from("recurring_transactions").delete().eq("id", r.id);
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-1 text-xs text-muted hover:text-negative transition"
                  >
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function ToggleRecurringButton({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <form
      action={async () => {
        "use server";
        const supabase = await createClient();
        await supabase
          .from("recurring_transactions")
          .update({ is_active: !isActive })
          .eq("id", id);
      }}
    >
      <button
        type="submit"
        className={`flex items-center gap-1 text-xs transition ${
          isActive ? "text-muted hover:text-amber-400" : "text-muted hover:text-positive"
        }`}
      >
        {isActive ? <Pause size={12} /> : <Play size={12} />}
        {isActive ? "Pausar" : "Reactivar"}
      </button>
    </form>
  );
}
