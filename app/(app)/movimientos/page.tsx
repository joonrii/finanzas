import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MovimientosPageClient from "./MovimientosPageClient";

export default async function MovimientosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, amount, type, description, merchant, occurred_on, account_id, destination_account_id, accounts:account_id(name), categories:category_id(icon, name)"
    )
    .eq("user_id", user.id)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  return <MovimientosPageClient transactions={transactions ?? []} />;
}
